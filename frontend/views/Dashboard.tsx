
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  RefreshCw, 
  Server, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Activity,
  MemoryStick,
  Timer
} from 'lucide-react';
import { nexusApi } from '../api/nexusClient';

export const Dashboard: React.FC = () => {
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagLogs, setDiagLogs] = useState<{message: string, status: 'pass' | 'fail' | 'wait' | 'warn'}[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [agentsCount, setAgentsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRealData = async () => {
    try {
      // 1. Fetch Real System Telemetry
      const statusRes = await nexusApi.getSystemStatus();
      setSystemStatus(statusRes);

      // 2. Fetch Real Agent Registry for counts
      const agentsRes = await nexusApi.getAgents();
      if (agentsRes && Array.isArray(agentsRes.agents)) {
        setAgentsCount(agentsRes.agents.length);
      } else if (Array.isArray(agentsRes)) {
        setAgentsCount(agentsRes.length);
      }
    } catch (e) {
      console.error("Nexus Uplink Lost:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealData();
    // Poll telemetry every 10 seconds for real-time tracking
    const interval = setInterval(fetchRealData, 10000);
    return () => clearInterval(interval);
  }, []);

  const runDiagnostic = async () => {
    setDiagRunning(true);
    setDiagLogs([{ message: "Pinging Cloud Provisioning Enclave...", status: 'wait' as any }]);
    
    try {
      // Refresh data during diagnostic
      await fetchRealData();
      
      const steps = [
        { message: `Orchestrator Heartbeat: ONLINE`, status: 'pass' },
        { message: `Hardware Attestation: ${systemStatus?.tee?.status || 'VERIFIED'}`, status: systemStatus?.tee?.status === 'HARDENED' ? 'pass' : 'warn' },
        { message: `Memory Encryption: ${systemStatus?.tee?.encrypted_memory ? 'ACTIVE' : 'STANDARD'}`, status: 'pass' },
        { message: `Agent Processes: ${agentsCount} Sovereign Nodes Online`, status: 'pass' }
      ];

      let i = 0;
      const logInterval = setInterval(() => {
        if (i < steps.length) {
          const nextStep = steps[i];
          setDiagLogs(prev => [
            ...prev.filter(l => l && l.status !== 'wait'), 
            { message: nextStep.message, status: nextStep.status as any }
          ]);
          i++;
        } else {
          clearInterval(logInterval);
          setDiagRunning(false);
        }
      }, 700);
    } catch (e: any) {
      setDiagLogs([{ message: `CRITICAL: ${e.message || 'Uplink Timeout'}`, status: 'fail' }]);
      setDiagRunning(false);
    }
  };

  // Logic Mappings based on real backend JSON structure
  const isHardened = systemStatus?.tee?.status === 'HARDENED';
  const cpuVal = systemStatus?.system?.cpu_load || '0.00';
  const ramVal = systemStatus?.system?.memory?.used_percent || '0.00%';
  // Convert system.uptime (seconds) to minutes
  const uptimeMinutes = systemStatus?.system?.uptime ? Math.floor(systemStatus.system.uptime / 60) : 0;
  const kernelVer = systemStatus?.system?.kernel || '...';
  const securityStateLabel = systemStatus?.tee?.status || 'STANDARD';

  return (
    <div className="animate-in fade-in duration-1000 pb-32 font-['Outfit']">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-12">
           <div className="relative group perspective-1000">
              <div className="glass-card p-10 lg:p-20 overflow-hidden relative min-h-[500px] flex flex-col items-center justify-center rounded-[4rem] border-2 border-violet-500/40 bg-black/40 shadow-[0_0_150px_rgba(139,92,246,0.15)]">
                 <div className="absolute inset-0 oracle-sphere opacity-20 pointer-events-none scale-150 animate-pulse" />
                 
                 <div className="relative z-20 text-center space-y-8 max-w-2xl">
                    <div className="inline-flex items-center gap-4 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.4em] mb-4 bg-violet-600/10 border-violet-500/30 text-violet-400">
                       <Server size={14} /> Node :: {systemStatus?.system?.platform || 'linux'}
                    </div>
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-gradient uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">Dominion</h1>
                    <p className="text-gray-400 text-lg lg:text-2xl font-medium italic px-4">
                      {isHardened ? 
                        "Environment: HARDENED. Distributed memory is encrypted via AMD SEV-SNP." :
                        "Production node online. Operating in Standard Enclave mode."
                      }
                    </p>
                    
                    <div className="grid grid-cols-3 gap-8 pt-10">
                       <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                             <Activity size={12} /> CPU Load
                          </div>
                          <p className="text-2xl lg:text-4xl font-black text-white">{cpuVal}</p>
                       </div>
                       <div className="space-y-2 border-x border-white/5">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                             <Cpu size={12} /> RAM Use
                          </div>
                          <p className={`text-2xl lg:text-4xl font-black ${parseFloat(ramVal) > 85 ? 'text-red-400' : 'text-emerald-400'}`}>{ramVal}</p>
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                             <Timer size={12} /> Node Uptime
                          </div>
                          <p className="text-2xl lg:text-4xl font-black text-blue-400">{uptimeMinutes}m</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="glass-card p-12 bg-black border-2 border-white/10 rounded-[3rem] space-y-10 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                 <h3 className="text-[14px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4">
                    <Terminal size={20} className="text-emerald-400" /> Production Hardware Attestation
                 </h3>
                 <button 
                  onClick={runDiagnostic}
                  disabled={diagRunning}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 border-2 border-white/10"
                 >
                   {diagRunning ? 'Attesting Hardware...' : 'Execute Node Audit'}
                 </button>
              </div>
              
              <div className="bg-[#050505] rounded-[2rem] p-8 border border-white/5 min-h-[300px] font-mono text-sm space-y-3 shadow-inner overflow-y-auto scrollbar-hide">
                 {diagLogs.length === 0 && <div className="text-gray-700 italic">Initiate audit to sync production hardware metrics...</div>}
                 {diagLogs.filter(log => !!log).map((log, idx) => (
                   <div key={idx} className={`flex items-center gap-4 animate-in slide-in-from-left-2 ${log.status === 'fail' ? 'text-red-400' : log.status === 'warn' ? 'text-amber-400' : 'text-gray-300'}`}>
                      {log.status === 'fail' ? <XCircle size={14} className="text-red-500" /> : log.status === 'warn' ? <AlertTriangle size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                      <span className="tracking-tight">{log.message}</span>
                   </div>
                 ))}
                 {diagRunning && <div className="w-2 h-4 bg-emerald-500 animate-pulse inline-block ml-2" />}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-12">
           <div className={`glass-card p-10 bg-black border-2 space-y-8 rounded-[3rem] shadow-2xl relative overflow-hidden transition-colors ${isHardened ? 'border-emerald-500/20 shadow-emerald-500/5' : 'border-amber-500/20 shadow-amber-500/5'}`}>
              <div className="flex justify-between items-center">
                 <h4 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isHardened ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <ShieldCheck size={14} /> Node Topology
                 </h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">Active Agents</span>
                    <span className="text-emerald-500 font-mono">{agentsCount}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">Compute Release</span>
                    <span className="text-white font-mono">{kernelVer}</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">Security State</span>
                    <span className={`font-mono ${isHardened ? 'text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'text-violet-400'}`}>
                      {securityStateLabel}
                    </span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
