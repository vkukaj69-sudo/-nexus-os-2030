'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import AgentGrid from '@/components/AgentGrid';
import StatsBar from '@/components/StatsBar';
import ChatPanel from '@/components/ChatPanel';
import { Brain, Zap, Activity } from 'lucide-react';

export default function Dashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [agentsRes, insightsRes] = await Promise.all([
        api.getAgents(),
        api.getInsights()
      ]);
      if (agentsRes.agents) setAgents(agentsRes.agents);
      if (insightsRes.insights) setInsights(insightsRes.insights);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-nexus-900">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-nexus-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-purple-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NEXUS OS</h1>
              <p className="text-xs text-gray-500">Cognitive AI Platform</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-sm text-green-400">All Systems Online</span>
            </div>
          </div>
        </header>

        {/* Stats Bar */}
        <StatsBar insights={insights} />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Agent Grid */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-nexus-400" />
                AI Agents
              </h2>
              <span className="text-sm text-gray-500">{agents.length} agents online</span>
            </div>
            
            <AgentGrid 
              agents={agents} 
              loading={loading}
              onSelectAgent={setActiveAgent}
              activeAgent={activeAgent}
            />
          </div>

          {/* Chat Panel */}
          {activeAgent && (
            <ChatPanel 
              agentId={activeAgent} 
              agents={agents}
              onClose={() => setActiveAgent(null)} 
            />
          )}
        </div>
      </main>
    </div>
  );
}
