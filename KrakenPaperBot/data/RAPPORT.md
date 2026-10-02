# KrakenPaperBot — simulation

Mis à jour le 02/10/2026 12:04

## Profil prudent

```
Capital : 50.00 → 45.42 USD (-9.2%)
Objectif x100 : 5000 USD, atteint à 0.9%
Trades clos : 18   ouverts : 2
Gagnants : 2/18 (11%)
Résultat des trades clos : -4.40 USD, dont 3.38 USD de frais payés
Sans les 2 meilleurs trades : -5.24 USD
Pire recul du capital : 9.8%
Sorties : STOP_LOSS 10, STOP_SECURISE 6, TAKE_PROFIT 2

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (18)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
02/10 06:53  -       EQUITY             45.99  capital simulé 45.99 USD dont 22.95 USD de cash
02/10 07:35  ETHUSD  STOP_LOSS        2712.01  stop touché → vente à 2712.01, résultat -0.48 USD
02/10 08:13  XBTUSD  ENTER           86029.64  tendance nette (EMA20 84868.63 > EMA50 84325.86 de 0.1%+); EMA20 encore montante (+410.70 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 67 dans la zone 45-70 → achat de 0.000265 à 86029.64 (22.89 USD frais compris), stop 85009.44, objectif 87559.95
02/10 08:13  ETHUSD  ENTER            2727.68  tendance nette (EMA20 2706.99 > EMA50 2697.55 de 0.1%+); EMA20 encore montante (+6.89 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 57 dans la zone 45-70 → achat de 0.008292 à 2727.68 (22.71 USD frais compris), stop 2690.69, objectif 2783.17
02/10 08:13  SOLUSD  SKIP              121.64  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 08:13  -       EQUITY             45.42  capital simulé 45.42 USD dont 0.00 USD de cash
02/10 09:08  XBTUSD  HOLD            85949.20  position gardée : stop 85009.44, objectif 87559.95, latent -0.20 USD
02/10 09:08  ETHUSD  HOLD             2728.50  position gardée : stop 2690.69, objectif 2783.17, latent -0.17 USD
02/10 09:08  SOLUSD  SKIP              121.66  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 09:08  -       EQUITY             45.40  capital simulé 45.40 USD dont 0.00 USD de cash
02/10 10:47  XBTUSD  HOLD            86310.00  position gardée : stop 85009.44, objectif 87559.95, latent -0.11 USD
02/10 10:15  ETHUSD  SECURE           2776.46  +1.5 ATR atteint → stop remonté à 2752.35 (position sans risque de perte)
02/10 10:47  ETHUSD  HOLD             2755.73  position gardée : stop 2752.35, objectif 2783.17, latent +0.05 USD
02/10 10:47  SOLUSD  SKIP              122.24  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 10:47  -       EQUITY             45.72  capital simulé 45.72 USD dont 0.00 USD de cash
02/10 12:04  XBTUSD  HOLD            86392.90  position gardée : stop 85009.44, objectif 87559.95, latent -0.09 USD
02/10 10:50  ETHUSD  STOP_SECURISE    2749.59  stop touché → vente à 2749.59, résultat -0.00 USD
02/10 12:04  ETHUSD  ENTER            2751.84  tendance nette (EMA20 2718.55 > EMA50 2704.05 de 0.1%+); EMA20 encore montante (+9.51 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 64 dans la zone 45-70 → achat de 0.008219 à 2751.84 (22.71 USD frais compris), stop 2713.84, objectif 2808.84
02/10 12:04  SOLUSD  SKIP              121.92  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 12:04  -       EQUITY             45.51  capital simulé 45.51 USD dont 0.00 USD de cash
```

## Profil agressif

