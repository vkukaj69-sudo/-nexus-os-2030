
import React, { useState } from 'react';
import { ScanEye, Zap, RefreshCcw, ArrowUpRight, Target, Users, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { simulateImpact } from '../geminiService';
import { SimulationResult, DigitalSoulProfile } from '../types';

export const ImpactSimulator: React.FC = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const mockSoul: DigitalSoulProfile = { 
      archetype: 'The Visionary Builder', 
      coreValues: ['Future-Proofing', 'Leverage', 'Systems'], 
      semanticFingerprint: 'Logical, direct, data-driven',
      purityScore: 98,
      lastSync: 'Now',
      evolutionStage: 1,
      memoryNodes: 142
    };
    try {
      const res = await simulateImpact(content, mockSoul);
      setResult(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="space-y-4">
        <h1 className="text-6xl font-black text-white tracking-tighter leading-none shadow-violet-500/20 drop-shadow-2xl">Impact Simulator</h1>
        <p className="text-gray-300 text-2xl font-bold max-w-4xl">Deploy synthetic audience clones to predict viral potential.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-10">
           <div className="glass-card p-12 border-violet-400/30 bg-violet-600/[0.04] border-2 shadow-2xl rounded-[3rem]">
              <textarea 
                value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your post or thread draft here..."
                className="w-full h-[500px] bg-black border-2 border-white/20 rounded-[3rem] p-10 text-white text-2xl leading-relaxed outline-none focus:ring-4 focus:ring-violet-500/40 resize-none mb-10 placeholder:text-gray-700 font-bold transition-all"
              />
              <button onClick={handleSimulate} disabled={loading} className="w-full py-8 bg-violet-600 hover:bg-violet-500 text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-[0_0_60px_rgba(139,92,246,0.6)] border-2 border-white/20">
                 {loading ? <RefreshCcw className="animate-spin" size={28} /> : <ScanEye size={28} />}
                 Run Synthetic Simulation
              </button>
           </div>
        </div>

        <div className="space-y-10">
           {result ? (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
                <div className="grid grid-cols-2 gap-8">
                   <div className="glass-card p-10 border-violet-400/40 bg-violet-600/[0.08] text-center border-2 shadow-xl flex flex-col justify-center">
                      <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest mb-4">Viral Probability</p>
                      <p className="text-7xl font-black text-white leading-none">{result.probabilityOfViralReach}%</p>
                   </div>
                </div>
                <div className="glass-card p-12 space-y-10 border-2 border-white/10 bg-white/[0.02] flex-1 shadow-2xl rounded-[3rem]">
                   <h3 className="text-[14px] font-black text-white uppercase tracking-[0.6em] border-b border-white/10 pb-6">Clone Feedback Log</h3>
                   <div className="space-y-10">
                      {result.syntheticFeedback.map((fb, i) => (
                        <div key={i} className="flex gap-8 items-start group">
                           <div className="space-y-4 flex-1">
                              <span className="text-lg font-black text-white uppercase tracking-wider">{fb.persona}</span>
                              <p className="text-gray-200 text-lg md:text-xl leading-relaxed font-bold italic">"{fb.reasoning}"</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-40 border-4 border-dashed border-white/10 rounded-[4rem] bg-white/[0.01]">
                <Target size={100} className="text-gray-600 mb-10 animate-pulse" />
                <h3 className="text-3xl font-black text-gray-500 uppercase tracking-[0.3em]">No Impact Detected</h3>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
