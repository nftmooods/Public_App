"""Profil "accumulation" : maximiser la quantité d'ETH détenue avant la fin du cycle haussier,
pas le $ à court terme. Ne suit pas le schéma stop/objectif de bot.py + broker.py (prudent/agressif) :

- Tant que la tendance de fond (EMA50/EMA200 journalières) est haussière, achète par paliers sur les
  replis (pas au sommet) : un repli n'est acheté qu'une fois, pas à chaque cycle tant qu'il dure.
- Ne revend jamais sur un simple repli ou un petit objectif atteint : la seule sortie est la détection
  d'un retournement structurel (EMA50 journalière qui repasse sous l'EMA200, "death cross"), qui liquide
  alors toute la position ETH d'un coup.
- Entre deux replis, ou après une liquidation, l'argent reste en cash : le profil ne "chasse" jamais un
  marché déjà monté.
"""
import time

import config as C
import kraken
import strategy
from journal import Journal, fmt_ts, print_decisions


def daily_regime(daily_candles):
    """Tendance de fond au dernier jour clôturé : golden cross (haussier) ou death cross (baissier)."""
    if len(daily_candles) < C.ACCUM_EMA_SLOW + 5:
        return None
    closes = [c["c"] for c in daily_candles]
    fast = strategy.ema(closes, C.ACCUM_EMA_FAST)[-1]
    slow = strategy.ema(closes, C.ACCUM_EMA_SLOW)[-1]
    return {"bull": fast > slow, "fast": fast, "slow": slow, "price": closes[-1]}


def dip_signal(hourly_candles, regime, already_bought_below):
    """Repli acheté dans une tendance de fond haussière, pas encore acheté depuis le dernier sommet."""
    price = hourly_candles[-1]["c"] if hourly_candles else None
    lookback = C.ACCUM_PULLBACK_LOOKBACK_H
    if not regime or not regime["bull"] or len(hourly_candles) < max(lookback, C.RSI_PERIOD + 2):
        return {"buy": False, "price": price, "reason": "pas de tendance de fond haussière confirmée"}

    recent_high = max(c["h"] for c in hourly_candles[-lookback:])
    pullback = (recent_high - price) / recent_high if recent_high else 0
    closes = [c["c"] for c in hourly_candles]
    r = strategy.rsi(closes, C.RSI_PERIOD)

    if already_bought_below is not None and recent_high <= already_bought_below:
        return {"buy": False, "price": price,
                "reason": f"repli déjà acheté depuis ce sommet ({recent_high:.2f})"}
    if pullback < C.ACCUM_MIN_PULLBACK:
        return {"buy": False, "price": price,
                "reason": f"pas de repli significatif (sommet 48h {recent_high:.2f}, repli {pullback:.1%})"}
    if r > C.ACCUM_DIP_RSI_MAX:
        return {"buy": False, "price": price,
                "reason": f"RSI {r:.0f} encore trop haut pour un vrai repli (seuil {C.ACCUM_DIP_RSI_MAX})"}
    if price < regime["slow"]:
        return {"buy": False, "price": price,
                "reason": f"prix ({price:.2f}) sous l'EMA{C.ACCUM_EMA_SLOW} journalière ({regime['slow']:.2f}), "
                          f"structure de fond cassée"}
    return {"buy": True, "price": price, "peak_ref": recent_high,
            "reason": f"repli de {pullback:.1%} depuis le sommet 48h ({recent_high:.2f}), RSI {r:.0f}, "
                      f"tendance de fond intacte (EMA{C.ACCUM_EMA_FAST} {regime['fast']:.2f} > "
                      f"EMA{C.ACCUM_EMA_SLOW} {regime['slow']:.2f})"}


