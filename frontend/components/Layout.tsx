
import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  BrainCircuit, 
  PenTool, 
  Zap, 
  Database,
  Activity,
  Command,
  LogOut,
  LayoutGrid,
  Map,
  ChevronDown,
  Layers,
  RefreshCw,
  Wallet,
  Menu,
  X,
  ScanEye,
  Sparkles,
  Quote,
  ShieldCheck,
  Shield,
  Clapperboard,
  Search,
  Atom,
  Bot,
  Terminal,
  Activity as Heartbeat,
  GitBranch,
  Factory,
  Radio,
  Target,
  Building2,
  Users,
  Fingerprint,
  Lock,
  ArrowRight,
  Settings
} from 'lucide-react';
import { ToolType, UserRole } from '../types';
import { CommandBar } from './CommandBar';
import { MobileNav } from './MobileNav';

const SidebarItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void, badge?: string, highlight?: boolean, locked?: boolean }> = ({ icon: Icon, label, active, onClick, badge, highlight, locked }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-700 group relative overflow-hidden ${
      active 
        ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.15)]' 
        : highlight ? 'bg-violet-500/5 text-violet-300 border border-violet-500/10' : 'text-gray-500 hover:text-gray-200'
    } ${locked ? 'opacity-40 grayscale-[0.5]' : ''}`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 shadow-[0_0_20px_rgba(139,92,246,1)]" />}
    <div className={`${active ? 'text-violet-400 scale-110' : highlight ? 'text-violet-400' : 'text-gray-600 group-hover:text-gray-400'} transition-transform duration-500`}>
      <Icon size={18} />
    </div>
    <span className={`font-black text-[11px] uppercase tracking-[0.3em] transition-all ${active ? 'tracking-[0.5em]' : ''}`}>{label}</span>
    {locked ? (
      <Lock size={12} className="ml-auto text-gray-700 group-hover:text-violet-500 transition-colors" />
    ) : badge && (
      <span className={`ml-auto text-[8px] font-black px-2 py-1 rounded-md border uppercase tracking-widest ${highlight ? 'bg-violet-500/20 text-violet-400 border-violet-500/30 animate-pulse' : 'bg-white/5 text-gray-500 border-white/10'}`}>{badge}</span>
    )}
  </button>
);

const UpgradeModal: React.FC<{ isOpen: boolean, onClose: () => void, featureName: string, onNavigate: (tool: ToolType) => void }> = ({ isOpen, onClose, featureName, onNavigate }) => {
  if (!isOpen) return null;

  const featureData: Record<string, string> = {
    'The Oracle': 'Master goal orchestration and Genesis Blitz protocol execution. Command the Agentic Mesh from a centralized intelligence hub.',
    'Video Studio': 'Cinematic motion synthesis using high-fidelity Veo 3.1 nodes. Create 4K visuals from raw narrative seeds.',
    'Neural Link': 'Direct low-latency telepresence for multi-modal brainstorming in a TEE-isolated hardware environment.',
    'Digital Soul': 'Advanced semantic fingerprinting and identity knowledge graph persistence. Ensure 100% brand consistency.',
    'Foundry': 'Physical-world asset manifestation tracking including treasury links, LLC status, and liability shields.',
    'Manifesto Lab': 'High-status philosophical content synthesis designed to establish unmatched founder authority in your niche.',
    'Dominion Scryer': 'Competitive intelligence mapping and territory control visualization for the attention economy.',
    'Perimeter': 'Zero-Trust hardware isolation monitoring and attestation logs for your private production enclaves.',
    'Protocol Users': 'Multi-node team management and sovereign citizen ledger access for agency-level operations.',
    'Evo Roadmap': 'Complete strategic planning from Genesis to Sovereign Independence.'
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-card bg-black border-2 border-violet-500/30 shadow-[0_0_100px_rgba(139,92,246,0.3)] overflow-hidden rounded-[3rem] animate-in zoom-in-95 duration-500">
        <div className="p-12 space-y-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-violet-600/10 border-2 border-violet-500/30 flex items-center justify-center text-violet-400 mx-auto shadow-2xl relative">
            <Lock size={40} className="animate-pulse" />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Upgrade to Sovereign</h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Unlock <span className="text-white font-bold">{featureName}</span> and full OS capabilities.
            </p>
            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-sm text-gray-500 italic leading-relaxed">
              {featureData[featureName] || 'Access the high-leverage tools of the Nexus Operating System.'}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { onNavigate(ToolType.PRICING); onClose(); }}
              className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_0_50px_rgba(139,92,246,0.4)] flex items-center justify-center gap-3"
            >
              Upgrade to Pro <ArrowRight size={16} />
            </button>
            <button 
              onClick={onClose}
              className="w-full py-5 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white border border-white/10 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AppLayout: React.FC<{ 
  children: React.ReactNode; 
  activeTool: ToolType; 
  setActiveTool: (tool: ToolType) => void;
  onExit?: () => void;
  role: string | UserRole;
  onWorkspaceChange?: (id: string) => void;
  isDominion?: boolean;
}> = ({ children, activeTool, setActiveTool, onExit, role, onWorkspaceChange, isDominion }) => {
  const [hasKey, setHasKey] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [purity, setPurity] = useState(98.2);
  const [isP1Verified, setIsP1Verified] = useState(() => localStorage.getItem('nexus_phase_1_verified') === 'true');
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);
  
  // Role Logic: admin, pro, or agency roles grant full access
  const roleStr = String(role || 'citizen').toLowerCase();
  const isFullAccess = ['admin', 'pro', 'agency'].includes(roleStr);
  
  const handleNavClick = (tool: ToolType, label: string, isLocked: boolean) => {
    if (isLocked) {
      setUpgradeTarget(label);
    } else {
      setActiveTool(tool);
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  return (
    <div className={`flex h-screen text-white overflow-hidden transition-all duration-[2000ms] ${isDominion ? 'bg-[#000804] selection:bg-emerald-500/30' : 'bg-[#020202] selection:bg-violet-500/30'}`}>
      <CommandBar isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} onNavigate={(tool) => {
        // Simple mapping for command bar: dashboard/composer are public, others check pro
        const publicTools = [ToolType.DASHBOARD, ToolType.COGNITIVE_COMPOSER, ToolType.SETTINGS, ToolType.PRICING];
        if (!isFullAccess && !publicTools.includes(tool)) {
           setUpgradeTarget("Sovereign Module");
        } else {
           setActiveTool(tool);
        }
      }} />
      
      <UpgradeModal 
        isOpen={!!upgradeTarget} 
        onClose={() => setUpgradeTarget(null)} 
        featureName={upgradeTarget || ''} 
        onNavigate={setActiveTool}
      />

      <aside className="w-80 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col hidden lg:flex shrink-0 relative z-50">
        <div className="p-10 pb-12 flex items-center space-x-5">
          <div className={`w-14 h-14 rounded-[1.5rem] bg-gradient-to-br flex items-center justify-center shadow-2xl border border-white/10 group overflow-hidden relative transition-all duration-[2000ms] ${isDominion ? 'from-teal-600 to-emerald-600' : 'from-violet-600 to-blue-600'}`}>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
            <Atom className="w-8 h-8 text-white group-hover:rotate-180 transition-transform duration-1000" />
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter block leading-none text-white">NEXUS</span>
            <span className={`text-[9px] font-black uppercase tracking-[0.7em] mt-2 block opacity-80 transition-all duration-[2000ms] ${isDominion ? 'text-emerald-400' : 'text-violet-400'}`}>
              {isFullAccess ? 'Sovereign Core' : 'Citizen Node'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-12 scrollbar-hide pb-10">
          <div className="space-y-1">
             <SidebarItem 
              icon={LayoutGrid} 
              label="Dominion View" 
              active={activeTool === ToolType.DASHBOARD} 
              onClick={() => handleNavClick(ToolType.DASHBOARD, 'Dominion View', false)} 
             />
             <SidebarItem 
              icon={Radio} 
              label="Neural Link" 
              active={activeTool === ToolType.NEURAL_LINK} 
              onClick={() => handleNavClick(ToolType.NEURAL_LINK, 'Neural Link', !isFullAccess)} 
              badge="LIVE" 
              highlight={isFullAccess} 
              locked={!isFullAccess} 
             />
             <SidebarItem 
              icon={Map} 
              label="Evo Roadmap" 
              active={activeTool === ToolType.ROADMAP_LAB} 
              onClick={() => handleNavClick(ToolType.ROADMAP_LAB, 'Evo Roadmap', !isFullAccess)} 
              badge={isP1Verified ? "PHASE 02" : "PHASE 01"} 
              locked={!isFullAccess} 
             />
          </div>

          <div className="space-y-1">
             <p className="px-6 text-[9px] font-black text-gray-600 uppercase tracking-[0.6em] mb-4">The Oracle Core</p>
             <SidebarItem 
              icon={Building2} 
              label="Identity Node" 
              active={activeTool === ToolType.IDENTITY_NODE} 
              onClick={() => handleNavClick(ToolType.IDENTITY_NODE, 'Identity Node', !isFullAccess)} 
              locked={!isFullAccess} 
             />
             
             <SidebarItem 
              icon={Command} 
              label="Orchestrator" 
              active={activeTool === ToolType.SOVEREIGN_CORE} 
              onClick={() => handleNavClick(ToolType.SOVEREIGN_CORE, 'The Oracle', !isFullAccess)} 
              badge="PRO" 
              locked={!isFullAccess} 
             />
             <SidebarItem 
              icon={Target} 
              label="Dominion Scry" 
              active={activeTool === ToolType.DOMINION_SCRYER} 
              onClick={() => handleNavClick(ToolType.DOMINION_SCRYER, 'Dominion Scryer', !isFullAccess)} 
              locked={!isFullAccess} 
             />
             <SidebarItem 
              icon={Factory} 
              label="Foundry" 
              active={activeTool === ToolType.FOUNDRY} 
              onClick={() => handleNavClick(ToolType.FOUNDRY, 'Foundry', !isFullAccess)} 
              badge="$2.6M" 
              locked={!isFullAccess} 
             />
             
             <SidebarItem 
              icon={Database} 
              label="Digital Soul" 
              active={activeTool === ToolType.DIGITAL_SOUL} 
              onClick={() => handleNavClick(ToolType.DIGITAL_SOUL, 'Digital Soul', !isFullAccess)} 
              badge={`${purity}%`} 
              locked={!isFullAccess} 
             />
          </div>

          <div className="space-y-1">
             <p className="px-6 text-[9px] font-black text-gray-600 uppercase tracking-[0.6em] mb-4">Synthesis Terminal</p>
             <SidebarItem 
              icon={PenTool} 
              label="Composer" 
              active={activeTool === ToolType.COGNITIVE_COMPOSER} 
              onClick={() => handleNavClick(ToolType.COGNITIVE_COMPOSER, 'Composer', false)} 
             />
             <SidebarItem 
              icon={Clapperboard} 
              label="Video Studio" 
              active={activeTool === ToolType.VIDEO_STUDIO} 
              onClick={() => handleNavClick(ToolType.VIDEO_STUDIO, 'Video Studio', !isFullAccess)} 
              badge="VEO" 
              locked={!isFullAccess} 
             />
             <SidebarItem 
              icon={Sparkles} 
              label="Manifesto Lab" 
              active={activeTool === ToolType.MANIFESTO_LAB} 
              onClick={() => handleNavClick(ToolType.MANIFESTO_LAB, 'Manifesto Lab', !isFullAccess)} 
              locked={!isFullAccess} 
             />
          </div>

          <div className="space-y-1 pt-6 border-t border-white/5">
             <SidebarItem 
              icon={ShieldCheck} 
              label="Perimeter" 
              active={activeTool === ToolType.SECURITY_NODE} 
              onClick={() => handleNavClick(ToolType.SECURITY_NODE, 'Perimeter', !isFullAccess)} 
              locked={!isFullAccess} 
             />
             {isFullAccess && (
               <SidebarItem 
                icon={Settings} 
                label="Vault Settings" 
                active={activeTool === ToolType.SETTINGS} 
                onClick={() => handleNavClick(ToolType.SETTINGS, 'Vault Settings', false)} 
                badge="KEYS"
               />
             )}
             <SidebarItem 
              icon={Users} 
              label="Protocol Users" 
              active={activeTool === ToolType.USER_MANAGEMENT} 
              onClick={() => handleNavClick(ToolType.USER_MANAGEMENT, 'Protocol Users', !isFullAccess)} 
              badge="ADMIN" 
              locked={!isFullAccess} 
             />
          </div>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-black/40">
          <button onClick={onExit} className="w-full flex items-center space-x-4 px-6 py-5 rounded-2xl text-gray-600 hover:text-red-400 transition-all uppercase text-[11px] font-black tracking-widest group">
            <LogOut size={18} />
            <span>Terminate Link</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-24 lg:h-28 px-8 lg:px-16 flex items-center justify-between z-40 bg-transparent shrink-0">
          <div className="flex items-center gap-4 lg:gap-10">
            <h2 className="text-[10px] lg:text-[12px] font-black text-white uppercase tracking-[0.5em] lg:tracking-[1em] opacity-40 truncate">{activeTool.replace('_', ' ')}</h2>
          </div>
          
          <div className="flex items-center space-x-6">
             <div className={`hidden sm:flex items-center gap-4 px-6 py-3 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all duration-[2000ms] ${isDominion ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : isFullAccess ? 'border-violet-500/30 text-violet-400 bg-violet-600/10' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                {isDominion ? <Sparkles size={14} /> : isFullAccess ? <Shield size={14} /> : <Lock size={14} />}
                {isDominion ? 'System Domain Manifested' : isFullAccess ? 'Sovereign Dominion Mode' : 'Restricted Guest Mode'}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-16 relative scrollbar-hide pb-40 lg:pb-16">
          <div className="max-w-[1700px] mx-auto relative z-10">
            {children}
          </div>
        </div>
        
        <MobileNav 
          activeTool={activeTool} 
          onNavClick={(tool, label, locked) => handleNavClick(tool, label, locked)} 
          isPro={isFullAccess} 
        />
      </main>
    </div>
  );
};
