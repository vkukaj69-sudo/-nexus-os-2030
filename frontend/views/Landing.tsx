
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ArrowRight, 
  Play, 
  BrainCircuit, 
  ChevronRight,
  Terminal,
  Sparkles,
  Database,
  PenTool,
  ScanEye,
  Rocket,
  Shield,
  Globe,
  Share2,
  Cpu,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  ZapOff,
  Boxes,
  Lock,
  Facebook,
  Instagram,
  Key,
  FileText,
  ShieldAlert,
  User
} from 'lucide-react';
import { LegalSectionId } from '../types';

const CinematicLogFeed = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const logMessages = [
    "SYNCING DIGITAL_SOUL_DNA...",
    "CALIBRATING SEMANTIC_FINGERPRINT",
    "ORCHESTRATING AGENT_NODE_01",
    "ANALYZING VIRAL_VELOCITY...",
    "EXTRACTING NICHE_AUTHORITY",
    "ENCRYPTING IDENTITY_GRAPH",
    "SIMULATING AUDIENCE_REACTION",
    "DEPLOYING SOVEREIGN_ASSET"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => [logMessages[Math.floor(Math.random() * logMessages.length)], ...prev].slice(0, 10));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-[10px] space-y-2 opacity-50">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-4 items-center animate-in slide-in-from-left-2 fade-in">
          <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
          <span className="text-white tracking-widest">{log}</span>
        </div>
      ))}
    </div>
  );
};

