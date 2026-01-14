
import React, { useState, useRef, useEffect } from 'react';
import { Database, Fingerprint, RefreshCw, ShieldCheck, Zap, Binary, Activity, Cpu, Layers, Target } from 'lucide-react';
import { syncDigitalSoul } from '../geminiService';
import { nexusApi } from '../api/nexusClient';
import { useSoul } from '../context/SoulContext';

export const DigitalSoul: React.FC = () => {
  const { soul, setSoul } = useSoul();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExistingSoul = async () => {
      try {
        const response = await nexusApi.retrieveSoul();
        // Standardize check for successful retrieval and non-null DNA
        if (response && response.success !== false && response.dna) {
          setSoul(response.dna);
          localStorage.setItem('nexus_digital_soul', JSON.stringify(response.dna));
        }
      } catch (e) {
        console.warn("Nexus Node: DNA vault record currently empty or inaccessible.");
      }
    };
    fetchExistingSoul();
  }, [setSoul]);

  const handleSync = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const data = await syncDigitalSoul(input);
      // syncDigitalSoul already performs validation, we just ensure the object exists
      if (data && data.archetype) {
        setSoul(data);
        localStorage.setItem('nexus_digital_soul', JSON.stringify(data));
      }
    } catch (e: any) { 
      console.error("Sync Failure:", e.message || e); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in slide-in-from-bottom-4 duration-700 pb-32">
      <header className="space-y-6 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-4 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em]">
             <ShieldCheck size={14} /> Vault Persistence Live
          </div>
          <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Identity Graph</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">Your brand DNA, architected in the Vault. 100% Consistency Guaranteed.</p>
        </div>
        
        {soul && (
          <div className="glass-card px-10 py-6 border-2 border-violet-500/40 bg-violet-600/10 shadow-[0_0_60px_rgba(139,92,246,0.3)] rounded-[2.5rem] flex items-center gap-6">
            <Activity className="text-violet-400" size={32} />
            <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">DNA Purity</p>
                <p className="text-3xl font-black text-white">{soul.purityScore || '98'}%</p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-10">
          <div className="glass-card p-12 border-violet-400/40 bg-violet-600/[0.03] relative overflow-hidden shadow-2xl border-2 rounded-[3.5rem]">
             <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                <Binary size={250} className="text-violet-300" />
             </div>
             <h3 className="text-[14px] font-black text-white uppercase tracking-[0.5em] mb-10 flex items-center gap-3">
                <Fingerprint size={28} className="text-violet-300" /> DNA Ingest Stream
             </h3>
             <textarea 
               value={input} onChange={(e) => setInput(e.target.value)}
               placeholder="Feed the Soul: Paste your most successful writing or core values here..."
               className="w-full h-[450px] bg-black border-2 border-white/10 rounded-[3rem] p-10 text-white text-xl leading-relaxed outline-none focus:ring-4 focus:ring-violet-500/40 focus:border-violet-400 resize-none mb-10 placeholder:text-gray-700 font-bold transition-all shadow-inner"
             />
             <button onClick={handleSync} disabled={loading} className="w-full py-8 bg-violet-600 hover:bg-violet-500 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(139,92,246,0.6)] border-2 border-white/20 group">
                {loading ? <RefreshCw className="animate-spin" size={28} /> : <Zap size={28} className="group-hover:scale-125 transition-transform" />}
                {loading ? 'Synthesizing DNA...' : 'Update Identity Vault'}
             </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-12">
           {soul ? (
             <div className="space-y-12 animate-in zoom-in-95 duration-500 h-full flex flex-col">
                <div className="glass-card p-12 lg:p-20 border-emerald-400/40 bg-emerald-500/[0.04] relative shadow-[0_0_100px_rgba(16,185,129,0.2)] border-2 flex-1 flex flex-col justify-center rounded-[4rem]">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none"><Cpu size={400} className="text-white" /></div>
                   <div className="space-y-4 mb-16 relative z-10">
                      <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.4em]">Archetype Detected</p>
                      <h2 className="text-7xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-none drop-shadow-2xl">{soul.archetype}</h2>
                   </div>
                   <div className="flex flex-wrap gap-4 mb-16 relative z-10">
                      {soul.coreValues?.map(v => (
                        <span key={v} className="px-8 py-4 bg-black/60 border-2 border-white/10 rounded-2xl text-[14px] font-black text-gray-200 uppercase tracking-[0.2em] shadow-2xl hover:border-emerald-500/50 transition-all">{v}</span>
                      ))}
                   </div>
                   <div className="grid grid-cols-2 gap-8 mb-16">
                      <div className="p-8 bg-black border border-white/10 rounded-[2.5rem] shadow-inner flex items-center gap-6">
                         <Layers className="text-violet-400" size={32} />
                         <div>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Storage Node</p>
                            <p className="text-2xl font-black text-white uppercase">api.nexus-os.ai</p>
                         </div>
                      </div>
                      <div className="p-8 bg-black border border-white/10 rounded-[2.5rem] shadow-inner flex items-center gap-6">
                         <Target className="text-emerald-400" size={32} />
                         <div>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Vault Mode</p>
                            <p className="text-2xl font-black text-white uppercase">HARDENED</p>
                         </div>
                      </div>
                   </div>
                   <div className="p-12 bg-black border-2 border-white/20 rounded-[3rem] space-y-8 shadow-[0_40px_80px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full bg-violet-600/50 group-hover:bg-violet-500 transition-colors" />
                      <p className="text-[12px] font-black text-violet-400 uppercase tracking-[0.4em]">Semantic Signature</p>
                      <p className="text-3xl text-white font-black leading-relaxed italic drop-shadow-md">"{soul.semanticFingerprint}"</p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40 border-4 border-dashed border-white/10 rounded-[4rem] bg-white/[0.01]">
                <Fingerprint size={150} className="text-gray-700 mb-12 animate-pulse" />
                <h3 className="text-4xl font-black text-gray-600 uppercase tracking-[0.3em]">Vault Node Empty</h3>
                <p className="text-lg text-gray-500 mt-6 max-w-sm mx-auto font-medium">Synchronize your Brand DNA to initiate the Identity Knowledge Graph.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
