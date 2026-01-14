
import React, { useState, useEffect } from 'react';
import { 
  Dna, 
  Scan, 
  Cpu, 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight, 
  Fingerprint, 
  BrainCircuit, 
  Terminal, 
  Loader2, 
  Lock, 
  Sparkles,
  Key,
  Database,
  Smartphone,
  ChevronRight,
  Target,
  Waves,
  ShieldAlert,
  Activity,
  FileText,
  Check as CheckIcon,
  X as XIcon,
  ExternalLink
} from 'lucide-react';
import { OnboardingStep } from '../types';
import { nexusApi } from '../api/nexusClient';

interface OnboardingProps {
  onComplete: (key: string) => void;
  onCancel: () => void;
  selectedPlan: string;
}

export const NeuralOnboarding: React.FC<OnboardingProps> = ({ onComplete, onCancel, selectedPlan }) => {
  const [step, setStep] = useState<OnboardingStep>(OnboardingStep.DNA_INTAKE);
  const [formData, setFormData] = useState({ niche: '', reach: '', goals: '' });
  const [purityScore, setPurityScore] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [handshakeStatus, setHandshakeStatus] = useState<'idle' | 'linking' | 'verified'>('idle');
  const [accordAccepted, setAccordAccepted] = useState(false);
  
  const planPricing = {
    'Spark': '$0',
    'Pro': '$84',
    'Agency': '$299'
  };

  const currentPrice = planPricing[selectedPlan as keyof typeof planPricing] || '$84';

  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 8));

  const startScan = () => {
    setStep(OnboardingStep.NEURAL_SCAN);
    const messages = [
      "Initializing Neural Bridge...",
      "Extracting Semantic Patterns...",
      "Matching Identity Hashes...",
      "Calibrating Dominion Vector...",
      "Simulating Reach Arbitrage...",
      "Analyzing Digital Purity...",
      "Scan Finalizing..."
    ];
    let i = 0;
    const interval = window.setInterval(() => {
      if (i < messages.length) {
        addLog(messages[i]);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setPurityScore(85 + Math.floor(Math.random() * 14));
          setStep(OnboardingStep.ALIGNMENT_RESULT);
        }, 1000);
      }
    }, 600);
  };

  const handleBond = async () => {
    if (selectedPlan === 'Spark') {
      setStep(OnboardingStep.KEY_REVEAL);
      return;
    }

    setPaymentLoading(true);
    setHandshakeStatus('linking');
    addLog("Initiating Node Billing Link...");

    try {
      const priceIds: Record<string, string> = {
        'Pro': 'price_1SnS16K9R2Fq5EmF0Qes5z2k',
        'Agency': 'price_1SnS1vK9R2Fq5EmFIDOBhYh7'
      };

      // Fix: Calling correct method createCheckoutSession instead of createStripeCheckout
      const res = await nexusApi.createCheckoutSession(priceIds[selectedPlan]);
      
      if (res.url) {
        addLog("Handshake Verified. Redirecting to Stripe...");
        setTimeout(() => {
          window.location.href = res.url;
        }, 1000);
      }
    } catch (e: any) {
      addLog(`Hardware Deviation: ${e.message}`);
      setPaymentLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case OnboardingStep.DNA_INTAKE:
        return (
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto shadow-2xl">
                 <Dna size={32} className="animate-pulse" />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Neural Intake</h2>
              <p className="text-gray-400 text-lg font-medium">Provision your dedicated node by seeding your creator DNA.</p>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-4">Current Niche / Expertise</label>
                  <input 
                    value={formData.niche}
                    onChange={e => setFormData({...formData, niche: e.target.value})}
                    placeholder="e.g. 'Advanced AI Engineering' or 'Strategic SaaS Growth'"
                    className="w-full bg-black border-2 border-white/10 rounded-2xl px-6 py-4 text-white focus:border-violet-500/50 outline-none transition-all"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-violet-400 uppercase tracking-widest ml-4">Sovereign Objective</label>
                  <textarea 
                    value={formData.goals}
                    onChange={e => setFormData({...formData, goals: e.target.value})}
                    placeholder="Describe your ultimate goal for 2030..."
                    className="w-full h-32 bg-black border-2 border-white/10 rounded-2xl px-6 py-4 text-white focus:border-violet-500/50 outline-none transition-all resize-none"
                  />
               </div>
            </div>

            <button 
              onClick={startScan}
              disabled={!formData.niche || !formData.goals}
              className="w-full py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(139,92,246,0.3)] disabled:opacity-50 border-2 border-white/10"
            >
              Initiate Diagnostic <ArrowRight size={18} className="inline ml-3" />
            </button>
          </div>
        );

      case OnboardingStep.NEURAL_SCAN:
        return (
          <div className="space-y-12 flex flex-col items-center py-10 animate-in zoom-in-95 duration-700">
             <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-violet-500/20 flex items-center justify-center">
                   <Scan size={64} className="text-violet-500 animate-pulse" />
                </div>
                <div className="absolute inset-0 border-t-4 border-violet-500 rounded-full animate-spin" />
             </div>
             
             <div className="w-full space-y-4">
                <h3 className="text-center text-xs font-black text-violet-400 uppercase tracking-[0.8em] animate-pulse">Scanning DNA Signature</h3>
                <div className="bg-[#050505] p-6 rounded-2xl border border-white/10 font-mono text-[10px] text-gray-500 space-y-2 min-h-[180px]">
                   {logs.map((log, i) => (
                     <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2">
                        <span className="text-emerald-500">{" >> "}</span>
                        <span className="text-gray-300">{log}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        );

      case OnboardingStep.ALIGNMENT_RESULT:
        return (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
             <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                   <ShieldCheck size={14} /> Scan Complete
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Sovereign Alignment</h2>
                <div className="relative w-48 h-48 mx-auto">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="552.9" strokeDashoffset={552.9 * (1 - purityScore / 100)} className="text-emerald-500 transition-all duration-[2000ms]" />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-6xl font-black text-white">{purityScore}%</span>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Purity</span>
                   </div>
                </div>
             </div>

             <button 
              onClick={() => setStep(OnboardingStep.THE_ACCORD)}
              className="w-full py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(139,92,246,0.3)] border-2 border-white/20"
             >
              Review Sovereign Accord <ChevronRight size={18} className="inline ml-3" />
             </button>
          </div>
        );

      case OnboardingStep.THE_ACCORD:
        return (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-700">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto shadow-2xl">
                 <FileText size={32} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Enter The Accord</h2>
              <p className="text-gray-400 text-lg font-medium">Verify your commitment to the Sovereign Network protocol.</p>
            </div>

            <div className="glass-card p-8 bg-[#0a0a0f] border border-white/10 space-y-6 max-h-[300px] overflow-y-auto scrollbar-hide font-['JetBrains_Mono'] text-xs text-gray-500 leading-relaxed">
               <p className="text-violet-400 font-black uppercase tracking-widest">PROTOCOL: THE SOVEREIGN ACCORD (v2030.04.1)</p>
               <p>1. ASSET OWNERSHIP: You retain 100% ownership of synthesized content.</p>
               <p>2. API KEY RESPONSIBILITY: You provide your own Gemini keys for unlimited Pro synthesis.</p>
               <p>3. BILLING: Pro and Agency tiers are monthly bonds secured via Stripe.</p>
            </div>

            <label className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer ${accordAccepted ? 'bg-emerald-600/10 border-emerald-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`} onClick={() => setAccordAccepted(!accordAccepted)}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accordAccepted ? 'bg-emerald-500 text-white' : 'bg-white/10 text-transparent'}`}><CheckIcon size={20} /></div>
                <p className="text-xs font-black uppercase tracking-widest text-white">Accept Sovereign Accord</p>
            </label>

            <button onClick={() => setStep(OnboardingStep.HARDWARE_BOND)} disabled={!accordAccepted} className="w-full py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all">Finalize Infrastructure</button>
          </div>
        );

      case OnboardingStep.HARDWARE_BOND:
        return (
          <div className="space-y-12 animate-in fade-in duration-700">
             {paymentLoading && (
               <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center space-y-10">
                  <Waves className="w-48 h-48 text-emerald-500 animate-pulse" />
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Redirecting...</h2>
               </div>
             )}

             <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl">
                   <Lock size={32} />
                </div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Hardware Bond</h2>
                <p className="text-gray-400 text-lg font-medium">Provision your node via Stripe Secure Link.</p>
             </div>

             <div className="glass-card p-10 bg-black border-2 border-white/10 space-y-8 text-center">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Node Allocation</p>
                   <p className="text-3xl font-black text-white uppercase">{selectedPlan} Sovereign</p>
                   <p className="text-xl font-black text-emerald-400">{currentPrice}/mo</p>
                </div>

                <button 
                  onClick={handleBond}
                  disabled={paymentLoading}
                  className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-center gap-4 border-2 border-white/10"
                >
                  {paymentLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
                  INITIATE BOND
                </button>
             </div>
          </div>
        );

      case OnboardingStep.KEY_REVEAL:
        return (
          <div className="space-y-12 animate-in zoom-in-95 duration-700">
             <div className="text-center space-y-4">
                <Key size={40} className="text-violet-600 mx-auto animate-bounce" />
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Identity Manifest</h2>
             </div>

             <div className="glass-card p-12 bg-black border-2 border-violet-500/40 text-center space-y-10">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-[1em]">Master Key</p>
                <p className="text-5xl font-mono font-black text-white tracking-[0.3em]">nexus2030</p>
                <button onClick={() => onComplete('nexus2030')} className="w-full py-8 bg-white text-black hover:bg-violet-600 hover:text-white rounded-[2rem] font-black text-lg uppercase tracking-[0.5em] transition-all">Authorize Entry</button>
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 font-['Outfit']">
      <div className="max-w-xl w-full relative">
        {(step !== OnboardingStep.KEY_REVEAL && step !== OnboardingStep.THE_ACCORD) && (
          <button onClick={onCancel} className="absolute -top-12 right-0 text-gray-600 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            Abandon Sync <XIcon size={14} />
          </button>
        )}
        {renderContent()}
      </div>
    </div>
  );
};
