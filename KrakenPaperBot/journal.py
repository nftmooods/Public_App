"""Journal SQLite : chaque décision, chaque position, et l'état du portefeuille simulé."""
import json
import os
import sqlite3
import time

SCHEMA = """
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER, pair TEXT, action TEXT, price REAL, reason TEXT, data TEXT
);
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair TEXT, opened_ts INTEGER, entry REAL, qty REAL, cost REAL,
  stop REAL, tp REAL, atr REAL, secured INTEGER DEFAULT 0,
  checked_ts INTEGER, status TEXT DEFAULT 'open',
  closed_ts INTEGER, exit_price REAL, exit_reason TEXT, pnl REAL
);
CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT);
"""


class Journal:
    def __init__(self, path, reset=False):
        if reset and os.path.exists(path):
            os.remove(path)
        self.db = sqlite3.connect(path)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)

    def log(self, pair, action, price, reason, ts=None, **data):
        self.db.execute(
            "INSERT INTO decisions (ts, pair, action, price, reason, data) VALUES (?,?,?,?,?,?)",
            (int(ts or time.time()), pair, action, price, reason, json.dumps(data, default=float)),
        )
        self.db.commit()

    def get(self, key, default=None):
        row = self.db.execute("SELECT value FROM state WHERE key=?", (key,)).fetchone()
        return row["value"] if row else default

    def set(self, key, value):
        self.db.execute("INSERT OR REPLACE INTO state (key, value) VALUES (?,?)", (key, str(value)))
        self.db.commit()

    def open_positions(self):
        return [dict(r) for r in self.db.execute("SELECT * FROM positions WHERE status='open'")]

    def closed_positions(self):
        return [dict(r) for r in self.db.execute(
            "SELECT * FROM positions WHERE status='closed' ORDER BY closed_ts")]

    def decisions(self, since=0, limit=None):
        q = "SELECT * FROM decisions WHERE ts>=? ORDER BY id"
        rows = [dict(r) for r in self.db.execute(q, (since,))]
        return rows[-limit:] if limit else rows