```
Capital : 50.00 → 45.05 USD (-9.9%)
Objectif x100 : 5000 USD, atteint à 0.9%
Trades clos : 7   ouverts : 1
Gagnants : 0/7 (0%)
Résultat des trades clos : -4.77 USD, dont 2.71 USD de frais payés
Sans les 2 meilleurs trades : -4.77 USD
Pire recul du capital : 9.5%
Sorties : STOP_LOSS 5, STOP_SECURISE 2

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (7)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
02/10 06:53  XBTUSD  HOLD            86683.00  position gardée : stop 85684.18, objectif 87461.58, latent +0.57 USD
02/10 06:53  ETHUSD  SKIP             2747.30  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 06:53  SOLUSD  SKIP              121.19  tendance trop faible ou baissière (EMA20 118.71, EMA50 118.65); EMA20 encore montante (+0.55 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 69 dans la zone 45-70
02/10 06:53  -       EQUITY             45.99  capital simulé 45.99 USD dont 0.00 USD de cash
02/10 08:13  XBTUSD  HOLD            85943.60  position gardée : stop 85684.18, objectif 87461.58, latent +0.18 USD
02/10 08:13  ETHUSD  SKIP             2727.68  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 08:13  SOLUSD  SKIP              121.64  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 08:13  -       EQUITY             45.59  capital simulé 45.59 USD dont 0.00 USD de cash
02/10 09:08  XBTUSD  HOLD            85949.20  position gardée : stop 85684.18, objectif 87461.58, latent +0.19 USD
02/10 09:08  ETHUSD  SKIP             2731.35  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 09:08  SOLUSD  SKIP              121.66  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 09:08  -       EQUITY             45.60  capital simulé 45.60 USD dont 0.00 USD de cash
02/10 10:47  XBTUSD  HOLD            86310.00  position gardée : stop 85684.18, objectif 87461.58, latent +0.38 USD
02/10 10:47  ETHUSD  SKIP             2758.50  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 10:47  SOLUSD  SKIP              122.24  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 10:47  -       EQUITY             45.79  capital simulé 45.79 USD dont 0.00 USD de cash
02/10 12:04  XBTUSD  HOLD            86392.90  position gardée : stop 85684.18, objectif 87461.58, latent +0.42 USD
02/10 12:04  ETHUSD  SKIP             2751.84  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 12:04  SOLUSD  SKIP              121.92  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
02/10 12:04  -       EQUITY             45.83  capital simulé 45.83 USD dont 0.00 USD de cash
```

## Profil accumulation

```
Capital : 50.00 → 50.58 USD (+1.2%)
ETH détenu : 0.008168 (coût moyen 2678.11 USD/ETH, cours actuel 2749.22)
Cash disponible : 28.12 USD
Achats faits : 2   liquidations totales : 0

Dernières décisions :
02/10 06:53  ETHUSD  HOLD             2744.35  conservé : latent +0.30 USD, en attente d'un repli ou d'un retournement
02/10 06:53  ETHUSD  HOLD             2744.35  conservé : latent +0.15 USD, en attente d'un repli ou d'un retournement
02/10 06:53  ETHUSD  SKIP             2718.69  repli déjà acheté depuis ce sommet (2737.61)
02/10 06:53  -       EQUITY             50.54  capital simulé 50.54 USD dont 0.008168 ETH et 28.12 USD de cash
02/10 08:13  ETHUSD  HOLD             2724.95  conservé : latent +0.21 USD, en attente d'un repli ou d'un retournement
02/10 08:13  ETHUSD  HOLD             2724.95  conservé : latent +0.08 USD, en attente d'un repli ou d'un retournement
02/10 08:13  ETHUSD  SKIP             2719.38  repli déjà acheté depuis ce sommet (2747.49)
02/10 08:13  -       EQUITY             50.38  capital simulé 50.38 USD dont 0.008168 ETH et 28.12 USD de cash
02/10 09:08  ETHUSD  HOLD             2728.50  conservé : latent +0.23 USD, en attente d'un repli ou d'un retournement
02/10 09:08  ETHUSD  HOLD             2728.50  conservé : latent +0.09 USD, en attente d'un repli ou d'un retournement
02/10 09:08  ETHUSD  SKIP             2728.49  repli déjà acheté depuis ce sommet (2747.49)
02/10 09:08  -       EQUITY             50.41  capital simulé 50.41 USD dont 0.008168 ETH et 28.12 USD de cash
02/10 10:47  ETHUSD  HOLD             2755.73  conservé : latent +0.36 USD, en attente d'un repli ou d'un retournement
02/10 10:47  ETHUSD  HOLD             2755.73  conservé : latent +0.19 USD, en attente d'un repli ou d'un retournement
02/10 10:47  ETHUSD  SKIP             2736.99  repli déjà acheté depuis ce sommet (2747.49)
02/10 10:47  -       EQUITY             50.63  capital simulé 50.63 USD dont 0.008168 ETH et 28.12 USD de cash
02/10 12:04  ETHUSD  HOLD             2749.08  conservé : latent +0.32 USD, en attente d'un repli ou d'un retournement
02/10 12:04  ETHUSD  HOLD             2749.08  conservé : latent +0.17 USD, en attente d'un repli ou d'un retournement
02/10 12:04  ETHUSD  SKIP             2746.37  pas de repli significatif (sommet 48h 2776.46, repli 1.1%)
02/10 12:04  -       EQUITY             50.58  capital simulé 50.58 USD dont 0.008168 ETH et 28.12 USD de cash
```

