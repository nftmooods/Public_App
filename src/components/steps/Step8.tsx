import React, { useState } from 'react';
import { Download, Copy, Globe, FileText, Share2, CheckCircle, ArrowRight, Eye, Sparkles, Loader2, Palette, Code } from 'lucide-react';

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

  const exportFormats = [
    {
      id: 'html',
      name: 'HTML',
      icon: Globe,
      description: 'Ready for web publishing with custom styling',
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

  const generateHtmlWithStyle = async () => {
    setIsGeneratingHtml(true);
    
    try {
      // Simulate AI HTML generation with custom styling
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${contentSettings.title}</title>
    <style>
        ${htmlStyle || `
        body {
            font-family: 'Georgia', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #fafafa;
        }
        
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        h2 {
            color: #34495e;
            margin-top: 30px;
        }
        
        .summary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        p {
            margin-bottom: 15px;
            text-align: justify;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .summary, .content {
                padding: 15px;
            }
        }
        `}
    </style>
</head>
<body>
    <article>
        <h1>${contentSettings.title}</h1>
        ${contentSettings.subtitle ? `<h2>${contentSettings.subtitle}</h2>` : ''}
        
        <div class="summary">
            <h3>Summary</h3>
            <p>${contentSettings.summary}</p>
        </div>
        
        <div class="content">
            ${generatedContent.split('\n\n').map(paragraph => 
              paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).filter(Boolean).join('\n            ')}
        </div>
    </article>
</body>
</html>`;

      setGeneratedHtml(styledHtml);
      
      // Update the HTML format with the generated content
      const htmlFormatIndex = exportFormats.findIndex(f => f.id === 'html');
      if (htmlFormatIndex !== -1) {
        exportFormats[htmlFormatIndex].content = styledHtml;
      }
      
      setExportStatus('HTML generated successfully with custom styling');
      setTimeout(() => setExportStatus(''), 3000);
      
    } catch (error) {
      console.error('Error generating HTML:', error);
      setExportStatus('Error generating HTML');
      setTimeout(() => setExportStatus(''), 3000);
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Export & Share
        </h2>
        <p className="text-lg text-gray-600">
          Your content is ready! Choose how you'd like to export it.
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
                        Customize Style
                      </button>
                    </div>
                  )}
                </div>

                {/* HTML Style Customization */}
                {format.id === 'html' && showHtmlGenerator && (
                  <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h5 className="font-medium text-purple-900 mb-3">Custom CSS Styling</h5>
                    <textarea
                      value={htmlStyle}
                      onChange={(e) => setHtmlStyle(e.target.value)}
                      placeholder="Enter your custom CSS styles here... (leave empty for default styling)"
                      rows={8}
                      className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm font-mono"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-purple-700">
                        Add your custom CSS to style the HTML output. AI will generate optimized HTML structure.
                      </p>
                      <button
                        onClick={generateHtmlWithStyle}
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
                            Generate HTML
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
                      <strong>Note:</strong> Click "Generate HTML" to create a styled version before copying or downloading.
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

      {/* Success Message */}
      <div className="text-center p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Content Generated Successfully!</h3>
        <p className="text-gray-600 mb-6">
          Your content has been transformed into professional material ready for publication.
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