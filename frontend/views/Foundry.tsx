
import React, { useState } from 'react';
import { Building2, Landmark, ShieldCheck, Zap, FileCheck, CheckCircle2, DollarSign, RefreshCw, Link2, Activity, ArrowRight, ScanEye, X, FileText, ShieldAlert, Boxes, Package, Factory, Globe, ArrowUpRight, Sparkles, Mail, Phone } from 'lucide-react';
import { FoundryModule } from '../types';

export const Foundry: React.FC = () => {
  const [modules] = useState<FoundryModule[]>([
    { id: '1', name: 'IDEAVALIDATOR LLC', type: 'legal', status: 'manifested', value: 'EIN: 41-2666846' },
    { id: '2', name: 'NY Publication Node', type: 'legal', status: 'syncing', value: '8-10 Week Cycle' },
    { id: '3', name: 'Google Workspace', type: 'intellectual', status: 'manifested', value: '10 Aliases @ nexus-os.ai' },
    { id: '6', name: 'Sovereign Comm Pipe', type: 'physical', status: 'manifested', value: '(929) 224-2356' },
    { id: '4', name: 'Mercury Treasury', type: 'financial', status: 'manifested', value: 'Active Checking' },
    { id: '5', name: 'Stripe Agency Mesh', type: 'financial', status: 'manifested', value: 'Payment Shake OK' },
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32 font-['Outfit']">
      <header className="flex flex-col xl:flex-row justify-between items-start gap-12 border-b border-white/5 pb-12">
        <div className="space-y-6 flex-1">
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em]">
             <Factory size={14} /> Manifestation Node :: Sovereign Status
          </div>
          <h1 className="text-9xl font-black text-white tracking-tighter leading-none text-gradient uppercase">The Foundry</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
            Verified legacy for <span className="text-white font-mono">IDEAVALIDATOR LLC</span>. Domain <span className="text-emerald-400">nexus-os.ai</span> and Mercury Treasury are live.
          </p>
        </div>
        <div className="glass-card px-10 py-8 border-2 border-emerald-500/30 bg-emerald-500/[0.05] flex flex-col items-center justify-center min-w-[320px] rounded-[3.5rem] shadow-[0_0_100px_rgba(16,185,129,0.2)]">
           <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Total Manifested Value</p>
           <p className="text-6xl font-black text-white tracking-tighter">$2.8M</p>
           <div className="flex items-center gap-2 mt-4 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
              <ArrowUpRight size={12} /> +200k Agency Handshake
           </div>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {modules.map(module => (
          <div key={module.id} className={`glass-card p-8 space-y-6 border-2 transition-all group hover:scale-[1.05] rounded-[2.5rem] ${
            module.status === 'manifested' ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 
            module.status === 'syncing' ? 'border-blue-500/40 bg-blue-600/[0.02] shadow-[0_0_50px_rgba(59,130,246,0.1)]' : 
            'border-white/5 bg-white/[0.01] opacity-40 grayscale'
          }`}>
             <div className="flex justify-between items-start">
                <div className={`p-4 rounded-xl shadow-xl transition-all ${
                   module.status === 'manifested' ? 'bg-emerald-600 text-white' : 
                   module.status === 'syncing' ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400'
                }`}>
                   {module.name === 'Google Workspace' ? <Mail size={24} /> :
                    module.name === 'Sovereign Comm Pipe' ? <Phone size={24} /> :
                    module.type === 'legal' ? <ShieldCheck size={24} /> : 
                    module.type === 'financial' ? <Landmark size={24} /> : 
                    module.type === 'intellectual' ? <Zap size={24} /> : <Package size={24} />}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                   module.status === 'manifested' ? 'text-emerald-400' : 'text-blue-400'
                }`}>{module.status}</span>
             </div>
             <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight mb-1 truncate">{module.name}</h4>
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{module.type} Module</p>
             </div>
             <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                <span className="text-sm font-black text-white truncate">{module.value}</span>
                <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
                   <ArrowRight size={14} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
