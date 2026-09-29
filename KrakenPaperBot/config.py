"""Paramètres de la simulation. Tout ce qui influence une décision est ici."""
import os

import kraken
import okx

PAIRS = ["XBTUSD", "ETHUSD", "SOLUSD"]
QUOTE = "USD"
EXCHANGE = kraken  # module qui fournit ohlc()/ticker()/pair_rules() ; voir profil "memecoin" pour OKX

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

VOLUME_MIN_RATIO = None   # si défini : la dernière bougie doit peser au moins ce multiple du volume
                           # moyen récent pour valider une entrée (voir profil "memecoin")
ADX_MIN = None             # si défini : n'entre que si l'ADX (force de tendance) dépasse ce seuil,
                           # pour écarter les faux départs en marché plat (voir strategy.adx)
ADX_PERIOD = 14

# Frais Kraken Pro au palier de volume le plus bas (à revérifier sur kraken.com)
TAKER_FEE = 0.0040
MAKER_FEE = 0.0025
SLIPPAGE = 0.001

# Profil "accumulation" (voir accumulate.py) : objectif = maximiser la quantité d'ETH détenue avant
# la fin du cycle haussier, pas le $ à court terme. Achète par paliers sur les replis d'une tendance
# de fond haussière (EMA journalières), ne revend tout qu'à la détection d'un retournement structurel.
ACCUM_PAIR = "ETHUSD"
ACCUM_DAILY_INTERVAL = 1440       # bougies journalières pour juger la tendance de fond
ACCUM_EMA_FAST = 50               # golden/death cross journalier
ACCUM_EMA_SLOW = 200
ACCUM_PULLBACK_LOOKBACK_H = 48    # sommet local calculé sur les 48 dernières heures
ACCUM_MIN_PULLBACK = 0.02         # repli mini de 2 % depuis ce sommet pour parler de "repli"
ACCUM_DIP_RSI_MAX = 45            # repli réel, pas un marché encore euphorique
ACCUM_BUY_FRACTION = 0.25         # part du cash dispo engagée à chaque repli (accumulation par paliers)

# Profils simulés en parallèle sur les mêmes prix, chacun avec son propre portefeuille et son journal.
# Un profil ne liste que ce qu'il change par rapport aux valeurs ci-dessus.
PROFILES = {
    "prudent": {},
    # Vise le x100 : risque 5x plus gros par trade, tout le capital mobilisable, objectifs plus lointains.
    "agressif": {"RISK_PER_TRADE": 0.10, "MAX_POSITION_FRACTION": 1.0,
                 "TAKE_PROFIT_ATR": 5.0, "BREAKEVEN_ATR": 2.0},
    # Accumulation d'ETH : voir accumulate.py, ne suit pas le schéma stop/objectif des deux profils ci-dessus.
    "accumulation": {},
    # Test OKX sur des meme coins (DOGE/SHIB/PEPE/WIF) : même moteur trend-following que prudent/agressif,
    # mais réglages resserrés pour leur volatilité erratique — position plus petite, tendance et volume
    # confirmés plus strictement, RSI plafonné plus bas pour ne pas acheter un pump déjà bien avancé.
    # Purement simulé, comme les autres : aucune clé API OKX utilisée ici (marché public uniquement).
    "memecoin": {
        "EXCHANGE": okx,
        "PAIRS": ["DOGE-USDT", "SHIB-USDT", "PEPE-USDT", "WIF-USDT"],
        "RISK_PER_TRADE": 0.01, "MAX_POSITION_FRACTION": 0.25,
        "EMA_GAP_MIN": 0.005, "RSI_MIN": 45, "RSI_MAX": 60,
        "STOP_ATR": 2.5, "TAKE_PROFIT_ATR": 4.0, "BREAKEVEN_ATR": 1.8,
        "VOLUME_MIN_RATIO": 1.3,
    },
    # --- Profils de test temporaires (branche test-adx-hypothesis, jamais mergés tels quels) ---
    # Comparent des pistes pour réduire les faux départs en range, à partir des réglages "prudent".
    "test_adx15": {"ADX_MIN": 15},
    "test_adx20": {"ADX_MIN": 20},
    "test_adx25": {"ADX_MIN": 25},
    "test_rsi_tight": {"RSI_MIN": 45, "RSI_MAX": 60},
    "test_adx20_rsi_tight": {"ADX_MIN": 20, "RSI_MIN": 45, "RSI_MAX": 60},
}

# Type de profil pour le tableau de bord visuel (dashboard_data.py) : "trading" (stop/objectif par
# position, le cas par défaut) ou "accumulation" (aucun stop/objectif, une seule sortie = liquidation
# totale). Les profils absents de ce dict sont "trading".
PROFILE_KIND = {"accumulation": "accumulation"}

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
