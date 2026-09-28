# KrakenPaperBot — simulation

Mis à jour le 28/09/2026 05:01

## Profil prudent

```
Capital : 50.00 → 48.02 USD (-4.0%)
Objectif x100 : 5000 USD, atteint à 1.0%
Trades clos : 9   ouverts : 0
Gagnants : 1/9 (11%)
Résultat des trades clos : -1.98 USD, dont 1.74 USD de frais payés
Sans les 2 meilleurs trades : -2.56 USD
Pire recul du capital : 5.1%
Sorties : STOP_LOSS 5, STOP_SECURISE 3, TAKE_PROFIT 1

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (9)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
27/09 21:23  -       EQUITY             49.19  capital simulé 49.19 USD dont 0.00 USD de cash
27/09 23:46  XBTUSD  HOLD            84610.10  position gardée : stop 84287.87, objectif 85645.31, latent -0.26 USD
27/09 23:46  SOLUSD  HOLD              122.73  position gardée : stop 121.30, objectif 126.31, latent -0.31 USD
27/09 23:46  ETHUSD  SKIP             2685.67  tendance trop faible ou baissière (EMA20 2696.07, EMA50 2694.56); EMA20 qui s'essouffle (-1.77 sur 3 bougies); prix sous l'EMA rapide; RSI 43 hors zone 45-70
27/09 23:46  -       EQUITY             49.02  capital simulé 49.02 USD dont 0.00 USD de cash
28/09 00:10  XBTUSD  STOP_LOSS       84203.58  stop touché → vente à 84203.58, résultat -0.38 USD
28/09 00:24  SOLUSD  HOLD              121.87  position gardée : stop 121.30, objectif 126.31, latent -0.48 USD
28/09 00:24  XBTUSD  ENTER           84582.40  tendance nette (EMA20 84582.07 > EMA50 84429.27 de 0.1%+); EMA20 encore montante (+17.99 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 54 dans la zone 45-70 → achat de 0.000288 à 84582.40 (24.41 USD frais compris), stop 84052.26, objectif 85377.61
28/09 00:24  ETHUSD  SKIP             2683.66  tendance trop faible ou baissière (EMA20 2694.89, EMA50 2694.13); EMA20 qui s'essouffle (-2.93 sur 3 bougies); prix sous l'EMA rapide; RSI 41 hors zone 45-70
28/09 00:24  -       EQUITY             48.53  capital simulé 48.53 USD dont 0.00 USD de cash
28/09 00:35  SOLUSD  STOP_LOSS         121.18  stop touché → vente à 121.18, résultat -0.62 USD
28/09 02:57  XBTUSD  HOLD            84200.00  position gardée : stop 84052.26, objectif 85377.61, latent -0.30 USD
28/09 02:57  ETHUSD  SKIP             2688.02  tendance trop faible ou baissière (EMA20 2692.50, EMA50 2693.16); EMA20 qui s'essouffle (-3.57 sur 3 bougies); prix sous l'EMA rapide; RSI 47 dans la zone 45-70
28/09 02:57  SOLUSD  SKIP              121.98  tendance nette (EMA20 122.30 > EMA50 121.48 de 0.1%+); EMA20 qui s'essouffle (-0.09 sur 3 bougies); prix sous l'EMA rapide; RSI 49 dans la zone 45-70
28/09 02:57  -       EQUITY             48.19  capital simulé 48.19 USD dont 23.98 USD de cash
28/09 03:00  XBTUSD  STOP_LOSS       83968.21  stop touché → vente à 83968.21, résultat -0.37 USD
28/09 05:01  XBTUSD  SKIP            83386.60  tendance trop faible ou baissière (EMA20 84319.37, EMA50 84341.23); EMA20 qui s'essouffle (-214.18 sur 3 bougies); prix sous l'EMA rapide; RSI 32 hors zone 45-70
28/09 05:01  ETHUSD  SKIP             2652.74  tendance trop faible ou baissière (EMA20 2684.16, EMA50 2689.50); EMA20 qui s'essouffle (-8.34 sur 3 bougies); prix sous l'EMA rapide; RSI 31 hors zone 45-70
28/09 05:01  SOLUSD  SKIP              120.02  tendance nette (EMA20 121.90 > EMA50 121.40 de 0.1%+); EMA20 qui s'essouffle (-0.40 sur 3 bougies); prix sous l'EMA rapide; RSI 37 hors zone 45-70
28/09 05:01  -       EQUITY             48.02  capital simulé 48.02 USD dont 48.02 USD de cash
```

## Profil agressif

