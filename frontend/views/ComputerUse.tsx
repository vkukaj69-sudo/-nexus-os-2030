
import React, { useState } from 'react';
import { MousePointerClick, Play, Zap, Monitor, RefreshCw, Terminal, Search, Link2, ExternalLink, Activity, ArrowRight, ShieldAlert } from 'lucide-react';
import { ComputerTask } from '../types';

export const ComputerUse: React.FC = () => {
  const [tasks, setTasks] = useState<ComputerTask[]>([
    { id: '1', name: 'Scrape X Metrics', target: 'x.com/analytics', steps: ['Login', 'Wait for render', 'Extract DOM', 'Parse JSON'], status: 'completed' },
    { id: '2', name: 'Reddit Trend Scrape', target: 'reddit.com/r/ai', steps: ['Load sub', 'Sort by Hot', 'Capture threads', 'Analyze Sentiment'], status: 'idle' }
  ]);
  const [executing, setExecuting] = useState<string | null>(null);

  const runTask = (id: string) => {
    setExecuting(id);
    setTimeout(() => {
      setExecuting(null);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="space-y-6">
        <h1 className="text-8xl font-black text-white tracking-tighter leading-none text-gradient">Computer Use</h1>
        <p className="text-gray-300 text-3xl font-bold max-w-4xl leading-relaxed">Agentic UI Automation. The OS now operates the web for you, literally.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-10">
          <div className="glass-card p-12 bg-white/[0.02] border-white/10 shadow-2xl space-y-12">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.5em] flex items-center gap-4">
                  <Monitor size={24} /> UI Macros
                </h3>
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <RefreshCw size={18} />
                </button>
             </div>
             
             <div className="space-y-6">
                {tasks.map(task => (
                  <div key={task.id} className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] hover:border-blue-500/50 transition-all group flex items-center justify-between shadow-lg">
                     <div className="space-y-3">
                        <div className="flex items-center gap-4">
                           <h4 className="text-2xl font-black text-white">{task.name}</h4>
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                             {task.status}
                           </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium font-mono">{task.target}</p>
                     </div>
                     <button 
                       onClick={() => runTask(task.id)}
                       disabled={executing === task.id}
                       className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-110 transition-all disabled:opacity-50"
                     >
                       {executing === task.id ? <RefreshCw className="animate-spin" size={24} /> : <Play fill="currentColor" size={24} />}
                     </button>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-10">
           <div className="glass-card p-12 bg-black border-2 border-white/10 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />
              <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-8">
                 <h3 className="text-[14px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4">
                    <Terminal size={24} className="text-blue-400" /> Execution Stream
                 </h3>
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">DISPOSABLE_VM :: ACTIVE</span>
              </div>
              <div className="flex-1 font-mono text-sm space-y-4 text-emerald-400/80 p-4 overflow-y-auto scrollbar-hide">
                 <p className="flex gap-4"><span>[08:42:11]</span> <span className="text-white">SYS_CALL: chromium.launch({"{headless: true}"})</span></p>
                 <p className="flex gap-4"><span>[08:42:14]</span> <span className="text-white">NAVIGATING TO: x.com/home</span></p>
                 <p className="flex gap-4"><span>[08:42:19]</span> <span className="text-white">WAITING FOR SELECTOR: [data-testid="sidebar"]</span></p>
                 <p className="flex gap-4"><span>[08:42:25]</span> <span className="text-white">IDENTIFYING DATA_NODES...</span></p>
                 {executing && (
                   <p className="flex gap-4 animate-pulse"><span>[08:42:30]</span> <span className="text-blue-400 font-bold">TASK_RUNNING: {tasks.find(t => t.id === executing)?.name}</span></p>
                 )}
                 <div className="pt-10 opacity-20">
                    <p>::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::</p>
                    <p>PROTOCOL_VERSION: 2030.1.4_AUTO</p>
                 </div>
              </div>
              <div className="p-8 bg-amber-500/5 border-t border-white/10 rounded-b-[3.5rem] flex items-center gap-6">
                 <ShieldAlert className="text-amber-400 shrink-0" size={32} />
                 <p className="text-xs text-amber-200/60 leading-relaxed font-bold uppercase tracking-widest">
                   Safety Guard active. AI has 0 access to plain-text credentials. All sessions are transient and destroyed post-execution.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
