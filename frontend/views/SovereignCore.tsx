
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Terminal, 
  Activity, 
  RefreshCw,
  Atom,
  Target,
  Bot,
  DollarSign,
  TrendingUp,
  FlaskConical,
  Sparkles,
  Command,
  Rocket,
  ArrowRight,
  ChevronRight,
  Cpu,
  Globe,
  DollarSign as Money
} from 'lucide-react';
import { NeuralThought, StripeStatus } from '../types';
import { orchestrateGoal, generateGenesisBlitzPlan } from '../geminiService';
import { useSoul } from '../context/SoulContext';

export const SovereignCore: React.FC = () => {
  const { soul } = useSoul();
  const [goal, setGoal] = useState('');
  const [blitzMode, setBlitzMode] = useState(false);
  const [blitzPlan, setBlitzPlan] = useState<any>(null);
  const [thoughts, setThoughts] = useState<NeuralThought[]>([
    { id: '1', timestamp: Date.now() - 5000, agent: 'Oracle_Node', reasoning: 'Interpreting the niche vectors...', action: 'Synchronizing agentic threads with the Digital Soul profile.', status: 'completed' },
  ]);
  const [loading, setLoading] = useState(false);
  const [stripeStatus] = useState<StripeStatus>(() => {
    const saved = localStorage.getItem('nexus_stripe_status');
    return saved ? JSON.parse(saved) : { isConnected: false, mode: 'test', currentArr: 0 };
  });

  const handleRunOrchestration = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    
    try {
      if (goal.toLowerCase().includes('blitz') || goal.toLowerCase().includes('viral') || goal.toLowerCase().includes('money')) {
        setBlitzMode(true);
        const plan = await generateGenesisBlitzPlan(goal, soul);
        setBlitzPlan(plan);
        setThoughts(prev => [{
           id: Math.random().toString(),
           timestamp: Date.now(),
           agent: 'Oracle_Blitz_Core',
           reasoning: 'Initiating Genesis Blitz Protocol for ' + goal,
           action: 'Synthesizing Niche Arbitrage & Mesh Configuration.',
           status: 'completed'
        }, ...prev]);
      } else {
        const thought = await orchestrateGoal(goal, soul);
        setThoughts(prev => [{ ...thought, agent: 'Oracle_Primary' }, ...prev]);
      }
      setGoal('');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setLoading(false), 1500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-20 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="space-y-6 flex-1 text-center md:text-left">
           <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-[0.5em] mb-4">
              <Sparkles size={16} /> Central Intelligence Hub
           </div>
           <h1 className="text-9xl font-black text-white tracking-tighter leading-[0.8] text-gradient uppercase">The Oracle</h1>
           <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
             {blitzMode ? 'Genesis Blitz Protocol Active. High-yield manifestation in progress.' : 'Divining the paths to infinite presence. Command the Agentic Mesh from the source.'}
           </p>
        </div>
        
        <div className="hidden lg:flex gap-4">
          <div className={`glass-card p-12 border-2 shadow-2xl flex items-center gap-10 rounded-[3rem] transition-all duration-1000 ${blitzMode ? 'bg-violet-600/20 border-violet-400 shadow-[0_0_80px_rgba(139,92,246,0.4)]' : 'bg-black/40 border-white/10'}`}>
             <div className="p-8 bg-violet-600 text-white rounded-[2.5rem] shadow-[0_0_50px_rgba(139,92,246,0.4)] animate-pulse">
                {blitzMode ? <Rocket size={56} /> : <Atom size={56} />}
             </div>
             <div>
                <p className="text-4xl font-black text-white leading-none">{blitzMode ? 'BLITZING' : 'ACTIVE'}</p>
                <p className="text-[11px] font-black text-violet-400 uppercase tracking-[0.6em] mt-3">{blitzMode ? 'Viral Manifestation' : 'Neural Synapse'}</p>
             </div>
          </div>
        </div>
      </header>

      {/* Divination Input */}
      <div className="flex justify-center pt-10">
         <div className="glass-card p-4 md:p-8 bg-white/[0.03] border-white/10 relative overflow-hidden shadow-3xl rounded-[4rem] max-w-5xl w-full">
            <div className="flex flex-col md:flex-row gap-6">
               <div className="relative flex-1">
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 text-violet-400">
                     <Command size={28} />
                  </div>
                  <input 
                    value={goal} onChange={(e) => setGoal(e.target.value)}
                    placeholder="Speak your intent to the Oracle (e.g. 'Initiate Genesis Blitz for AI SaaS')..."
                    className="w-full bg-black/40 border-2 border-white/5 rounded-[3rem] pl-20 pr-12 py-8 text-2xl text-white outline-none focus:ring-4 focus:ring-violet-500/30 focus:border-violet-400 transition-all font-bold placeholder:text-gray-800"
                    onKeyDown={(e) => e.key === 'Enter' && handleRunOrchestration()}
                  />
               </div>
               <button 
                  onClick={handleRunOrchestration} disabled={loading}
                  className="px-12 py-8 bg-violet-600 hover:bg-violet-500 text-white rounded-[3rem] font-black text-lg uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-6 shadow-[0_0_50px_rgba(139,92,246,0.6)] group shrink-0"
               >
                  {loading ? <RefreshCw className="animate-spin" size={32} /> : blitzMode ? <Rocket size={32} /> : <Zap size={32} />}
                  {blitzMode ? 'Blitz Active' : 'Manifest'}
               </button>
            </div>
         </div>
      </div>

      {blitzPlan && (
        <div className="animate-in slide-in-from-top-12 duration-1000 space-y-12">
          <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-8">
             <Rocket size={32} className="text-violet-400 animate-bounce" />
             <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Genesis Blitz Plan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass-card p-12 space-y-6 bg-violet-600/5 border-violet-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Globe size={100} /></div>
                <h4 className="text-[11px] font-black text-violet-400 uppercase tracking-[0.4em]">Arbitrage Strategy</h4>
                <p className="text-2xl font-black text-white leading-tight">{blitzPlan.arbitrage}</p>
             </div>
             <div className="glass-card p-12 space-y-6 bg-emerald-600/5 border-emerald-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Money size={100} /></div>
                <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em]">Yield Forecast</h4>
                <p className="text-2xl font-black text-white leading-tight">{blitzPlan.yieldForecast}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             <div className="glass-card p-12 space-y-8 bg-black/40 border-white/10">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] flex items-center gap-3">
                   <Activity size={18} /> Mesh Configuration
                </h4>
                <div className="space-y-4">
                   {blitzPlan.meshConfig.map((step: string, i: number) => (
                     <div key={i} className="flex items-center gap-6 p-6 bg-white/5 rounded-2xl border border-white/5 group hover:border-violet-500/40 transition-all">
                        <span className="text-2xl font-black text-violet-400/30">0{i+1}</span>
                        <p className="text-lg font-bold text-gray-200">{step}</p>
                     </div>
                   ))}
                </div>
             </div>
             <div className="glass-card p-12 space-y-8 bg-black/40 border-white/10">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.5em] flex items-center gap-3">
                   <Zap size={18} /> Viral Hook Synthesis
                </h4>
                <div className="space-y-6">
                   {blitzPlan.viralHooks.map((hook: string, i: number) => (
                     <div key={i} className="p-8 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-3xl italic text-xl font-medium text-white shadow-inner relative group hover:border-violet-500/40 transition-all">
                        <div className="absolute top-4 right-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"><Sparkles size={16}/></div>
                        "{hook}"
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
         <div className="lg:col-span-2 space-y-16">
            <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-8">
               <Terminal size={24} className="text-gray-400" />
               <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.8em]">Manifestation Logs</h3>
            </div>
            
            <div className="space-y-20">
               {thoughts.map((thought, i) => (
                 <div key={thought.id} className="flex gap-12 group animate-in slide-in-from-bottom-8">
                    <div className="w-24 h-24 rounded-[2.5rem] border-2 bg-black border-violet-500/30 flex items-center justify-center shadow-2xl shrink-0 group-hover:border-violet-500 transition-all duration-700">
                       <Bot size={40} className="text-violet-400" />
                    </div>
                    <div className="flex-1 space-y-6 pt-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] font-black text-violet-400 uppercase tracking-[0.5em]">{thought.agent}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">[{new Date(thought.timestamp).toLocaleTimeString()}]</span>
                       </div>
                       <p className="text-4xl text-white font-black leading-tight tracking-tighter">"{thought.reasoning}"</p>
                       <div className="p-10 glass-card bg-white/[0.02] rounded-[3rem] border border-white/10">
                          <p className="text-xl text-gray-400 font-medium leading-relaxed italic">The Oracle has decreed: {thought.action}</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="space-y-12">
            <div className="glass-card p-12 space-y-12 border-emerald-500/20 bg-emerald-500/[0.02] shadow-3xl group">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.6em]">System Health</h3>
                  <ShieldCheck size={32} className="text-emerald-400 group-hover:scale-110 transition-transform" />
               </div>
               <div className="space-y-10">
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sovereignty Level</p>
                     <p className="text-6xl font-black text-white">99.9%</p>
                  </div>
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Digital Purity</p>
                     <p className="text-6xl font-black text-white">MAX</p>
                  </div>
               </div>
            </div>

            <div className="glass-card p-12 bg-white/[0.01] border-white/10 space-y-8">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.5em]">Active Channels</h3>
               <div className="space-y-4">
                  {['Twitter_Link_01', 'Reddit_Scryer', 'LinkedIn_Twin'].map(channel => (
                    <div key={channel} className="flex justify-between items-center p-5 bg-black/40 rounded-2xl border border-white/5">
                       <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{channel}</span>
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
