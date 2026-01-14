
import React from 'react';
import { LayoutGrid, Command, PenTool, Clapperboard, Database, Building2, ShieldCheck, Lock, Map } from 'lucide-react';
import { ToolType } from '../types';

interface MobileNavProps {
  activeTool: ToolType;
  onNavClick: (tool: ToolType, label: string, locked: boolean) => void;
  isPro?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTool, onNavClick, isPro }) => {
  const items = [
    { id: ToolType.DASHBOARD, icon: LayoutGrid, label: 'Sight' },
    { id: ToolType.ROADMAP_LAB, icon: Map, label: 'Evo', proOnly: true },
    { id: ToolType.IDENTITY_NODE, icon: Building2, label: 'Legal', proOnly: true },
    { id: ToolType.SOVEREIGN_CORE, icon: Command, label: 'Oracle', proOnly: true },
    { id: ToolType.COGNITIVE_COMPOSER, icon: PenTool, label: 'Create' },
    { id: ToolType.VIDEO_STUDIO, icon: Clapperboard, label: 'Motion', proOnly: true },
    { id: ToolType.DIGITAL_SOUL, icon: Database, label: 'DNA', proOnly: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-[100] px-4 flex items-center justify-between pb-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTool === item.id;
        const isLocked = !!item.proOnly && !isPro;
        
        return (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id, item.label, isLocked)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 relative ${
              isActive ? 'text-violet-400 scale-110' : isLocked ? 'text-gray-700' : 'text-gray-500'
            }`}
          >
            <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`}>
              <Icon size={20} />
            </div>
            {isLocked && <Lock size={8} className="absolute top-2 right-2 text-gray-800" />}
            <span className="text-[8px] font-black uppercase tracking-widest truncate w-full text-center">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
