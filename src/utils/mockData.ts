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
      text: "Welcome to this Twitter Space on the future of decentralized finance. I'm excited to have exceptional guests today.",
      speaker: 'host'
    },
    {
      start: 26,
      end: 58,
      text: "Thanks for having me. I think DeFi is at a really interesting inflection point. Institutional adoption is accelerating.",
      speaker: 'speaker1'
    },
    {
      start: 59,
      end: 92,
      text: "Absolutely. What's fascinating is how the regulatory landscape is starting to crystallize. This clarity is driving innovation.",
      speaker: 'speaker2'
    },
    {
      start: 93,
      end: 127,
      text: "From a technical perspective, the scalability solutions we're seeing now are game-changing. Layer 2 adoption has increased 300% this year.",
      speaker: 'speaker3'
    },
    {
      start: 128,
      end: 165,
      text: "That's an excellent point. Let's dive deeper into scalability. Sarah, what are your thoughts on current solutions?",
      speaker: 'host'
    },
    {
      start: 166,
      end: 203,
      text: "The key isn't just throughput, but maintaining decentralization. We can't sacrifice core principles for speed. That's where ZK-rollups really shine.",
      speaker: 'speaker2'
    },
    {
      start: 204,
      end: 240,
      text: "User experience is equally important. The average person shouldn't need to understand gas fees or bridging. Infrastructure should be invisible.",
      speaker: 'speaker1'
    },
    {
      start: 241,
      end: 275,
      text: "Speaking of user experience, cross-chain interoperability is where I see the biggest opportunity. Seamless asset movement between chains.",
      speaker: 'speaker3'
    }
  ];

  const fullText = timestamps.map(t => t.text).join(' ');
  const tokenCount = Math.floor(fullText.length / 4);
  const estimatedCost = tokenCount * 0.0001;

  return {
    text: fullText,
    language: 'English',
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
      text: 'DeFi is experiencing accelerated institutional adoption, marking a significant inflection point in the industry.',
      timestamp: 26,
      speaker: 'Alex Chen',
      category: 'insight',
      editable: true,
      webLinks: ['https://defipulse.com/institutional-adoption', 'https://coindesk.com/defi-institutions']
    },
    {
      id: '2',
      text: 'Regulatory clarity is driving innovation rather than stifling it, contrary to common concerns.',
      timestamp: 59,
      speaker: 'Sarah Johnson',
      category: 'theme',
      editable: true,
      webLinks: ['https://regulatory-clarity-defi.com']
    },
    {
      id: '3',
      text: 'Layer 2 adoption has increased 300% this year, representing massive scalability improvements.',
      timestamp: 93,
      speaker: 'Mike Rodriguez',
      category: 'quote',
      editable: true,
      webLinks: ['https://l2beat.com/scaling/summary']
    },
    {
      id: '4',
      text: 'ZK-rollups offer scalability while maintaining decentralization principles, unlike other solutions.',
      timestamp: 166,
      speaker: 'Sarah Johnson',
      category: 'insight',
      editable: true,
      webLinks: ['https://ethereum.org/en/developers/docs/scaling/zk-rollups/']
    },
    {
      id: '5',
      text: 'User experience should prioritize invisible infrastructure complexity like gas fees and bridging.',
      timestamp: 204,
      speaker: 'Alex Chen',
      category: 'theme',
      editable: true,
      webLinks: []
    },
    {
      id: '6',
      text: 'Cross-chain interoperability represents the biggest opportunity for seamless asset movement.',
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
    article: `# The Future of Decentralized Finance: In-Depth Analysis

## Introduction

The decentralized finance (DeFi) landscape is undergoing a major transformation period, with institutional adoption accelerating and regulatory frameworks beginning to crystallize. This comprehensive analysis explores the key trends shaping DeFi's future, based on insights from industry experts.

## Main Themes

### Institutional Adoption
DeFi has reached a significant inflection point with institutional investors increasingly embracing decentralized financial protocols. This shift represents a fundamental evolution in how traditional finance perceives blockchain-based solutions.

### Regulatory Clarity Driving Innovation
Contrary to widespread concerns about regulatory crackdowns stifling innovation, emerging regulatory frameworks are actually providing the clarity needed for sustained growth and development in the DeFi space.

### Scalability Breakthroughs
The technical infrastructure supporting DeFi has seen remarkable improvements, with Layer 2 solutions experiencing 300% growth in adoption over the past year. These developments address long-standing concerns about transaction throughput and costs.

## Technical Innovations

### ZK-Rollups and Decentralization
Zero-knowledge rollups represent a breakthrough in solving the blockchain trilemma, offering scalability improvements while maintaining the decentralization principles that are core to DeFi's value proposition.

### User Experience Evolution
The focus has shifted from purely technical capabilities to optimizing user experience. The goal is to make complex blockchain operations invisible to end users, eliminating friction points like gas fee calculations and cross-chain bridging complexities.

### Cross-Chain Interoperability
The future of DeFi lies in seamless interoperability between different blockchain networks, enabling frictionless asset movement and unified user experiences across multiple protocols.

## Conclusion

The DeFi ecosystem is rapidly maturing, with technical innovations addressing scalability concerns while regulatory clarity provides a stable foundation for continued growth. The focus on user experience and institutional adoption suggests a promising future for decentralized finance.`,

    bullets: `# Key Points: The Future of Decentralized Finance

## Main Trends

• **Accelerated Institutional Adoption**: DeFi has reached an inflection point with institutional investors increasingly embracing decentralized protocols

• **Regulatory Clarity Drives Innovation**: Emerging regulatory frameworks provide clarity that enables rather than restricts DeFi development

• **Massive Scalability Improvements**: Layer 2 adoption increased 300% this year, addressing transaction throughput and cost concerns

• **ZK-Rollups Maintain Decentralization**: Zero-knowledge rollups offer scalability while preserving fundamental decentralization principles

• **Focus on User Experience**: Infrastructure complexity should be invisible to users, eliminating gas fee and bridging friction

• **Cross-Chain Interoperability Priority**: Seamless asset movement between blockchain networks represents the biggest growth opportunity

• **Mature Technical Infrastructure**: Scalability solutions are now production-ready rather than experimental

• **Crystallizing Regulatory Landscape**: Clear regulations provide stability for long-term DeFi development`,

    thread: `🧵 THREAD: The Future of DeFi - Key Insights from Today

1/8 DeFi is at a major inflection point. Institutional adoption is accelerating faster than ever, marking a fundamental shift in how traditional finance perceives decentralized protocols. 🏦

2/8 Plot twist: Regulatory clarity is actually DRIVING innovation, not killing it. Clear frameworks give builders confidence to create sustainable, compliant solutions. 📋

3/8 The numbers don't lie: Layer 2 adoption exploded 300% this year. Scalability isn't a future problem—it's solved now. ⚡

4/8 ZK-rollups are the real MVPs here. They solve the blockchain trilemma by delivering massive scalability WITHOUT sacrificing decentralization. That's huge. 🔐

5/8 User experience is everything. The best DeFi products make blockchain complexity invisible. No more confusing gas fees or bridging nightmares. 🎯

6/8 Cross-chain interoperability is where the magic happens. Seamless asset movement between chains will unlock DeFi's true potential. 🌉

7/8 Technical infrastructure has reached a tipping point. We're moving from experimental solutions to enterprise-ready ones. 🚀

8/8 Bottom line: DeFi is maturing rapidly. With regulatory clarity, technical breakthroughs, and institutional adoption, we're entering a new era of decentralized finance. 🌟`,

    faq: `# FAQ: The Future of Decentralized Finance

## Frequently Asked Questions

**Q: What makes this moment an "inflection point" for DeFi?**
A: Institutional adoption is accelerating rapidly while regulatory frameworks provide much-needed clarity. This combination creates ideal conditions for sustainable growth and mainstream adoption.

**Q: How does regulatory clarity affect DeFi innovation?**
A: Contrary to concerns about regulatory crackdowns, clear frameworks actually drive innovation by giving developers confidence to build compliant, long-term solutions.

**Q: What do the Layer 2 adoption numbers really mean?**
A: The 300% growth in Layer 2 adoption this year demonstrates that scalability solutions are moving from experimental to production-ready, addressing major barriers to DeFi usage.

**Q: Why are ZK-rollups considered superior to other scaling solutions?**
A: ZK-rollups solve the blockchain trilemma by providing massive scalability improvements while maintaining the decentralization principles that are core to DeFi's value proposition.

**Q: What does "invisible infrastructure" mean for DeFi users?**
A: The goal is to eliminate user friction by automatically handling complex operations like gas fee optimization and cross-chain bridging, making DeFi as easy to use as traditional financial apps.

**Q: What is cross-chain interoperability and why is it important?**
A: Cross-chain interoperability enables seamless asset movement between different blockchain networks, creating unified user experiences and unlocking new possibilities for DeFi protocols.

**Q: How mature is DeFi's technical infrastructure?**
A: The infrastructure has reached a tipping point, moving from experimental solutions to enterprise-ready platforms capable of supporting institutional-grade applications.`
  };

  let content = baseContent[format as keyof typeof baseContent] || baseContent.article;

  // Adjust tone
  switch (tone) {
    case 'casual':
      content = content.replace(/demonstrates/g, 'shows')
                    .replace(/represents/g, 'is')
                    .replace(/significant/g, 'huge')
                    .replace(/However,/g, 'But,')
                    .replace(/Furthermore,/g, 'Plus,');
      break;
    case 'engaging':
      content = content.replace(/The/g, 'The exciting')
                    .replace(/This/g, 'This revolutionary')
                    .replace(/important/g, 'revolutionary')
                    .replace(/shows/g, 'reveals');
      break;
    case 'professional':
      content = content.replace(/huge/g, 'significant')
                    .replace(/shows/g, 'demonstrates')
                    .replace(/big/g, 'substantial');
      break;
  }

  return content;
};

export const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));