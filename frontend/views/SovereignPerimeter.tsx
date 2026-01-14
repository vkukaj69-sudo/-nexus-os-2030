
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle,
  Lock,
  Server,
  Activity
} from 'lucide-react';
import { nexusApi } from '../api/nexusClient';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const SovereignPerimeter: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showScuttleConfirm, setShowScuttleConfirm] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Standardized to getSystemStatus
      const status = await nexusApi.getSystemStatus();
      
      if (status && status.success !== false) {
        setSystemStatus(status);
        
        const newEvent = {
          id: Date.now(),
          timestamp: Date.now(),
          level: status.teeActive ? 'info' : 'warning',
          message: `Handshake: ${status.status || 'OK'}. Hardware: ${status.hardware || 'VIRTUAL'}. Memory Encrypted: ${status.memoryEncrypted ? 'YES' : 'NO'}`,
          module: 'Vault_Sentinel'
        };
        setEvents(prev => [newEvent, ...prev].slice(0, 15));
      } else {
        throw new Error(status?.error || 'Empty Node Heartbeat');
      }
    } catch (e: any) {
      setEvents(prev => [{
        id: Date.now(),
        timestamp: Date.now(),
        level: 'critical',
        message: `CONNECTION_LOSS: ${e.message || 'Production node unreachable'}. Check uplink status.`,
        module: 'Network'
      }, ...prev].slice(0, 15));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleScuttle = () => {
    setIsRestoring(true);
    setTimeout(() => {
      nexusApi.logout();
      window.location.href = '/';
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-32 font-['Outfit']">
      <ConfirmationModal
        isOpen={showScuttleConfirm}
        onClose={() => setShowScuttleConfirm(false)}
        onConfirm={handleScuttle}
        title="DANGER: TOTAL NODE SCUTTLE"
        message="This will immediately purge your server-side session, revoke your JWT, and wipe local DNA signatures. Access to the hardware enclave will be severed."
        confirmLabel="Initiate Purge"
      />

      {isRestoring && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center space-y-8">
           <RotateCcw className="text-red-500 w-32 h-32 animate-spin" />
           <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter">NODE PURGE IN PROGRESS</h2>
              <p className="text-gray-500 uppercase tracking-widest font-bold">Wiping transient memory and revoking keys...</p>
           </div>
        </div>
      )}

      <header className="flex flex-col xl:flex-row justify-between items-start gap-12 border-b border-white/5 pb-12">
        <div className="space-y-6 flex-1">
          <div className={`inline-flex items-center gap-4 px-6 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.5em] transition-all duration-500 ${systemStatus?.teeActive ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'bg-red-600/10 border-red-500/30 text-red-400'}`}>
             {systemStatus?.teeActive ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} 
             {systemStatus?.teeActive ? 'HARDENED HARDWARE ISOLATION' : 'UNHARDENED ENVIRONMENT'}
          </div>
          <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Perimeter</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
            Real-time attestation for <span className="text-white font-mono">api.nexus-os.ai</span>. Platform: <span className={systemStatus?.teeActive ? 'text-emerald-400' : 'text-amber-400'}>{systemStatus?.hardware || 'Awaiting Sync...'}</span>.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="glass-card p-12 bg-black border-2 border-white/10 shadow-3xl overflow-hidden relative rounded-[4rem] min-h-[600px] flex flex-col">
             <div className="flex items-center justify-between border-b border-white/5 pb-8 mb-8">
                <h3 className="text-[16px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-6">
                   <Terminal size={32} className="text-blue-400" /> Vault Internal Status
                </h3>
                <button 
                  onClick={fetchStatus}
                  className="px-8 py-4 bg-white/5 hover:bg-blue-600 text-white border border-white/10 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all"
                >
                  <RefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                  Refresh Attestation
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 px-4 font-mono">
                {events.length === 0 && <p className="text-gray-700 italic">Listening for vault pulse...</p>}
                {events.filter(e => !!e).map((event) => (
                  <div key={event.id} className={`text-xs flex gap-4 animate-in slide-in-from-left-2 ${event.level === 'critical' ? 'text-red-400' : event.level === 'warning' ? 'text-amber-400' : 'text-gray-400'}`}>
                    <span className="text-blue-500 shrink-0">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-emerald-500 font-bold shrink-0">{event.module}:</span>
                    <span className="text-white">{event.message}</span>
                  </div>
                ))}
                {systemStatus?.attestation && (
                  <div className="pt-8 border-t border-white/5 opacity-40">
                    <p className="uppercase tracking-widest text-[9px] mb-2 font-black">Node Attestation Hash</p>
                    <p className="break-all text-[10px] leading-relaxed">{systemStatus.attestation}</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="p-10 glass-card bg-black border-2 border-white/10 rounded-[3rem] space-y-8">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enclave Status</h4>
              <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Node Status</span>
                    <span className="text-emerald-400 font-mono text-sm">{systemStatus?.status || 'SYNCING...'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">AMD SEV-SNP</span>
                    <span className={systemStatus?.teeActive ? 'text-emerald-400' : 'text-red-400'}>{systemStatus?.teeActive ? 'ACTIVE' : 'INACTIVE'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Memory Encrypted</span>
                    <span className={systemStatus?.memoryEncrypted ? 'text-emerald-400' : 'text-red-400'}>{systemStatus?.memoryEncrypted ? 'YES' : 'NO'}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Uptime</span>
                    <span className="text-white font-mono text-xs">{systemStatus?.uptime ? `${Math.floor(systemStatus.uptime / 60)}m` : '...'}</span>
                 </div>
              </div>
           </div>

           <div className="p-10 glass-card bg-red-600/5 border-2 border-red-500/20 rounded-[3rem] space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
              <div className="flex items-center gap-4 text-red-400">
                 <AlertTriangle size={24} />
                 <h4 className="text-[12px] font-black uppercase tracking-widest">Fail-Safe Procedure</h4>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Destroy session link and revoke JWT authorization immediately. Access will be permanently severed from this device.
              </p>
              <button 
                onClick={() => setShowScuttleConfirm(true)}
                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95"
              >
                 Initialize Scuttle
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
