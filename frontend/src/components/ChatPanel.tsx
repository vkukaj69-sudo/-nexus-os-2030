'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  agentId: string;
  agents: any[];
  onClose: () => void;
}

export default function ChatPanel({ agentId, agents, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = agents.find(a => a.id === agentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Welcome message
    setMessages([{
      role: 'agent',
      content: `Hello! I'm ${agent?.name || agentId}. ${agent?.description || 'How can I assist you today?'}`,
      timestamp: new Date()
    }]);
  }, [agentId]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.callAgent(agentId, { input: input });
      
      const agentMessage: Message = {
        role: 'agent',
        content: response.response || response.error || 'I processed your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'agent',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-96 border-l border-nexus-700 bg-nexus-800 flex flex-col">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-nexus-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nexus-400 to-purple-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white capitalize">{agent?.name || agentId}</h3>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-nexus-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-nexus-400' 
                : 'bg-gradient-to-br from-nexus-400 to-purple-600'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
              msg.role === 'user'
                ? 'bg-nexus-400 text-white rounded-tr-sm'
                : 'bg-nexus-700 text-gray-200 rounded-tl-sm'
            }`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexus-400 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-nexus-700 px-4 py-3 rounded-2xl rounded-tl-sm">
              <Loader2 className="w-5 h-5 text-nexus-300 animate-spin" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-nexus-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${agent?.name || agentId}...`}
            className="flex-1 bg-nexus-700 border border-nexus-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-nexus-400 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-nexus-400 flex items-center justify-center text-white hover:bg-nexus-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
