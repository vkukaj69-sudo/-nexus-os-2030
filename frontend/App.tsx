
import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/Layout';
import { ToolType, UserRole, LegalSectionId } from './types';
import { nexusApi } from './api/nexusClient';
import { Dashboard } from './views/Dashboard';
import { DigitalSoul } from './views/DigitalSoul';
import { SovereignCore } from './views/SovereignCore';
import { Composer } from './views/Composer';
import { IdentityNode } from './views/IdentityNode';
import { AlgoAnalyzer } from './views/AlgoAnalyzer';
import { ImpactSimulator } from './views/ImpactSimulator';
import { BrainDump } from './views/BrainDump';
import { VoiceCoach } from './views/VoiceCoach';
import { LandingPage } from './views/Landing';
import { AgentHub } from './views/AgentHub';
import { ReplyGuy } from './views/ReplyGuy';
import { Researcher } from './views/Researcher';
import { TrendsLab } from './views/TrendsLab';
import { LegalView } from './views/Legal';
import { UserManagement } from './views/UserManagement';
import { HistoryHub } from './views/HistoryHub';
import { LibraryView } from './views/Library';
import { ProLab } from './views/ProLab';
import { FunnelBuilder } from './views/FunnelBuilder';
import { BrandLab } from './views/BrandLab';
import { DigitalTwin } from './views/DigitalTwin';
import { KnowledgeGraph } from './views/KnowledgeGraph';
import { ComputerUse } from './views/ComputerUse';
import { SovereignPerimeter } from './views/SovereignPerimeter';
import { VideoStudio } from './views/VideoStudio';
import { RoadmapLab } from './views/RoadmapLab';
import { ManifestoLab } from './views/ManifestoLab';
import { NeuralLink } from './views/NeuralLink';
import { Foundry } from './views/Foundry';
import { DominionScryer } from './views/DominionScryer';
import { Settings } from './views/Settings';
import { Pricing } from './views/Pricing';
import { SoulProvider } from './context/SoulContext';
import { SovereignErrorBoundary } from './components/ErrorBoundary';
import { NeuralOnboarding } from './views/NeuralOnboarding';
import { Shield, Lock, ArrowRight, Eye, EyeOff, Atom, Loader2, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.DASHBOARD);
  
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('nexus_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [showStudio, setShowStudio] = useState(() => !!user && !!nexusApi.getToken());
  const [passcode, setPasscode] = useState('');
  const [email, setEmail] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [initStep, setInitStep] = useState(0);
  const [isDominionActive, setIsDominionActive] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [selectedOnboardingPlan, setSelectedOnboardingPlan] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Public Routing State
  const [activePublicView, setActivePublicView] = useState<'landing' | 'legal'>('landing');
  const [targetLegalSection, setTargetLegalSection] = useState<LegalSectionId>('accord');

  const initMessages = [
    "Linking to Production Vault...",
    "TEE Hardware Attestation...",
    "AMD SEV-SNP Handshake Verified.",
    "Synchronizing Digital Soul...",
    "Access Authorized."
  ];

  const syncRouteFromUrl = () => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    
    const checkLegal = (p: string) => {
        if (p.includes('accord')) return 'accord';
        if (p.includes('dominion') || p.includes('privacy')) return 'dominion';
        if (p.includes('reciprocity') || p.includes('refund')) return 'reciprocity';
        if (p.includes('copyright') || p.includes('dmca')) return 'copyright';
        return null;
    }

    const section = checkLegal(path) || checkLegal(hash);
    if (section) {
        setTargetLegalSection(section as LegalSectionId);
        setActivePublicView('legal');
    } else {
        setActivePublicView('landing');
    }
  };

  useEffect(() => {
    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    window.addEventListener('hashchange', syncRouteFromUrl);
    return () => {
      window.removeEventListener('popstate', syncRouteFromUrl);
      window.removeEventListener('hashchange', syncRouteFromUrl);
    };
  }, []);

  // Strict Field Reset when entering auth screen
  useEffect(() => {
    if (showStudio && !user) {
      setEmail('');
      setPasscode('');
    }
  }, [showStudio, !!user]);

  const handleAuth = async () => {
    if (!email || !passcode) {
      setAuthError('Identity and Master Key required.');
      return;
    }

    setIsInitializing(true);
    setAuthError('');
    try {
      let data;
      if (isRegisterMode) {
        await nexusApi.register({ email, password: passcode });
        data = await nexusApi.login({ email, password: passcode });
      } else {
        data = await nexusApi.login({ email, password: passcode });
      }
      
      if (data && data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
        setUser(data.user);
        
        let step = 0;
        const interval = setInterval(async () => {
          if (step < initMessages.length - 1) {
            step++;
            setInitStep(step);
          } else {
            clearInterval(interval);
            
            // Check user role for privileged access
            const role = String(data.user.role || 'citizen').toLowerCase();
            const isPrivileged = ['admin', 'pro', 'agency'].includes(role);

            if (isPrivileged) {
              // Privileged users (Admin, Pro, Agency) always go straight to dashboard
              setIsInitializing(false);
              setShowStudio(true);
              setSelectedOnboardingPlan(null); // Clear any pending intent
            } else if (selectedOnboardingPlan && selectedOnboardingPlan !== 'Spark') {
              // Citizen users who clicked upgrade are sent to Stripe
              try {
                const priceIds: Record<string, string> = {
                  'Pro': 'price_1SnS16K9R2Fq5EmF0Qes5z2k',
                  'Agency': 'price_1SnS1vK9R2Fq5EmFIDOBhYh7'
                };
                // Fix: Calling correct method createCheckoutSession instead of createStripeCheckout
                const res = await nexusApi.createCheckoutSession(priceIds[selectedOnboardingPlan]);
                if (res.url) {
                  window.location.href = res.url;
                  return; // Redirection handled by browser
                }
              } catch (e) {
                console.error("Stripe direct redirect failed:", e);
                setIsInitializing(false);
                setShowOnboarding(true);
              }
            } else {
              // Normal flow for citizen login or free plan
              setIsInitializing(false);
              if (selectedOnboardingPlan === 'Spark') {
                setShowOnboarding(true);
              } else {
                setShowStudio(true);
              }
            }
          }
        }, 300);
      } else {
        throw new Error(data?.error || 'Vault Node handshake failed.');
      }
    } catch (e: any) {
      setIsInitializing(false);
      setAuthError(e.message || 'RESTRICTED_NODE_ACCESS');
    }
  };

  const handleLegal = (section: LegalSectionId) => {
    setTargetLegalSection(section);
    setActivePublicView('legal');
    window.location.hash = section;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (!user) return null;
    switch (activeTool) {
      case ToolType.DASHBOARD: return <Dashboard />;
      case ToolType.SOVEREIGN_CORE: return <SovereignCore />;
      case ToolType.SECURITY_NODE: return <SovereignPerimeter />;
      case ToolType.VIDEO_STUDIO: return <VideoStudio />;
      case ToolType.DIGITAL_SOUL: return <DigitalSoul />;
      case ToolType.KNOWLEDGE_GRAPH: return <KnowledgeGraph />;
      case ToolType.DIGITAL_TWIN: return <DigitalTwin />;
      case ToolType.COMPUTER_USE: return <ComputerUse />;
      case ToolType.COGNITIVE_COMPOSER: return <Composer onNavigate={setActiveTool} />;
      case ToolType.IDENTITY_NODE: return <IdentityNode onNavigate={setActiveTool} />;
      case ToolType.ALGO_ANALYZER: return <AlgoAnalyzer />;
      case ToolType.IMPACT_SIMULATOR: return <ImpactSimulator />;
      case ToolType.BRAIN_DUMP: return <BrainDump />;
      case ToolType.COGNITIVE_PARTNER: return <VoiceCoach />;
      case ToolType.NEURAL_LINK: return <NeuralLink />;
      case ToolType.FOUNDRY: return <Foundry />;
      case ToolType.DOMINION_SCRYER: return <DominionScryer onTakeover={() => setIsDominionActive(true)} />;
      case ToolType.AGENT_HUB: return <AgentHub onNavigate={setActiveTool} />;
      case ToolType.REPLY_GUY: return <ReplyGuy />;
      case ToolType.RESEARCHER: return <Researcher />;
      case ToolType.TRENDS_LAB: return <TrendsLab />;
      case ToolType.LEGAL: return <LegalView initialSection={targetLegalSection} />;
      case ToolType.USER_MANAGEMENT: return <UserManagement />;
      case ToolType.HISTORY_HUB: return <HistoryHub />;
      case ToolType.LIBRARY: return <LibraryView />;
      case ToolType.PRO_LAB: return <ProLab />;
      case ToolType.FUNNEL_BUILDER: return <FunnelBuilder />;
      case ToolType.BRAND_LAB: return <BrandLab />;
      case ToolType.ROADMAP_LAB: return <RoadmapLab onNavigate={setActiveTool} />;
      case ToolType.MANIFESTO_LAB: return <ManifestoLab />;
      case ToolType.SETTINGS: return <Settings />;
      case ToolType.PRICING: return <Pricing />;
      default: return <Dashboard />;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center space-y-12 font-['Outfit']">
         <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_120px_rgba(139,92,246,0.6)] relative">
            <Atom className="text-white w-16 h-16 animate-spin" style={{ animationDuration: '10s' }} />
         </div>
         <div className="space-y-6 text-center">
            <h2 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.8em]">Nexus Production Uplink</h2>
            <p className="text-3xl font-black text-white tracking-tight">{initMessages[initStep]}</p>
         </div>
      </div>
    );
  }

  if (showOnboarding && user) {
    return (
      <NeuralOnboarding 
        selectedPlan={selectedOnboardingPlan || 'Pro'} 
        onCancel={() => { setShowOnboarding(false); setShowStudio(true); }} 
        onComplete={() => { setShowOnboarding(false); setShowStudio(true); }} 
      />
    );
  }

  if (showStudio && !user) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-8 relative overflow-hidden font-['Outfit']">
        <div className="max-w-2xl w-full relative z-10">
          <div className="glass-card p-12 lg:p-20 border-violet-500/30 space-y-12 flex flex-col items-center rounded-[4rem] text-center shadow-[0_0_100px_rgba(139,92,246,0.15)] bg-black/80 backdrop-blur-3xl border-2">
            <div className="w-24 h-24 rounded-3xl bg-violet-600/10 border-2 border-violet-500/30 flex items-center justify-center text-violet-400 shadow-2xl relative">
              <Shield size={48} />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
            </div>
            
            <div className="space-y-4">
               <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{isRegisterMode ? 'New Node' : 'Vault Entry'}</h2>
               <p className="text-gray-500 uppercase tracking-widest text-[10px]">{isRegisterMode ? 'Initialize Identity Record' : 'Access Hardware Enclave'}</p>
            </div>

            <div className="space-y-6 w-full">
               <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Vault Identity (Email)"
                  autoComplete="off"
                  className="w-full bg-black border-2 border-white/10 rounded-2xl px-8 py-5 text-lg text-white outline-none focus:border-violet-500 transition-all font-mono"
               />
               <div className="relative">
                  <input 
                    type={showPass ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Sovereign Master Key"
                    autoComplete="new-password"
                    className="w-full bg-black border-2 border-white/10 rounded-2xl px-8 py-5 text-lg text-white outline-none focus:border-violet-500 transition-all font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                  />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-700 hover:text-violet-400 transition-colors">
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
               </div>
               {authError && <p className="text-red-500 font-black text-[10px] uppercase text-center tracking-[0.3em]">{authError}</p>}
               
               <button onClick={handleAuth} className="w-full py-6 bg-violet-600 hover:bg-violet-500 text-white rounded-[2.5rem] font-black text-base uppercase tracking-[0.5em] transition-all shadow-[0_0_60px_rgba(139,92,246,0.4)] border-2 border-white/10">
                 {isRegisterMode ? 'Deploy Identity' : 'Establish Link'} <ArrowRight size={20} className="inline ml-3"/>
               </button>

               <button 
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-violet-400 transition-colors"
                >
                  {isRegisterMode ? 'Already manifested? Log in' : 'New sovereign? Provision Node'}
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !showStudio) {
    if (activePublicView === 'legal') {
        return (
            <div className="min-h-screen bg-[#020202] selection:bg-violet-500/30 overflow-y-auto font-['Outfit']">
                <nav className="p-8 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-3xl sticky top-0 z-[100]">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-xl">
                           <Zap size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tighter uppercase text-white">Nexus Legal</span>
                     </div>
                     <button 
                        onClick={() => { setActivePublicView('landing'); window.location.hash = ''; window.history.pushState({}, '', '/'); }} 
                        className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                     >
                        Back to Orbit
                     </button>
                </nav>
                <div className="p-8 lg:p-20">
                    <LegalView initialSection={targetLegalSection} />
                </div>
            </div>
        );
    }
    return (
      <LandingPage 
        onEnter={(plan) => { 
          setSelectedOnboardingPlan(plan || 'Pro'); 
          setIsRegisterMode(true); 
          setShowStudio(true); 
        }} 
        onLogin={() => { 
          setIsRegisterMode(false); 
          setShowStudio(true); 
        }} 
        onLegal={handleLegal} 
      />
    );
  }

  return (
    <SoulProvider>
      <AppLayout 
        key={user?.id || 'session'}
        activeTool={activeTool} 
        setActiveTool={setActiveTool}
        onExit={() => { setShowStudio(false); setUser(null); nexusApi.logout(); }}
        role={user?.role || UserRole.CUSTOMER}
        isDominion={isDominionActive}
      >
        <SovereignErrorBoundary>
          {renderContent()}
        </SovereignErrorBoundary>
      </AppLayout>
    </SoulProvider>
  );
};

export default App;
