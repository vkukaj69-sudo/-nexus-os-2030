'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  FileText,
  Loader2,
  Copy,
  RefreshCw,
  ChevronLeft,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';

const platforms = [
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', maxLength: 280 },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', maxLength: 3000 },
  { id: 'instagram', name: 'Instagram', icon: '📷', maxLength: 2200 },
  { id: 'facebook', name: 'Facebook', icon: 'f', maxLength: 5000 },
  { id: 'threads', name: 'Threads', icon: '@', maxLength: 500 },
];

const contentTypes = [
  { id: 'content_generate', name: 'Post', description: 'Single platform post' },
  { id: 'hooks', name: 'Hooks', description: '5 engaging openers' },
  { id: 'thread', name: 'Thread', description: 'Multi-part thread' },
];

export default function ContentStudio() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [contentType, setContentType] = useState('content_generate');
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Transform state
  const [showTransform, setShowTransform] = useState(false);
  const [transformTo, setTransformTo] = useState('linkedin');
  const [transforming, setTransforming] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setGenerating(true);
    setError(null);
    setOutput(null);

    try {
      const result = await api.generateContent(topic, platform, contentType);

      if (result.error) {
        throw new Error(result.error);
      }

      // Extract content from various response formats
      const content = result.content
        || result.result?.content
        || result.hooks?.join('\n\n')
        || result.thread?.map((t: any, i: number) => `${i + 1}. ${t}`).join('\n\n')
        || JSON.stringify(result, null, 2);

      setOutput(content);
      setShowTransform(true);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleTransform = async () => {
    if (!output) return;

    setTransforming(true);
    setError(null);

    try {
      const result = await api.transformContent(output, platform, transformTo);

      if (result.error) {
        throw new Error(result.error);
      }

      const transformed = result.content || result.result?.content || JSON.stringify(result);
      setOutput(transformed);
      setPlatform(transformTo);
    } catch (err: any) {
      setError(err.message || 'Transform failed');
    } finally {
      setTransforming(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPlatform = platforms.find(p => p.id === platform);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Content Studio</h1>
                <p className="text-xs text-gray-500">AI-powered content generation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Topic Input */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                What do you want to write about?
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Share a tip about productivity, announce a new feature, tell a story about..."
                className="w-full h-28 bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={generating}
              />
            </div>

            {/* Platform Selection */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Platform
              </label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      platform === p.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                    disabled={generating}
                  >
                    <span className="text-lg">{p.icon}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Content Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      contentType === type.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                    disabled={generating}
                  >
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs opacity-70">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                generating || !topic.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/25'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Content
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Output</h3>
              {output && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {output.length} / {selectedPlatform?.maxLength || '∞'} chars
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-[300px] bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              {output ? (
                <div className="text-white whitespace-pre-wrap">{output}</div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Generated content will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Transform Section */}
            {output && showTransform && (
              <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400">Transform to:</span>
                  <select
                    value={transformTo}
                    onChange={(e) => setTransformTo(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white"
                    disabled={transforming}
                  >
                    {platforms.filter(p => p.id !== platform).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleTransform}
                    disabled={transforming}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    {transforming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        Transform
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {output && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setOutput(null);
                    setShowTransform(false);
                  }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Over
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
