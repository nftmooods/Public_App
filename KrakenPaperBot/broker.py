"""Courtier simulé : ouvre les positions et rejoue les bougies pour appliquer stop et objectif.

Hypothèses volontairement pessimistes :
- si une bougie touche le stop ET l'objectif, on considère que le stop est passé en premier ;
- si le prix ouvre sous le stop (gap), on vend au prix d'ouverture, pas au stop ;
- l'objectif est une vente limite : on ne vend jamais au-dessus de l'objectif.
"""
import config as C


def cash(j):
    return float(j.get("cash", C.START_CAPITAL))


def equity(j, marks=None):
    """Cash + positions ouvertes, au prix de marché si connu, sinon au prix d'entrée."""
    marks = marks or {}
    return cash(j) + sum(p["qty"] * marks.get(p["pair"], p["entry"]) for p in j.open_positions())


def breakeven_price(entry):
    """Prix de stop qui rembourse l'achat, frais et slippage compris."""
    return entry * (1 + C.TAKER_FEE) / ((1 - C.SLIPPAGE) * (1 - C.TAKER_FEE))


def open_position(j, pair, fill, sig, rules, ts):
    stop = fill - C.STOP_ATR * sig["atr"]
    tp = fill + C.TAKE_PROFIT_ATR * sig["atr"]
    eq, available = equity(j), cash(j)
    qty = min(
        eq * C.RISK_PER_TRADE / (fill - stop),
        eq * C.MAX_POSITION_FRACTION / fill,
        available / (fill * (1 + C.TAKER_FEE)),
    )
    if qty < rules["ordermin"] or qty * fill < rules["costmin"]:
        j.log(pair, "SKIP", fill,
              f"signal valide mais montant trop petit pour Kraken "
              f"({qty:.8f} < minimum {rules['ordermin']} ou {qty * fill:.2f} EUR < {rules['costmin']} EUR)", ts)
        return None

    cost = qty * fill * (1 + C.TAKER_FEE)
    j.set("cash", available - cost)
    j.db.execute(
        "INSERT INTO positions (pair, opened_ts, entry, qty, cost, stop, tp, atr, checked_ts) "
        "VALUES (?,?,?,?,?,?,?,?,?)",
        (pair, ts, fill, qty, cost, stop, tp, sig["atr"], ts),
    )
    j.db.commit()
    j.log(pair, "ENTER", fill,
          f"{sig['reason']} → achat de {qty:.6f} à {fill:.2f} ({cost:.2f} EUR frais compris), "
          f"stop {stop:.2f}, objectif {tp:.2f}", ts, qty=qty, stop=stop, tp=tp, **sig["indicators"])


def close(j, p, price, reason, ts, detail):
    fee = C.MAKER_FEE if reason == "TAKE_PROFIT" else C.TAKER_FEE
    proceeds = p["qty"] * price * (1 - fee)
    pnl = proceeds - p["cost"]
    j.set("cash", cash(j) + proceeds)
    j.db.execute(
        "UPDATE positions SET status='closed', closed_ts=?, exit_price=?, exit_reason=?, pnl=? WHERE id=?",
        (ts, price, reason, pnl, p["id"]),
    )
    j.db.commit()
    j.log(p["pair"], reason, price, f"{detail} → vente à {price:.2f}, résultat {pnl:+.2f} EUR",
          ts, position=p["id"], pnl=pnl)
    return True


def apply_candle(j, p, c):
    """Rejoue une bougie sur une position ouverte. Renvoie True si la position est fermée."""
    label = "STOP_SECURISE" if p["secured"] else "STOP_LOSS"
    if c["o"] <= p["stop"]:
        return close(j, p, c["o"] * (1 - C.SLIPPAGE), label, c["t"], "ouverture en gap sous le stop")
    if c["l"] <= p["stop"]:
        return close(j, p, p["stop"] * (1 - C.SLIPPAGE), label, c["t"], "stop touché")
    if c["h"] >= p["tp"]:
        return close(j, p, p["tp"], "TAKE_PROFIT", c["t"], "objectif atteint")

    if not p["secured"] and c["h"] >= p["entry"] + C.BREAKEVEN_ATR * p["atr"]:
        p["stop"], p["secured"] = breakeven_price(p["entry"]), 1
        j.db.execute("UPDATE positions SET stop=?, secured=1 WHERE id=?", (p["stop"], p["id"]))
        j.db.commit()
        j.log(p["pair"], "SECURE", c["h"],
              f"+{C.BREAKEVEN_ATR} ATR atteint → stop remonté à {p['stop']:.2f} (position sans risque de perte)",
              c["t"], position=p["id"])
    return False
