# Observations de Claude, cycle par cycle

Chaque cycle ajoute une entrée : ce qui s'est passé, ce qui semble marcher ou non, et les pistes
d'ajustement à valider par Martin. Aucune règle n'est modifiée sans son accord.

## 25/09 01:48 — révision de la stratégie (Claude, suite à la demande de Martin de faire tourner l'app)

Backtest initial (30j, signal 1h) : les deux profils nettement perdants (-27,7 %/-27,3 %) contre un
marché à +10,6 %, taux de gain 17-19 %, 48 % des sorties en stop loss sec.

Deux hypothèses testées sur les vrais prix Kraken via le workflow de backtest GitHub Actions :
1. Filtre de tendance nette + pente EMA (au lieu d'un simple croisement) → légère amélioration
   (-23,9 %/-29,5 %), insuffisant.
2. Signal d'entrée en bougies 4h au lieu de 1h → pire (-32 %/-36 % sur 110 jours, marché +56 % sur
   cette période plus longue). Écarté.

**Conclusion : le déficit vient des règles d'entrée elles-mêmes (taux de gain 15-26 %, loin des ~40 %
nécessaires pour le ratio 2 ATR stop / 3 ATR objectif), pas du bruit ou du choix des bougies.** Plutôt
que de continuer à régler des paramètres à l'aveugle, j'ai gardé le filtre de tendance (1) et le signal
1h, et ajouté un coupe-circuit opérationnel : au-delà de -30 % depuis le sommet du capital, plus de
nouvelle entrée tant que le capital n'est pas remonté.

**À valider par Martin** : une vraie révision des règles d'entrée (pas un réglage de plus) — par exemple
entrer sur un repli dans la tendance plutôt que sur la confirmation du croisement, qui arrive souvent
trop tard. Détails dans `README.md`.

## 25/09 05:34 — le cron GitHub Actions ne se déclenche jamais tout seul (confirmé)

Depuis la mise en place (23h38 UTC), 4 cycles ont tourné avec succès, tous les 4 déclenchés à la main
(workflow_dispatch) par la surveillance Claude. Le cron programmé n'a jamais fired, ni en `7,37 * * * *`
(2h de recul) ni en `*/30 * * * *` (2h de recul, 4 échéances manquées). Ce n'est pas un problème de
syntaxe (vérifiée deux fois) ni d'inactivité du dépôt (commits fréquents dans l'intervalle) : c'est une
fiabilité insuffisante du planificateur GitHub Actions sur ce dépôt.

**Conséquence pratique** : la cadence de ~30-60 min tient uniquement grâce au déclenchement manuel de
la surveillance Claude, pas grâce à GitHub. Tant que Claude surveille, ça marche ; sans surveillance,
le bot ne tournerait pas.

