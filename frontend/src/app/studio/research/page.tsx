'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  TrendingUp,
  Loader2,
  ChevronLeft,
  Search,
  Globe,
  BarChart2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

const regions = [
  { id: 'US', name: 'United States' },
  { id: 'GB', name: 'United Kingdom' },
  { id: 'CA', name: 'Canada' },
  { id: 'AU', name: 'Australia' },
  { id: 'DE', name: 'Germany' },
  { id: 'FR', name: 'France' },
  { id: 'JP', name: 'Japan' },
  { id: 'IN', name: 'India' },
];

const analysisTypes = [
  { id: 'trends', name: 'Google Trends', description: 'Search interest over time' },
  { id: 'research', name: 'Deep Research', description: 'AI-powered analysis' },
];

export default function ResearchStudio() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('US');
  const [analysisType, setAnalysisType] = useState('trends');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let result;

      if (analysisType === 'trends') {
        // Check if multiple keywords (comma separated)
        const keywords = query.split(',').map(k => k.trim()).filter(k => k);
        if (keywords.length > 1) {
          result = await api.getTrends(undefined, keywords, region);
        } else {
          result = await api.getTrends(query, undefined, region);
        }
      } else {
        result = await api.research(query, analysisType);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setResults(result);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'rising' || trend === 'up') return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    if (trend === 'falling' || trend === 'down') return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const suggestions = [
    "AI agents",
    "Claude AI, ChatGPT, Gemini",
    "cryptocurrency",
    "remote work trends",
    "sustainable tech"
  ];

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Research Studio</h1>
                <p className="text-xs text-gray-500">Trends & Market Intelligence</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Controls */}
          <div className="space-y-6">
            {/* Search Input */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                What do you want to research?
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter keyword or compare: term1, term2, term3"
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>

              {/* Suggestions */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Try these:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(suggestion)}
                      className="text-xs px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
                      disabled={loading}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Type */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Analysis Type
              </label>
              <div className="space-y-2">
                {analysisTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAnalysisType(type.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                      analysisType === type.id
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                    }`}
                    disabled={loading}
                  >
                    {type.id === 'trends' ? (
                      <BarChart2 className="w-5 h-5" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{type.name}</div>
                      <div className="text-xs opacity-70">{type.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Region */}
            {analysisType === 'trends' && (
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                >
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                loading || !query.trim()
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-5 h-5" />
                  Analyze
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

          {/* Right: Results */}
          <div className="lg:col-span-2 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Results</h3>

            {results ? (
              <div className="space-y-6">
                {/* Interest Over Time */}
                {results.interestOverTime && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-3">Interest Over Time</h4>
                    <div className="space-y-2">
                      {results.interestOverTime.slice(-12).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-24">{item.formattedTime || item.date}</span>
                          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{ width: `${item.value || item.interest}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8">{item.value || item.interest}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Queries */}
                {results.relatedQueries && (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Top Queries */}
                    {results.relatedQueries.top && results.relatedQueries.top.length > 0 && (
                      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                        <h4 className="text-sm font-medium text-white mb-3">Top Related</h4>
                        <div className="space-y-2">
                          {results.relatedQueries.top.slice(0, 8).map((q: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-gray-300 truncate">{q.query}</span>
                              <span className="text-xs text-gray-500">{q.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rising Queries */}
                    {results.relatedQueries.rising && results.relatedQueries.rising.length > 0 && (
                      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-green-400" /> Rising
                        </h4>
                        <div className="space-y-2">
                          {results.relatedQueries.rising.slice(0, 8).map((q: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="text-sm text-gray-300 truncate">{q.query}</span>
                              <span className="text-xs text-green-400">{q.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Regional Interest */}
                {results.interestByRegion && results.interestByRegion.length > 0 && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-3">Interest by Region</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {results.interestByRegion.slice(0, 10).map((r: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm text-gray-300 truncate flex-1">{r.geoName || r.region}</span>
                          <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${r.value || r.interest}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-6">{r.value || r.interest}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Daily Trends */}
                {results.dailyTrends && results.dailyTrends.length > 0 && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-3">Trending Today</h4>
                    <div className="space-y-2">
                      {results.dailyTrends.slice(0, 10).map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b border-gray-700/50 last:border-0">
                          <span className="text-sm text-gray-300">{t.title || t.query}</span>
                          <span className="text-xs text-gray-500">{t.traffic || t.formattedTraffic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparison Results */}
                {results.comparison && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-3">Keyword Comparison</h4>
                    <div className="space-y-3">
                      {Object.entries(results.comparison).map(([keyword, data]: [string, any], i: number) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-300">{keyword}</span>
                            <span className="text-xs text-gray-500">Avg: {data.average || data.avgInterest}</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              style={{ width: `${data.average || data.avgInterest}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deep Research Results */}
                {results.analysis && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-3">Analysis</h4>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">{results.analysis}</div>
                  </div>
                )}

                {/* Raw result fallback */}
                {!results.interestOverTime && !results.relatedQueries && !results.analysis && (
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    <pre className="text-xs text-gray-400 overflow-auto">
                      {JSON.stringify(results, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Research results will appear here</p>
                  <p className="text-gray-600 text-xs mt-1">Compare multiple keywords with commas</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
