"""Paramètres de la simulation. Tout ce qui influence une décision est ici."""

PAIRS = ["XBTEUR", "ETHEUR", "SOLEUR"]

START_CAPITAL = 50.0          # EUR
RISK_PER_TRADE = 0.02         # part du capital perdue si le stop est touché
MAX_POSITION_FRACTION = 0.5   # une position ne dépasse jamais 50 % du capital

CHECK_EVERY_MIN = 120         # un cycle d'analyse toutes les 2 h
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

DB_PATH = "sim.db"
BACKTEST_DB_PATH = "backtest.db"