## Profil memecoin

```
Capital : 50.00 → 50.68 USD (+1.4%)
Objectif x100 : 5000 USD, atteint à 1.0%
Trades clos : 2   ouverts : 1
Gagnants : 2/2 (100%)
Résultat des trades clos : +0.72 USD, dont 0.16 USD de frais payés
Sans les 2 meilleurs trades : +0.00 USD
Pire recul du capital : 0.0%
Sorties : STOP_SECURISE 1, TAKE_PROFIT 1

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (2)
  [x] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
02/10 08:13  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.09, EMA50 0.09); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 58 dans la zone 45-60; volume 1.5x la moyenne (seuil 1.3x)
02/10 08:13  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 59 dans la zone 45-60; volume 1.5x la moyenne (seuil 1.3x)
02/10 08:13  PEPE-USDT SKIP                0.00  tendance nette (EMA20 0.00 > EMA50 0.00 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 62 hors zone 45-60; volume 3.0x la moyenne (seuil 1.3x)
02/10 08:13  WIF-USDT SKIP                0.27  tendance nette (EMA20 0.25 > EMA50 0.25 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 68 hors zone 45-60; volume 1.9x la moyenne (seuil 1.3x)
02/10 08:13  -       EQUITY             50.72  capital simulé 50.72 USD dont 50.72 USD de cash
02/10 09:08  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.09, EMA50 0.09); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 58 dans la zone 45-60; volume trop faible (0.9x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 09:08  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 62 hors zone 45-60; volume trop faible (1.1x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 09:08  PEPE-USDT SKIP                0.00  tendance nette (EMA20 0.00 > EMA50 0.00 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 61 hors zone 45-60; volume trop faible (0.7x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 09:08  WIF-USDT SKIP                0.26  tendance nette (EMA20 0.25 > EMA50 0.25 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 60 dans la zone 45-60; volume trop faible (1.2x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 09:08  -       EQUITY             50.72  capital simulé 50.72 USD dont 50.72 USD de cash
02/10 10:47  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.10, EMA50 0.09); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 62 hors zone 45-60; volume trop faible (0.8x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 10:47  SHIB-USDT SKIP                0.00  tendance trop faible ou baissière (EMA20 0.00, EMA50 0.00); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 66 hors zone 45-60; volume 1.7x la moyenne (seuil 1.3x)
02/10 10:47  PEPE-USDT SKIP                0.00  tendance nette (EMA20 0.00 > EMA50 0.00 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 59 dans la zone 45-60; volume trop faible (1.0x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 10:47  WIF-USDT ENTER               0.26  tendance nette (EMA20 0.25 > EMA50 0.25 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 57 dans la zone 45-60; volume 1.4x la moyenne (seuil 1.3x) → achat de 40.590021 à 0.26 (10.58 USD frais compris), stop 0.25, objectif 0.28
02/10 10:47  -       EQUITY             50.68  capital simulé 50.68 USD dont 40.15 USD de cash
02/10 12:04  WIF-USDT HOLD                0.26  position gardée : stop 0.25, objectif 0.28, latent -0.16 USD
02/10 12:04  DOGE-USDT SKIP                0.10  tendance trop faible ou baissière (EMA20 0.10, EMA50 0.09); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 64 hors zone 45-60; volume 1.3x la moyenne (seuil 1.3x)
02/10 12:04  SHIB-USDT SKIP                0.00  tendance nette (EMA20 0.00 > EMA50 0.00 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 63 hors zone 45-60; volume trop faible (0.9x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 12:04  PEPE-USDT SKIP                0.00  tendance nette (EMA20 0.00 > EMA50 0.00 de 0.5%+); EMA20 encore montante (+0.00 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 60 dans la zone 45-60; volume trop faible (0.8x la moyenne, seuil 1.3x) : dérive illiquide plutôt qu'un vrai mouvement
02/10 12:04  -       EQUITY             50.61  capital simulé 50.61 USD dont 40.15 USD de cash
```
