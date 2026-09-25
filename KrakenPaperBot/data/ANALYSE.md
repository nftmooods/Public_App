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
