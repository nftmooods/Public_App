# KrakenPaperBot — trading simulé sur Kraken, sans argent réel

Toutes les 30 minutes, le bot analyse BTC, ETH et SOL en dollars sur Kraken, avec une mise de départ de 50 USD. S'il décide d'acheter, il pose un stop loss
et un objectif (take profit). **Chaque décision est enregistrée avec sa raison et ses chiffres**, y compris les
décisions de ne rien faire.

Aucune clé API, aucun accès à ton compte : le bot lit uniquement les prix publics de Kraken.

## Ce qui se passe entre deux analyses

À chaque passage, le bot récupère les bougies de 5 minutes écoulées depuis le passage précédent et les rejoue
une par une. Si le prix a touché le stop ou l'objectif entre-temps, la vente est comptée **au moment où elle
aurait eu lieu chez Kraken**. Si le PC ou le serveur a été éteint, il rattrape tout au passage suivant (avec des
bougies plus grosses au-delà de 2 jours et demi).

Hypothèses pessimistes, pour ne pas se raconter d'histoires :
- si une bougie touche le stop et l'objectif, on considère que le stop est passé en premier ;
- si le prix ouvre directement sous le stop (chute brutale), on vend au prix d'ouverture, donc plus bas ;
- frais Kraken Pro (0,40 % au marché, 0,25 % en limite) et 0,1 % de slippage à chaque ordre ;
- minimums d'ordre de Kraken respectés.

## Les règles de décision

- **Entrée** : EMA 20 au moins 0,1 % au-dessus de l'EMA 50 et encore montante (pas un simple croisement),
  prix au-dessus de l'EMA 20, RSI entre 45 et 70.
- **Stop loss** : 2 ATR sous le prix d'achat. **Objectif** : 3 ATR au-dessus.
- **Sécurisation** : dès que le prix monte de 1,5 ATR, le stop remonte au prix d'achat, frais compris.
  La position ne peut alors plus perdre (sauf chute brutale en gap).
- **Taille** : une perte au stop coûte au maximum 2 % du capital ; une position ne dépasse jamais 50 % du capital.
- **Coupe-circuit** : recul de 30 % depuis le sommet du capital → plus aucune nouvelle entrée tant que le
  capital n'est pas remonté (les positions déjà ouvertes restent gérées normalement).

Tous les réglages sont dans `config.py`.

## Résultat des backtests (24/09/2026)

Les deux profils sont nettement perdants sur les vrais prix Kraken, dans les deux réglages testés :
- 30 jours, signal 1h : prudent -24 %, agressif -30 % (marché +11 % sur la période) ;
- 110 jours, signal 4h : prudent -32 %, agressif -36 % (marché +56 % sur la période).

Taux de gain 15 à 26 %, loin des ~40 % nécessaires pour un objectif à 3 ATR et un stop à 2 ATR. Le signal
d'entrée (EMA/RSI) rentre trop souvent en fin de mouvement plutôt qu'au début. Le filtre de tendance
nette + pente EMA a légèrement aidé sans changer le constat. **Les règles d'entrée ont besoin d'être
repensées, pas seulement réglées, avant d'envisager de l'argent réel.** Le coupe-circuit à -30 % limite
les dégâts en attendant, sans changer les règles d'entrée elles-mêmes — cette révision reste à faire, en
concertation avec Martin.

## Deux profils en parallèle

Chaque cycle fait tourner deux portefeuilles simulés de 50 USD sur les mêmes prix, pour comparer sur la durée :
- **prudent** : les règles ci-dessus ;
- **agressif** : vise le x100, avec 10 % du capital risqué par trade, tout le capital mobilisable,
  un objectif à 5 ATR et une sécurisation à 2 ATR.

Un x100 demande d'enchaîner beaucoup de trades gagnants avec des mises fortes : le profil agressif a
beaucoup plus de chances de fondre que de multiplier la mise. C'est précisément ce que la simulation doit
mesurer avant de risquer de l'argent réel.

## Installation

```bash
pip install -r requirements.txt
```

## Commandes

```bash
python bot.py run            # un cycle : rattrape le marché, puis décide
python bot.py journal        # les 30 dernières décisions
python bot.py report         # bilan et critères de validation
python bot.py backtest       # rejoue les 30 derniers jours avec les mêmes règles
python bot.py export         # écrit RAPPORT.md et les CSV de décisions
```

Chaque commande porte sur les deux profils, ou sur un seul : `python bot.py report agressif`.

## Où sont les journaux

Le run planifié écrit dans `data/` (variable `KPB_DATA_DIR`) et le committe sur la branche Git :
- `RAPPORT.md` : bilan de chaque profil, progression vers le x100, 20 dernières décisions ;
- `decisions-<profil>.csv` : toutes les décisions, lisibles dans un tableur ;
- `ANALYSE.md` : les observations de Claude après chaque cycle ;
- `sim-<profil>.db` : l'état complet (positions, cash), nécessaire au cycle suivant.

## Le faire tourner automatiquement

En place, deux étages :
- **GitHub Actions** (`.github/workflows/kraken-paper-bot.yml`) lance `bot.py run` puis `bot.py export`
  toutes les 30 min et committe `data/`. Gratuit, accès internet libre. Lancement manuel possible depuis
  l'onglet Actions du dépôt (« Run workflow »). GitHub peut démarrer avec 5 à 30 min de retard : sans
  conséquence, le bot rattrape les bougies manquées.
- **Une routine Claude** (Sonnet 5), toutes les 2 h, 20 min après : elle lit `RAPPORT.md` et les CSV,
  vérifie que le dernier cycle est récent, et ajoute son analyse dans `data/ANALYSE.md`.

Autres options :

Sur un serveur Linux (ton VPS par exemple), ajoute cette ligne avec `crontab -e` :

```
0 */2 * * * cd /opt/KrakenPaperBot && /usr/bin/python3 bot.py run >> run.log 2>&1
```

Sous Windows, le Planificateur de tâches fonctionne aussi, mais seulement quand le PC est allumé.
Le rattrapage des bougies compense les trous, mais le bot ne peut pas ouvrir de position pendant ce temps.

## Critères avant de passer à l'argent réel

Tous obligatoires, affichés par `python bot.py report` :
1. au moins 30 trades clos ;
2. résultat positif **après** frais ;
3. toujours positif sans les 2 meilleurs trades ;
4. recul maximal du capital inférieur à 20 %.

## Plus tard, le passage au réel (pas encore implémenté)

- Clé API Kraken avec **uniquement** le droit de trader : jamais le droit de retrait.
- Le stop et l'objectif sont posés **chez Kraken** au moment de l'achat : ils se déclenchent même si le bot est
  arrêté. Le cycle de 2 h ne sert plus qu'à décider des nouvelles entrées.
