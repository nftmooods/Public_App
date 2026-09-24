# KrakenPaperBot — trading simulé sur Kraken, sans argent réel

Toutes les 2 h, le bot analyse BTC, ETH et SOL en euros sur Kraken. S'il décide d'acheter, il pose un stop loss
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

- **Entrée** : EMA 20 > EMA 50 (tendance haussière), prix au-dessus de l'EMA 20, RSI entre 45 et 70.
- **Stop loss** : 2 ATR sous le prix d'achat. **Objectif** : 3 ATR au-dessus.
- **Sécurisation** : dès que le prix monte de 1,5 ATR, le stop remonte au prix d'achat, frais compris.
  La position ne peut alors plus perdre (sauf chute brutale en gap).
- **Taille** : une perte au stop coûte au maximum 2 % du capital ; une position ne dépasse jamais 50 % du capital.

Tous les réglages sont dans `config.py`.

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
```

## Le faire tourner toutes les 2 h

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