**À valider par Martin** : soit accepter ce fonctionnement (Claude déclenche à la main), soit passer à
un mécanisme de planification hors GitHub Actions (ex. la routine Claude elle-même déclenche le workflow
à heure fixe, ou un service cron externe qui appelle l'API GitHub). Ne pas re-changer l'expression cron
une 3e fois sans piste concrète : ce n'est probablement pas le format qui pose problème.

## Mise à jour 25/09 19:30 — le cron GitHub s'améliore

Sur les 20 runs à date, 3 se sont déclenchés seuls en `event: schedule` (run #9, #15, #20), le dernier
il y a quelques minutes. Ce n'est toujours pas fiable à 100 % (les 17 autres runs restent des
`workflow_dispatch` manuels de la surveillance Claude), mais ce n'est plus jamais 0/N comme au début.
Pas encore assez de signal pour conclure que le cron `*/30 * * * *` est devenu fiable — à continuer
d'observer sans re-changer la config.

## Mise à jour 28/09 16:57 — le cron tourne seul mais avec de gros écarts, pas juste en manuel

Depuis l'ajout du profil memecoin (27/09 soir), plusieurs cycles récents se sont bien déclenchés en
`event: schedule` sans intervention (runs #66, #67 notamment), donc le cron programmé fonctionne belle
et bien de façon autonome maintenant — contrairement au 25/09 où il ne se déclenchait jamais seul.
Mais l'intervalle entre deux `schedule` consécutifs a été très irrégulier sur cette fenêtre : 3h16 puis
8h15 entre deux cycles auto, au lieu des 30 min configurées. Le déclenchement manuel de la surveillance
Claude reste donc nécessaire pour tenir la cadence annoncée de ~30-60 min, mais pour une raison différente
du 25/09 : ce n'est plus "le cron ne se déclenche jamais", c'est "le cron se déclenche, mais GitHub
espace les exécutions bien plus que l'intervalle demandé" — un throttling côté plateforme (dépôt à faible
priorité, file d'attente des schedules chargée) plutôt qu'un souci de config ou de dépôt inactif.

**Constat pratique inchangé** : la surveillance Claude reste la garantie de cadence réelle, pas GitHub
seul. Pas de nouvelle piste à valider par Martin pour l'instant — ce comportement (cron autonome mais
espacé) semble être une caractéristique du planificateur GitHub Actions gratuit, pas un bug à corriger
côté dépôt.

## 29/09 22:16 — filtre ADX testé : réduit nettement les faux départs en range (pas encore rentable)

Martin a demandé pourquoi les trades sont perdants en ce moment. Diagnostic : BTC/ETH/SOL sont en range
serré depuis plusieurs cycles (EMA20/EMA50 collées, RSI 40-50), l'environnement le pire pour une entrée
sur confirmation de croisement EMA (le signal arrive juste avant que le marché reparte en sens inverse).
C'est le même problème documenté le 25/09, pas une nouvelle dérive.

Deux hypothèses testées par backtest réel (28j, branche `test-adx-hypothesis`, non mergée), à partir des
réglages "prudent" :
1. **Filtre ADX** (force de tendance de Wilder, nouvelle fonction `strategy.adx()`, gardée derrière
   `C.ADX_MIN` inactif par défaut comme `VOLUME_MIN_RATIO`) : n'entre que si le marché est assez
   directionnel, pas en range.
2. **RSI resserré** (45-70 → 45-60) : filtre plus strict sur la zone d'entrée.

| Profil | Résultat | Trades clos | Taux de gain | Recul max |
|---|---|---|---|---|
| Baseline (prudent) | -22,9 % | 52 | 21 % | 22,9 % |
| ADX ≥ 15 | -20,0 % | 48 | 25 % | 20,0 % |
| ADX ≥ 20 | -16,2 % | 40 | 25 % | 16,5 % |
| **ADX ≥ 25** | **-13,8 %** | 30 | **27 %** | **14,2 %** |
| RSI resserré seul | -21,3 % | 38 | 11 % | 21,3 % |
| ADX ≥ 20 + RSI resserré | -14,5 % | 29 | 14 % | 14,8 % |

**Conclusion** : le filtre ADX seul améliore toutes les métriques de façon monotone avec le seuil — à
ADX ≥ 25, la perte est quasi divisée par deux et le taux de gain passe de 21 % à 27 %, tout en gardant
30 trades clos (le minimum pour juger). Le RSI resserré, lui, ne marche pas : il fait chuter le taux de
gain à 11 % (pire que sans filtre) et dilue même le bénéfice de l'ADX quand on le combine. Écarté.

**Limite honnête** : même à ADX ≥ 25, le profil reste perdant (-13,8 %), pas encore rentable après frais.
Ce n'est pas un remède au problème de fond (taux de gain encore loin des ~40 % nécessaires), juste une
réduction significative du bruit de range qui aggravait ce problème.

**À valider par Martin** : proposé de déployer `ADX_MIN=25` sur prudent et agressif en production — en
attente de sa confirmation avant de toucher aux profils live.

## 29/09 22:45 — un déclenchement manuel + un cron quasi simultanés font échouer le push (sans perte)

Le déclenchement manuel de la surveillance (22:44:39) et un cron autonome (22:44:45) sont arrivés à
6 secondes d'écart. Le groupe de concurrence a bien sérialisé leur exécution (le 2e n'a démarré qu'après
la fin du 1er), mais le 2e avait "gelé" son point de départ git au moment de sa mise en file, donc son
rebase a buté sur un vrai conflit de contenu (fichiers .db binaires, non fusionnables) une fois le 1er
déjà poussé. Le run a échoué proprement à l'étape git, sans rien casser : l'étape `run && export` avait
déjà réussi, et le cycle du 1er run contient les mêmes données de marché — rien n'est perdu, un cycle est
juste resté sans commit. Pas d'action à prendre : cas rare (deux déclenchements à quelques secondes
d'écart), impact nul en pratique.
