import React, { useState } from 'react';
import { Download, Copy, Globe, FileText, Share2, CheckCircle, ArrowRight, Eye, Sparkles, Loader2, Palette, Code } from 'lucide-react';
import { GeminiServiceFactory } from '../../utils/geminiService';
import { OpenAIServiceFactory } from '../../utils/openaiService';
import { useAppContext } from '../../contexts/AppContext';

interface Step8Props {
  generatedContent: string;
  contentSettings: any;
  onNext: () => void;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  format: any;
  content: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, format, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <format.icon className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {format.name} Preview
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-6 min-h-96">
            {format.id === 'html' ? (
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {content}
              </pre>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

const Step8: React.FC<Step8Props> = ({ generatedContent, contentSettings, onNext }) => {
  const { apiUsageAssignment, apiKeys } = useAppContext();
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; format: any | null }>({
    isOpen: false,
    format: null
  });
  
  // HTML Generation states
  const [showHtmlGenerator, setShowHtmlGenerator] = useState(false);
  const [htmlStyle, setHtmlStyle] = useState('');
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');

  // Get API key for export
  const getExportApiConfig = () => {
    const assignment = apiUsageAssignment.export;
    if (!assignment || !assignment.provider) {
      return { apiKey: null, model: null, displayName: 'Not configured' };
    }

    const providerConfig = apiKeys[assignment.provider as keyof typeof apiKeys];
    if (!providerConfig || !providerConfig.enabled) return null;

    if ('key' in providerConfig) {
      const providerDisplayNames: Record<string, string> = {
        'googleAI': 'Google AI',
        'openAI': 'OpenAI',
        'anthropic': 'Anthropic',
        'mistral': 'Mistral AI'
      };

      const modelDisplayNames: Record<string, string> = {
        'gemini-2.5-flash': 'Gemini 2.5 Flash',
        'gemini-1.5-pro': 'Gemini 1.5 Pro',
        'gpt-4o': 'GPT-4o',
        'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
        'mistral-large': 'Mistral Large'
      };

      const providerName = providerDisplayNames[assignment.provider] || assignment.provider;
      const modelName = assignment.model ? modelDisplayNames[assignment.model] || assignment.model : null;
      const displayName = modelName ? `${providerName} (${modelName})` : providerName;

      return { 
        apiKey: providerConfig.key, 
        model: assignment.model,
        displayName 
      };
    }

    return { apiKey: null, model: null, displayName: 'No API key' };
  };

  const exportFormats = [
    {
      id: 'html',
      name: 'HTML',
      icon: Globe,
      description: 'AI-generated HTML with professional styling and responsive design',
      content: generatedHtml || `<article>
<h1>${contentSettings.title}</h1>
<h2>${contentSettings.subtitle}</h2>
<div class="summary">
<p>${contentSettings.summary}</p>
</div>
<div class="content">
${generatedContent.split('\n').map(line => `<p>${line}</p>`).join('\n')}
</div>
</article>`,
      requiresGeneration: true
    },
    {
      id: 'plain',
      name: 'Plain Text',
      icon: FileText,
      description: 'Simple text format',
      content: `${contentSettings.title}

${contentSettings.subtitle}

Summary: ${contentSettings.summary}

${generatedContent}`,
      requiresGeneration: false
    },
    {
      id: 'json',
      name: 'JSON',
      icon: FileText,
      description: 'Structured data format',
      content: JSON.stringify({
        title: contentSettings.title,
        subtitle: contentSettings.subtitle,
        summary: contentSettings.summary,
        content: generatedContent,
        format: contentSettings.format,
        tone: contentSettings.tone,
        generatedAt: new Date().toISOString()
      }, null, 2),
      requiresGeneration: false
    }
  ];

  const handleCopy = async (format: any) => {
    try {
      await navigator.clipboard.writeText(format.content);
      setCopiedFormat(format.id);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = (format: any) => {
    const extensions = {
      html: 'html',
      plain: 'txt',
      json: 'json'
    };

    const blob = new Blob([format.content], { 
      type: format.id === 'html' ? 'text/html' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekapp-content.${extensions[format.id as keyof typeof extensions]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportStatus(`Downloaded ${format.name} file`);
    setTimeout(() => setExportStatus(''), 3000);
  };

  const handlePreview = (format: any) => {
    setPreviewModal({ isOpen: true, format });
  };

  const generateHtmlWithAI = async () => {
    setIsGeneratingHtml(true);
    
    try {
      const { apiKey: exportApiKey, model: exportModel } = getExportApiConfig();
      const exportAssignment = apiUsageAssignment.export;
      
      if (exportApiKey) {
        console.log('🤖 Generating AI-powered HTML with professional styling...');
        
        // Create a comprehensive prompt for HTML generation
        const htmlPrompt = `Generate a complete, professional HTML document with the following requirements:

CONTENT:
Title: ${contentSettings.title}
Subtitle: ${contentSettings.subtitle}
Content: ${generatedContent}

REQUIREMENTS:
1. Create a complete HTML5 document with proper DOCTYPE, head, and body
2. Include responsive CSS styling that works on all devices
3. Use modern, professional design with:
   - Clean typography (use web-safe fonts)
   - Proper spacing and layout
   - Professional color scheme
   - Responsive design for mobile/tablet/desktop
   - Subtle animations and hover effects
   - Print-friendly styles
4. Structure the content with proper semantic HTML
5. Include meta tags for SEO
6. Add a table of contents if the content is long
7. Style code blocks, quotes, and lists appropriately
8. Include a professional header and footer
9. Use CSS Grid or Flexbox for layout
10. Ensure accessibility (ARIA labels, proper contrast)

${htmlStyle ? `CUSTOM STYLING REQUIREMENTS:\n${htmlStyle}\n` : ''}

Generate only the complete HTML code, no explanations.`;

        let aiGeneratedHtml;
        
        if (exportAssignment?.provider === 'googleAI' && exportApiKey.startsWith('AIza')) {
          const geminiService = GeminiServiceFactory.create(exportApiKey, exportModel);
          aiGeneratedHtml = await geminiService.generateContent(
            generatedContent,
            [],
            {
              title: 'HTML Generation',
              subtitle: '',
              summary: htmlPrompt,
              format: 'article',
              tone: 'professional'
            }
          );
        } else if (exportAssignment?.provider === 'openAI' && exportApiKey.startsWith('sk-')) {
          const openaiService = OpenAIServiceFactory.create(exportApiKey, exportModel);
          aiGeneratedHtml = await openaiService.generateContent(
            generatedContent,
            [],
            {
              title: 'HTML Generation',
              subtitle: '',
              summary: htmlPrompt,
              format: 'article',
              tone: 'professional'
            }
          );
        } else {
          throw new Error(`Unsupported provider for export: ${exportAssignment?.provider}`);
        }

        // Clean up the response to ensure it's valid HTML
        let cleanHtml = aiGeneratedHtml;
        
        // If the AI didn't include DOCTYPE, add it
        if (!cleanHtml.includes('<!DOCTYPE')) {
          cleanHtml = `<!DOCTYPE html>\n${cleanHtml}`;
        }
        
        // If the AI didn't include html tags, wrap it
        if (!cleanHtml.includes('<html')) {
          cleanHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contentSettings.title}</title>
</head>
<body>
${cleanHtml}
</body>
</html>`;
        }

        setGeneratedHtml(cleanHtml);
        console.log('✅ AI-generated HTML created successfully');
        
      } else {
        // No API configured - generate basic HTML
        console.log('⚠️ No export API configured, generating basic HTML...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const demoHtml = generateProfessionalDemoHtml();
        setGeneratedHtml(demoHtml);
      }
      
      // Update the HTML format with the generated content
      const htmlFormatIndex = exportFormats.findIndex(f => f.id === 'html');
      if (htmlFormatIndex !== -1) {
        exportFormats[htmlFormatIndex].content = generatedHtml || generateProfessionalDemoHtml();
      }
      
      setExportStatus(exportApiKey ? 'Professional HTML generated successfully with AI-powered styling' : 'Basic HTML generated');
      setTimeout(() => setExportStatus(''), 3000);
      
    } catch (error) {
      console.error('❌ Error generating AI HTML:', error);
      
      // Fallback to professional demo HTML
      const fallbackHtml = generateProfessionalDemoHtml();
      setGeneratedHtml(fallbackHtml);
      
      setExportStatus('HTML generated with fallback styling');
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  const generateProfessionalDemoHtml = (): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${contentSettings.subtitle || 'Professional content generated by Rekapp'}">
    <title>${contentSettings.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.7;
            color: #2c3e50;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border-radius: 15px;
            overflow: hidden;
            margin-top: 2rem;
            margin-bottom: 2rem;
        }
        
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 3rem 2rem;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            position: relative;
            z-index: 1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 300;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 3rem 2rem;
        }
        
        .summary {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            border-left: 5px solid #667eea;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .summary h3 {
            color: #2c3e50;
            margin-bottom: 1rem;
            font-size: 1.3rem;
        }
        
        .summary p {
            color: #34495e;
            font-size: 1.1rem;
        }
        
        .article-content {
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .article-content h2 {
            color: #2c3e50;
            font-size: 1.8rem;
            margin: 2rem 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid #667eea;
            position: relative;
        }
        
        .article-content h3 {
            color: #34495e;
            font-size: 1.4rem;
            margin: 1.5rem 0 1rem 0;
        }
        
        .article-content p {
            margin-bottom: 1.5rem;
            text-align: justify;
        }
        
        .article-content ul, .article-content ol {
            margin: 1.5rem 0;
            padding-left: 2rem;
        }
        
        .article-content li {
            margin-bottom: 0.5rem;
        }
        
        .article-content blockquote {
            border-left: 4px solid #667eea;
            padding-left: 1.5rem;
            margin: 2rem 0;
            font-style: italic;
            color: #555;
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 0 10px 10px 0;
        }
        
        .article-content code {
            background: #f1f2f6;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }
        
        .article-content pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 1.5rem;
            border-radius: 10px;
            overflow-x: auto;
            margin: 1.5rem 0;
        }
        
        .article-content a {
            color: #667eea;
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: all 0.3s ease;
        }
        
        .article-content a:hover {
            border-bottom-color: #667eea;
            color: #764ba2;
        }
        
        footer {
            background: #2c3e50;
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .footer-content {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .footer-content p {
            margin-bottom: 1rem;
            opacity: 0.8;
        }
        
        .generated-by {
            font-size: 0.9rem;
            opacity: 0.6;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 1rem;
            margin-top: 1rem;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                margin: 1rem;
                border-radius: 10px;
            }
            
            header {
                padding: 2rem 1rem;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .content {
                padding: 2rem 1rem;
            }
            
            .summary {
                padding: 1.5rem;
            }
            
            .article-content {
                font-size: 1rem;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white;
            }
            
            .container {
                box-shadow: none;
                margin: 0;
            }
            
            header {
                background: #2c3e50 !important;
                -webkit-print-color-adjust: exact;
            }
            
            .summary {
                background: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
            }
        }
        
        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .content > * {
            animation: fadeInUp 0.6s ease-out;
        }
        
        /* Custom styling integration */
        ${htmlStyle}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${contentSettings.title}</h1>
            ${contentSettings.subtitle ? `<div class="subtitle">${contentSettings.subtitle}</div>` : ''}
        </header>
        
        <div class="content">
            ${contentSettings.summary ? `
            <div class="summary">
                <h3>Executive Summary</h3>
                <p>${contentSettings.summary}</p>
            </div>
            ` : ''}
            
            <div class="article-content">
                ${generatedContent.split('\n\n').map(paragraph => {
                  if (paragraph.trim().startsWith('#')) {
                    const level = paragraph.match(/^#+/)?.[0].length || 1;
                    const text = paragraph.replace(/^#+\s*/, '');
                    return `<h${Math.min(level + 1, 6)}>${text}</h${Math.min(level + 1, 6)}>`;
                  }
                  return paragraph.trim() ? `<p>${paragraph.trim()}</p>` : '';
                }).filter(Boolean).join('\n                ')}
            </div>
        </div>
        
        <footer>
            <div class="footer-content">
                <p>This content was professionally generated and formatted for optimal readability and engagement.</p>
                <div class="generated-by">
                    Generated by Rekapp • ${new Date().toLocaleDateString()} • Professional Content Creation Platform
                </div>
            </div>
        </footer>
    </div>
</body>
</html>`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Export & Share
        </h2>
        <p className="text-lg text-gray-600">
          Your content is ready! Export with AI-powered formatting and professional styling.
        </p>
      </div>

      {exportStatus && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{exportStatus}</span>
          </div>
        </div>
      )}

      {/* Export Formats */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Export Formats</h3>
        <div className="grid md:grid-cols-1 gap-6">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            return (
              <div key={format.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{format.name}</h4>
                      <p className="text-sm text-gray-500">{format.description}</p>
                    </div>
                  </div>
                  
                  {/* Special HTML generation section */}
                  {format.id === 'html' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowHtmlGenerator(!showHtmlGenerator)}
                        className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Palette className="w-4 h-4 mr-2" />
                        AI Styling
                      </button>
                    </div>
                  )}
                </div>

                {/* HTML AI Generation */}
                {format.id === 'html' && showHtmlGenerator && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      AI-Powered HTML Generation
                    </h5>
                    <p className="text-sm text-purple-700 mb-3">
                      Let AI create professional HTML with responsive design, modern styling, and accessibility features.
                    </p>
                    <textarea
                      value={htmlStyle}
                      onChange={(e) => setHtmlStyle(e.target.value)}
                      placeholder="Optional: Add specific styling requirements (e.g., 'Use a dark theme', 'Add animations', 'Corporate blue color scheme')..."
                      rows={4}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-purple-700">
                        AI will generate professional HTML with modern CSS, responsive design, and SEO optimization.
                      </p>
                      <button
                        onClick={generateHtmlWithAI}
                        disabled={isGeneratingHtml}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        {isGeneratingHtml ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI HTML
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePreview(format)}
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                  
                  <button
                    onClick={() => handleCopy(format)}
                    disabled={format.id === 'html' && format.requiresGeneration && !generatedHtml}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                      copiedFormat === format.id
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {copiedFormat === format.id ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {copiedFormat === format.id ? 'Copied!' : 'Copy'}
                  </button>
                  
                  <button
                    onClick={() => handleDownload(format)}
                    disabled={format.id === 'html' && format.requiresGeneration && !generatedHtml}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>

                {/* HTML generation notice */}
                {format.id === 'html' && format.requiresGeneration && !generatedHtml && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Click "Generate AI HTML" to create a professionally styled version with responsive design and modern CSS.
                    </p>
                  </div>
                )}

                {/* AI generation status */}
                {format.id === 'html' && generatedHtml && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      <strong>AI-generated HTML ready!</strong> Professional styling with responsive design and modern CSS included.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Content Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {generatedContent.split(' ').length}
            </div>
            <div className="text-sm text-blue-700">Words</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {generatedContent.length}
            </div>
            <div className="text-sm text-green-700">Characters</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">
              {Math.ceil(generatedContent.split(' ').length / 200)}
            </div>
            <div className="text-sm text-purple-700">Min read</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Format: {contentSettings.format} • Tone: {contentSettings.tone}</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* AI Features Notice */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-6 h-6 text-purple-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">AI-Enhanced Export Features</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>AI HTML Generation:</strong> Professional responsive design with modern CSS</li>
              <li>• <strong>Smart Styling:</strong> Automatic color schemes, typography, and layout optimization</li>
              <li>• <strong>SEO Optimization:</strong> Meta tags, semantic HTML, and accessibility features</li>
              <li>• <strong>Responsive Design:</strong> Mobile, tablet, and desktop compatibility</li>
              <li>• <strong>Print-Friendly:</strong> Optimized styles for printing and PDF generation</li>
              <li>• <strong>Custom Requirements:</strong> Specify styling preferences for personalized output</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Content Generated Successfully!</h3>
        <p className="text-gray-600 mb-6">
          Your content has been transformed into professional material with AI-powered formatting and styling options.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          If you found this tool helpful, please consider supporting our development in the next step.
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
        >
          Continue to Support
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, format: null })}
        format={previewModal.format}
        content={previewModal.format?.content || ''}
      />
    </div>
  );
};

export default Step8;