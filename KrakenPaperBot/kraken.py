"""Données publiques Kraken : aucune clé API, aucun accès au compte."""
import functools
import time

import requests

BASE = "https://api.kraken.com/0/public"


@functools.lru_cache(maxsize=None)  # tous les profils d'un même cycle voient les mêmes prix
def _get(path, **params):
    for attempt in range(3):
        try:
            r = requests.get(f"{BASE}/{path}", params=params, timeout=20)
            r.raise_for_status()
            data = r.json()
            if data.get("error"):
                raise RuntimeError(data["error"])
            return data["result"]
        except (requests.RequestException, RuntimeError):
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def ohlc(pair, interval, since=None):
    """Bougies clôturées uniquement (Kraken renvoie aussi la bougie en cours, on l'écarte)."""
    params = {"pair": pair, "interval": interval}
    if since:
        params["since"] = since
    res = _get("OHLC", **params)
    rows = res[next(k for k in res if k != "last")]
    now = time.time()
    return [
        {"t": int(c[0]), "o": float(c[1]), "h": float(c[2]), "l": float(c[3]), "c": float(c[4])}
        for c in rows
        if int(c[0]) + interval * 60 <= now
    ]


def ticker(pair):
    t = next(iter(_get("Ticker", pair=pair).values()))
    return {"ask": float(t["a"][0]), "bid": float(t["b"][0]), "last": float(t["c"][0])}


def pair_rules(pair):
    """Minimums d'ordre imposés par Kraken : quantité minimale et montant minimal."""
    info = next(iter(_get("AssetPairs", pair=pair).values()))
    return {"ordermin": float(info.get("ordermin") or 0), "costmin": float(info.get("costmin") or 0)}
