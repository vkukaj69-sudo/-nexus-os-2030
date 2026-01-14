
import React, { useState } from 'react';
import { Palette, Download, RefreshCw, Star, ShieldCheck, Sparkles, ExternalLink, Image as ImageIcon, Search, Fingerprint, Info } from 'lucide-react';
import { generateProImage } from '../geminiService';

export const BrandLab: React.FC = () => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [profileText, setProfileText] = useState('');
  const [profiling, setProfiling] = useState(false);
  const [voiceDNA, setVoiceDNA] = useState<any>(null);

  const handleProfileVoice = async () => {
    if (!profileText.trim()) return;
    setProfiling(true);
    // Simulating deep voice profiling analysis
    setTimeout(() => {
      setVoiceDNA({
        archetype: 'Strategic Minimalist',
        traits: ['Logical', 'Direct', 'Authoritative', 'Future-Focused'],
        sentiment: 'High-Value Professional',
        score: 98
      });
      setProfiling(false);
    }, 2000);
  };

  const handleGenerateLogo = async (id: string, prompt: string) => {
    setLoadingId(id);
    try {
      const url = await generateProImage(prompt, '4K');
      setResults(prev => ({ ...prev, [id]: url }));
    } finally { setLoadingId(null); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-violet-600/20 text-violet-400 border border-violet-500/20 uppercase tracking-[0.2em]">Sovereign Identity</span>
          </div>
          <h1 className="text-4xl font-black text-gradient">Brand Lab v2</h1>
          <p className="text-gray-400">Lock in your Voice DNA and Visual Core for 2026.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="glass-card p-8 border-violet-500/20 bg-violet-500/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Fingerprint size={160} className="text-violet-400" />
             </div>
             <h3 className="text-lg font-black text-white flex items-center gap-2 mb-6 uppercase tracking-widest">
                <Fingerprint size={20} className="text-violet-400" /> Voice DNA Profiler
             </h3>
             <p className="text-xs text-gray-400 leading-relaxed mb-6">Paste your best performing content here. Nexus will extract your unique "Brand Signature".</p>
             <textarea 
               value={profileText} onChange={(e) => setProfileText(e.target.value)}
               placeholder="Paste 3-5 of your most viral posts here..."
               className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500/50 resize-none mb-4 font-medium"
             />
             <button onClick={handleProfileVoice} disabled={profiling} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2">
               {profiling ? <RefreshCw className="animate-spin" size={18}/> : <Search size={18}/>} EXTRACT DNA SIGNATURE
             </button>

             {voiceDNA && (
               <div className="mt-8 p-6 bg-black/60 border border-violet-500/30 rounded-2xl animate-in slide-in-from-top-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-violet-400 uppercase">Archetype Locked</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">{voiceDNA.score}% Purity</span>
                  </div>
                  <h4 className="text-2xl font-black text-white">{voiceDNA.archetype}</h4>
                  <div className="flex flex-wrap gap-2">
                    {voiceDNA.traits.map((t: string) => (
                      <span key={t} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] font-black text-gray-400 uppercase">{t}</span>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2 flex items-center gap-2">
            <Palette size={14} /> 4K Visual Core
          </h3>
          <div className="grid grid-cols-1 gap-4">
             {[
               { id: 'logo', name: 'Neural Minimalist Logo', prompt: 'Modern minimalist AI logo, clean lines, neural circuit bolt, violet white palette, black background, 4K.' },
               { id: 'hero', name: 'Identity Hero Background', prompt: 'Futuristic abstract glass refraction background, iridescent violet fuchsia gradients, hyper-realistic, 8K wallpaper.' }
             ].map((item) => (
               <div key={item.id} className="glass-card p-6 border-white/5 group relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-white">{item.name}</h4>
                    <button onClick={() => handleGenerateLogo(item.id, item.prompt)} disabled={loadingId === item.id} className="p-2 bg-white/5 rounded-lg text-violet-400 hover:text-white transition-all">
                      {loadingId === item.id ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                  </div>
                  {results[item.id] ? (
                    <div className="relative group rounded-xl overflow-hidden border border-white/10 animate-in zoom-in-95">
                       <img src={results[item.id]} className="w-full h-auto" alt="Generated visual" />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <button onClick={() => window.open(results[item.id])} className="p-2 bg-white text-black rounded-lg"><ExternalLink size={16}/></button>
                          <button className="p-2 bg-violet-600 text-white rounded-lg"><Download size={16}/></button>
                       </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-white/5 border border-dashed border-white/10 rounded-xl flex items-center justify-center">
                       <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Ready for render</p>
                    </div>
                  )}
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
