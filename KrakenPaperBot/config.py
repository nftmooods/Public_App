"""Paramètres de la simulation. Tout ce qui influence une décision est ici."""
import os

PAIRS = ["XBTUSD", "ETHUSD", "SOLUSD"]
QUOTE = "USD"

START_CAPITAL = 50.0          # USD
TARGET_MULTIPLE = 100         # objectif : x100 la mise de départ
RISK_PER_TRADE = 0.02         # part du capital perdue si le stop est touché
MAX_POSITION_FRACTION = 0.5   # une position ne dépasse jamais 50 % du capital

CHECK_EVERY_MIN = 30          # un cycle toutes les 30 min (GitHub Actions) : rattrape et gère les sorties
SIGNAL_INTERVAL = 60          # bougies de 1 h pour décider d'une entrée
# Testé en 4h (24/09) : résultat pire (-32 %/-36 % sur 110 jours) qu'en 1h (-24 %/-30 % sur 30 jours),
# comparé à un marché qui montait davantage sur la période 4h (+56 % contre +11 %). Revenu au signal 1h.

MAX_DRAWDOWN_STOP = 0.30      # au-delà de ce recul depuis le sommet du capital, plus aucune nouvelle
                               # entrée : les positions ouvertes continuent d'être gérées (stop/objectif),
                               # mais le bot arrête de miser tant que le capital n'est pas remonté

# Indicateurs
EMA_FAST = 20
EMA_SLOW = 50
RSI_PERIOD = 14
RSI_MIN, RSI_MAX = 45, 70
ATR_PERIOD = 14
EMA_GAP_MIN = 0.001      # tendance nette : EMA rapide au moins 0,1 % au-dessus de l'EMA lente
EMA_SLOPE_LOOKBACK = 3   # l'EMA rapide doit être plus haute qu'il y a 3 bougies (encore montante)

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
