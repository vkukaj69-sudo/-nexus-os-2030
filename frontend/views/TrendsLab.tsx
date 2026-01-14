
import React, { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Zap, Search, ArrowUpRight, Globe, BarChart3, Flame, ExternalLink, Info, Target, Globe2 } from 'lucide-react';
import { getGoogleTrends } from '../geminiService';
import { GoogleTrendItem, SearchSource } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const TrendsLab: React.FC = () => {
  const [niche, setNiche] = useState('AI SaaS & Future Tech');
  const [trends, setTrends] = useState<GoogleTrendItem[]>([]);
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const data = await getGoogleTrends(niche);
      setTrends(data.trends);
      setSources(data.sources);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Week 1', val: 45 },
    { name: 'Week 2', val: 52 },
    { name: 'Week 3', val: 68 },
    { name: 'Week 4', val: 92 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Trends Lab</h1>
          <p className="text-gray-400 max-w-xl">Identify breakout search terms before they hit social media hype cycles.</p>
        </div>
        <div className="flex gap-3">
          <input 
            value={niche} 
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Search niche..."
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none"
          />
          <button onClick={fetchTrends} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            SYNC TRENDS
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)
            ) : trends.map((trend, i) => (
                <div key={i} className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-blue-500/30 transition-all cursor-pointer group">
                  <div className="flex-1 space-y-1">
                    <h4 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{trend.keyword}</h4>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-4">
                      <span className="flex items-center gap-1"><Search size={10} /> {trend.searchVolume}</span>
                      <span className="flex items-center gap-1 text-emerald-400"><ArrowUpRight size={10} /> {trend.growth} Growth</span>
                    </span>
                  </div>
                  <button className="p-3 bg-blue-600/10 text-blue-400 rounded-full hover:bg-blue-600 hover:text-white transition-all">
                     <Target size={18} />
                  </button>
                </div>
              ))
            }
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5">
             <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Globe size={14} /> Global Search Hype
             </h3>
             <div className="h-[200px] -ml-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.2} fill="#3b82f6" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {sources.length > 0 && (
            <div className="glass-card p-6 border-white/10 bg-white/[0.01]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-6">
                 <Globe2 size={14} /> Intelligence Sources
              </h3>
              <div className="space-y-3">
                 {sources.map((s, i) => (
                   <a key={i} href={s.uri} target="_blank" className="block p-3 bg-black/40 border border-white/5 rounded-xl hover:border-blue-500/40 transition-all text-[10px] text-gray-400 hover:text-white truncate">
                      {s.title}
                   </a>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
