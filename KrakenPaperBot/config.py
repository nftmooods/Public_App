"""Paramètres de la simulation. Tout ce qui influence une décision est ici."""
import os

PAIRS = ["XBTUSD", "ETHUSD", "SOLUSD"]
QUOTE = "USD"

START_CAPITAL = 50.0          # USD
TARGET_MULTIPLE = 100         # objectif : x100 la mise de départ
RISK_PER_TRADE = 0.02         # part du capital perdue si le stop est touché
MAX_POSITION_FRACTION = 0.5   # une position ne dépasse jamais 50 % du capital

CHECK_EVERY_MIN = 30          # un cycle toutes les 30 min (GitHub Actions)
SIGNAL_INTERVAL = 60          # bougies de 1 h pour décider

# Indicateurs
EMA_FAST = 20
EMA_SLOW = 50
RSI_PERIOD = 14
RSI_MIN, RSI_MAX = 45, 70
ATR_PERIOD = 14

# Sorties, en multiples d'ATR (volatilité moyenne d'une bougie)
STOP_ATR = 2.0
TAKE_PROFIT_ATR = 3.0
BREAKEVEN_ATR = 1.5   # à +1,5 ATR, le stop remonte au prix d'entrée, frais compris

# Frais Kraken Pro au palier de volume le plus bas (à revérifier sur kraken.com)
TAKER_FEE = 0.0040
MAKER_FEE = 0.0025
SLIPPAGE = 0.001

# Profils simulés en parallèle sur les mêmes prix, chacun avec son propre portefeuille et son journal.
# Un profil ne liste que ce qu'il change par rapport aux valeurs ci-dessus.
PROFILES = {
    "prudent": {},
    # Vise le x100 : risque 5x plus gros par trade, tout le capital mobilisable, objectifs plus lointains.
    "agressif": {"RISK_PER_TRADE": 0.10, "MAX_POSITION_FRACTION": 1.0,
                 "TAKE_PROFIT_ATR": 5.0, "BREAKEVEN_ATR": 2.0},
}

DATA_DIR = os.environ.get("KPB_DATA_DIR", ".")
_DEFAULTS = {k: globals()[k] for p in PROFILES.values() for k in p}


def use(profile):
    """Applique un profil : ses réglages et ses fichiers de journal."""
    g = globals()
    g.update(_DEFAULTS)
    g.update(PROFILES[profile])
    g["PROFILE"] = profile
    g["DB_PATH"] = os.path.join(DATA_DIR, f"sim-{profile}.db")
    g["BACKTEST_DB_PATH"] = os.path.join(DATA_DIR, f"backtest-{profile}.db")


use("prudent")
