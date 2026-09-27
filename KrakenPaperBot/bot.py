"""Simulateur de trading (Kraken ou OKX selon le profil, voir config.EXCHANGE), sans argent réel.

Chaque commande s'applique à tous les profils de config.py, ou à celui donné en argument.

    python bot.py run [profil]              un cycle : rejoue le marché depuis le dernier passage, puis décide
    python bot.py backtest [profil]         rejoue les 30 derniers jours avec les mêmes règles
    python bot.py report [profil]           bilan de la simulation   (report backtest : bilan du backtest)
    python bot.py journal [profil] [n]      n dernières décisions (30 par défaut)
    python bot.py export                    écrit RAPPORT.md et un CSV des décisions par profil dans KPB_DATA_DIR
"""
import contextlib
import csv
import io
import os
import sys
import time
from datetime import datetime

import accumulate
import broker
import config as C
import strategy
from journal import Journal, fmt_ts, print_decisions

sys.stdout.reconfigure(encoding="utf-8")


def replay_interval(gap_s):
    """Plus petite taille de bougie dont les 720 dernières couvrent le temps écoulé."""
    for interval in (5, 15, 60, 240):
        if gap_s < interval * 60 * 700:
            return interval
    return 1440


def run():
    if C.PROFILE == "accumulation":
        return accumulate.run()
    j, now = Journal(C.DB_PATH), int(time.time())
    marks = {}

    # 1. Positions ouvertes : on rejoue tout ce qui s'est passé depuis la dernière vérification,
    #    pour que le stop et l'objectif s'appliquent comme s'ils étaient posés chez Kraken.
    for p in j.open_positions():
        interval = replay_interval(now - p["checked_ts"])
        candles = [c for c in C.EXCHANGE.ohlc(p["pair"], interval, since=p["checked_ts"] - interval * 60)
                   if c["t"] >= p["checked_ts"]]
        if any(broker.apply_candle(j, p, c) for c in candles):
            continue
        if candles:
            p["checked_ts"] = candles[-1]["t"] + interval * 60
            j.db.execute("UPDATE positions SET checked_ts=? WHERE id=?", (p["checked_ts"], p["id"]))
            j.db.commit()
        bid = marks[p["pair"]] = C.EXCHANGE.ticker(p["pair"])["bid"]
        latent = p["qty"] * bid * (1 - C.TAKER_FEE) - p["cost"]
        j.log(p["pair"], "HOLD", bid,
              f"position gardée : stop {p['stop']:.2f}, objectif {p['tp']:.2f}, latent {latent:+.2f} {C.QUOTE}", now)

    # 2. Coupe-circuit : au-delà d'un recul trop marqué depuis le sommet du capital, on arrête de
    #    miser (les positions déjà ouvertes restent gérées par l'étape 1) jusqu'à ce que le capital
    #    remonte. Le sommet ne redescend jamais, donc le recul se réduit tout seul si le capital repart.
    eq_now = broker.equity(j, marks)
    peak = max(float(j.get("peak_equity", C.START_CAPITAL)), eq_now)
    j.set("peak_equity", peak)
    drawdown = (peak - eq_now) / peak if peak > 0 else 0
    halted = drawdown >= C.MAX_DRAWDOWN_STOP

    # 3. Paires sans position : faut-il entrer ?
    held = {p["pair"] for p in j.open_positions()}
    if halted:
        j.log("-", "HALT", eq_now,
              f"recul de {drawdown:.0%} depuis le sommet ({peak:.2f} {C.QUOTE}) ≥ seuil {C.MAX_DRAWDOWN_STOP:.0%} "
              f"→ aucune nouvelle entrée ce cycle", now)
    for pair in C.PAIRS:
        if pair in held or halted:
            continue
        sig = strategy.evaluate(C.EXCHANGE.ohlc(pair, C.SIGNAL_INTERVAL))
        if not sig["enter"]:
            j.log(pair, "SKIP", sig["price"], sig["reason"], now, **sig["indicators"])
            continue
        fill = C.EXCHANGE.ticker(pair)["ask"] * (1 + C.SLIPPAGE)
        broker.open_position(j, pair, fill, sig, C.EXCHANGE.pair_rules(pair), now)

    eq = broker.equity(j, marks)
    j.log("-", "EQUITY", eq, f"capital simulé {eq:.2f} {C.QUOTE} dont {broker.cash(j):.2f} {C.QUOTE} de cash", now)
    print_decisions(j.decisions(since=now - 1))


