import { TranscriptionData, KeyPoint, Speaker, Timestamp } from '../types';

export const generateMockTranscription = (): TranscriptionData => {
  const speakers: Speaker[] = [
    { id: 'speaker1', name: 'Alex Chen', color: '#3B82F6', speakingTime: 420 },
    { id: 'speaker2', name: 'Sarah Johnson', color: '#10B981', speakingTime: 380 },
    { id: 'speaker3', name: 'Mike Rodriguez', color: '#F59E0B', speakingTime: 350 },
    { id: 'host', name: 'Host', color: '#8B5CF6', speakingTime: 650 }
  ];

  const timestamps: Timestamp[] = [
    {
      start: 0,
      end: 25,
      text: "Bienvenue dans ce Twitter Space sur l'avenir de la finance décentralisée. Je suis ravi d'avoir des invités exceptionnels aujourd'hui.",
      speaker: 'host'
    },
    {
      start: 26,
      end: 58,
      text: "Merci de m'avoir invité. Je pense que la DeFi est à un point d'inflexion vraiment intéressant. L'adoption institutionnelle s'accélère.",
      speaker: 'speaker1'
    },
    {
      start: 59,
      end: 92,
      text: "Absolument. Ce qui est fascinant, c'est la façon dont le paysage réglementaire commence à se cristalliser. Cette clarté stimule l'innovation.",
      speaker: 'speaker2'
    },
    {
      start: 93,
      end: 127,
      text: "D'un point de vue technique, les solutions de scalabilité que nous voyons maintenant changent la donne. L'adoption de la Layer 2 a augmenté de 300% cette année.",
      speaker: 'speaker3'
    },
    {
      start: 128,
      end: 165,
      text: "C'est un excellent point. Approfondissons la question de la scalabilité. Sarah, que pensez-vous des solutions actuelles ?",
      speaker: 'host'
    },
    {
      start: 166,
      end: 203,
      text: "La clé n'est pas seulement le débit, mais le maintien de la décentralisation. Nous ne pouvons pas sacrifier les principes fondamentaux pour la vitesse. C'est là que les ZK-rollups brillent vraiment.",
      speaker: 'speaker2'
    },
    {
      start: 204,
      end: 240,
      text: "L'expérience utilisateur est tout aussi importante. La personne moyenne ne devrait pas avoir besoin de comprendre les frais de gas ou le bridging. L'infrastructure devrait être invisible.",
      speaker: 'speaker1'
    },
    {
      start: 241,
      end: 275,
      text: "En parlant d'expérience utilisateur, l'interopérabilité cross-chain est là où je vois la plus grande opportunité. Mouvement d'actifs transparent entre les chaînes.",
      speaker: 'speaker3'
    }
  ];

  const fullText = timestamps.map(t => t.text).join(' ');
  const tokenCount = Math.floor(fullText.length / 4);
  const estimatedCost = tokenCount * 0.0001;

  return {
    text: fullText,
    language: 'Français',
    speakers,
    timestamps,
    duration: 1800, // 30 minutes
    tokenCount,
    estimatedCost
  };
};

export const generateMockKeyPoints = (): KeyPoint[] => {
  return [
    {
      id: '1',
      text: 'La DeFi connaît une adoption institutionnelle accélérée, marquant un point d\'inflexion significatif dans l\'industrie.',
      timestamp: 26,
      speaker: 'Alex Chen',
      category: 'insight',
      editable: true,
      webLinks: ['https://defipulse.com/institutional-adoption', 'https://coindesk.com/defi-institutions']
    },
    {
      id: '2',
      text: 'La clarté réglementaire stimule l\'innovation plutôt que de l\'étouffer, contrairement aux préoccupations communes.',
      timestamp: 59,
      speaker: 'Sarah Johnson',
      category: 'theme',
      editable: true,
      webLinks: ['https://regulatory-clarity-defi.com']
    },
    {
      id: '3',
      text: 'L\'adoption de la Layer 2 a augmenté de 300% cette année, représentant des améliorations massives de scalabilité.',
      timestamp: 93,
      speaker: 'Mike Rodriguez',
      category: 'quote',
      editable: true,
      webLinks: ['https://l2beat.com/scaling/summary']
    },
    {
      id: '4',
      text: 'Les ZK-rollups offrent la scalabilité tout en maintenant les principes de décentralisation, contrairement à d\'autres solutions.',
      timestamp: 166,
      speaker: 'Sarah Johnson',
      category: 'insight',
      editable: true,
      webLinks: ['https://ethereum.org/en/developers/docs/scaling/zk-rollups/']
    },
    {
      id: '5',
      text: 'L\'expérience utilisateur devrait prioriser l\'invisibilité de l\'infrastructure complexe comme les frais de gas et le bridging.',
      timestamp: 204,
      speaker: 'Alex Chen',
      category: 'theme',
      editable: true,
      webLinks: []
    },
    {
      id: '6',
      text: 'L\'interopérabilité cross-chain représente la plus grande opportunité pour un mouvement d\'actifs transparent.',
      timestamp: 241,
      speaker: 'Mike Rodriguez',
      category: 'insight',
      editable: true,
      webLinks: ['https://bridge-protocols.com', 'https://interoperability-guide.com']
    }
  ];
};

