
import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Scale, 
  Lock, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  FileSearch, 
  ShieldCheck, 
  Atom,
  Copy,
  Check,
  Hash,
  FileText,
  Activity,
  ShieldPlus,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Info,
  Book
} from 'lucide-react';
import { LEGAL_DOCS } from '../legalContent';
import { LegalSectionId } from '../types';

export const LegalView: React.FC<{ initialSection?: LegalSectionId }> = ({ initialSection }) => {
  const [activeSection, setActiveSection] = useState<LegalSectionId>(initialSection || 'accord');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // Synchronize local state with prop changes for reactive routing
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const startAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setAuditLogs([]);
    const logs = [
      "Initializing Neural Audit...",
      "Verifying EIN: 41-2666846 against IRS Database...",
      "NY DOS Hash Match: IDEAVALIDATOR LLC Active.",
      "Syncing domain registry: nexus-os.ai...",
      "Mercury Treasury Handshake: SECURE.",
      "Stripe Agency Mesh: ACTIVE.",
      "HSM Handshake: Hardware Root of Trust Verified."
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < logs.length) {
        setAuditLogs(prev => [logs[i], ...prev]);
        setAuditProgress(Math.round(((i + 1) / logs.length) * 100));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsAuditing(false), 1000);
      }
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32 font-['Outfit']">
      <header className="flex flex-col lg:flex-row justify-between items-start gap-12">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck size={24} />
             </div>
             <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.5em]">IDEAVALIDATOR LLC :: NY_DOS_7754809</span>
          </div>
          <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient uppercase">The Constitution</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
            Legal infrastructure for <span className="text-white">IDEAVALIDATOR LLC</span>. Jurisdiction: <span className="text-violet-400">New York, USA</span>.
          </p>
        </div>
        
        <button 
          onClick={startAudit}
          disabled={isAuditing}
          className="glass-card p-10 bg-emerald-600/10 border-emerald-500/30 border-2 shadow-2xl hover:scale-105 transition-all group shrink-0 rounded-[3rem]"
        >
          <div className="flex items-center gap-8">
             <div className={`p-6 bg-emerald-600 text-white rounded-[2.2rem] shadow-2xl transition-all ${isAuditing ? 'animate-spin' : ''}`}>
                <FileSearch size={40} />
             </div>
             <div className="text-left">
                <p className="text-2xl font-black text-white uppercase tracking-tight">Audit Protocol</p>
                <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mt-2">
                   {isAuditing ? `Scanning... ${auditProgress}%` : 'Registry: ACTIVE'}
                </p>
             </div>
          </div>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-1 space-y-4">
           <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.6em] mb-4 px-4">Network Manifests</p>
           <div className="space-y-2">
              {(Object.keys(LEGAL_DOCS) as LegalSectionId[]).map((id) => (
                <button 
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all flex items-center justify-between group ${
                    activeSection === id 
                      ? 'bg-violet-600/10 border-violet-500/40 text-white shadow-xl' 
                      : 'bg-[#0a0a0f] border-white/5 text-gray-500 hover:text-gray-200'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase tracking-widest">{LEGAL_DOCS[id].name}</p>
                    <p className="text-[9px] text-gray-600 uppercase tracking-tighter">{LEGAL_DOCS[id].subtitle}</p>
                  </div>
                  <ChevronRight size={16} className={`transition-transform ${activeSection === id ? 'translate-x-1 text-violet-400' : 'text-gray-800'}`} />
                </button>
              ))}
           </div>

           <div className="pt-8">
             <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3 text-amber-400">
                   <AlertTriangle size={18} />
                   <h4 className="text-[10px] font-black uppercase tracking-widest">Legal Status</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  Compliance with NY DOS Article 206 is currently in cycle. LLC active since registration.
                </p>
             </div>
           </div>
        </div>

        <div className="lg:col-span-3">
           <div className="glass-card p-12 md:p-20 space-y-10 bg-[#0a0a0f] border-2 border-white/10 shadow-3xl rounded-[4rem] relative min-h-[800px] flex flex-col">
              <div className="absolute top-0 right-0 p-12 opacity-[0.01] pointer-events-none text-white"><Atom size={600} /></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-8 border-b border-white/5 pb-8 relative z-10">
                <div className="space-y-2">
                   <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                     {LEGAL_DOCS[activeSection].name}
                   </h2>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-emerald-500 font-mono text-[9px] font-black uppercase tracking-widest">
                         <Info size={10} /> VERSION: {LEGAL_DOCS[activeSection].version}
                      </div>
                      <div className="flex items-center gap-2 text-violet-400 font-mono text-[9px] font-black uppercase tracking-widest">
                         <Hash size={10} /> {LEGAL_DOCS[activeSection].hash}
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => handleCopy(LEGAL_DOCS[activeSection].content, activeSection)}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 text-emerald-400"
                >
                  {copied === activeSection ? <Check size={16} /> : <Copy size={16} />}
                  {copied === activeSection ? 'Hashed to Clipboard' : 'Copy Node Protocol'}
                </button>
              </div>

              <div className="flex-1 font-['JetBrains_Mono'] text-lg md:text-xl text-gray-400 leading-relaxed space-y-8 relative z-10 selection:bg-emerald-500/30">
                 {LEGAL_DOCS[activeSection].content.split('\n\n').map((para, i) => (
                   <p key={i}>{para}</p>
                 ))}
              </div>

              <div className="pt-12 mt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-gray-600 relative z-10 gap-4">
                 <div className="flex items-center gap-4">
                    <Shield size={16} className="text-emerald-500/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Verified Infrastructure Document</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-700">ENTITY_ID: NY_DOS_7754809</span>
                    <span className="text-gray-800">|</span>
                    <span className="text-[9px] font-mono text-gray-700">DOMAIN: NEXUS-OS.AI</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
