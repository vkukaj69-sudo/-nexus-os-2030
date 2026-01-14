
import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Globe, ArrowUpRight, Sparkles, RefreshCw, ExternalLink, ShieldCheck, Boxes, DollarSign, PlusCircle, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AgentActivity, ViralPulseItem, ToolType } from '../types';
import { getViralPulse } from '../geminiService';
import { nexusApi } from '../api/nexusClient';

export const AgentHub: React.FC<{ onNavigate?: (tool: ToolType) => void, activeWorkspaceId?: string }> = ({ onNavigate, activeWorkspaceId = '1' }) => {
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [pulse, setPulse] = useState<ViralPulseItem[]>([]);
  const [loadingPulse, setLoadingPulse] = useState(false);

  const fetchAgentStates = async () => {
    try {
      const data = await nexusApi.getAgents();
      // data from production database
      setAgents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to sync agent registry:", e);
    }
  };

  useEffect(() => {
    fetchAgentStates();
    const interval = setInterval(fetchAgentStates, 5000); // 5s poll for real-time feel
    fetchPulse();
    return () => clearInterval(interval);
  }, []);

  const fetchPulse = async () => {
    setLoadingPulse(true);
    try {
      const data = await getViralPulse("Autonomous AI & Sovereign Wealth 2028");
      setPulse(data);
    } catch (e) { console.error(e); }
    finally { setLoadingPulse(false); }
  };

  const handleProvision = async () => {
    setIsProvisioning(true);
    try {
      await nexusApi.provisionAgent({ specialty: 'Foundation Intelligence' });
      setProvisionSuccess(true);
      setTimeout(() => setProvisionSuccess(false), 3000);
      fetchAgentStates();
    } catch (e) {
      console.error("Provisioning Deviation:", e);
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="space-y-20 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start gap-12">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Boxes className="text-blue-400" size={20} />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em]">
              Agentic Mesh Status: {agents.length > 0 ? 'SYNCHRONIZED' : 'IDLE'}
            </span>
          </div>
          <h1 className="text-7xl font-black text-white tracking-tighter leading-none shadow-blue-500/20 drop-shadow-2xl text-gradient uppercase">Agent Registry</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
            Real-time process monitoring for your independent node workers. Direct production access.
          </p>
        </div>
        
        <div className="flex gap-4 shrink-0">
           <div className="glass-card p-8 bg-blue-600/5 border border-blue-500/30 flex items-center gap-6 rounded-[2.5rem]">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl">
                 <Activity size={24} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Processes</p>
                 <p className="text-2xl font-black text-white">{agents.length}</p>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {agents.map(agent => (
          <div key={agent.id} className={`glass-card p-12 border-white/20 relative overflow-hidden group hover:border-blue-400/60 transition-all duration-500 shadow-2xl ${agent.id.includes('sentinel') || agent.specialty?.includes('Sentinel') ? 'bg-blue-600/[0.08] border-blue-500/50' : 'bg-white/[0.03]'}`}>
            <div className="flex justify-between items-start mb-12">
              <div className={`p-5 rounded-3xl group-hover:scale-110 transition-transform border shadow-xl ${agent.id.includes('sentinel') || agent.specialty?.includes('Sentinel') ? 'bg-emerald-600/30 text-emerald-200 border-emerald-400/40' : 'bg-blue-600/30 text-blue-200 border-blue-400/40'}`}>
                {agent.id.includes('sentinel') || agent.specialty?.includes('Sentinel') ? <ShieldCheck size={40} /> : <Cpu size={40} />}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[13px] font-black uppercase px-4 py-2 rounded-full border-2 ${agent.status === 'active' ? 'bg-emerald-600/30 text-emerald-300 border-emerald-400/50 animate-pulse' : 'bg-white/10 text-gray-400 border-white/20'}`}>
                  {agent.status || 'idle'}
                </span>
              </div>
            </div>
            <h4 className="text-white font-black text-2xl uppercase tracking-[0.2em] mb-2 drop-shadow-lg">{agent.name}</h4>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-6">Process ID: {agent.id}</p>
            <p className="text-gray-200 text-xl font-bold leading-relaxed mb-12 min-h-[80px]">
              {agent.task || agent.current_task || 'Standby for Task Allocation.'}
            </p>
            
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${agent.id.includes('sentinel') ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                 style={{width: `${agent.progress ?? 100}%`}} 
               />
            </div>
          </div>
        ))}
        
        <button 
          onClick={handleProvision}
          disabled={isProvisioning}
          className={`glass-card border-4 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center group rounded-[3rem] min-h-[300px] ${isProvisioning ? 'border-blue-500/40 bg-blue-600/[0.03]' : provisionSuccess ? 'border-emerald-500/40 bg-emerald-600/[0.03]' : 'border-white/5 hover:border-blue-500/40 hover:bg-blue-600/[0.03]'}`}
        >
           {isProvisioning ? (
             <Loader2 className="text-blue-400 animate-spin mb-4" size={48} />
           ) : provisionSuccess ? (
             <CheckCircle2 className="text-emerald-400 animate-bounce mb-4" size={48} />
           ) : (
             <PlusCircle className="text-gray-700 group-hover:text-blue-400 group-hover:scale-125 transition-all mb-4" size={48} />
           )}
           <p className={`text-[14px] font-black uppercase tracking-[0.4em] ${isProvisioning ? 'text-blue-400' : provisionSuccess ? 'text-emerald-400' : 'text-gray-600 group-hover:text-white'}`}>
             {isProvisioning ? 'Spawning Worker...' : provisionSuccess ? 'Node Provisioned' : 'Spawn Worker Node'}
           </p>
           <p className="text-[9px] font-black text-gray-700 group-hover:text-gray-400 uppercase tracking-widest mt-2">GCP Compute Enclave</p>
        </button>
      </div>

      <div className="glass-card p-16 bg-white/[0.02] border-white/15 relative shadow-[0_0_150px_rgba(0,0,0,0.8)] border-2">
        <div className="flex items-center justify-between mb-16 border-b border-white/10 pb-12">
          <h3 className="text-[18px] font-black text-white uppercase tracking-[0.8em] flex items-center gap-5">
             <Activity size={36} className="text-blue-500" /> Real-world Hype Pulse
          </h3>
          <button onClick={fetchPulse} disabled={loadingPulse} className="p-5 bg-white/10 rounded-2xl hover:bg-white/20 hover:scale-110 transition-all border border-white/20 shadow-2xl group">
             <RefreshCw size={28} className={`${loadingPulse ? 'animate-spin' : ''} text-white group-hover:text-blue-400 transition-colors`} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
           {loadingPulse ? (
             Array(5).fill(0).map((_, i) => <div key={i} className="h-80 bg-white/5 rounded-[3rem] animate-pulse border border-white/10" />)
           ) : (
             pulse.map((item, i) => (
               <div key={i} className="bg-[#080808] border-2 border-white/10 rounded-[3rem] p-10 hover:border-blue-500/60 transition-all flex flex-col justify-between shadow-[0_30px_60px_rgba(0,0,0,0.5)] group relative overflow-hidden h-full min-h-[400px]">
                  <div>
                    <div className="flex justify-between items-start mb-8">
                      <span className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em] bg-white/5 px-3 py-1 rounded-lg">{item.source}</span>
                      <ArrowUpRight size={24} className="text-emerald-400 opacity-70 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    <h4 className="text-white text-2xl font-black leading-[1.1] mb-8 tracking-tight group-hover:text-blue-400 transition-colors">{item.topic}</h4>
                  </div>
                  <div className="space-y-8">
                    <p className="text-base text-gray-100 italic font-black leading-relaxed bg-white/[0.08] p-6 rounded-[2rem] border border-white/10 shadow-inner">"{item.suggestedAngle}"</p>
                    <a href={item.url} target="_blank" className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-3 hover:text-white transition-all group-hover:translate-x-2">
                       Verify Intelligence <ExternalLink size={16} />
                    </a>
                  </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};
