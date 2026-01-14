
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  DollarSign,
  RefreshCw,
  Activity,
  ArrowRight,
  ScanEye,
  X,
  FileText,
  ShieldAlert,
  Check,
  ShieldPlus,
  Scale,
  FileSearch,
  AlertTriangle,
  FileBarChart,
  Mail,
  Phone,
  CloudCog,
  ChevronRight,
  Terminal,
  Server,
  Globe,
  Video,
  Clock,
  Landmark,
  ExternalLink,
  LockKeyhole,
  Instagram,
  Facebook
} from 'lucide-react';
import { ToolType } from '../types';

export const IdentityNode: React.FC<{ onNavigate?: (tool: ToolType) => void }> = ({ onNavigate }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(() => localStorage.getItem('nexus_phase_1_verified') === 'true');
  
  const handleVerifyStack = () => {
    setIsVerifying(true);
    setTimeout(() => {
      localStorage.setItem('nexus_phase_1_verified', 'true');
      setIsVerified(true);
      setIsVerifying(false);
      // Force reload to update Layout badges
      window.location.reload();
    }, 2500);
  };

  const setupSteps = [
    {
      id: 1,
      title: "Legal Shell",
      subtitle: "Active Node",
      icon: Building2,
      description: "IDEAVALIDATOR LLC is ACTIVE. EIN: 41-2666846. Registered in NY via Northwest Albany.",
      items: [
        { label: "NY Articles of Organization", status: 'done' },
        { label: "EIN: 41-2666846", status: 'done' },
        { label: "Section 206 Publication", status: 'processing' },
        { label: "DBA 'Nexus OS'", status: 'pending' }
      ]
    },
    {
      id: 2,
      title: "Meta Bridge",
      subtitle: "Business Ready",
      icon: Instagram,
      description: "Direct connection to Meta Business Suite for automated Instagram/Facebook orchestration.",
      items: [
        { label: "Meta Pixel Sync", status: 'done' },
        { label: "Graph API Node", status: 'done' },
        { label: "Messenger Auth", status: 'done' },
        { label: "Ad Node Handshake", status: 'pending' }
      ]
    },
    {
      id: 3,
      title: "Compute Stack",
      subtitle: "Nexus-Production",
      icon: CloudCog,
      description: "GCP Project 'Nexus-Production' online. 'nexus-vault' AMD SEV-SNP VM Active.",
      items: [
        { label: "Confidential VM: 35.239.84.65", status: 'done' },
        { label: "AMD SEV Hardware Lock", status: 'done' },
        { label: "Service Account: nexus-agent", status: 'done' }
      ]
    },
    {
      id: 6,
      title: "Treasury",
      subtitle: "Mercury Bank",
      icon: Landmark,
      description: "Mercury nodes initialized and synchronized.",
      items: [
        { label: "Account Link", status: 'done' },
        { label: "KYB Verification", status: 'done' },
        { label: "Treasury Routing", status: 'done' }
      ]
    }
  ];

  const currentStepData = setupSteps.find(s => s.id === activeStep) || setupSteps[0];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32 relative">
      <header className="flex flex-col lg:flex-row justify-between items-start gap-12">
        <div className="space-y-6 flex-1">
          <div className={`flex items-center gap-4 ${isVerified ? 'text-emerald-400' : 'text-violet-400'}`}>
             <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-violet-500/10 border-violet-500/30'}`}>
                {isVerified ? <ShieldCheck size={24} /> : <LockKeyhole size={24} />}
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.5em]">
                {isVerified ? 'IDEAVALIDATOR LLC :: INFRASTRUCTURE SECURED' : 'IDEAVALIDATOR LLC :: SETUP REQUIRED'}
             </span>
          </div>
          <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Identity Node</h1>
          <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">
            Sovereign Infrastructure for <span className="text-white font-mono">EIN 41-2666846</span>. Meta Bridge for <span className="text-blue-400">FB/IG</span> is active.
          </p>
        </div>
        
        <div className={`glass-card px-10 py-8 border-2 flex flex-col items-center justify-center min-w-[280px] rounded-[3.5rem] shadow-2xl transition-all duration-1000 ${isVerified ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-violet-500/30 bg-violet-500/[0.05]'}`}>
           <p className={`text-[11px] font-black uppercase tracking-[0.4em] mb-4 ${isVerified ? 'text-emerald-500' : 'text-violet-500'}`}>{isVerified ? 'Stack Health' : 'Sync Required'}</p>
           <div className="relative w-24 h-24 mb-4">
              <svg className="w-full h-full transform -rotate-90">
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                 <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - (isVerified ? 0.98 : 0.42))} className={`transition-all duration-1000 ${isVerified ? 'text-emerald-500' : 'text-violet-500'}`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <span className="text-2xl font-black text-white">{isVerified ? '98%' : '42%'}</span>
              </div>
           </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {setupSteps.map((step) => (
          <button 
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`px-8 py-5 rounded-[2.5rem] border-2 transition-all flex items-center gap-4 ${
              activeStep === step.id ? 'bg-emerald-600 border-emerald-400 text-white shadow-2xl' : 'bg-white/5 border-white/10 text-gray-500'
            }`}
          >
            <step.icon size={20} />
            <span className="text-xs font-black uppercase tracking-widest">{step.title}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
           <div className="glass-card p-12 md:p-20 space-y-12 bg-black border-2 border-white/10 rounded-[4rem] relative min-h-[600px]">
              <div className="space-y-6 relative z-10">
                 <h2 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">{currentStepData.title}</h2>
                 <p className="text-2xl text-gray-400 font-medium leading-relaxed max-w-2xl">{currentStepData.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                 {currentStepData.items.map((item, i) => (
                   <div key={i} className="p-8 rounded-3xl border-2 transition-all bg-white/[0.03] border-white/10">
                      <div className="flex justify-between items-center mb-4">
                         <p className="text-xs font-black text-gray-500 uppercase tracking-widest">{item.label}</p>
                         {isVerified || item.status === 'done' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Clock size={18} className="text-blue-400" />}
                      </div>
                      <p className="text-xl font-black text-white uppercase">{isVerified || item.status === 'done' ? 'Verified' : 'In Transit'}</p>
                   </div>
                 ))}
              </div>

              {activeStep === 1 && !isVerified && (
                <div className="relative z-10 pt-8">
                   <button 
                     onClick={handleVerifyStack}
                     disabled={isVerifying}
                     className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-4"
                   >
                     {isVerifying ? <RefreshCw className="animate-spin" size={24}/> : <ShieldPlus size={24}/>}
                     Establish Phase 01 Anchor
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
