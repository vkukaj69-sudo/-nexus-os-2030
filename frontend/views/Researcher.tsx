
import React, { useState } from 'react';
import { UserSearch, Search, TrendingUp, Users, Target, BarChart, ArrowUpRight, Zap, Globe, Share2, Twitter, Youtube, Linkedin, Link2, ShieldCheck, RefreshCw, ExternalLink, Globe2, Facebook, Instagram } from 'lucide-react';
import { analyzeAccount } from '../geminiService';
import { CreatorAccount, PlatformType } from '../types';

export const Researcher: React.FC = () => {
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('X');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreatorAccount | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [linking, setLinking] = useState(false);

  const handleSearch = async () => {
    if (!handle.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeAccount(handle, platform);
      setResult(res);
    } catch (error) {
      console.error('Account analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAPI = () => {
    setLinking(true);
    setTimeout(() => {
      setIsConnected(true);
      setLinking(false);
    }, 1500);
  };

  const platforms: { id: PlatformType, icon: any }[] = [
    { id: 'X', icon: Twitter },
    { id: 'LinkedIn', icon: Linkedin },
    { id: 'Facebook', icon: Facebook },
    { id: 'Instagram', icon: Instagram },
    { id: 'YouTube', icon: Youtube },
    { id: 'Reddit', icon: Globe },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gradient">Sovereign Intelligence Lab</h1>
          <p className="text-gray-300 text-lg font-medium">Analyze patterns and extract live data from the digital stack.</p>
        </div>
        
        <button 
          onClick={handleConnectAPI}
          disabled={isConnected || linking}
          className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all border-2 ${
            isConnected 
              ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
              : 'bg-violet-600 text-white border-white/20 hover:bg-violet-500 shadow-xl'
          }`}
        >
          {linking ? <RefreshCw className="animate-spin" size={16} /> : isConnected ? <ShieldCheck size={16} /> : <Link2 size={16} />}
          {isConnected ? 'API Node Linked' : 'Connect Live APIs'}
        </button>
      </header>

      <div className="glass-card p-6 md:p-10 max-w-4xl mx-auto space-y-6 border-violet-500/20 shadow-2xl bg-white/[0.02]">
        <div className="flex flex-wrap gap-2 justify-center bg-white/5 p-1.5 rounded-2xl w-fit mx-auto border border-white/10">
          {platforms.map(p => (
            <button 
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 border ${platform === p.id ? 'bg-violet-600 text-white border-violet-500 shadow-xl' : 'text-gray-500 hover:text-white border-transparent'}`}
            >
              <p.icon size={18} />
              <span className="text-xs font-black uppercase tracking-widest">{p.id}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-violet-400">
              <span className="text-base font-black">@</span>
            </div>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={`${platform} Handle, Profile URL or Community...`}
              className="w-full pl-12 pr-6 py-4 bg-black/40 border-2 border-white/10 rounded-2xl text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-gray-600 font-medium"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !handle}
            className="px-10 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center transition-all shadow-[0_0_30px_rgba(139,92,246,0.4)] shrink-0 border-2 border-white/10"
          >
            {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-3" /> : <Search size={20} className="mr-3" />}
            {isConnected ? 'Scrape Live Node' : 'Extract Intelligence'}
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in duration-500 pb-20">
          <div className="lg:col-span-1 space-y-8">
            <div className="glass-card p-10 text-center relative overflow-hidden border-violet-500/30 bg-white/[0.02] shadow-2xl border-2">
               <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 mx-auto mb-6 border-4 border-white/20 overflow-hidden shadow-2xl">
                  <img src={`https://picsum.photos/seed/${result.username}/200`} alt="Profile Intelligence" className="w-full h-full object-cover" />
               </div>
               <h2 className="text-3xl font-black text-white tracking-tight">@{result.username}</h2>
               <p className="text-sm text-violet-300 font-black mb-3 uppercase tracking-[0.3em]">{platform} PROFILED</p>
               <p className="text-base text-gray-200 font-medium italic mb-8 px-4 leading-relaxed">"{result.niche}"</p>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.06] p-5 rounded-2xl border border-white/10 shadow-inner">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">{platform === 'YouTube' ? 'SUB_COUNT' : 'FOLLOWERS'}</p>
                    <p className="text-xl font-black text-white">{result.stats.followers}</p>
                  </div>
                  <div className="bg-white/[0.06] p-5 rounded-2xl border border-white/10 shadow-inner">
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">ENGAGEMENT</p>
                    <p className="text-xl font-black text-emerald-400">{result.stats.avgEngagement}</p>
                  </div>
               </div>
            </div>

            {result.sources && result.sources.length > 0 && (
              <div className="glass-card p-8 space-y-6 border-white/10 bg-white/[0.01]">
                 <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Globe2 size={14} className="text-blue-400" /> Search Grounding
                 </h4>
                 <div className="space-y-4">
                    {result.sources.map((s, i) => (
                      <a key={i} href={s.uri} target="_blank" className="block p-4 bg-black/40 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all group">
                         <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{s.title}</p>
                         <p className="text-[9px] text-gray-500 mt-1 truncate">{s.uri}</p>
                      </a>
                    ))}
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 md:p-12 border-white/10 shadow-2xl bg-white/[0.01]">
               <h3 className="text-2xl font-black mb-10 flex items-center text-white tracking-tight uppercase tracking-widest">
                 <Target size={24} className="mr-4 text-violet-400" />
                 High-Performing Native Hooks
               </h3>
               <div className="grid grid-cols-1 gap-6">
                 {result.topPosts.map((post, i) => (
                   <div key={i} className="bg-white/[0.04] border border-white/10 p-8 rounded-3xl hover:bg-white/[0.08] transition-all cursor-pointer group shadow-xl relative overflow-hidden border-2">
                     <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black bg-violet-600 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg">Pattern Breakdown #{i+1}</span>
                        <Share2 size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                     </div>
                     <p className="text-xl md:text-2xl text-white leading-relaxed font-sans font-black italic selection:bg-violet-500/30">
                       "{post}"
                     </p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
