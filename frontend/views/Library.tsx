
import React, { useState, useEffect } from 'react';
import { Library, Search, Filter, Sparkles, Copy, Trash2, RefreshCw, Check, BookOpen } from 'lucide-react';
import { repurposeInVoice } from '../geminiService';
import { Inspiration } from '../types';
import { ConfirmationModal } from '../components/ConfirmationModal';

const MOCK_LIBS: Inspiration[] = [
  { id: '1', author: 'VisualizeValue', content: "The best marketing doesn't feel like marketing. It feels like a service.", category: 'Marketing' },
  { id: '2', author: 'SahilBloom', content: "The 80/20 rule applies to everything. Focus on the 20% of tasks that drive 80% of results.", category: 'Productivity' },
  { id: '3', author: 'DickieBush', content: "Stop trying to write better. Start trying to be more specific.", category: 'Writing' },
  { id: '4', author: 'JamesClear', content: "You do not rise to the level of your goals. You fall to the level of your systems.", category: 'Habits' },
];

export const LibraryView: React.FC = () => {
  const [items, setItems] = useState<Inspiration[]>([]);
  const [repurposingId, setRepurposingId] = useState<string | null>(null);
  const [repurposedContent, setRepurposedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nexus_saved_inspiration');
    const savedItems: Inspiration[] = saved ? JSON.parse(saved) : [];
    setItems([...savedItems, ...MOCK_LIBS]);
  }, []);

  const handleRepurpose = async (item: Inspiration) => {
    setRepurposingId(item.id);
    setRepurposedContent(null);
    try {
      const result = await repurposeInVoice(item.content, "Tech-focused, minimalist, strategic, uses bullet points often.");
      setRepurposedContent(result);
    } catch (error) {
      console.error(error);
    } finally {
      setRepurposingId(null);
    }
  };

  const confirmDelete = () => {
    if (!deleteConfirmationId) return;
    const id = deleteConfirmationId;
    
    // Remove from UI state
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);

    // Remove from localStorage if it exists there
    const saved = localStorage.getItem('nexus_saved_inspiration');
    if (saved) {
      const savedItems: Inspiration[] = JSON.parse(saved);
      const filteredSaved = savedItems.filter(i => i.id !== id);
      localStorage.setItem('nexus_saved_inspiration', JSON.stringify(filteredSaved));
    }
    setDeleteConfirmationId(null);
  };

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <ConfirmationModal
        isOpen={!!deleteConfirmationId}
        onClose={() => setDeleteConfirmationId(null)}
        onConfirm={confirmDelete}
        title="Purge Intelligence"
        message="Are you sure you want to remove this inspiration node from your vault? This action is irreversible."
        confirmLabel="Purge Node"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gradient">Inspiration Vault</h1>
          <p className="text-gray-400">Curate viral hooks and repurpose them in your unique creator voice.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search library..." 
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 text-white" 
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-card p-6 hover:border-violet-500/30 transition-all flex flex-col group animate-in fade-in duration-500">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20 uppercase tracking-tighter">
                  {item.category}
                </span>
                <button 
                  onClick={() => setDeleteConfirmationId(item.id)}
                  className="text-gray-600 hover:text-red-400 transition-colors p-1"
                  title="Delete from library"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-gray-300 text-sm italic leading-relaxed mb-6 flex-1">"{item.content}"</p>
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${item.author === 'Self (Nexus)' ? 'bg-violet-600/20 text-violet-400' : 'bg-white/10 text-gray-500'}`}>
                    {item.author === 'Self (Nexus)' ? 'N' : item.author.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">@{item.author}</span>
                </div>
                <button 
                  onClick={() => handleRepurpose(item)}
                  disabled={repurposingId === item.id}
                  className="flex items-center gap-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  {repurposingId === item.id ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Repurpose
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card border-dashed border-white/10">
          <BookOpen className="w-16 h-16 text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-400">Library is empty</h3>
          <p className="text-gray-600 text-sm max-w-sm mt-2">
            Save interesting posts from the Composer or add your own to build your inspiration vault.
          </p>
        </div>
      )}

      {repurposedContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card max-w-2xl w-full p-8 relative shadow-2xl border-white/10">
            <button onClick={() => setRepurposedContent(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="text-violet-400" />
              Repurposed in Your Voice
            </h3>
            <div className="bg-white/5 rounded-2xl p-6 mb-6 text-gray-200 leading-relaxed font-sans text-lg">
              {repurposedContent}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(repurposedContent);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard' : 'Copy and Use'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