export const generateMockContent = (format: string, tone: string): string => {
  const baseContent = {
    article: `# L'Avenir de la Finance Décentralisée : Analyse Approfondie

## Introduction

Le paysage de la finance décentralisée (DeFi) traverse une période de transformation majeure, avec une adoption institutionnelle qui s'accélère et des cadres réglementaires qui commencent à se cristalliser. Cette analyse complète explore les tendances clés qui façonnent l'avenir de la DeFi, basée sur les insights d'experts de l'industrie.

## Thèmes Principaux

### Adoption Institutionnelle
La DeFi a atteint un point d'inflexion significatif avec les investisseurs institutionnels qui embrassent de plus en plus les protocoles financiers décentralisés. Ce changement représente une évolution fondamentale dans la façon dont la finance traditionnelle perçoit les solutions basées sur la blockchain.

### Clarté Réglementaire Stimulant l'Innovation
Contrairement aux préoccupations répandues concernant les répression réglementaires étouffant l'innovation, les cadres réglementaires émergents fournissent en réalité la clarté nécessaire pour une croissance et un développement soutenus dans l'espace DeFi.

### Percées en Scalabilité
L'infrastructure technique supportant la DeFi a connu des améliorations remarquables, avec les solutions Layer 2 connaissant une croissance de 300% en adoption au cours de l'année passée. Ces développements répondent aux préoccupations de longue date concernant le débit des transactions et les coûts.

## Innovations Techniques

### ZK-Rollups et Décentralisation
Les rollups à connaissance zéro représentent une percée dans la résolution du trilemme de la blockchain, offrant des améliorations de scalabilité tout en maintenant les principes de décentralisation qui sont au cœur de la proposition de valeur de la DeFi.

### Évolution de l'Expérience Utilisateur
L'accent s'est déplacé des capacités purement techniques vers l'optimisation de l'expérience utilisateur. L'objectif est de rendre les opérations blockchain complexes invisibles aux utilisateurs finaux, éliminant les points de friction comme les calculs de frais de gas et les complexités de bridging cross-chain.

### Interopérabilité Cross-Chain
L'avenir de la DeFi réside dans l'interopérabilité transparente entre différents réseaux blockchain, permettant un mouvement d'actifs sans friction et des expériences utilisateur unifiées à travers plusieurs protocoles.

## Conclusion

L'écosystème DeFi mûrit rapidement, avec des innovations techniques répondant aux préoccupations de scalabilité tandis que la clarté réglementaire fournit une base stable pour une croissance continue. L'accent sur l'expérience utilisateur et l'adoption institutionnelle suggère un avenir prometteur pour la finance décentralisée.`,

    bullets: `# Points Clés : L'Avenir de la Finance Décentralisée

## Tendances Principales

• **Adoption Institutionnelle Accélérée** : La DeFi a atteint un point d'inflexion avec les investisseurs institutionnels embrassant de plus en plus les protocoles décentralisés

• **Clarté Réglementaire Stimule l'Innovation** : Les cadres réglementaires émergents fournissent la clarté qui permet plutôt que de restreindre le développement DeFi

• **Améliorations Massives de Scalabilité** : L'adoption Layer 2 a augmenté de 300% cette année, répondant aux préoccupations de débit et de coût des transactions

• **ZK-Rollups Maintiennent la Décentralisation** : Les rollups à connaissance zéro offrent la scalabilité tout en préservant les principes de décentralisation fondamentaux

• **Focus sur l'Expérience Utilisateur** : La complexité de l'infrastructure devrait être invisible aux utilisateurs, éliminant les frictions de frais de gas et de bridging

• **Priorité à l'Interopérabilité Cross-Chain** : Le mouvement transparent d'actifs entre réseaux blockchain représente la plus grande opportunité de croissance

• **Infrastructure Technique Mature** : Les solutions de scalabilité sont maintenant révolutionnaires plutôt qu'expérimentales

• **Paysage Réglementaire se Cristallise** : Des régulations claires fournissent la stabilité pour le développement DeFi à long terme`,

    thread: `🧵 THREAD : L'Avenir de la DeFi - Insights Clés d'Aujourd'hui

1/8 La DeFi est à un point d'inflexion majeur. L'adoption institutionnelle s'accélère plus vite que jamais, marquant un changement fondamental dans la façon dont la finance traditionnelle perçoit les protocoles décentralisés. 🏦

2/8 Plot twist : La clarté réglementaire STIMULE en fait l'innovation, ne la tue pas. Des cadres clairs donnent aux constructeurs la confiance pour créer des solutions durables et conformes. 📋

3/8 Les chiffres ne mentent pas : L'adoption Layer 2 a explosé de 300% cette année. La scalabilité n'est pas un problème futur—elle est résolue maintenant. ⚡

4/8 Les ZK-rollups sont les vrais MVP ici. Ils résolvent le trilemme blockchain en livrant une scalabilité massive SANS sacrifier la décentralisation. C'est énorme. 🔐

5/8 L'expérience utilisateur est tout. Les meilleurs produits DeFi rendent la complexité blockchain invisible. Plus de frais de gas confus ou de cauchemars de bridging. 🎯

6/8 L'interopérabilité cross-chain est là où la magie opère. Le mouvement transparent d'actifs entre chaînes va débloquer le vrai potentiel de la DeFi. 🌉

7/8 L'infrastructure technique a atteint un point de basculement. Nous passons de solutions expérimentales à des solutions prêtes pour l'entreprise. 🚀

8/8 Conclusion : La DeFi mûrit rapidement. Avec la clarté réglementaire, les percées techniques et l'adoption institutionnelle, nous entrons dans une nouvelle ère de finance décentralisée. 🌟`,

    faq: `# FAQ : L'Avenir de la Finance Décentralisée

## Questions Fréquemment Posées

**Q : Qu'est-ce qui fait de ce moment un "point d'inflexion" pour la DeFi ?**
R : L'adoption institutionnelle s'accélère rapidement tandis que les cadres réglementaires fournissent la clarté tant nécessaire. Cette combinaison crée des conditions idéales pour une croissance durable et une adoption mainstream.

**Q : Comment la clarté réglementaire affecte-t-elle l'innovation DeFi ?**
R : Contrairement aux préoccupations concernant les répression réglementaires, des cadres clairs stimulent en fait l'innovation en donnant aux développeurs la confiance pour construire des solutions conformes et à long terme.

**Q : Que signifient vraiment les chiffres d'adoption Layer 2 ?**
R : La croissance de 300% en adoption Layer 2 cette année démontre que les solutions de scalabilité passent d'expérimentales à prêtes pour la production, répondant aux barrières majeures à l'utilisation DeFi.

**Q : Pourquoi les ZK-rollups sont-ils considérés supérieurs aux autres solutions de scaling ?**
R : Les ZK-rollups résolvent le trilemme blockchain en fournissant des améliorations massives de scalabilité tout en maintenant les principes de décentralisation qui sont au cœur de la proposition de valeur DeFi.

**Q : Que signifie "infrastructure invisible" pour les utilisateurs DeFi ?**
R : L'objectif est d'éliminer les frictions utilisateur en gérant automatiquement les opérations complexes comme l'optimisation des frais de gas et le bridging cross-chain, rendant la DeFi aussi facile à utiliser que les apps financières traditionnelles.

**Q : Qu'est-ce que l'interopérabilité cross-chain et pourquoi est-ce important ?**
R : L'interopérabilité cross-chain permet le mouvement transparent d'actifs entre différents réseaux blockchain, créant des expériences utilisateur unifiées et débloquant de nouvelles possibilités pour les protocoles DeFi.

**Q : À quel point l'infrastructure technique de la DeFi est-elle mature ?**
R : L'infrastructure a atteint un point de basculement, passant de solutions expérimentales à des plateformes prêtes pour l'entreprise capables de supporter des applications de niveau institutionnel.`
  };

  let content = baseContent[format as keyof typeof baseContent] || baseContent.article;

  // Ajuster le ton
  switch (tone) {
    case 'casual':
      content = content.replace(/démontre/g, 'montre')
                    .replace(/représente/g, 'est')
                    .replace(/significatif/g, 'énorme')
                    .replace(/Cependant,/g, 'Mais,')
                    .replace(/De plus,/g, 'En plus,');
      break;
    case 'engaging':
      content = content.replace(/Le/g, 'L\'excitant')
                    .replace(/Cette/g, 'Cette révolutionnaire')
                    .replace(/important/g, 'révolutionnaire')
                    .replace(/montre/g, 'révèle');
      break;
    case 'professional':
      content = content.replace(/énorme/g, 'significatif')
                    .replace(/montre/g, 'démontre')
                    .replace(/gros/g, 'substantiel');
      break;
  }

  return content;
};

export const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));