```
Capital : 50.00 → 48.49 USD (-3.0%)
Objectif x100 : 5000 USD, atteint à 1.0%
Trades clos : 4   ouverts : 0
Gagnants : 0/4 (0%)
Résultat des trades clos : -1.51 USD, dont 1.59 USD de frais payés
Sans les 2 meilleurs trades : -1.51 USD
Pire recul du capital : 3.0%
Sorties : STOP_LOSS 2, STOP_SECURISE 2

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (4)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
27/09 21:23  SOLUSD  SKIP              123.30  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 21:23  -       EQUITY             49.80  capital simulé 49.80 USD dont 0.00 USD de cash
27/09 23:46  XBTUSD  HOLD            84610.10  position gardée : stop 84287.87, objectif 86188.29, latent -0.53 USD
27/09 23:46  ETHUSD  SKIP             2685.67  tendance trop faible ou baissière (EMA20 2696.07, EMA50 2694.56); EMA20 qui s'essouffle (-1.77 sur 3 bougies); prix sous l'EMA rapide; RSI 43 hors zone 45-70
27/09 23:46  SOLUSD  SKIP              122.87  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 23:46  -       EQUITY             49.67  capital simulé 49.67 USD dont 0.00 USD de cash
28/09 00:10  XBTUSD  STOP_LOSS       84203.58  stop touché → vente à 84203.58, résultat -0.77 USD
28/09 00:24  XBTUSD  ENTER           84582.40  tendance nette (EMA20 84582.07 > EMA50 84429.27 de 0.1%+); EMA20 encore montante (+17.99 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 54 dans la zone 45-70 → achat de 0.000580 à 84582.40 (49.23 USD frais compris), stop 84052.26, objectif 85907.74
28/09 00:24  ETHUSD  SKIP             2683.66  tendance trop faible ou baissière (EMA20 2694.89, EMA50 2694.13); EMA20 qui s'essouffle (-2.93 sur 3 bougies); prix sous l'EMA rapide; RSI 41 hors zone 45-70
28/09 00:24  SOLUSD  SKIP              122.01  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
28/09 00:24  -       EQUITY             49.04  capital simulé 49.04 USD dont 0.00 USD de cash
28/09 02:57  XBTUSD  HOLD            84200.00  position gardée : stop 84052.26, objectif 85907.74, latent -0.61 USD
28/09 02:57  ETHUSD  SKIP             2688.02  tendance trop faible ou baissière (EMA20 2692.50, EMA50 2693.16); EMA20 qui s'essouffle (-3.57 sur 3 bougies); prix sous l'EMA rapide; RSI 47 dans la zone 45-70
28/09 02:57  SOLUSD  SKIP              121.98  tendance nette (EMA20 122.30 > EMA50 121.48 de 0.1%+); EMA20 qui s'essouffle (-0.09 sur 3 bougies); prix sous l'EMA rapide; RSI 49 dans la zone 45-70
28/09 02:57  -       EQUITY             48.82  capital simulé 48.82 USD dont 0.00 USD de cash
28/09 03:00  XBTUSD  STOP_LOSS       83968.21  stop touché → vente à 83968.21, résultat -0.75 USD
28/09 05:01  XBTUSD  SKIP            83386.60  tendance trop faible ou baissière (EMA20 84319.37, EMA50 84341.23); EMA20 qui s'essouffle (-214.18 sur 3 bougies); prix sous l'EMA rapide; RSI 32 hors zone 45-70
28/09 05:01  ETHUSD  SKIP             2652.74  tendance trop faible ou baissière (EMA20 2684.16, EMA50 2689.50); EMA20 qui s'essouffle (-8.34 sur 3 bougies); prix sous l'EMA rapide; RSI 31 hors zone 45-70
28/09 05:01  SOLUSD  SKIP              120.02  tendance nette (EMA20 121.90 > EMA50 121.40 de 0.1%+); EMA20 qui s'essouffle (-0.40 sur 3 bougies); prix sous l'EMA rapide; RSI 37 hors zone 45-70
28/09 05:01  -       EQUITY             48.49  capital simulé 48.49 USD dont 48.49 USD de cash
```

## Profil accumulation

