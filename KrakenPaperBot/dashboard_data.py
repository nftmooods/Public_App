"""Convertit KPB_DATA_DIR/decisions-*.csv en KPB_DATA_DIR/dashboard.json, pour le tableau de bord visuel.

    python dashboard_data.py

Lu par le tableau de bord publié (voir data/dashboard-url.txt pour son lien), republié par Claude
après chaque vérification qui trouve un nouveau cycle.
"""
import csv
import json
import os
from datetime import datetime

import config as C

START_CAPITAL = C.START_CAPITAL
TARGET_MULTIPLE = C.TARGET_MULTIPLE


def parse_ts(s):
    return datetime.strptime(s, "%d/%m %H:%M").replace(year=datetime.now().year).isoformat()


def load(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build_profile(rows):
    equity, open_positions, closed_trades, events, last_skip = [], {}, [], [], {}

    for r in rows:
        ts = parse_ts(r["date"])
        pair, action = r["paire"], r["action"]
        data = json.loads(r["donnees"]) if r["donnees"] else {}
        price = float(r["prix"]) if r["prix"] not in ("", None) else None

        if action == "HOLD":
            if pair in open_positions:
                try:
                    latent = float(r["raison"].split("latent ")[1].split(" ")[0])
                except (IndexError, ValueError):
                    latent = None
                open_positions[pair]["lastMark"] = {"ts": ts, "price": price, "latent": latent}
        elif action == "EQUITY":
            equity.append({"t": ts, "equity": round(price, 4)})
        elif action == "ENTER":
            open_positions[pair] = {
                "pair": pair, "entryTs": ts, "entry": price,
                "qty": data.get("qty"), "stop": data.get("stop"), "tp": data.get("tp"),
                "reason": r["raison"].split(" → ")[0], "secured": False,
            }
        elif action == "SECURE":
            if pair in open_positions:
                open_positions[pair]["secured"] = True
        elif action in ("TAKE_PROFIT", "STOP_LOSS", "STOP_SECURISE"):
            pos = open_positions.pop(pair, None)
            if pos:
                pos.update({"exitTs": ts, "exit": price, "exitReason": action,
                            "pnl": round(data.get("pnl", 0), 4), "status": "closed"})
                closed_trades.append(pos)
        elif action == "SKIP":
            last_skip[pair] = {"ts": ts, "reason": r["raison"]}
        elif action == "HALT":
            events.append({"ts": ts, "reason": r["raison"]})

    still_open = [dict(p, status="open") for p in open_positions.values()]
    pnls = [t["pnl"] for t in closed_trades]
    wins = [p for p in pnls if p > 0]
    eq_now = equity[-1]["equity"] if equity else START_CAPITAL
    peak = running = START_CAPITAL
    drawdown = 0.0
    for p in pnls:
        running += p
        peak = max(peak, running)
        drawdown = max(drawdown, (peak - running) / peak if peak else 0)

    return {
        "equity": equity,
        "openTrades": sorted(still_open, key=lambda t: t["entryTs"]),
        "closedTrades": sorted(closed_trades, key=lambda t: t["exitTs"], reverse=True),
        "events": events,
        "lastSkip": last_skip,
        "summary": {
            "capitalNow": round(eq_now, 2), "capitalStart": START_CAPITAL,
            "targetMultiple": TARGET_MULTIPLE, "targetCapital": START_CAPITAL * TARGET_MULTIPLE,
            "progressPct": round(eq_now / (START_CAPITAL * TARGET_MULTIPLE) * 100, 3),
            "tradesClosed": len(closed_trades), "tradesOpen": len(still_open),
            "wins": len(wins), "winRatePct": round(len(wins) / len(pnls) * 100, 1) if pnls else None,
            "pnlTotal": round(sum(pnls), 2), "drawdownPct": round(drawdown * 100, 1),
        },
    }


def main():
    out = {
        "generatedAt": datetime.now().isoformat(),
        "profiles": {p: build_profile(load(os.path.join(C.DATA_DIR, f"decisions-{p}.csv")))
                     for p in C.PROFILES},
    }
    with open(os.path.join(C.DATA_DIR, "dashboard.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)


if __name__ == "__main__":
    main()
