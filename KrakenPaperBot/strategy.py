"""Règles d'entrée. Chaque décision renvoie la raison en clair et les chiffres qui l'ont produite."""
import config as C


def ema(values, n):
    k, out, e = 2 / (n + 1), [], None
    for v in values:
        e = v if e is None else v * k + e * (1 - k)
        out.append(e)
    return out


def rsi(closes, n):
    gains = sum(max(closes[i] - closes[i - 1], 0) for i in range(1, n + 1)) / n
    losses = sum(max(closes[i - 1] - closes[i], 0) for i in range(1, n + 1)) / n
    for i in range(n + 1, len(closes)):
        d = closes[i] - closes[i - 1]
        gains = (gains * (n - 1) + max(d, 0)) / n
        losses = (losses * (n - 1) + max(-d, 0)) / n
    return 100.0 if losses == 0 else 100 - 100 / (1 + gains / losses)


def atr(candles, n):
    trs = [
        max(c["h"] - c["l"], abs(c["h"] - p["c"]), abs(c["l"] - p["c"]))
        for p, c in zip(candles, candles[1:])
    ]
    a = sum(trs[:n]) / n
    for tr in trs[n:]:
        a = (a * (n - 1) + tr) / n
    return a


def evaluate(candles):
    """Achète seulement dans une tendance haussière nette et encore montante, sans poursuivre un marché
    déjà surchauffé. Backtest du 24/09 : sans filtre de force ni de pente, 48 % des sorties étaient des
    stop loss secs (faux départs sur des croisements EMA marginaux) — d'où ces deux filtres en plus."""
    price = candles[-1]["c"] if candles else None
    if len(candles) < C.EMA_SLOW + C.ATR_PERIOD + C.EMA_SLOPE_LOOKBACK + 1:
        return {"enter": False, "price": price, "reason": "historique insuffisant", "indicators": {}}

    closes = [c["c"] for c in candles]
    fast_series = ema(closes, C.EMA_FAST)
    fast, slow = fast_series[-1], ema(closes, C.EMA_SLOW)[-1]
    fast_prev = fast_series[-1 - C.EMA_SLOPE_LOOKBACK]
    r, a = rsi(closes, C.RSI_PERIOD), atr(candles, C.ATR_PERIOD)

    checks = [
        (fast > slow * (1 + C.EMA_GAP_MIN),
         f"tendance nette (EMA{C.EMA_FAST} {fast:.2f} > EMA{C.EMA_SLOW} {slow:.2f} de {C.EMA_GAP_MIN:.1%}+)",
         f"tendance trop faible ou baissière (EMA{C.EMA_FAST} {fast:.2f}, EMA{C.EMA_SLOW} {slow:.2f})"),
        (fast > fast_prev,
         f"EMA{C.EMA_FAST} encore montante (+{fast - fast_prev:.2f} sur {C.EMA_SLOPE_LOOKBACK} bougies)",
         f"EMA{C.EMA_FAST} qui s'essouffle ({fast - fast_prev:+.2f} sur {C.EMA_SLOPE_LOOKBACK} bougies)"),
        (price > fast,
         "prix au-dessus de l'EMA rapide",
         "prix sous l'EMA rapide"),
        (C.RSI_MIN <= r <= C.RSI_MAX,
         f"RSI {r:.0f} dans la zone {C.RSI_MIN}-{C.RSI_MAX}",
         f"RSI {r:.0f} hors zone {C.RSI_MIN}-{C.RSI_MAX}"),
    ]
    return {
        "enter": all(ok for ok, _, _ in checks),
        "price": price,
        "atr": a,
        "reason": "; ".join(yes if ok else no for ok, yes, no in checks),
        "indicators": {"ema_fast": fast, "ema_slow": slow, "rsi": r, "atr": a},
    }
