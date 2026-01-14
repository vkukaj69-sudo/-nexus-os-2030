
import React, { useState } from 'react';
import { Bot, ShieldCheck, Key, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { nexusApi } from '../api/nexusClient';

export const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleStoreKey = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      await nexusApi.storeKey(apiKey);
      setStatus({ type: 'success', message: 'Sovereign Key provisioned and locked in Vault.' });
      setApiKey('');
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Key provision failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-32 font-['Outfit']">
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase text-gradient">Vault Settings</h1>
        <p className="text-gray-400 text-xl font-bold">Node configuration and security status.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* BYOK SYSTEM: Sovereign Key Provision */}
        <div className="glass-card p-10 border-violet-500/30 bg-violet-600/[0.03] space-y-8 relative overflow-hidden rounded-[3rem]">
           <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.5em] flex items-center gap-4">
                 <Key size={24} className="text-violet-400" /> Sovereign Key Provision
              </h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">TEE SECURED</span>
              </div>
           </div>

           <div className="space-y-6">
              <p className="text-sm text-gray-400 leading-relaxed font-medium italic">
                Pro and Agency nodes require your personal <span className="text-white font-bold">Gemini API Key</span>. 
                This allows for unlimited 4K video synthesis and high-bandwidth neural link telepresence. 
                Keys are stored in your private hardware enclave and never shared.
              </p>
              
              <div className="space-y-4">
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Gemini API Key here..."
                  className="w-full bg-black border-2 border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-violet-500 transition-all font-mono"
                />
                <button 
                  onClick={handleStoreKey}
                  disabled={loading || !apiKey.trim()}
                  className="w-full py-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl flex items-center justify-center gap-3 border-2 border-white/10"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {loading ? 'Provisioning Node...' : 'Lock Key in Vault'}
                </button>
              </div>

              {status && (
                <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 animate-in zoom-in-95 ${
                  status.type === 'success' ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'bg-red-600/10 border-red-500/30 text-red-400'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                  <p className="text-sm font-bold uppercase tracking-tight">{status.message}</p>
                </div>
              )}
           </div>
        </div>

        <div className="glass-card p-10 border-white/5 bg-white/[0.02] space-y-8 relative overflow-hidden rounded-[3rem]">
           <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.5em] flex items-center gap-4">
                 <ShieldCheck size={24} className="text-gray-600" /> Infrastructure Attestation
              </h3>
           </div>

           <div className="space-y-6">
              <p className="text-sm text-gray-500 leading-relaxed font-medium italic">
                Your <span className="text-white font-bold">Sovereign Node</span> is linked to the production cluster. 
                Citizen nodes use platform-default keys with restricted bandwidth. Upgrade to Pro for high-leverage BYOK access.
              </p>
              
              <div className="p-6 bg-black border-2 border-white/10 rounded-2xl flex items-center gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Platform Default Key: ACTIVE</span>
              </div>
           </div>
        </div>

        <div className="glass-card p-10 bg-white/[0.01] border-white/5 space-y-6 rounded-[3rem]">
           <div className="flex items-center gap-4 text-blue-400">
              <Bot size={24} />
              <h4 className="text-[12px] font-black uppercase tracking-widest">Security Protocol Note</h4>
           </div>
           <p className="text-xs text-gray-500 leading-relaxed font-medium">
             Nexus OS operates within an isolated hardware perimeter. Personal keys are retrieved only during neural synthesis 
             to preserve absolute data sovereignty and prevent unauthorized multi-tenant access.
           </p>
        </div>
      </div>
    </div>
  );
};
