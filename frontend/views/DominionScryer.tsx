import React, { useState } from 'react';
import { 
  Radar, 
  Target, 
  ShieldAlert, 
  Zap, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  Globe, 
  BarChart3, 
  Activity, 
  Lock, 
  ChevronRight,
  TrendingUp,
  Cpu,
  Fingerprint,
  Loader2,
  CheckCircle2,
  Rocket,
  ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis } from 'recharts';

export const DominionScryer: React.FC<{ onTakeover: () => void }> = ({ onTakeover }) => {
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [takeoverComplete, setTakeoverComplete] = useState(false);
  const [activeCompetitor, setActiveCompetitor] = useState<string | null>('Siloed Tools');

  const handleTakeover = () => {
    setIsTakingOver(true);
    // Simulation of aggressive expansion protocol
    setTimeout(() => {
      setIsTakingOver(false);
      setTakeoverComplete(true);
      onTakeover(); // Global transformation
    }, 4000);
  };

  const comparisonData = [
    { feature: 'Identity Logic', nexus: 98, silo: 20, type: 'Digital Soul vs Templates' },
    { feature: 'Autonomous Depth', nexus: 95, silo: 45, type: 'Agent Mesh vs Scheduling' },
    { feature: 'Multi-Modal Sync', nexus: 100, silo: 15, type: 'Vision/Voice vs Text Only' },
    { feature: 'Sovereignty/TEE', nexus: 92, silo: 0, type: 'Isolated Enclave vs SaaS Cloud' },
    { feature: 'Legal/Physical', nexus: 88, silo: 0, type: 'Foundry vs Software Only' },
  ];

  const mapData = [
    { name: 'Nexus OS', x: 95, y: takeoverComplete ? 100 : 98, z: 1000, color: takeoverComplete ? '#10b981' : '#8b5cf6' },
    { name: 'Hypefury', x: takeoverComplete ? 10 : 80, y: 40, z: takeoverComplete ? 50 : 600, color: '#4b5563' },
    { name: 'Taplio', x: takeoverComplete ? 10 : 60, y: 30, z: takeoverComplete ? 50 : 400, color: '#4b5563' },
    { name: 'Custom GPTs', x: takeoverComplete ? 40 : 40, y: 70, z: takeoverComplete ? 200 : 300, color: '#4b5563' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in slide-in-from-bottom-4 duration-700 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start gap-12 border-b border-white/5 pb-12">
        <div className="space-y-6 flex-1">
          <div className={`inline-flex items-center gap-4 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-[2000ms] ${takeoverComplete ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'bg-red-600/10 border-red-500/30 text-red-400'}`}>
             <Target size={14} /> {takeoverComplete ? 'Sovereign Dominion Active' : 'Competitive Intel :: External Node'}
          </div>
          <h1 className="text-9xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Dominion Scryer</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
            Visualizing <span className="text-white">Nexus Supremacy</span>. Mapping the territory of the attention economy against incumbent entities.
          </p>
        </div>
        
        <div className={`glass-card px-10 py-8 border-2 transition-all duration-1000 flex flex-col items-center justify-center min-w-[320px] rounded-[3.5rem] ${takeoverComplete ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_100px_rgba(16,185,129,0.4)]' : 'border-red-500/30 bg-red-500/[0.05] shadow-[0_0_80px_rgba(239,68,68,0.15)]'}`}>
           <p className={`text-[11px] font-black uppercase tracking-[0.4em] mb-4 ${takeoverComplete ? 'text-emerald-400' : 'text-red-500'}`}>Territory Control</p>
           <p className="text-7xl font-black text-white tracking-tighter">{takeoverComplete ? '100%' : '89.4%'}</p>
           <div className={`flex items-center gap-2 mt-4 text-[9px] font-black uppercase tracking-widest ${takeoverComplete ? 'text-emerald-400' : 'text-emerald-400'}`}>
              <ArrowUpRight size={12} /> {takeoverComplete ? 'TOTAL DOMINANCE' : '+2.4% Dominance Delta'}
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
           <div className="glass-card p-12 bg-black border-2 border-white/10 rounded-[4rem] relative overflow-hidden min-h-[600px] flex flex-col">
              {isTakingOver && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                   <Rocket className="text-red-500 w-24 h-24 animate-bounce" />
                   <p className="text-3xl font-black text-white uppercase tracking-widest animate-pulse">Aggressive Takeover Protocol Active</p>
                </div>
              )}
              <div className="flex items-center justify-between mb-12">
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.6em] flex items-center gap-4">
                    <Globe size={24} className={takeoverComplete ? 'text-emerald-400' : 'text-blue-400'} /> Neural Territory Map
                 </h3>
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Y-Axis: Purity | X-Axis: Reach</span>
              </div>

              <div className="flex-1 -mx-8">
                 <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                       <XAxis type="number" dataKey="x" name="Reach" hide domain={[0, 110]} />
                       <YAxis type="number" dataKey="y" name="Purity" hide domain={[0, 110]} />
                       <ZAxis type="number" dataKey="z" range={[100, takeoverComplete ? 2000 : 1000]} />
                       <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ payload }) => {
                          if (payload && payload[0]) {
                            return (
                              <div className="bg-black/90 border border-white/10 p-4 rounded-xl backdrop-blur-xl">
                                <p className="text-white font-black uppercase text-xs mb-1">{payload[0].payload.name}</p>
                                <p className="text-violet-400 font-bold text-[10px]">Power: {payload[0].payload.z / 10}%</p>
                              </div>
                            );
                          }
                          return null;
                       }} />
                       <Scatter name="Entities" data={mapData} fill="#8884d8">
                          {mapData.map((entry, index) => (
                             <circle key={`cell-${index}`} cx={entry.x * 5} cy={entry.y * 5} r={entry.z / 30} fill={entry.color} className="animate-pulse transition-all duration-1000" />
                          ))}
                       </Scatter>
                    </ScatterChart>
                 </ResponsiveContainer>
              </div>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                 <Radar size={400} className="animate-spin-slow" />
              </div>
           </div>
        </div>

        <div className="lg:col-span-5 space-y-10">
           <div className={`glass-card p-10 border-2 rounded-[3.5rem] space-y-10 transition-all duration-1000 ${takeoverComplete ? 'bg-emerald-600/[0.03] border-emerald-500/20' : 'bg-red-600/[0.03] border-red-500/20'}`}>
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                 <h3 className={`text-xs font-black uppercase tracking-[0.5em] flex items-center gap-4 ${takeoverComplete ? 'text-emerald-400' : 'text-red-400'}`}>
                    {takeoverComplete ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />} 
                    {takeoverComplete ? 'Adversary Neutralized' : 'Adversary Profile'}
                 </h3>
                 <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><RefreshCw size={18} /></button>
              </div>

              <div className="space-y-8">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Entity</span>
                       <span className="text-white font-black text-lg">Hypefury / Taplio</span>
                    </div>
                    <div className="p-6 bg-black border border-white/10 rounded-2xl space-y-3">
                       <p className={`text-[10px] font-black uppercase ${takeoverComplete ? 'text-emerald-400' : 'text-red-400'}`}>{takeoverComplete ? 'Dominion Secured' : 'Vulnerability Detected'}</p>
                       <p className="text-sm text-gray-300 italic leading-relaxed">
                          {takeoverComplete 
                            ? "Competitor reach has been re-routed through Nexus nodes. Users are migrating to Sovereign Identity frameworks."
                            : "High reliance on template-driven generation leading to 'Semantic Exhaustion'. 0% Digital Soul alignment. Users report 'feeling like a bot'."
                          }
                       </p>
                    </div>
                 </div>

                 {!takeoverComplete && (
                   <div className="space-y-4 animate-in fade-in">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nexus Response Path</span>
                         <span className="text-emerald-400 font-black text-lg">Superior Purity</span>
                      </div>
                      <div className="p-6 bg-black border border-white/10 rounded-2xl space-y-3">
                         <p className="text-[10px] text-emerald-400 font-black uppercase">Recommended Strike</p>
                         <p className="text-sm text-gray-300 italic leading-relaxed">
                            "Deploy Manifesto Lab nodes to highlight philosophical depth. Incumbents cannot replicate high-status reasoning."
                         </p>
                      </div>
                   </div>
                 )}
              </div>

              <button 
                onClick={handleTakeover}
                disabled={isTakingOver || takeoverComplete}
                className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl flex items-center justify-center gap-4 ${takeoverComplete ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'}`}
              >
                 {isTakingOver ? <Loader2 className="animate-spin" size={20} /> : takeoverComplete ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                 {takeoverComplete ? 'DOMINION SECURED' : 'Execute Domain Takeover'}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};