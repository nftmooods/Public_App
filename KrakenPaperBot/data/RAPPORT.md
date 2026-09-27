# KrakenPaperBot — simulation

Mis à jour le 27/09/2026 13:12

## Profil prudent

```
Capital : 50.00 → 49.55 USD (-0.9%)
Objectif x100 : 5000 USD, atteint à 1.0%
Trades clos : 4   ouverts : 2
Gagnants : 1/4 (25%)
Résultat des trades clos : -0.25 USD, dont 0.76 USD de frais payés
Sans les 2 meilleurs trades : -0.83 USD
Pire recul du capital : 1.6%
Sorties : STOP_LOSS 1, STOP_SECURISE 2, TAKE_PROFIT 1

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (4)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
27/09 07:20  -       EQUITY             49.52  capital simulé 49.52 USD dont 24.85 USD de cash
27/09 07:56  SOLUSD  HOLD              121.11  position gardée : stop 119.03, objectif 126.35, latent -0.37 USD
27/09 07:56  XBTUSD  SKIP            84317.40  tendance trop faible ou baissière (EMA20 84215.06, EMA50 84188.92); EMA20 encore montante (+55.76 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 55 dans la zone 45-70
27/09 07:56  ETHUSD  SKIP             2691.64  tendance trop faible ou baissière (EMA20 2690.87, EMA50 2689.92); EMA20 encore montante (+1.39 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 51 dans la zone 45-70
27/09 07:56  -       EQUITY             49.62  capital simulé 49.62 USD dont 24.85 USD de cash
27/09 09:23  SOLUSD  HOLD              121.48  position gardée : stop 119.03, objectif 126.35, latent -0.30 USD
27/09 09:23  XBTUSD  SKIP            84505.30  tendance trop faible ou baissière (EMA20 84264.78, EMA50 84211.96); EMA20 encore montante (+60.48 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 61 dans la zone 45-70
27/09 09:23  ETHUSD  SKIP             2706.45  tendance trop faible ou baissière (EMA20 2693.53, EMA50 2691.12); EMA20 encore montante (+2.74 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 62 dans la zone 45-70
27/09 09:23  -       EQUITY             49.70  capital simulé 49.70 USD dont 24.85 USD de cash
27/09 09:55  SOLUSD  SECURE            124.33  +1.5 ATR atteint → stop remonté à 123.06 (position sans risque de perte)
27/09 11:28  SOLUSD  HOLD              123.82  position gardée : stop 123.06, objectif 126.35, latent +0.18 USD
27/09 11:28  XBTUSD  ENTER           84729.64  tendance nette (EMA20 84356.69 > EMA50 84254.98 de 0.1%+); EMA20 encore montante (+117.24 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 67 dans la zone 45-70 → achat de 0.000292 à 84729.64 (24.85 USD frais compris), stop 84293.28, objectif 85384.19
27/09 11:28  ETHUSD  SKIP             2711.30  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 11:28  -       EQUITY             50.08  capital simulé 50.08 USD dont 0.00 USD de cash
27/09 13:12  SOLUSD  HOLD              124.06  position gardée : stop 123.06, objectif 126.35, latent +0.23 USD
27/09 12:15  XBTUSD  SECURE          85104.00  +1.5 ATR atteint → stop remonté à 85495.70 (position sans risque de perte)
27/09 12:20  XBTUSD  STOP_SECURISE   84890.52  ouverture en gap sous le stop → vente à 84890.52, résultat -0.15 USD
27/09 13:12  XBTUSD  ENTER           84985.70  tendance nette (EMA20 84455.30 > EMA50 84304.68 de 0.1%+); EMA20 encore montante (+142.61 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 68 dans la zone 45-70 → achat de 0.000289 à 84985.70 (24.70 USD frais compris), stop 84515.70, objectif 85690.71
27/09 13:12  ETHUSD  SKIP             2712.85  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 13:12  -       EQUITY             49.98  capital simulé 49.98 USD dont 0.00 USD de cash
```

## Profil agressif

```
Capital : 50.00 → 49.80 USD (-0.4%)
Objectif x100 : 5000 USD, atteint à 1.0%
Trades clos : 1   ouverts : 1
Gagnants : 0/1 (0%)
Résultat des trades clos : +0.00 USD, dont 0.40 USD de frais payés
Sans les 2 meilleurs trades : +0.00 USD
Pire recul du capital : 0.0%
Sorties : STOP_SECURISE 1

Critères pour envisager de l'argent réel :
  [ ] au moins 30 trades clos (1)
  [ ] résultat positif après frais
  [ ] toujours positif sans les 2 meilleurs trades
  [x] recul maximal du capital inférieur à 20 %

Dernières décisions :
27/09 07:20  XBTUSD  SKIP            84317.40  tendance trop faible ou baissière (EMA20 84215.06, EMA50 84188.92); EMA20 encore montante (+55.76 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 55 dans la zone 45-70
27/09 07:20  ETHUSD  SKIP             2691.64  tendance trop faible ou baissière (EMA20 2690.87, EMA50 2689.92); EMA20 encore montante (+1.39 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 51 dans la zone 45-70
27/09 07:20  -       EQUITY             49.88  capital simulé 49.88 USD dont 0.00 USD de cash
27/09 07:57  SOLUSD  HOLD              121.11  position gardée : stop 117.60, objectif 127.54, latent -0.12 USD
27/09 07:57  XBTUSD  SKIP            84317.40  tendance trop faible ou baissière (EMA20 84215.06, EMA50 84188.92); EMA20 encore montante (+55.76 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 55 dans la zone 45-70
27/09 07:57  ETHUSD  SKIP             2691.64  tendance trop faible ou baissière (EMA20 2690.87, EMA50 2689.92); EMA20 encore montante (+1.39 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 51 dans la zone 45-70
27/09 07:57  -       EQUITY             50.08  capital simulé 50.08 USD dont 0.00 USD de cash
27/09 09:23  SOLUSD  HOLD              121.48  position gardée : stop 117.60, objectif 127.54, latent +0.03 USD
27/09 09:23  XBTUSD  SKIP            84505.30  tendance trop faible ou baissière (EMA20 84264.78, EMA50 84211.96); EMA20 encore montante (+60.48 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 61 dans la zone 45-70
27/09 09:23  ETHUSD  SKIP             2706.45  tendance trop faible ou baissière (EMA20 2693.53, EMA50 2691.12); EMA20 encore montante (+2.74 sur 3 bougies); prix au-dessus de l'EMA rapide; RSI 62 dans la zone 45-70
27/09 09:23  -       EQUITY             50.23  capital simulé 50.23 USD dont 0.00 USD de cash
27/09 09:55  SOLUSD  SECURE            124.33  +2.0 ATR atteint → stop remonté à 121.53 (position sans risque de perte)
27/09 11:28  SOLUSD  HOLD              123.82  position gardée : stop 121.53, objectif 127.54, latent +0.99 USD
27/09 11:28  XBTUSD  SKIP            84729.64  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 11:28  ETHUSD  SKIP             2711.30  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 11:28  -       EQUITY             51.20  capital simulé 51.20 USD dont 0.00 USD de cash
27/09 13:12  SOLUSD  HOLD              124.06  position gardée : stop 121.53, objectif 127.54, latent +1.09 USD
27/09 13:12  XBTUSD  SKIP            84985.70  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 13:12  ETHUSD  SKIP             2712.85  signal valide mais plus assez de cash (0.00 USD), déjà investi dans les positions ouvertes
27/09 13:12  -       EQUITY             51.30  capital simulé 51.30 USD dont 0.00 USD de cash
```
