
import React, { useState } from 'react';
import { Quote, Sparkles, Send, Copy, Zap, ArrowRight, Share2, Rocket, RefreshCw, Bot, Clapperboard, Download } from 'lucide-react';
import { generateManifesto, generateProImage } from '../geminiService';
import { useSoul } from '../context/SoulContext';

export const ManifestoLab: React.FC = () => {
  const { soul } = useSoul();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [manifesto, setManifesto] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setManifesto(null);
    setImageUrl(null);
    try {
      const result = await generateManifesto(topic, soul);
      setManifesto(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArt = async () => {
    if (!manifesto?.visualPrompt) return;
    setGeneratingImage(true);
    try {
      const url = await generateProImage(manifesto.visualPrompt, '2K');
      setImageUrl(url);
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="space-y-6">
        <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-[0.5em]">
          <Quote size={16} /> The Identity Manifesto
        </div>
        <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Manifesto Lab</h1>
        <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
          Synthesize high-status philosophical content that defines your brand's sovereignty.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-10">
          <div className="glass-card p-12 space-y-10 bg-white/[0.02] border-white/10 shadow-2xl rounded-[3rem]">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-violet-400 uppercase tracking-[0.5em]">Philosophical Seed</h3>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is the truth everyone in your niche is ignoring? (e.g. 'The future of wealth is agentic orchestration')"
                className="w-full h-48 bg-black border-2 border-white/10 rounded-[2.5rem] p-8 text-xl text-white outline-none focus:ring-4 focus:ring-violet-500/30 focus:border-violet-400 resize-none font-bold transition-all placeholder:text-gray-800"
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full py-8 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-[0_0_60px_rgba(139,92,246,0.5)]"
            >
              {loading ? <RefreshCw className="animate-spin" size={28} /> : <Sparkles size={28} />}
              Synthesize Manifesto
            </button>
          </div>

          {manifesto && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
              <div className="glass-card p-12 space-y-8 bg-violet-600/5 border-violet-500/20 rounded-[3rem]">
                <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Viral Hooks (Distribution Nodes)</h4>
                <div className="space-y-4">
                  {manifesto.hooks.map((hook: string, i: number) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/10 rounded-2xl group cursor-pointer hover:border-violet-500/50 transition-all">
                      <p className="text-sm font-bold text-gray-200">"{hook}"</p>
                      <button 
                        onClick={() => navigator.clipboard.writeText(hook)}
                        className="p-3 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-12 space-y-8 bg-emerald-500/5 border-emerald-500/20 rounded-[3rem]">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Visual Prompt (Sovereign Aesthetic)</h4>
                <div className="p-8 bg-black/40 rounded-2xl border border-white/10 font-mono text-xs text-emerald-300 italic leading-relaxed">
                  {manifesto.visualPrompt}
                </div>
                <button 
                  onClick={handleGenerateArt}
                  disabled={generatingImage}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                >
                  {generatingImage ? <RefreshCw className="animate-spin" size={18} /> : <Clapperboard size={18} />}
                  Render Visual Asset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-10">
          {manifesto ? (
            <div className="glass-card p-16 space-y-12 bg-black border-2 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden min-h-[800px] flex flex-col animate-in zoom-in-95 duration-700 rounded-[4rem]">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
                <Rocket size={500} className="text-white" />
              </div>
              
              {imageUrl && (
                <div className="w-full aspect-video rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl mb-12 animate-in fade-in duration-1000">
                  <img src={imageUrl} alt="Manifesto Art" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="space-y-6 relative z-10">
                <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight italic">{manifesto.headline}</h2>
                <div className="w-24 h-2 bg-violet-600 rounded-full" />
              </div>

              <div className="flex-1 relative z-10">
                <p className="text-2xl md:text-3xl text-gray-200 font-medium leading-[1.4] whitespace-pre-wrap font-sans first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-violet-500">
                  {manifesto.manifestoText}
                </p>
              </div>

              <div className="pt-16 border-t border-white/10 relative z-10 space-y-8">
                <div className="p-10 bg-violet-600/10 border-2 border-violet-500/30 rounded-[3rem] text-center space-y-4">
                  <p className="text-[11px] font-black text-violet-400 uppercase tracking-[0.5em]">The Sovereign Call</p>
                  <p className="text-2xl font-black text-white uppercase">{manifesto.callToSovereignty}</p>
                </div>
                
                <div className="flex gap-4">
                  <button className="flex-1 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-3">
                    <Download size={18} /> Export PDF
                  </button>
                  <button className="flex-1 py-5 bg-white/10 border border-white/20 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
                    <Share2 size={18} /> Distribute to Mesh
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40 border-4 border-dashed border-white/10 rounded-[4rem] bg-white/[0.01]">
              <Bot size={120} className="text-gray-700 mb-10 animate-pulse" />
              <h3 className="text-3xl font-black text-gray-500 uppercase tracking-[0.3em]">Awaiting Visionary Spark</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
