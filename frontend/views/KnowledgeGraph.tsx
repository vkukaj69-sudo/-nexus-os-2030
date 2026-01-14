
import React, { useState } from 'react';
import { Network, Search, Filter, Sparkles, Database, Atom, Globe, Target, ArrowUpRight, Plus, RefreshCw, Share2, ArrowRight } from 'lucide-react';

export const KnowledgeGraph: React.FC = () => {
  const [nodes] = useState([
    { id: '1', label: 'AI Strategy', cat: 'idea', val: 92 },
    { id: '2', label: 'Digital Sovereignty', cat: 'value', val: 100 },
    { id: '3', label: 'Creator Ops', cat: 'asset', val: 78 },
    { id: '4', label: 'X Platform', cat: 'platform', val: 85 },
    { id: '5', label: 'LinkedIn', cat: 'platform', val: 64 },
    { id: '6', label: 'Agentic Ecosystem', cat: 'idea', val: 88 }
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 flex-1">
          <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient">Knowledge Graph</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">842,000 contextual nodes mapped. Your entire creator consciousness is now a searchable, interlinked asset.</p>
        </div>
        
        <div className="flex gap-4">
           <button className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
              <RefreshCw size={24} />
           </button>
           <button className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-4 shadow-2xl">
              <Plus size={20} /> New Intelligence Node
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 glass-card p-12 bg-black border-2 border-white/10 shadow-2xl relative overflow-hidden h-[700px] flex items-center justify-center">
           {/* Conceptual Graph Visualization */}
           <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full neural-grid"></div>
           </div>
           
           <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute w-40 h-40 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
              <div className="grid grid-cols-3 gap-16 relative z-10">
                 {nodes.map(node => (
                   <div key={node.id} className="glass-card p-8 border-white/10 bg-white/[0.03] hover:border-blue-500/50 hover:scale-110 transition-all cursor-pointer group flex flex-col items-center justify-center text-center space-y-4">
                      <div className={`p-4 rounded-2xl shadow-2xl border-2 ${node.cat === 'idea' ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' : node.cat === 'platform' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'}`}>
                         <Atom size={32} />
                      </div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tighter">{node.label}</h4>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-4">
                         <div className={`h-full transition-all duration-1000 ${node.cat === 'idea' ? 'bg-violet-500' : node.cat === 'platform' ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{width: `${node.val}%`}}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-10 bg-black/60 backdrop-blur-3xl px-12 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                 <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Ideas</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Platforms</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Assets</span>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="glass-card p-10 bg-white/[0.02] border-white/10 space-y-10">
              <h3 className="text-[14px] font-black text-white uppercase tracking-[0.6em] border-b border-white/10 pb-6">Node Analysis</h3>
              <div className="space-y-8">
                 {[
                   { label: 'Cluster Density', val: 'High (0.92)' },
                   { label: 'Semantic Breadth', val: 'Enterprise' },
                   { label: 'Platform Synergy', val: 'Optimal' },
                   { label: 'Authority Score', val: '89.4%' }
                 ].map((stat, i) => (
                   <div key={i} className="flex justify-between items-center">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{stat.label}</span>
                      <span className="text-lg font-black text-white">{stat.val}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="glass-card p-10 bg-blue-600/5 border-blue-500/20 space-y-6">
              <div className="flex items-center gap-4 text-blue-400">
                 <Sparkles size={24} />
                 <h4 className="text-[12px] font-black uppercase tracking-widest">Contextual Insight</h4>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed font-medium italic">
                "Your 'AI Strategy' node has gained 14% more semantic relevance this week due to the latest brain dump. Suggested pivot: Connect it to the 'Sovereign Debt' node for a high-value thread."
              </p>
              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                 Apply Optimization <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
