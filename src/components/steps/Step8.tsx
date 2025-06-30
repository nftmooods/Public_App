import React, { useState } from 'react';
import { Download, Copy, Globe, FileText, Hash, Share2, CheckCircle, ArrowRight } from 'lucide-react';

interface Step8Props {
  generatedContent: string;
  contentSettings: any;
  onNext: () => void;
}

const Step8: React.FC<Step8Props> = ({ generatedContent, contentSettings, onNext }) => {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string>('');

  const exportFormats = [
    {
      id: 'html',
      name: 'HTML',
      icon: Globe,
      description: 'Ready for web publishing',
      content: `<article>
<h1>${contentSettings.title}</h1>
<h2>${contentSettings.subtitle}</h2>
<div class="summary">
<p>${contentSettings.summary}</p>
</div>
<div class="content">
${generatedContent.split('\n').map(line => `<p>${line}</p>`).join('\n')}
</div>
</article>`
    },
    {
      id: 'markdown',
      name: 'Markdown',
      icon: Hash,
      description: 'Perfect for documentation',
      content: `# ${contentSettings.title}

## ${contentSettings.subtitle}

**Summary:** ${contentSettings.summary}

${generatedContent}`
    },
    {
      id: 'plain',
      name: 'Plain Text',
      icon: FileText,
      description: 'Simple text format',
      content: `${contentSettings.title}

${contentSettings.subtitle}

Summary: ${contentSettings.summary}

${generatedContent}`
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
      }, null, 2)
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
      markdown: 'md',
      plain: 'txt',
      json: 'json'
    };

    const blob = new Blob([format.content], { type: 'text/plain' });
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

  const integrations = [
    { name: 'WordPress', icon: Globe, status: 'Available' },
    { name: 'Notion', icon: FileText, status: 'Available' },
    { name: 'Medium', icon: Share2, status: 'Coming Soon' },
    { name: 'Substack', icon: FileText, status: 'Coming Soon' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Export & Share
        </h2>
        <p className="text-lg text-gray-600">
          Your content is ready! Choose how you'd like to export or share it.
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
        <div className="grid md:grid-cols-2 gap-4">
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
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCopy(format)}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                      copiedFormat === format.id
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
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
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-all"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct Integrations */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Direct Publishing</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            const isAvailable = integration.status === 'Available';
            return (
              <div key={integration.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className={`p-3 rounded-lg mx-auto mb-3 w-fit ${
                    isAvailable ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isAvailable ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{integration.name}</h4>
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    isAvailable 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {integration.status}
                  </div>
                  {isAvailable && (
                    <button className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-all">
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Final Content Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="prose prose-sm max-w-none">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {contentSettings.title}
            </h1>
            <h2 className="text-lg text-gray-600 font-normal mb-4">
              {contentSettings.subtitle}
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div className="text-sm font-medium text-blue-800 mb-1">Executive Summary</div>
              <p className="text-blue-700 text-sm">
                {contentSettings.summary}
              </p>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {generatedContent.substring(0, 500)}
              {generatedContent.length > 500 && '...'}
            </div>
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
    </div>
  );
};

export default Step8;