'use client';
import { Bot, Brain, Shield, Code, TrendingUp, Users, FileText, Lightbulb, Briefcase, Heart, Compass } from 'lucide-react';

const agentIcons: Record<string, any> = {
  cipher: Brain,
  sentinel: Shield,
  architect: Code,
  oracle: TrendingUp,
  diplomat: Users,
  lexicon: FileText,
  catalyst: Lightbulb,
  nexus: Bot,
  strategist: Briefcase,
  empath: Heart,
  voyager: Compass
};

const agentColors: Record<string, string> = {
  cipher: 'from-blue-500 to-cyan-500',
  sentinel: 'from-red-500 to-orange-500',
  architect: 'from-purple-500 to-pink-500',
  oracle: 'from-green-500 to-emerald-500',
  diplomat: 'from-yellow-500 to-amber-500',
  lexicon: 'from-indigo-500 to-blue-500',
  catalyst: 'from-pink-500 to-rose-500',
  nexus: 'from-violet-500 to-purple-500',
  strategist: 'from-teal-500 to-cyan-500',
  empath: 'from-rose-500 to-pink-500',
  voyager: 'from-amber-500 to-yellow-500'
};

interface AgentGridProps {
  agents: any[];
  loading: boolean;
  onSelectAgent: (agentId: string) => void;
  activeAgent: string | null;
}

export default function AgentGrid({ agents, loading, onSelectAgent, activeAgent }: AgentGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="nexus-card p-4 animate-pulse">
            <div className="w-12 h-12 rounded-xl bg-nexus-700 mb-3"></div>
            <div className="h-4 bg-nexus-700 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-nexus-700 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {agents.map((agent) => {
        const Icon = agentIcons[agent.id] || Bot;
        const gradient = agentColors[agent.id] || 'from-gray-500 to-gray-600';
        const isActive = activeAgent === agent.id;

        return (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className={`nexus-card p-4 text-left transition-all duration-300 ${
              isActive ? 'ring-2 ring-nexus-400 glow-box' : ''
            }`}
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="font-semibold text-white capitalize mb-1">{agent.name}</h3>
            <p className="text-xs text-gray-400 line-clamp-2 mb-3">{agent.description}</p>
            
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-green-400">Online</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
