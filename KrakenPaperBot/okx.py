"""Données publiques OKX : aucune clé API, aucun accès au compte. Même interface que kraken.py
(ohlc/ticker/pair_rules) pour que bot.py/broker.py/strategy.py restent inchangés — seul le profil
utilisé décide, via config.EXCHANGE, quel module interroge le marché."""
import functools
import time

import requests

BASE = "https://www.okx.com/api/v5"

# bougies en minutes (même convention que kraken.py) → code de bougie OKX
BAR = {1: "1m", 3: "3m", 5: "5m", 15: "15m", 30: "30m", 60: "1H", 240: "4H", 1440: "1Dutc"}


@functools.lru_cache(maxsize=None)  # tous les profils d'un même cycle voient les mêmes prix
def _get(path, **params):
    for attempt in range(3):
        try:
            r = requests.get(f"{BASE}/{path}", params=params, timeout=20)
            r.raise_for_status()
            data = r.json()
            if data.get("code") != "0":
                raise RuntimeError(data.get("msg", data))
            return data["data"]
        except (requests.RequestException, RuntimeError):
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def ohlc(pair, interval, since=None):
    """Bougies clôturées uniquement, les plus récentes en dernier (comme kraken.ohlc).
    Remonte jusqu'à ~900 bougies (3 pages) via l'historique OKX pour couvrir un vrai backtest."""
    bar = BAR[interval]
    now_ms = int(time.time() * 1000)
    rows, before = [], None
    for _ in range(3):
        params = {"instId": pair, "bar": bar, "limit": 300}
        if before:
            params["after"] = before
        page = _get("market/history-candles", **params)
        if not page:
            break
        rows = page + rows
        before = page[-1][0]
        if since and int(before) <= since * 1000:
            break
    rows.sort(key=lambda c: int(c[0]))  # OKX renvoie le plus récent en premier : on remet en ordre
    return [
        {"t": int(c[0]) // 1000, "o": float(c[1]), "h": float(c[2]), "l": float(c[3]),
         "c": float(c[4]), "v": float(c[5])}
        for c in rows
        if int(c[0]) + interval * 60_000 <= now_ms and (not since or int(c[0]) // 1000 >= since)
    ]


def ticker(pair):
    t = _get("market/ticker", instId=pair)[0]
    return {"ask": float(t["askPx"]), "bid": float(t["bidPx"]), "last": float(t["last"])}


def pair_rules(pair):
    """Minimum d'ordre imposé par OKX : quantité minimale (OKX ne publie pas de montant minimal
    distinct comme Kraken costmin, donc on ne contraint que sur la quantité)."""
    info = _get("public/instruments", instType="SPOT", instId=pair)[0]
    return {"ordermin": float(info.get("minSz") or 0), "costmin": 0.0}
