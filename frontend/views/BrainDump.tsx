
import React, { useState } from 'react';
import { Lightbulb, Send, Copy, Check, Sparkles, Brain, List, MessageSquare } from 'lucide-react';
import { convertBrainDump } from '../geminiService';

export const BrainDump: React.FC = () => {
  const [dump, setDump] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ posts: string[], threads: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'threads'>('posts');

  const handleProcess = async () => {
    if (!dump.trim()) return;
    setLoading(true);
    try {
      const res = await convertBrainDump(dump);
      setResult(res);
    } catch (error) {
      console.error('Processing dump failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gradient">Brain Dump Refiner</h1>
        <p className="text-gray-300">Turn messy voice notes or raw thoughts into structured content pillars.</p>
      </div>

      <div className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden border-violet-500/20">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain size={120} className="text-violet-500" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <label className="text-xs font-black text-violet-400 uppercase tracking-widest flex items-center">
            <Lightbulb size={16} className="mr-2" />
            Thought Capture Protocol
          </label>
          <textarea
            value={dump}
            onChange={(e) => setDump(e.target.value)}
            placeholder="Type your raw thoughts, random idea sparks, or meeting notes here..."
            className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all leading-relaxed font-sans placeholder:text-gray-600"
          />
          <button
            onClick={handleProcess}
            disabled={loading || !dump}
            className="w-full py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : <Sparkles size={20} className="mr-2" />}
            Refine Into Content Assets
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex items-center justify-center gap-2 p-1.5 bg-white/5 rounded-2xl w-fit mx-auto border border-white/10 shadow-2xl">
            <button 
              onClick={() => setActiveTab('posts')}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'posts' ? 'bg-violet-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
            >
              <List size={16} /> Short Posts ({result.posts.length})
            </button>
            <button 
              onClick={() => setActiveTab('threads')}
              className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'threads' ? 'bg-violet-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}
            >
              <MessageSquare size={16} /> Threads ({result.threads.length})
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {(activeTab === 'posts' ? result.posts : result.threads).map((item, i) => (
              <div key={i} className="glass-card p-8 border-white/10 hover:border-violet-500/40 transition-all group bg-white/[0.02]">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center text-violet-300 font-black text-sm border border-violet-500/20">
                      #{i + 1}
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{activeTab === 'posts' ? 'Ready Post' : 'Thread Sequence Segment'}</span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(item)}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all shadow-lg"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="text-white text-base md:text-xl leading-relaxed whitespace-pre-wrap font-medium font-sans selection:bg-violet-500/30">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
