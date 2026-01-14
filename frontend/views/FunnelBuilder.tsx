
import React, { useState } from 'react';
import { Rocket, Sparkles, Smartphone, Monitor, Copy, Check, ExternalLink, Zap, MousePointer2, RefreshCw, Bot, Code } from 'lucide-react';
import { generateFunnel } from '../geminiService';
import { FunnelDraft } from '../types';

export const FunnelBuilder: React.FC = () => {
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<FunnelDraft | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePreview, setActivePreview] = useState<'mobile' | 'ai'>('mobile');

  const handleGenerate = async () => {
    if (!source.trim()) return;
    setLoading(true);
    try {
      const res = await generateFunnel(source);
      setDraft(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const MicroSitePreview = ({ data }: { data: FunnelDraft }) => (
    <div className="w-full h-full bg-[#0a0a0a] text-white flex flex-col font-sans overflow-y-auto scrollbar-hide">
      <div className="p-6 pt-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 mx-auto flex items-center justify-center shadow-2xl">
          <Zap size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-black leading-tight">{data.headline}</h1>
        <p className="text-gray-200 text-sm font-medium">{data.subheadline}</p>
        <button className="w-full py-3 rounded-xl font-bold shadow-lg text-white" style={{ backgroundColor: data.accentColor }}>{data.cta}</button>
      </div>
      <div className="p-6 bg-white/[0.08] border-y border-white/10 my-4 shadow-inner">
         <p className="text-sm leading-relaxed text-white italic font-medium">"{data.heroText}"</p>
      </div>
      <div className="p-6 space-y-6">
        {data.features.map((f, i) => (
          <div key={i} className="space-y-1.5">
             <h4 className="text-xs font-black uppercase tracking-widest border-b border-white/5 pb-1" style={{ color: data.accentColor }}>{f.title}</h4>
             <p className="text-[11px] text-gray-300 leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto p-6 text-center border-t border-white/10">
         <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Architected via Nexus OS 2030</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Micro-Funnel Architect</h1>
          <p className="text-gray-300">Transform viral content into high-converting conversion environments in seconds.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="glass-card p-8 space-y-6 border-violet-500/20 shadow-2xl bg-white/[0.01]">
            <h3 className="text-xs font-black text-violet-300 uppercase tracking-[0.3em] flex items-center gap-2">
               <Sparkles size={16} /> Content Seed Source
            </h3>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Paste the viral thread, article, or post content you want to convert..."
              className="w-full h-56 bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-base md:text-lg outline-none focus:ring-1 focus:ring-violet-500/50 resize-none leading-relaxed placeholder:text-gray-700 font-medium"
            />
            <button 
              onClick={handleGenerate}
              disabled={loading || !source.trim()}
              className="w-full py-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Rocket size={20} />}
              Execute Funnel Synthesis
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex gap-2 mb-6 bg-white/10 p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button onClick={() => setActivePreview('mobile')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activePreview === 'mobile' ? 'bg-white/10 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}><Smartphone size={16} /> Device Interface</button>
            <button onClick={() => setActivePreview('ai')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activePreview === 'ai' ? 'bg-violet-600 text-white shadow-xl' : 'text-gray-500 hover:text-gray-300'}`}><Bot size={16} /> AI_METADATA_NODE</button>
          </div>
          <div className="relative w-full max-w-[340px] aspect-[9/18.5] bg-[#050505] rounded-[3.5rem] border-[12px] border-[#1a1a1a] shadow-[0_0_120px_rgba(0,0,0,0.6)] overflow-hidden">
             {activePreview === 'mobile' ? (
               <>
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-[#1a1a1a] rounded-b-3xl z-50 shadow-lg" />
                 {draft ? <MicroSitePreview data={draft} /> : <div className="w-full h-full flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-40"><Smartphone size={56} className="text-gray-700" /><p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Awaiting Generation</p></div>}
               </>
             ) : (
               <div className="w-full h-full p-8 bg-[#0a0a0a] overflow-y-auto scrollbar-hide space-y-6">
                  <div className="flex items-center gap-3 py-6 border-b border-white/10"><Code size={24} className="text-violet-400" /><h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">LLMO Protocol Node</h4></div>
                  {draft?.jsonLd ? (
                    <div className="space-y-6 animate-in fade-in">
                       <p className="text-[11px] text-gray-300 leading-relaxed font-medium italic border-l-2 border-violet-500/40 pl-4">This JSON-LD structured data block ensures high-fidelity indexing by RAG-enabled AI agents (Gemini, ChatGPT Search).</p>
                       <pre className="p-6 bg-black border border-white/10 rounded-2xl text-xs text-emerald-300 font-mono whitespace-pre-wrap leading-relaxed selection:bg-emerald-500/40 shadow-inner">{draft.jsonLd}</pre>
                    </div>
                  ) : <div className="h-full flex flex-col items-center justify-center text-center opacity-30"><Bot size={56} className="text-gray-600" /><p className="text-[10px] font-black uppercase tracking-[0.3em] mt-6 text-gray-600">No Intelligence Detected</p></div>}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