interface LandingProps {
  onEnter: (plan?: string) => void;
  onLogin: () => void;
  onLegal: (section: LegalSectionId) => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onEnter, onLogin, onLegal }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-violet-500/30 overflow-x-hidden font-['Outfit']">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-24 border-b border-white/10 bg-black/80 backdrop-blur-3xl z-[100] px-4 lg:px-16 flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-5">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl overflow-hidden shrink-0 border border-white/10">
            <Zap className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg lg:text-2xl font-black tracking-tighter leading-none">NEXUS</span>
            <span className="text-[8px] lg:text-[10px] font-black text-violet-400 tracking-[0.4em] lg:tracking-[0.6em] mt-1.5 uppercase truncate">Sovereign Studio</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-12 text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">
          <button onClick={() => scrollToSection('workflow')} className="hover:text-white transition-all">Workflow</button>
          <button onClick={() => scrollToSection('ecosystem')} className="hover:text-white transition-all">Ecosystem</button>
          <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-all">Pricing</button>
          <button onClick={() => scrollToSection('roi')} className="hover:text-white transition-all">Yield</button>
          <button onClick={() => onLegal('accord')} className="hover:text-white transition-all">Accord</button>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
           <button onClick={() => onEnter('Pro')} className="px-6 lg:px-10 py-3 lg:py-4 bg-violet-600 text-white rounded-xl font-black text-[10px] lg:text-[11px] uppercase tracking-widest hover:bg-violet-500 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] group border border-white/10 shrink-0">
             Provision Node
             <ChevronRight size={14} className="inline ml-1 lg:ml-2 group-hover:translate-x-1 transition-transform" />
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="pt-48 lg:pt-64 pb-32 px-8 relative z-10 scroll-mt-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-10 lg:space-y-12 text-left">
            <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-[0.4em]">
              <BrainCircuit size={16} /> The Protocol of Identity
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] uppercase text-gradient">
              One Soul.<br />Infinite<br />Presence.
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-xl leading-relaxed font-medium">
              Nexus is the world's first <span className="text-white font-black">Sovereign Identity OS</span>. Synchronize your DNA and deploy agentic dominion across Meta, X, and the digital stack.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-8">
              <button onClick={() => onEnter('Pro')} className="w-full sm:w-auto px-10 lg:px-12 py-5 lg:py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-[12px] lg:text-[14px] uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(139,92,246,0.4)]">
                Initialize Dominion <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection('workflow')} className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-4 text-gray-400 hover:text-white">
                <Play size={18} fill="currentColor" /> Watch Ops
              </button>
            </div>
          </div>

          <div className="relative group perspective-1000 hidden lg:block">
             <div className="glass-card p-4 border-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.9)] bg-black/60 rotate-2 group-hover:rotate-0 transition-all duration-1000 overflow-hidden min-h-[500px] flex flex-col relative text-left">
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                   </div>
                   <div className="flex items-center gap-3">
                      <Terminal size={14} className="text-violet-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Node_01 :: Active</span>
                   </div>
                </div>
                <div className="flex-1 p-8 space-y-12 flex flex-col">
                   <div className="space-y-4">
                      <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em]">Current Objective</p>
                      <h3 className="text-3xl font-black text-white leading-tight">Scale Brand Trust Vector via Meta & X Orchestration</h3>
                   </div>
                   <div className="flex-1">
                      <CinematicLogFeed />
                   </div>
                   <div className="p-8 bg-violet-600/5 border border-violet-500/20 rounded-[2rem] flex items-center justify-between">
                      <div>
                         <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Impact Probability</p>
                         <p className="text-3xl font-black text-white">94.2%</p>
                      </div>
                      <Sparkles size={32} className="text-violet-400" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-48 px-8 relative overflow-hidden bg-black/20 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-6">
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">The Nexus Protocol</h2>
              <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto italic text-center">Absolute digital dominion. Fully automated. Verified sovereign.</p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", icon: <Database />, title: "Ingest DNA", desc: "Feed your raw writing and thoughts into the Digital Soul sync node." },
                { step: "02", icon: <PenTool />, title: "Architect", desc: "Transform your DNA into viral pillars across Instagram, Facebook, and X." },
                { step: "03", icon: <ScanEye />, title: "Simulate", desc: "Predict conversion potential using synthetic audience clones." },
                { step: "04", icon: <Rocket />, title: "Deploy", desc: "Launch autonomous agents to manage engagement while you sleep." }
              ].map((item, i) => (
                <div key={i} className="glass-card p-10 space-y-8 border-white/10 hover:border-violet-500/40 transition-all hover:-translate-y-2 duration-500 group text-left">
                   <div className="flex justify-between items-start">
                      <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                        {React.cloneElement(item.icon as React.ReactElement<any>, { size: 28 })}
                      </div>
                      <span className="text-4xl font-black text-white/5 font-mono group-hover:text-violet-500/20 transition-colors">{item.step}</span>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tight">{item.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ecosystem" className="py-48 px-8 relative overflow-hidden scroll-mt-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
           <div className="space-y-12 text-left">
              <div className="space-y-6">
                 <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">Agentic<br />Mesh Grid</h2>
                 <p className="text-xl text-gray-400 leading-relaxed max-w-xl font-medium">
                    Connect your Nexus Node to the global distribution layer. Our sovereign agents manage presence across the entire Meta and X stack.
                 </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                 {[
                   { icon: <MessageSquare />, label: "X / Twitter", status: "Native Bridge" },
                   { icon: <Globe />, label: "LinkedIn", status: "B2B Node" },
                   { icon: <Facebook />, label: "Facebook", status: "Social Hub" },
                   { icon: <Instagram />, label: "Instagram", status: "Visual Mesh" },
                   { icon: <Share2 />, label: "Reddit", status: "Hype Pulse" },
                   { icon: <Cpu />, label: "GCP / AWS", status: "Compute Enclave" }
                 ].map((app, i) => (
                   <div key={i} className="flex items-center gap-6 p-6 glass-card border-white/5 bg-white/[0.02]">
                      <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                         {app.icon}
                      </div>
                      <div>
                         <p className="font-black text-white uppercase tracking-widest text-xs">{app.label}</p>
                         <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{app.status}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           <div className="relative flex items-center justify-center p-12">
              <div className="oracle-sphere w-64 h-64 lg:w-96 lg:h-96 opacity-30 blur-3xl absolute" />
              <div className="relative z-10 glass-card p-12 border-violet-500/30 bg-black/60 shadow-[0_0_100px_rgba(139,92,246,0.2)] rounded-[4rem]">
                 <div className="space-y-10 text-left">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 rounded-3xl bg-violet-600 flex items-center justify-center text-white shadow-2xl">
                          <Zap size={32} />
                       </div>
                       <div>
                          <h4 className="text-2xl font-black text-white tracking-tight uppercase">Sovereign Link</h4>
                          <p className="text-[10px] font-black text-violet-400 font-black uppercase tracking-[0.4em] mt-1">Status: CALIBRATED</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-violet-500 h-full w-[98%]" />
                       </div>
                       <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
                          "All external nodes are synced via Zero-Knowledge handshakes. Your DNA signature is verified across the Agentic Mesh."
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-48 px-8 relative overflow-hidden bg-black/40 scroll-mt-24">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="text-center space-y-6">
             <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Node Allocation</h2>
             <p className="text-gray-400 text-xl font-medium max-w-2xl mx-auto italic text-center">Secure your dedicated hardware node and provision your Digital Soul.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Tier 1 */}
            <div className="glass-card p-12 space-y-10 border-white/10 flex flex-col hover:border-white/20 transition-all duration-500 text-left">
               <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Spark Node</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-5xl font-black text-white">$0</span>
                     <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">/ Exploration</span>
                  </div>
               </div>
               <div className="space-y-6 flex-1">
                  {[
                    "Standard Content Composer",
                    "Basic Meta Research",
                    "Single Account Sync",
                    "Public Mesh Access"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm font-medium text-gray-400">
                       <CheckCircle2 size={18} className="text-gray-700" /> {feat}
                    </div>
                  ))}
               </div>
               <button onClick={() => onEnter('Spark')} className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all text-gray-400 hover:text-white">Initialize Spark</button>
            </div>

            {/* Tier 2 - Featured */}
            <div className="glass-card p-12 space-y-10 border-violet-500/40 bg-violet-600/[0.03] flex flex-col scale-110 z-10 shadow-[0_0_100px_rgba(139,92,246,0.15)] relative overflow-hidden text-left">
               <div className="absolute top-4 right-4 px-3 py-1 bg-violet-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">Sovereign Choice</div>
               <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Pro Sovereign</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-5xl font-black text-white">$84</span>
                     <span className="text-violet-400 font-black uppercase text-[10px] tracking-widest">/ Mo Bond</span>
                  </div>
               </div>
               <div className="space-y-6 flex-1">
                  {[
                    "Digital Soul DNA Mapping",
                    "Veo 3.1 Cinematic Studio",
                    "Agentic Meta Reply Mesh (Pro)",
                    "TEE Isolated Hardware Vault",
                    "Sovereign LLMO Indexing",
                    "Direct Neural Link Access"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm font-medium text-white">
                       <ShieldCheck size={18} className="text-violet-400" /> {feat}
                    </div>
                  ))}
               </div>
               <button onClick={() => onEnter('Pro')} className="w-full py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(139,92,246,0.4)]">Provision Pro Node</button>
            </div>

            {/* Tier 3 */}
            <div className="glass-card p-12 space-y-10 border-emerald-500/20 flex flex-col hover:border-emerald-500/40 transition-all duration-500 text-left">
               <div className="space-y-4">
                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">Agency Mesh</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-5xl font-black text-white">$299</span>
                     <span className="text-emerald-400 font-black uppercase text-[10px] tracking-widest">/ Global Mesh</span>
                  </div>
               </div>
               <div className="space-y-6 flex-1">
                  {[
                    "10 Dedicated Identity Nodes",
                    "Unlimited Meta Agent Provisioning",
                    "Custom Governance Logic",
                    "Private Enclave Deployments",
                    "Priority TEE Compute",
                    "24/7 Strategic Support"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-4 text-sm font-medium text-gray-400">
                       <Boxes size={18} className="text-emerald-500" /> {feat}
                    </div>
                  ))}
               </div>
               <button onClick={() => onEnter('Agency')} className="w-full py-5 bg-emerald-600/10 border border-emerald-500/30 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all text-emerald-400 hover:text-white">Deploy Global Mesh</button>
            </div>
          </div>
        </div>
      </section>

      {/* Yield/ROI Section */}
      <section id="roi" className="py-48 px-8 relative overflow-hidden bg-black/50 scroll-mt-24">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter">Exponential Yield</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <p className="text-6xl font-black text-emerald-400 tracking-tighter">$2.6M</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Average IP Valuation</p>
            </div>
            <div className="space-y-4">
              <p className="text-6xl font-black text-violet-400 tracking-tighter">99%</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Operational Efficiency</p>
            </div>
            <div className="space-y-4">
              <p className="text-6xl font-black text-blue-400 tracking-tighter">∞</p>
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Scalability Potential</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-32 px-8 bg-black border-t border-white/10 relative overflow-hidden text-center">
        <div className="max-w-7xl mx-auto relative z-10">
           <div className="flex flex-col items-center space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Zap size={20} />
                </div>
                <span className="text-2xl font-black tracking-tighter uppercase">Nexus OS</span>
              </div>
              <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.5em] leading-relaxed">
                The Sovereign Creator Operating System.<br />Architected in Silicon Valley 2028.
              </p>
              
              <div className="flex flex-wrap justify-center gap-8 mt-12">
                 <button onClick={() => onLegal('accord')} className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Sovereign Accord</button>
                 <button onClick={() => onLegal('dominion')} className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Data Dominion</button>
                 <button onClick={() => onLegal('reciprocity')} className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Reciprocity Terms</button>
                 <button onClick={() => onLegal('copyright')} className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-all">Copyright Node</button>
              </div>
           </div>
        </div>
        <div className="mt-40 text-center text-[13px] text-white/90 font-black uppercase tracking-[1em] drop-shadow-[0_0_100px_rgba(255,255,255,0.4)]">
           © 2028 Nexus Systems. Neural Verification Clear.
        </div>
      </footer>
    </div>
  );
};
