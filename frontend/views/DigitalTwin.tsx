
import React, { useState, useEffect } from 'react';
import { UsersRound, RefreshCw, Zap, ShieldCheck, Activity, Globe, MessageSquare, ArrowUpRight, CheckCircle2, Cpu } from 'lucide-react';
import { DigitalTwinState } from '../types';

export const DigitalTwin: React.FC = () => {
  const [twin, setTwin] = useState<DigitalTwinState>({
    status: 'autonomous',
    purity: 98.4,
    activeThreads: 14,
    scheduledPosts: 82
  });
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 flex-1">
          <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient">Digital Twin</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">Your consciousness, replicated. The Twin is currently managing 14 threads in autonomous mode.</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={syncing}
          className="glass-card p-10 bg-blue-600/10 border-blue-400/40 border-2 shadow-[0_0_100px_rgba(59,130,246,0.2)] hover:scale-105 transition-all group shrink-0 rounded-[3rem]"
        >
           <div className="flex items-center gap-8">
              <div className={`p-6 bg-blue-500 text-white rounded-[2rem] shadow-2xl transition-all ${syncing ? 'animate-spin' : 'group-hover:rotate-12'}`}>
                 <RefreshCw size={48} />
              </div>
              <div className="text-left">
                 <p className="text-2xl font-black text-white uppercase tracking-tight">Sync Status</p>
                 <p className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] mt-2">{syncing ? 'Uploading Consciousness...' : '98.4% Purity Index'}</p>
              </div>
           </div>
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="glass-card p-12 space-y-10 relative overflow-hidden bg-white/[0.02]">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.5em]">Thread Capacity</h3>
              <Activity className="text-blue-400" size={24} />
           </div>
           <p className="text-7xl font-black text-white leading-none">14</p>
           <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Active Distributed Conversations</p>
        </div>
        <div className="glass-card p-12 space-y-10 relative overflow-hidden bg-white/[0.02]">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.5em]">Scheduled Reach</h3>
              <Globe className="text-blue-400" size={24} />
           </div>
           <p className="text-7xl font-black text-white leading-none">82</p>
           <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest">Autonomous Posts in Queue</p>
        </div>
        <div className="glass-card p-12 space-y-10 relative overflow-hidden bg-emerald-500/[0.03] border-emerald-500/20">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.5em]">Operating Tier</h3>
              <ShieldCheck className="text-emerald-400" size={24} />
           </div>
           <p className="text-7xl font-black text-white leading-none">S</p>
           <p className="text-emerald-400 font-bold uppercase text-[11px] tracking-widest">Absolute Sovereign Authority</p>
        </div>
      </div>
      <div className="glass-card p-16 bg-white/[0.02] border-white/10 relative shadow-2xl">
         <div className="flex items-center justify-between mb-16">
            <h3 className="text-2xl font-black text-white uppercase tracking-[0.6em] flex items-center gap-6">
               <Cpu size={36} className="text-blue-400" /> Consciousness Logs
            </h3>
            <span className="flex items-center gap-3 text-emerald-400 text-xs font-black uppercase tracking-widest bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Stream
            </span>
         </div>
         <div className="space-y-8">
            {[
              "Synthesized LinkedIn engagement for 4 high-authority threads.",
              "Adjusted X profile persona based on latest technical brain dump.",
              "Autonomous response generated for 12 Reddit inquiries.",
              "Knowledge Graph node expanded: 'Future of Agentic OS'."
            ].map((log, i) => (
              <div key={i} className="flex gap-8 items-center group cursor-pointer hover:translate-x-4 transition-all">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 border border-white/10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <CheckCircle2 size={24} />
                 </div>
                 <p className="text-2xl font-bold text-gray-100 leading-none group-hover:text-white transition-all">{log}</p>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};