def backtest():
    if C.PROFILE == "accumulation":
        return accumulate.backtest()
    j = Journal(C.BACKTEST_DB_PATH, reset=True)
    data = {pair: C.EXCHANGE.ohlc(pair, C.SIGNAL_INTERVAL) for pair in C.PAIRS}
    rules = {pair: C.EXCHANGE.pair_rules(pair) for pair in C.PAIRS}
    index = {pair: {c["t"]: i for i, c in enumerate(cs)} for pair, cs in data.items()}
    times = sorted(set.intersection(*(set(ix) for ix in index.values())))
    warmup = C.EMA_SLOW + C.ATR_PERIOD + 5
    every = max(1, C.CHECK_EVERY_MIN // C.SIGNAL_INTERVAL)
    pending, peak, halted = {}, C.START_CAPITAL, False

    for k, t in enumerate(times):
        if k >= warmup and k % every == 0:
            peak = max(peak, broker.equity(j))  # même coupe-circuit qu'en direct (bot.py run)
            halted = (peak - broker.equity(j)) / peak >= C.MAX_DRAWDOWN_STOP if peak > 0 else False
        for pair in C.PAIRS:
            i = index[pair][t]
            c = data[pair][i]
            if pair in pending:  # décision prise à la clôture précédente → achat à l'ouverture
                broker.open_position(j, pair, c["o"] * (1 + C.SLIPPAGE), pending.pop(pair), rules[pair], t)
            pos = next((p for p in j.open_positions() if p["pair"] == pair), None)
            if pos:
                broker.apply_candle(j, pos, c)
            elif k >= warmup and k % every == 0:
                if halted:
                    continue
                sig = strategy.evaluate(data[pair][: i + 1])
                if sig["enter"]:
                    pending[pair] = sig
                else:
                    j.log(pair, "SKIP", sig["price"], sig["reason"], t + C.SIGNAL_INTERVAL * 60)

    last = {pair: data[pair][index[pair][times[-1]]]["c"] for pair in C.PAIRS}
    start = {pair: data[pair][index[pair][times[warmup]]]["c"] for pair in C.PAIRS}
    hold = sum(last[p] / start[p] - 1 for p in C.PAIRS) / len(C.PAIRS)
    print(f"Période : {fmt_ts(times[warmup])} → {fmt_ts(times[-1])}  ({C.SIGNAL_INTERVAL} min par bougie)")
    print(f"Pour comparer, acheter et garder les {len(C.PAIRS)} paires à parts égales : {hold:+.1%}\n")
    report(C.BACKTEST_DB_PATH, marks=last)


def report(path=None, marks=None):
    if C.PROFILE == "accumulation":
        mark = (marks or {}).get(C.ACCUM_PAIR)
        return accumulate.report(path, mark=mark)
    j = Journal(path or C.DB_PATH)
    closed, still_open = j.closed_positions(), j.open_positions()
    pnls = [p["pnl"] for p in closed]
    total = sum(pnls)
    wins = [x for x in pnls if x > 0]
    without_top2 = total - sum(sorted(pnls, reverse=True)[:2])
    fees = sum(
        (p["cost"] - p["qty"] * p["entry"])
        + p["qty"] * p["exit_price"] * (C.MAKER_FEE if p["exit_reason"] == "TAKE_PROFIT" else C.TAKER_FEE)
        for p in closed
    )
    peak = running = C.START_CAPITAL
    drawdown = 0.0
    for x in pnls:
        running += x
        peak = max(peak, running)
        drawdown = max(drawdown, (peak - running) / peak)
    reasons = {}
    for p in closed:
        reasons[p["exit_reason"]] = reasons.get(p["exit_reason"], 0) + 1

    eq = broker.equity(j, marks)
    print(f"Capital : {C.START_CAPITAL:.2f} → {eq:.2f} {C.QUOTE} ({eq / C.START_CAPITAL - 1:+.1%})")
    target = C.START_CAPITAL * C.TARGET_MULTIPLE
    print(f"Objectif x{C.TARGET_MULTIPLE} : {target:.0f} {C.QUOTE}, atteint à {eq / target:.1%}")
    print(f"Trades clos : {len(closed)}   ouverts : {len(still_open)}")
    if closed:
        print(f"Gagnants : {len(wins)}/{len(closed)} ({len(wins) / len(closed):.0%})")
        print(f"Résultat des trades clos : {total:+.2f} {C.QUOTE}, dont {fees:.2f} {C.QUOTE} de frais payés")
        print(f"Sans les 2 meilleurs trades : {without_top2:+.2f} {C.QUOTE}")
        print(f"Pire recul du capital : {drawdown:.1%}")
        print("Sorties : " + ", ".join(f"{k} {v}" for k, v in sorted(reasons.items())))
    print("\nCritères pour envisager de l'argent réel :")
    for ok, label in [
        (len(closed) >= 30, f"au moins 30 trades clos ({len(closed)})"),
        (total > 0, "résultat positif après frais"),
        (without_top2 > 0, "toujours positif sans les 2 meilleurs trades"),
        (drawdown < 0.20, "recul maximal du capital inférieur à 20 %"),
    ]:
        print(f"  [{'x' if ok else ' '}] {label}")


def export():
    """Rapport lisible et CSV des décisions, pour relire l'historique sans Python."""
    lines = [f"# KrakenPaperBot — simulation\n\nMis à jour le {datetime.now():%d/%m/%Y %H:%M}\n"]
    for profile in C.PROFILES:
        C.use(profile)
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                report()
                print("\nDernières décisions :")
                print_decisions(Journal(C.DB_PATH).decisions(limit=20))
        except Exception as e:
            # Un profil en échec ne doit jamais empêcher le rapport et le CSV des autres d'être écrits.
            print(f"ERREUR export du profil {profile} : {e!r}", file=sys.stderr)
            buf.write(f"Erreur lors de la génération du rapport : {e!r}\n")
        lines.append(f"## Profil {profile}\n\n```\n{buf.getvalue()}```\n")
        with open(os.path.join(C.DATA_DIR, f"decisions-{profile}.csv"), "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["date", "paire", "action", "prix", "raison", "donnees"])
            for d in Journal(C.DB_PATH).decisions():
                w.writerow([fmt_ts(d["ts"]), d["pair"], d["action"], d["price"], d["reason"], d["data"]])
    with open(os.path.join(C.DATA_DIR, "RAPPORT.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "run"
    args = sys.argv[2:]
    profiles = [a for a in args if a in C.PROFILES] or list(C.PROFILES)
    args = [a for a in args if a not in C.PROFILES]
    if cmd == "export":
        export()
        sys.exit()
    if cmd not in ("run", "backtest", "report", "journal"):
        print(__doc__)
        sys.exit()
    failures = []
    for profile in profiles:
        C.use(profile)
        print(f"\n===== Profil {profile} =====")
        try:
            if cmd == "run":
                run()
            elif cmd == "backtest":
                backtest()
            elif cmd == "report":
                report(C.BACKTEST_DB_PATH if args == ["backtest"] else C.DB_PATH)
            else:
                print_decisions(Journal(C.DB_PATH).decisions(limit=int(args[0]) if args else 30))
        except Exception as e:
            # Un profil qui plante (bug, aléa réseau Kraken) ne doit jamais empêcher les autres de
            # tourner, ni bloquer l'export de leurs données : chacun a son propre portefeuille et
            # journal, indépendant des autres. On ne sort en erreur que si tous ont échoué (rien à
            # exporter de toute façon), pour ne jamais couper `bot.py run && bot.py export` en amont.
            failures.append(profile)
            print(f"ERREUR sur le profil {profile} : {e!r}")
    if failures:
        print(f"Profils en échec : {', '.join(failures)}")
        if len(failures) == len(profiles):
            sys.exit(1)
