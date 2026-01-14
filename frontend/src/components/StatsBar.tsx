'use client';
import { Brain, Zap, Clock, TrendingUp } from 'lucide-react';

interface StatsBarProps {
  insights: any;
}

export default function StatsBar({ insights }: StatsBarProps) {
  const stats = [
    {
      icon: Zap,
      label: 'Total Events',
      value: insights?.summary?.totalEvents || 0,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10'
    },
    {
      icon: Brain,
      label: 'Tokens Used',
      value: insights?.summary?.totalTokens?.toLocaleString() || 0,
      color: 'text-nexus-300',
      bg: 'bg-nexus-400/10'
    },
    {
      icon: Clock,
      label: 'Avg Response',
      value: `${insights?.summary?.avgDuration || 0}ms`,
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      icon: TrendingUp,
      label: 'Weekly Trend',
      value: `${insights?.trends?.weeklyGrowth || 0}%`,
      color: insights?.trends?.direction === 'up' ? 'text-green-400' : 'text-gray-400',
      bg: insights?.trends?.direction === 'up' ? 'bg-green-400/10' : 'bg-gray-400/10'
    }
  ];

  return (
    <div className="h-20 border-b border-nexus-700 flex items-center px-6 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
