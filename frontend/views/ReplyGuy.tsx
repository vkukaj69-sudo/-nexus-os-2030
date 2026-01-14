
import React, { useState, useEffect } from 'react';
import { 
  MessageSquareShare, 
  UserPlus, 
  RefreshCw, 
  Send, 
  Sparkles, 
  Trash2, 
  Check, 
  Copy, 
  PencilLine, 
  TrendingUp, 
  Wand2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ListTodo,
  ArrowRight,
  Filter,
  MoreHorizontal,
  Zap,
  History
} from 'lucide-react';
import { generateReply } from '../geminiService';
import { QueuedReply, ReplyStatus } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface TrackedAccount {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  latestPost: string;
}

const INITIAL_ACCOUNTS: TrackedAccount[] = [
  { id: '1', name: 'Elon Musk', handle: 'elonmusk', avatar: 'https://picsum.photos/seed/elon/120', latestPost: "The efficiency of the new Starlink satellites is exceeding expectations. Global connectivity is inevitable." },
  { id: '2', name: 'Naval', handle: 'naval', avatar: 'https://picsum.photos/seed/naval/120', latestPost: "If you can't learn to enjoy the work, you will eventually be out-competed by someone who does." },
  { id: '3', name: 'Sahil Bloom', handle: 'sahilbloom', avatar: 'https://picsum.photos/seed/sahil/120', latestPost: "The best ROI in life is usually on the things you do when you don't feel like doing them." }
];

export const ReplyGuy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'targets' | 'queue' | 'history'>('targets');
  const [accounts] = useState<TrackedAccount[]>(INITIAL_ACCOUNTS);
  const [queue, setQueue] = useState<QueuedReply[]>([]);
  const [tone, setTone] = useState('insightful');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_reply_queue');
    if (saved) {
      setQueue(JSON.parse(saved));
    }
  }, []);

  const saveQueue = (updatedQueue: QueuedReply[]) => {
    setQueue(updatedQueue);
    localStorage.setItem('nexus_reply_queue', JSON.stringify(updatedQueue));
  };

  const handleQueueReply = async (acc: TrackedAccount) => {
    setProcessingId(acc.id);
    try {
      const suggested = await generateReply(acc.latestPost, tone);
      const newItems: QueuedReply[] = suggested.map((content, idx) => ({
        id: Math.random().toString(36).substr(2, 9),
        sourceAccount: acc.name,
        sourceHandle: acc.handle,
        originalPost: acc.latestPost,
        draftContent: content,
        tone: tone,
        status: 'pending',
        confidenceScore: Math.floor(Math.random() * 20) + 80,
        timestamp: Date.now() + idx
      }));
      saveQueue([...newItems, ...queue]);
      setActiveTab('queue');
    } catch (error) {
      console.error('Failed to generate replies:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const updateStatus = (id: string, newStatus: ReplyStatus) => {
    const updated = queue.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    );
    saveQueue(updated);
  };

  const confirmDelete = () => {
    if (!deleteConfirmationId) return;
    saveQueue(queue.filter(item => item.id !== deleteConfirmationId));
    setDeleteConfirmationId(null);
  };

  const getPendingCount = () => queue.filter(i => i.status === 'pending').length;
  const getApprovedCount = () => queue.filter(i => i.status === 'approved').length;

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in slide-in-from-bottom-4 duration-700 pb-32">
      <ConfirmationModal
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Discard Draft"
        message="This draft reply will be permanently removed from your execution queue."
        confirmLabel="Discard Draft"
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 border-b-2 border-white/10 pb-12">
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white tracking-tighter shadow-violet-500/20 drop-shadow-2xl">Smart Reply Intelligence</h1>
          <p className="text-gray-300 text-2xl font-bold">Automated drafting with strategic creator-in-the-loop approval.</p>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-[2rem] w-fit border-2 border-white/10 shadow-2xl">
        <button onClick={() => setActiveTab('targets')} className={`px-10 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 ${activeTab === 'targets' ? 'bg-violet-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}><TrendingUp size={20} /> Intelligence Feed</button>
        <button onClick={() => setActiveTab('queue')} className={`px-10 py-4 rounded-2xl text-[13px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 relative ${activeTab === 'queue' ? 'bg-violet-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}><ListTodo size={20} /> Review Queue {getPendingCount() > 0 && <span className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full text-[12px] font-black flex items-center justify-center border-4 border-[#050505] animate-bounce shadow-2xl">!</span>}</button>
      </div>
      {activeTab === 'targets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in duration-500">
          {accounts.map((acc) => (
            <div key={acc.id} className="glass-card p-12 flex flex-col space-y-10 hover:border-violet-400/60 transition-all duration-500 group relative overflow-hidden bg-white/[0.03] border-2 shadow-2xl rounded-[3rem]">
              <div className="flex items-center gap-6">
                <img src={acc.avatar} className="w-20 h-20 rounded-full border-4 border-white/20 shadow-2xl ring-4 ring-violet-500/20" alt={acc.name} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-white text-2xl truncate drop-shadow-md">{acc.name}</h4>
                  <p className="text-base text-violet-400 font-bold uppercase tracking-widest">@{acc.handle}</p>
                </div>
              </div>
              <div className="bg-black/40 border-2 border-white/10 rounded-[2rem] p-8 italic text-xl text-gray-100 leading-relaxed font-black shadow-inner">"{acc.latestPost}"</div>
              <div className="pt-4"><button onClick={() => handleQueueReply(acc)} disabled={processingId === acc.id} className="w-full py-6 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-3xl text-sm font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-2xl border-2 border-white/20">{processingId === acc.id ? <RefreshCw size={24} className="animate-spin" /> : <Zap size={24} />}Draft Strategic Replies</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
