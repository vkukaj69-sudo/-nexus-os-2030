
import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Target, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Circle, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  BarChart3, 
  Globe, 
  Users, 
  DollarSign, 
  RefreshCw,
  Award,
  Activity,
  ChevronRight
} from 'lucide-react';
import { RoadmapMilestone, ToolType } from '../types';

export const RoadmapLab: React.FC<{ onNavigate?: (tool: ToolType) => void }> = ({ onNavigate }) => {
  const [p1Verified, setP1Verified] = useState(() => localStorage.getItem('nexus_phase_1_verified') === 'true');

  const milestones: RoadmapMilestone[] = [
    {
      id: '1',
      phase: 1,
      title: 'Genesis Phase',
      objective: 'Establish Brand DNA & Digital Soul Sync',
      targetReach: '1,000 Followers',
      targetRevenue: '$5k / Mo',
      status: p1Verified ? 'completed' : 'active',
      tasks: ['Synchronize Digital Soul Profile', 'Launch Vercel Production Node', 'Deploy Identity JSON-LD']
    },
    {
      id: '2',
      phase: 2,
      title: 'The Seedling Stage',
      objective: 'Automated Viral Distribution Blitz',
      targetReach: '10,000 Followers',
      targetRevenue: '$15k / Mo',
      status: p1Verified ? 'active' : 'locked',
      tasks: ['Activate Agentic Reply Guy Hub', 'Synthesize 12 High-Impact VEO Videos', 'Bridge Creator Accounts to Trends Lab']
    },
    {
      id: '3',
      phase: 3,
      title: 'Velocity Scaling',
      objective: 'Mass Personalization & Funnel Conversion',
      targetReach: '25,000 Followers',
      targetRevenue: '$40k / Mo',
      status: 'locked',
      tasks: ['Deploy 5 Multi-Channel Micro-Funnels', 'Enable Computer Use UI Automation', 'Integrate Real-Time Impact Simulations']
    },
    {
      id: '4',
      phase: 4,
      title: 'Digital Sovereignty',
      objective: 'Infinite Presence & Self-Sustaining Yield',
      targetReach: '50,000+ Followers',
      targetRevenue: '$84k+ / Mo',
      status: 'locked',
      tasks: ['Achieve 100% Digital Twin Purity', 'Full HSM-Isolated Governance', 'Launch Private Community Vault']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start gap-10">
        <div className="space-y-4">
           <h1 className="text-7xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Evolution Roadmap</h1>
           <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
             {p1Verified 
               ? "Phase 01 Manifested. Calibrating viral scaling for Phase 02."
               : "Scaling your North Star from zero to global sovereignty via agentic orchestration."
             }
           </p>
        </div>
        <div className="flex gap-6">
           <div className={`glass-card px-10 py-6 border-2 rounded-[2.5rem] transition-all duration-1000 ${p1Verified ? 'border-emerald-500/40 bg-emerald-600/10 shadow-[0_0_60px_rgba(16,185,129,0.3)]' : 'border-violet-500/40 bg-violet-600/10 shadow-[0_0_60px_rgba(139,92,246,0.3)] animate-pulse'}`}>
              <p className="text-[12px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Current Status</p>
              <p className={`text-4xl font-black ${p1Verified ? 'text-emerald-400' : 'text-violet-400'}`}>
                {p1Verified ? 'SEEDLING' : 'GENESIS'}
              </p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {milestones.map((m) => (
          <div 
            key={m.id}
            className={`glass-card p-10 border-2 transition-all duration-700 relative overflow-hidden flex flex-col justify-between min-h-[500px] rounded-[3rem] ${
              m.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/5 opacity-60' :
              m.status === 'active' ? 'border-violet-500/50 bg-violet-600/10 shadow-[0_0_100px_rgba(139,92,246,0.3)] scale-105 z-10' :
              'border-white/5 bg-white/[0.02] opacity-40 grayscale'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 ${m.status === 'active' ? 'bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-scan-line' : ''}`} />
            
            {m.status === 'active' && (
              <div className="absolute top-0 right-0 p-8 text-violet-400">
                <Zap size={32} className="animate-pulse" />
              </div>
            )}
            
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-black uppercase tracking-[0.5em] px-4 py-1.5 rounded-full border ${
                  m.status === 'completed' ? 'text-emerald-400 border-emerald-500/30' :
                  m.status === 'active' ? 'text-violet-400 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]' :
                  'text-gray-500 border-white/10'
                }`}>
                  Phase 0{m.phase}
                </span>
                {m.status === 'completed' ? <CheckCircle2 className="text-emerald-400" size={24} /> : m.status === 'locked' ? <Lock size={20} className="text-gray-700" /> : <Activity className="text-violet-400 animate-spin-slow" size={24} />}
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{m.title}</h3>
                <p className="text-sm text-gray-400 font-medium leading-relaxed italic">"{m.objective}"</p>
              </div>

              <div className="space-y-4 pt-6">
                <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Users size={12}/> Target Reach</span>
                  <span className="text-white">{m.targetReach}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><DollarSign size={12}/> Target Yield</span>
                  <span className="text-emerald-400">{m.targetRevenue}</span>
                </div>
              </div>

              <div className="space-y-3 pt-8">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Milestone Tasks</p>
                 {m.tasks.map((t, i) => (
                   <div key={i} className="flex items-start gap-3 text-[11px] font-bold text-gray-400 leading-tight">
                      {m.status === 'completed' ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> : <Circle size={14} className="text-gray-700 shrink-0" />}
                      <span>{t}</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="pt-10">
              {m.status === 'active' ? (
                <button 
                  onClick={() => onNavigate?.(ToolType.SOVEREIGN_CORE)}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3"
                >
                  Initiate Blitz <ArrowRight size={16} />
                </button>
              ) : m.status === 'completed' ? (
                <div className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                  Phase Manifested <Award size={16} />
                </div>
              ) : (
                <div className="w-full py-4 bg-white/5 text-gray-600 border border-white/10 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2">
                  <Lock size={12} /> Locked: Complete Phase 0{m.phase - 1}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-16 bg-gradient-to-br from-violet-600/10 via-transparent to-violet-600/5 border-2 border-white/10 rounded-[4rem] shadow-3xl flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
           <Sparkles size={300} />
        </div>
        <div className="space-y-6 max-w-2xl relative z-10">
           <h3 className="text-5xl font-black text-white uppercase tracking-tight">
             {p1Verified ? "Blitz Manifestation Active" : "Genesis Blitz Sync"}
           </h3>
           <p className="text-xl text-gray-400 font-medium leading-relaxed">
             {p1Verified 
               ? "Infrastructure is stable. Deploy your agentic mesh to conquer the attention territory."
               : "The Oracle is ready to manifest your viral blitz. All agentic nodes are on standby for Phase 01."
             }
           </p>
        </div>
        <button 
          onClick={() => onNavigate?.(ToolType.SOVEREIGN_CORE)}
          className="px-12 py-6 bg-violet-600 text-white hover:bg-violet-500 rounded-[2rem] font-black text-lg uppercase tracking-[0.4em] transition-all shadow-2xl border-2 border-white/20 group relative z-10"
        >
          Begin Orchestration <ChevronRight className="inline ml-2 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>
    </div>
  );
};