def buy(j, fill, rules, ts, reason):
    available = float(j.get("cash", C.START_CAPITAL))
    amount = available * C.ACCUM_BUY_FRACTION
    # Sous les deux tiers du palier habituel, autant engager tout le cash restant plutôt que de
    # laisser un reliquat trop petit pour jamais être réinvesti (poussière sous les minimums Kraken).
    if available - amount < amount * 0.66:
        amount = available
    if amount < rules["costmin"] or amount < rules["ordermin"] * fill:
        j.log(C.ACCUM_PAIR, "SKIP", fill,
              f"repli valide mais cash dispo trop faible ({available:.2f} {C.QUOTE})", ts)
        return
    qty = amount / (fill * (1 + C.TAKER_FEE))
    cost = qty * fill * (1 + C.TAKER_FEE)
    j.set("cash", available - cost)
    j.db.execute(
        "INSERT INTO positions (pair, opened_ts, entry, qty, cost, checked_ts) VALUES (?,?,?,?,?,?)",
        (C.ACCUM_PAIR, ts, fill, qty, cost, ts),
    )
    j.db.commit()
    j.log(C.ACCUM_PAIR, "ENTER", fill,
          f"{reason} → achat de {qty:.6f} ETH à {fill:.2f} ({cost:.2f} {C.QUOTE} frais compris)", ts, qty=qty)


def liquidate(j, price, ts, reason):
    positions = j.open_positions()
    total_qty = sum(p["qty"] for p in positions)
    proceeds_total = 0.0
    for p in positions:
        proceeds = p["qty"] * price * (1 - C.TAKER_FEE)
        pnl = proceeds - p["cost"]
        proceeds_total += proceeds
        j.db.execute(
            "UPDATE positions SET status='closed', closed_ts=?, exit_price=?, exit_reason=?, pnl=? WHERE id=?",
            (ts, price, "MACRO_EXIT", pnl, p["id"]),
        )
    j.set("cash", float(j.get("cash", C.START_CAPITAL)) + proceeds_total)
    j.db.commit()
    j.log(C.ACCUM_PAIR, "MACRO_EXIT", price,
          f"{reason} → vente de {total_qty:.6f} ETH, {proceeds_total:.2f} {C.QUOTE} récupérés", ts)


def eth_held(j):
    return sum(p["qty"] for p in j.open_positions())


def run():
    j, now = Journal(C.DB_PATH), int(time.time())
    daily = kraken.ohlc(C.ACCUM_PAIR, C.ACCUM_DAILY_INTERVAL)
    hourly = kraken.ohlc(C.ACCUM_PAIR, C.SIGNAL_INTERVAL)
    regime = daily_regime(daily)
    bid = kraken.ticker(C.ACCUM_PAIR)["bid"]
    held = eth_held(j)
    prev_regime_bull = j.get("regime_bull")

    if held > 0 and regime and not regime["bull"] and prev_regime_bull != "0":
        liquidate(j, bid * (1 - C.SLIPPAGE), now,
                  f"tendance de fond retournée : EMA{C.ACCUM_EMA_FAST} journalière "
                  f"({regime['fast']:.2f}) repassée sous l'EMA{C.ACCUM_EMA_SLOW} ({regime['slow']:.2f})")
    else:
        for p in j.open_positions():
            latent = p["qty"] * bid * (1 - C.TAKER_FEE) - p["cost"]
            j.log(C.ACCUM_PAIR, "HOLD", bid,
                  f"conservé : latent {latent:+.2f} {C.QUOTE}, en attente d'un repli ou d'un retournement", now)
        peak_ref = float(j.get("last_buy_peak_ref")) if j.get("last_buy_peak_ref") else None
        sig = dip_signal(hourly, regime, peak_ref)
        if sig["buy"]:
            ask = kraken.ticker(C.ACCUM_PAIR)["ask"] * (1 + C.SLIPPAGE)
            buy(j, ask, kraken.pair_rules(C.ACCUM_PAIR), now, sig["reason"])
            j.set("last_buy_peak_ref", sig["peak_ref"])
        else:
            j.log(C.ACCUM_PAIR, "SKIP", sig["price"], sig["reason"], now)

    if regime:
        j.set("regime_bull", "1" if regime["bull"] else "0")
    eq = float(j.get("cash", C.START_CAPITAL)) + eth_held(j) * bid
    j.log("-", "EQUITY", eq,
          f"capital simulé {eq:.2f} {C.QUOTE} dont {eth_held(j):.6f} ETH et "
          f"{float(j.get('cash', C.START_CAPITAL)):.2f} {C.QUOTE} de cash", now)
    print_decisions(j.decisions(since=now - 1))


