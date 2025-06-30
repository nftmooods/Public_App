import React, { useState } from 'react';
import { ArrowRight, FileText, List, MessageSquare, HelpCircle, Eye, Sparkles } from 'lucide-react';
import { ContentSettings, KeyPoint } from '../../types';

interface Step6Props {
  contentSettings: ContentSettings;
  keyPoints?: KeyPoint[];
  onUpdateSettings: (settings: ContentSettings) => void;
  onNext: () => void;
}

const Step6: React.FC<Step6Props> = ({ contentSettings, keyPoints = [], onUpdateSettings, onNext }) => {
  const [localSettings, setLocalSettings] = useState<ContentSettings>(contentSettings);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKeyPoint, setPreviewKeyPoint] = useState<KeyPoint | null>(null);

  const handleChange = (field: keyof ContentSettings, value: string) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  const formats = [
    { 
      id: 'article', 
      name: 'Web Article', 
      icon: FileText, 
      description: 'Long article with sections and subheadings',
      features: ['Hierarchical structure', 'SEO optimized', 'In-depth reading'],
      example: 'Introduction → Main themes → Detailed insights → Conclusion'
    },
    { 
      id: 'bullets', 
      name: 'Key Points', 
      icon: List, 
      description: 'Structured and concise list',
      features: ['Quick reading', 'Scannable format', 'Effective summary'],
      example: '• Point 1 → • Point 2 → • Point 3 → • Conclusion'
    },
    { 
      id: 'thread', 
      name: 'Twitter Thread', 
      icon: MessageSquare, 
      description: 'Series of connected tweets',
      features: ['Social format', 'High engagement', 'Viral sharing'],
      example: '1/n Introduction → 2/n Key point → 3/n Insight → n/n Conclusion'
    },
    { 
      id: 'faq', 
      name: 'FAQ', 
      icon: HelpCircle, 
      description: 'Structured questions and answers',
      features: ['Interactive format', 'Easy search', 'Maximum clarity'],
      example: 'Q: Question 1? → A: Answer → Q: Question 2? → A: Answer'
    }
  ];

  const tones = [
    { 
      id: 'professional', 
      name: 'Professional', 
      description: 'Formal and expert tone',
      characteristics: ['Technical vocabulary', 'Formal style', 'Credibility'],
      example: '"This analysis reveals significant trends in the ecosystem..."'
    },
    { 
      id: 'casual', 
      name: 'Casual', 
      description: 'Conversational and accessible tone',
      characteristics: ['Simple language', 'Friendly approach', 'Accessibility'],
      example: '"We discovered some really interesting things in this discussion..."'
    },
    { 
      id: 'neutral', 
      name: 'Neutral', 
      description: 'Balanced and informative tone',
      characteristics: ['Objectivity', 'Clarity', 'Factual'],
      example: '"The following points were discussed during this conversation..."'
    },
    { 
      id: 'engaging', 
      name: 'Engaging', 
      description: 'Dynamic and captivating tone',
      characteristics: ['Catchy style', 'Emotion', 'Interaction'],
      example: '"Get ready to discover insights that will change your vision..."'
    }
  ];

  const generatePreview = (keyPoint: KeyPoint) => {
    const getKeyPointTitle = (text: string) => {
      const colonIndex = text.indexOf(':');
      return colonIndex > 0 ? text.substring(0, colonIndex) : text.substring(0, 60) + '...';
    };

    const getKeyPointDescription = (text: string) => {
      const colonIndex = text.indexOf(':');
      return colonIndex > 0 ? text.substring(colonIndex + 1).trim() : text;
    };

    const title = getKeyPointTitle(keyPoint.text);
    const description = getKeyPointDescription(keyPoint.text);

    const formatExamples = {
      article: `## ${title}

${description}

This section would develop in detail the implications of this point, with concrete examples and references to mentioned sources. The analysis would also include perspectives from different speakers and links to other themes discussed.

### Key takeaways:
- Technical aspects and implications
- Impact on the ecosystem
- Evolution perspectives`,

      bullets: `• **${title}**
  ${description}
  
• **Main implications:**
  - Technical and practical impact
  - Consequences for users
  - Expected developments
  
• **Sources and references:**
  - Links to documentation
  - Relevant case studies`,

      thread: `🧵 THREAD: ${title}

1/5 ${description.substring(0, 200)}...

2/5 The implications of this point are multiple. First, the technical impact that transforms how we approach the problem.

3/5 Then, the practical consequences for end users, who directly benefit from these improvements.

4/5 Experts agree on the importance of this evolution for the future of the sector.

5/5 In conclusion, this point perfectly illustrates current trends and upcoming challenges. What do you think? 💭`,

      faq: `**Q: ${title} - Can you explain this concept?**

A: ${description}

**Q: What are the practical implications?**

A: This point has several important implications: improving user experience, optimizing performance, and opening new possibilities for innovation.

**Q: How does this affect the ecosystem?**

A: The impact is felt at several levels: technical, economic and social, creating a positive ripple effect throughout the sector.`
    };

    const toneAdjustments = {
      professional: (text: string) => text.replace(/things/g, 'elements').replace(/super/g, 'remarkable'),
      casual: (text: string) => text.replace(/reveals/g, 'shows').replace(/significant/g, 'important'),
      engaging: (text: string) => text.replace(/This/g, 'This incredible').replace(/important/g, 'revolutionary'),
      neutral: (text: string) => text
    };

    let content = formatExamples[localSettings.format as keyof typeof formatExamples] || formatExamples.article;
    content = toneAdjustments[localSettings.tone as keyof typeof toneAdjustments](content);

    return content;
  };

  const handleShowPreview = () => {
    if (keyPoints.length > 0) {
      setPreviewKeyPoint(keyPoints[0]);
      setShowPreview(true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Content Format and Tone
        </h2>
        <p className="text-lg text-gray-600">
          Choose the content type and tone that match your objectives
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Format selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Content Type</h3>
            <div className="space-y-4">
              {formats.map((format) => {
                const Icon = format.icon;
                const isSelected = localSettings.format === format.id;
                
                return (
                  <div
                    key={format.id}
                    onClick={() => handleChange('format', format.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{format.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{format.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {format.features.map((feature, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 text-xs rounded-full ${
                                isSelected 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                        
                        <div className="text-xs text-gray-500 italic">
                          Structure: {format.example}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tone selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Tone and Style</h3>
            <div className="space-y-4">
              {tones.map((tone) => {
                const isSelected = localSettings.tone === tone.id;
                
                return (
                  <div
                    key={tone.id}
                    onClick={() => handleChange('tone', tone.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{tone.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{tone.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {tone.characteristics.map((char, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${
                              isSelected 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {char}
                          </span>
                        ))}
                      </div>
                      
                      <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                        Example: {tone.example}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preview of the combination */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mt-8 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">
            Your Selection Preview
          </h3>
          {keyPoints.length > 0 && (
            <button
              onClick={handleShowPreview}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Preview
            </button>
          )}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Selected Format</h4>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const selectedFormat = formats.find(f => f.id === localSettings.format);
                  if (selectedFormat) {
                    const Icon = selectedFormat.icon;
                    return (
                      <>
                        <Icon className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium text-gray-900">{selectedFormat.name}</div>
                          <div className="text-sm text-gray-600">{selectedFormat.description}</div>
                        </div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Selected Tone</h4>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const selectedTone = tones.find(t => t.id === localSettings.tone);
                  if (selectedTone) {
                    return (
                      <div>
                        <div className="font-medium text-gray-900">{selectedTone.name}</div>
                        <div className="text-sm text-gray-600">{selectedTone.description}</div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-white rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Expected Result</h4>
          <p className="text-sm text-gray-700">
            Your content will be generated in <strong>{formats.find(f => f.id === localSettings.format)?.name}</strong> 
            {' '}format with a <strong>{tones.find(t => t.id === localSettings.tone)?.name}</strong> tone, 
            optimized for your audience and communication objectives.
          </p>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && previewKeyPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Format and Tone Preview
                </h2>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-1">
                  Example based on: "{previewKeyPoint.text.split(':')[0] || previewKeyPoint.text.substring(0, 50)}..."
                </h3>
                <p className="text-sm text-blue-700">
                  Format: {formats.find(f => f.id === localSettings.format)?.name} • 
                  Tone: {tones.find(t => t.id === localSettings.tone)?.name}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                    {generatePreview(previewKeyPoint)}
                  </pre>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a preview based on one of your key points. 
                  The final content will be generated using all your key points and will be richer and more detailed.
                </p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Generate Content
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Step6;