
import React, { useState } from 'react';
import { BrainCircuit, Sparkles, ArrowRight, Target, Zap, TrendingUp, RefreshCcw } from 'lucide-react';
import { getCoachIdeas } from '../geminiService';
import { ContentIdea } from '../types';

export const Coach: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [history, setHistory] = useState('Recently posted about AI agents, productivity hacks for developers, and the future of remote work.');

  const handleGetIdeas = async () => {
    setLoading(true);
    try {
      const res = await getCoachIdeas(history);
      setIdeas(res.ideas);
    } catch (error) {
      console.error('Failed to get coach ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-violet-600/20 text-violet-300 border border-violet-500/30 uppercase tracking-[0.2em]">Nexus Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient">Content Coach</h1>
          <p className="text-gray-300 max-w-xl text-base">Analyzing your creator footprint to find the exact pillars your audience will engage with next.</p>
        </div>
        <button 
          onClick={handleGetIdeas}
          disabled={loading}
          className="px-10 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] shrink-0"
        >
          {loading ? <RefreshCcw className="w-5 h-5 animate-spin mr-3" /> : <Zap size={20} className="mr-3" />}
          Refresh Strategy
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass-card p-8 space-y-8 h-fit border-white/10">
          <div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-violet-400" />
              Creator Voice Context
            </h3>
            <textarea
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              placeholder="Describe your niche and recent topics..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-5 text-sm md:text-base text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 resize-none transition-all placeholder:text-gray-700"
            />
          </div>
          
          <div className="space-y-5 pt-6 border-t border-white/10">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
              <span className="text-gray-400">Niche Fit</span>
              <span className="text-emerald-400 font-black text-sm">92%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
              <span className="text-gray-400">Viral Projection</span>
              <span className="text-violet-400 font-black text-sm">88%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-violet-500 h-full w-[88%] shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {ideas.length > 0 ? (
            ideas.map((idea, i) => (
              <div key={i} className="glass-card p-8 border-white/10 hover:border-violet-500/50 transition-all cursor-pointer group bg-white/[0.02]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg text-[9px] font-black bg-white/10 text-violet-300 uppercase tracking-widest border border-white/10">{idea.type}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors leading-tight">{idea.title}</h3>
                    <div className="p-5 bg-white/[0.04] border border-white/10 rounded-2xl italic text-base md:text-lg text-white font-medium shadow-inner">
                      " {idea.hook} "
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium"><strong className="text-violet-300 uppercase text-[10px] font-black mr-2">Core Strategy:</strong> {idea.reasoning}</p>
                  </div>
                  <div className="shrink-0 pt-2">
                    <button className="p-4 bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded-2xl group-hover:bg-violet-600 group-hover:text-white transition-all shadow-xl">
                      <ArrowRight size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[450px] glass-card flex flex-col items-center justify-center text-center p-12 border-dashed border-white/20 bg-white/[0.01]">
              <div className="w-20 h-20 rounded-full bg-violet-600/10 flex items-center justify-center mb-8 border border-violet-500/20">
                <BrainCircuit size={40} className="text-violet-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">Initialize Strategist DNA</h3>
              <p className="text-gray-400 text-sm md:text-base max-w-sm leading-relaxed">
                Provide your context and tap 'Refresh Strategy' to architect your next viral content pillar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