def backtest():
    j = Journal(C.BACKTEST_DB_PATH, reset=True)
    daily = kraken.ohlc(C.ACCUM_PAIR, C.ACCUM_DAILY_INTERVAL)
    hourly = kraken.ohlc(C.ACCUM_PAIR, C.SIGNAL_INTERVAL)
    rules = kraken.pair_rules(C.ACCUM_PAIR)
    day_index = {d["t"]: i for i, d in enumerate(daily)}
    day_times = sorted(day_index)
    warmup = max(C.ACCUM_EMA_SLOW + 5, C.RSI_PERIOD + C.ACCUM_PULLBACK_LOOKBACK_H + 2)

    def regime_as_of(ts):
        days_so_far = [t for t in day_times if t <= ts]
        if len(days_so_far) < C.ACCUM_EMA_SLOW + 5:
            return None
        return daily_regime(daily[:day_index[days_so_far[-1]] + 1])

    peak_ref = None
    for i in range(warmup, len(hourly)):
        c = hourly[i]
        regime = regime_as_of(c["t"])
        held = eth_held(j)
        if held > 0:
            prev_regime = regime_as_of(hourly[i - 1]["t"])
            if regime and not regime["bull"] and prev_regime and prev_regime["bull"]:
                liquidate(j, c["o"] * (1 - C.SLIPPAGE), c["t"], "tendance de fond retournée (backtest)")
                peak_ref = None
                continue
        sig = dip_signal(hourly[: i + 1], regime, peak_ref)
        if sig["buy"]:
            buy(j, c["c"] * (1 + C.SLIPPAGE), rules, c["t"], sig["reason"])
            peak_ref = sig["peak_ref"]

    last_price = hourly[-1]["c"]
    start_price = hourly[warmup]["c"]
    print(f"Période : {fmt_ts(hourly[warmup]['t'])} → {fmt_ts(hourly[-1]['t'])}  (60 min par bougie)")
    print(f"Pour comparer, acheter l'ETH et le garder : {last_price / start_price - 1:+.1%}\n")
    report(C.BACKTEST_DB_PATH, mark=last_price)


def report(path=None, mark=None):
    j = Journal(path or C.DB_PATH)
    mark = mark or kraken.ticker(C.ACCUM_PAIR)["bid"]
    closed, still_open = j.closed_positions(), j.open_positions()
    held_qty = sum(p["qty"] for p in still_open)
    cost_basis = sum(p["cost"] for p in still_open)
    avg_cost = cost_basis / held_qty if held_qty else 0
    cash = float(j.get("cash", C.START_CAPITAL))
    eq = cash + held_qty * mark
    pnls = [p["pnl"] for p in closed]

    print(f"Capital : {C.START_CAPITAL:.2f} → {eq:.2f} {C.QUOTE} ({eq / C.START_CAPITAL - 1:+.1%})")
    print(f"ETH détenu : {held_qty:.6f} (coût moyen {avg_cost:.2f} {C.QUOTE}/ETH, cours actuel {mark:.2f})")
    print(f"Cash disponible : {cash:.2f} {C.QUOTE}")
    print(f"Achats faits : {len(closed) + len(still_open)}   liquidations totales : "
          f"{len([p for p in closed if p['exit_reason'] == 'MACRO_EXIT'])}")
    if pnls:
        print(f"Résultat des liquidations passées : {sum(pnls):+.2f} {C.QUOTE}")
