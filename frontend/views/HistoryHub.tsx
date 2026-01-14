
import React, { useState, useEffect } from 'react';
import { History, BarChart3, TrendingUp, Zap, Target, ArrowUpRight, Award, Flame } from 'lucide-react';
import { analyzeHistoryData } from '../geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MOCK_HISTORY = "A mix of tech advice, productivity hacks, and AI news. My best posts are usually deep-dives into LLMs or short, punchy productivity tips.";

export const HistoryHub: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    handleLoadHistory();
  }, []);

  const handleLoadHistory = async () => {
    setLoading(true);
    try {
      const data = await analyzeHistoryData(MOCK_HISTORY);
      setInsights(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Threads', val: 85 },
    { name: 'Short Post', val: 92 },
    { name: 'Long Form', val: 74 },
    { name: 'Polls', val: 45 },
    { name: 'Media', val: 88 },
  ];

  const COLORS = ['#8b5cf6', '#a78bfa', '#c084fc', '#d8b4fe', '#f0abfc'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient">History Hub</h1>
          <p className="text-gray-400">Decoding your winning patterns from the last 1,000 posts.</p>
        </div>
        <button onClick={handleLoadHistory} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
          <History size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 md:p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-violet-400" />
            Format Performance Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} dy={10} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px'}} />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Award size={16} />
              The Winning Formula
            </h4>
            {insights ? (
              <div className="space-y-4">
                {insights.winningTopics.map((topic: string, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{topic}</span>
                    <ArrowUpRight size={14} className="text-emerald-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/2" />
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <Flame size={16} />
               High-Conversion Hooks
            </h4>
            <div className="space-y-3">
              {insights?.hookStyles.map((hook: string, i: number) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 text-xs text-gray-400 italic">
                  "{hook}"
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 bg-gradient-to-br from-violet-600/10 to-transparent">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-white shrink-0">
            <Zap size={32} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold mb-2">Strategy Intelligence Report</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {insights?.engagementInsights || "Analyzing your data to generate custom engagement insights..."}
            </p>
          </div>
          <button className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
            Download Report
          </button>
        </div>
      </div>
    </div>
  );
};
