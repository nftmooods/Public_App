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