```
Capital : 50.00 → 49.94 USD (-0.1%)
ETH détenu : 0.004684 (coût moyen 2668.76 USD/ETH, cours actuel 2656.00)
Cash disponible : 37.50 USD
Achats faits : 1   liquidations totales : 0

Dernières décisions :
27/09 14:35  ETHUSD  SKIP             2709.31  pas de repli significatif (sommet 48h 2723.60, repli 0.5%)
27/09 14:35  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
27/09 17:42  ETHUSD  SKIP             2687.98  pas de repli significatif (sommet 48h 2722.39, repli 1.3%)
27/09 17:42  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
27/09 18:54  ETHUSD  SKIP             2689.30  pas de repli significatif (sommet 48h 2722.39, repli 1.2%)
27/09 18:54  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
27/09 21:23  ETHUSD  SKIP             2697.64  pas de repli significatif (sommet 48h 2722.39, repli 0.9%)
27/09 21:23  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
27/09 23:46  ETHUSD  SKIP             2685.67  pas de repli significatif (sommet 48h 2722.39, repli 1.3%)
27/09 23:46  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
28/09 00:24  ETHUSD  SKIP             2683.66  pas de repli significatif (sommet 48h 2722.39, repli 1.4%)
28/09 00:24  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
28/09 02:57  ETHUSD  SKIP             2688.02  pas de repli significatif (sommet 48h 2722.39, repli 1.3%)
28/09 02:57  -       EQUITY             50.00  capital simulé 50.00 USD dont 0.000000 ETH et 50.00 USD de cash
28/09 05:01  ETHUSD  ENTER            2658.13  repli de 2.6% depuis le sommet 48h (2722.39), RSI 31, tendance de fond intacte (EMA50 2415.87 > EMA200 2254.30) → achat de 0.004684 ETH à 2658.13 (12.50 USD frais compris)
28/09 05:01  -       EQUITY             49.94  capital simulé 49.94 USD dont 0.004684 ETH et 37.50 USD de cash
```

## Profil memecoin

```
Capital : 50.00 → 50.00 USD (+0.0%)
Objectif x100 : 5000 USD, atteint à 1.0%
Trades clos : 0   ouverts : 0

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (0)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
27/09 23:46  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.10, EMA50 0.10); EMA20 encore montante (+0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 48 dans la zone 45-60; volume trop faible (0.8x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
27/09 23:46  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 encore montante (+0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 48 dans la zone 45-60; volume trop faible (0.4x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
27/09 23:46  PEPE-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 encore montante (+0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 46 dans la zone 45-60; volume trop faible (0.9x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
27/09 23:46  WIF-USDT SKIP                0.24  tendance trop faible ou baissière (EMA20 0.25, EMA50 0.25); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 46 dans la zone 45-60; volume trop faible (0.7x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
27/09 23:46  -       EQUITY             50.00  capital simulé 50.00 USD dont 50.00 USD de cash
28/09 00:24  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.10, EMA50 0.10); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 51 dans la zone 45-60; volume trop faible (0.6x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 00:24  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 51 dans la zone 45-60; volume trop faible (0.7x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 00:24  PEPE-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 50 dans la zone 45-60; volume trop faible (0.9x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 00:24  WIF-USDT SKIP                0.25  tendance trop faible ou baissière (EMA20 0.25, EMA50 0.25); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 48 dans la zone 45-60; volume trop faible (0.7x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 00:24  -       EQUITY             50.00  capital simulé 50.00 USD dont 50.00 USD de cash
28/09 02:57  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.10, EMA50 0.10); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 48 dans la zone 45-60; volume trop faible (0.9x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 02:57  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 50 dans la zone 45-60; volume trop faible (0.5x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 02:57  PEPE-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 48 dans la zone 45-60; volume trop faible (0.7x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 02:57  WIF-USDT SKIP                0.24  tendance trop faible ou baissière (EMA20 0.25, EMA50 0.25); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 47 dans la zone 45-60; volume trop faible (0.9x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
28/09 02:57  -       EQUITY             50.00  capital simulé 50.00 USD dont 50.00 USD de cash
28/09 05:01  DOGE-USDT SKIP                0.09  tendance trop faible ou baissière (EMA20 0.10, EMA50 0.10); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 37 hors zone 45-60; volume 2.1x la moyenne (seuil 1.3x)
28/09 05:01  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 36 hors zone 45-60; volume 1.6x la moyenne (seuil 1.3x)
28/09 05:01  PEPE-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 36 hors zone 45-60; volume 2.4x la moyenne (seuil 1.3x)
28/09 05:01  WIF-USDT SKIP                0.24  tendance trop faible ou baissière (EMA20 0.24, EMA50 0.25); EMA20 qui s'essouffle (-0.00 sur 3 bougies); prix sous l'EMA rapide; RSI 38 hors zone 45-60; volume 1.9x la moyenne (seuil 1.3x)
28/09 05:01  -       EQUITY             50.00  capital simulé 50.00 USD dont 50.00 USD de cash
```
