
import React, { useState, useEffect } from 'react';
import { Search, Command, X, ArrowRight, Zap, Play } from 'lucide-react';
import { ToolType } from '../types';

interface CommandBarProps {
  onNavigate: (tool: ToolType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onNavigate, isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  
  const commands = [
    { type: ToolType.DASHBOARD, label: 'Dashboard', desc: 'Main Command Overview' },
    { type: ToolType.VIDEO_STUDIO, label: 'Video Studio', desc: 'Veo Cinematic Synthesis' },
    { type: ToolType.SOVEREIGN_CORE, label: 'Orchestrator', desc: 'Master Goal Command' },
    { type: ToolType.COGNITIVE_COMPOSER, label: 'Composer', desc: 'Viral Content Architect' },
    { type: ToolType.RESEARCHER, label: 'Researcher', desc: 'Live Account Scraping' },
    { type: ToolType.TRENDS_LAB, label: 'Trends Lab', desc: 'Breakout Keyword Analysis' },
    { type: ToolType.DIGITAL_SOUL, label: 'Identity Graph', desc: 'Knowledge Base DNA' },
    { type: ToolType.SECURITY_NODE, label: 'Perimeter', desc: 'Hardware Isolation Hub' },
    { type: ToolType.LEGAL, label: 'Governance', desc: 'Trust Constitution' }
  ];

  const filtered = commands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) || 
    c.desc.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); 
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] px-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl glass-card bg-black border-2 border-white/10 shadow-[0_0_100px_rgba(139,92,246,0.3)] overflow-hidden rounded-[2.5rem] animate-in zoom-in-95 duration-300">
        <div className="flex items-center px-8 py-6 border-b border-white/10">
          <Search className="text-violet-400 mr-4" size={24} />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search command node... (type 'video', 'soul', 'security')"
            className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder:text-gray-700"
          />
          <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Command size={10} /> K
          </div>
        </div>

        <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map(cmd => (
                <button 
                  key={cmd.type}
                  onClick={() => { onNavigate(cmd.type); onClose(); }}
                  className="w-full group flex items-center justify-between p-5 rounded-2xl hover:bg-violet-600/10 border border-transparent hover:border-violet-500/30 transition-all text-left"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-3 bg-white/5 rounded-xl text-gray-500 group-hover:text-violet-400 transition-colors">
                       <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-white group-hover:text-violet-300 transition-colors uppercase tracking-tight">{cmd.label}</p>
                      <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{cmd.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-gray-800 group-hover:text-violet-400 transition-all group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-4 opacity-30">
               <X size={48} className="mx-auto text-gray-600" />
               <p className="text-[12px] font-black uppercase tracking-[0.5em]">No matching neural nodes</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-white/10 rounded">ESC</span> to Close
              </span>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-white/10 rounded">ENTER</span> to Launch
              </span>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Ready for Ops</span>
           </div>
        </div>
      </div>
    </div>
  );
};
