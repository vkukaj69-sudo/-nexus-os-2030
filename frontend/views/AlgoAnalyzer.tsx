
import React, { useState } from 'react';
import { Zap, Send, AlertCircle, CheckCircle2, Info, Bot, Search } from 'lucide-react';
import { analyzeContent } from '../geminiService';
import { AnalysisResult } from '../types';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';

export const AlgoAnalyzer: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showSchema, setShowSchema] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeContent(text);
      setResult(res);
      setShowSchema(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const radarData = result ? [
    { subject: 'Hook', A: result.metrics.hookStrength, fullMark: 100 },
    { subject: 'Viral', A: result.metrics.viralIndex, fullMark: 100 },
    { subject: 'Authentic', A: result.metrics.authenticity, fullMark: 100 },
    { subject: 'RAG/AI', A: result.metrics.ragScore, fullMark: 100 },
    { subject: 'Semantic', A: result.metrics.semanticClarity, fullMark: 100 },
    { subject: 'Read', A: result.metrics.readability, fullMark: 100 },
  ] : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gradient">LLMO & Viral Predictor</h1>
        <p className="text-gray-300 text-sm md:text-base px-4">Score your post for humans AND AI agents before publishing.</p>
      </div>

      <div className="glass-card p-5 md:p-8 space-y-4 md:space-y-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your post draft here for algo-scoring..."
          className="w-full h-40 md:h-48 bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all placeholder:text-gray-600"
        />
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-[10px] md:text-xs text-gray-400 font-mono font-bold">
            <Info size={14} className="mr-1 text-violet-400" />
            CHAR_COUNT: {text.length} | RECOMMENDED: 120-240
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !text}
            className={`w-full sm:w-auto px-8 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : <Zap size={18} className="mr-2" />}
            Analyze Intelligence
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in fade-in zoom-in duration-500">
          <div className="glass-card p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px] relative border-violet-500/30">
            <div className="absolute top-4 right-4 flex gap-2">
               <div className="px-2 py-1 bg-violet-500/20 border border-violet-500/30 rounded-md text-[9px] font-black text-violet-300 uppercase tracking-widest flex items-center gap-1 shadow-lg">
                 <Bot size={10} /> AI_VALIDATED
               </div>
            </div>
            <div className="relative w-40 h-40 md:w-48 md:h-48 mb-6 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" 
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 * (1 - result.score / 100)}
                  className="text-violet-500 transition-all duration-1000 ease-out"
                  style={{ strokeDasharray: '282.7' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl md:text-5xl font-black text-white">{result.score}</span>
                <span className="text-[10px] text-violet-300 font-bold tracking-widest uppercase">VIRAL_INDEX</span>
              </div>
            </div>
            <p className="text-center text-white text-base md:text-lg font-medium italic leading-relaxed px-4">"{result.feedback}"</p>
          </div>

          <div className="glass-card p-4 md:p-6 overflow-hidden bg-white/[0.02]">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-4 px-2">Performance Topology</h4>
            <div className="h-[250px] md:h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#444" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#ccc', fontSize: 10, fontWeight: 'bold' }} />
                  <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card p-6 md:p-8 border-emerald-500/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg md:text-xl font-bold flex items-center text-white">
                <CheckCircle2 size={24} className="mr-3 text-emerald-400 shrink-0" />
                Algorithmic Refinement Plan
              </h3>
              <button 
                onClick={() => setShowSchema(!showSchema)}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all shadow-lg"
              >
                <Search size={14} /> {showSchema ? 'Hide Schema' : 'Deploy AI Metadata'}
              </button>
            </div>
            
            {showSchema ? (
              <div className="animate-in fade-in slide-in-from-top-4">
                 <div className="p-6 bg-black/60 border border-white/10 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">JSON-LD Metadata (LLMO Ready)</p>
                    <pre className="text-xs md:text-sm text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed selection:bg-emerald-500/30 p-2">
                      {result.aiSchema}
                    </pre>
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {result.suggestions.map((s, i) => (
                  <div key={i} className="flex items-start p-5 bg-white/[0.04] border border-white/10 rounded-2xl hover:bg-white/[0.08] transition-all group">
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 flex items-center justify-center mr-4 mt-0.5 font-bold text-[11px] shrink-0 border border-violet-500/20 group-hover:scale-110 transition-transform">
                      {i+1}
                    </div>
                    <p className="text-sm md:text-base text-gray-100 leading-relaxed font-medium">{s}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
