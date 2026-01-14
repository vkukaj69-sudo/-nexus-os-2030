
import React, { useState, useEffect } from 'react';
import { PenTool, Copy, Sparkles, RefreshCw, Send, Trash2, Image as ImageIcon, Video, Clapperboard, Zap, Flame, Fingerprint, Brain, Share2, Loader2, Cpu, Instagram, Facebook, LayoutGrid, Smartphone, Lock, AlertCircle, Settings, ShieldCheck, Info } from 'lucide-react';
import { generateProImage } from '../geminiService';
import { useSoul } from '../context/SoulContext';
import { HeatmapSegment, ToolType } from '../types';
import { nexusApi } from '../api/nexusClient';

const FORMATS = [
  { id: 'instagram', name: 'Insta', icon: Instagram },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'x', name: 'X Post', icon: Share2 },
  { id: 'linkedin', name: 'LinkedIn', icon: LayoutGrid },
  { id: 'reddit', name: 'Reddit', icon: Smartphone },
];

export const Composer: React.FC<{ onNavigate?: (tool: ToolType) => void }> = ({ onNavigate }) => {
  const { soul } = useSoul();
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState('');
  const [heatmap, setHeatmap] = useState<HeatmapSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('instagram');
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  // Usage State
  const [usage, setUsage] = useState<{ used: number, limit: number, remaining: number } | null>(null);
  const [byokError, setByokError] = useState(false);
  const [upgradeError, setUpgradeError] = useState(false);

  // Robust Pro check
  const user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
  const isFullAccess = ['admin', 'pro', 'agency'].includes(String(user.role || 'citizen').toLowerCase());

  useEffect(() => {
    const fetchUsage = async () => {
      if (!isFullAccess) {
        try {
          const data = await nexusApi.getUsage();
          setUsage(data);
        } catch (e) {
          console.error("Usage Node Deviation", e);
        }
      }
    };
    fetchUsage();
  }, [isFullAccess]);

  const handleRepurpose = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    setResult('');
    setHeatmap([]);
    setShowHeatmap(false);
    setGeneratedImageUrl(null);
    setByokError(false);
    setUpgradeError(false);

    try {
      const response = await nexusApi.request('/oracle/synthesize', {
        method: 'POST',
        body: JSON.stringify({
          content: sourceText,
          platform: selectedFormat,
          model: 'gemini-3-flash-preview'
        })
      });

      setResult(response.output || response.text || "No synthesis received from node.");
      
      if (usage) {
        setUsage({ ...usage, used: usage.used + 1, remaining: usage.remaining - 1 });
      }
    } catch (e: any) {
      console.error("Composer Node Error:", e);
      const msg = e.message.toLowerCase();
      if (msg.includes("api key") || msg.includes("must store")) {
        setByokError(true);
      } else if (msg.includes("pro feature") || msg.includes("limit reached")) {
        setUpgradeError(true);
      }
      setResult(`Protocol Deviation: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeHeatmap = async () => {
    if (!result) return;
    
    // Pro check: In a real app, this might be a backend check, but we handle it here too for speed
    if (!isFullAccess) {
      setUpgradeError(true);
      return;
    }

    setHeatmapLoading(true);
    setShowHeatmap(true);
    setUpgradeError(false);
    setByokError(false);

    try {
      const res = await nexusApi.analyzeHeatmap(result);
      if (res && res.heatmap) {
        setHeatmap(res.heatmap);
      } else {
        throw new Error("Invalid heatmap response payload.");
      }
    } catch (e: any) {
      console.error("Heatmap Node Error:", e);
      const msg = e.message.toLowerCase();
      if (msg.includes("api key") || msg.includes("must store")) {
        setByokError(true);
      } else if (msg.includes("pro feature") || msg.includes("limit reached")) {
        setUpgradeError(true);
      }
    } finally { 
      setHeatmapLoading(false); 
    }
  };

  const handleGenerateImage = async () => {
    if (!result || !isFullAccess) return;
    setImageLoading(true);
    try {
      const url = await generateProImage(result);
      setGeneratedImageUrl(url);
    } finally { setImageLoading(false); }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', bar: 'bg-emerald-500', label: 'High Engagement' };
    if (score >= 5) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', bar: 'bg-amber-500', label: 'Moderate' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', bar: 'bg-rose-500', label: 'Friction Point' };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Viral Architect</h1>
          <p className="text-gray-400 text-sm">
            Mode: <span className={`font-bold uppercase tracking-widest text-xs ${isFullAccess ? 'text-violet-400' : 'text-amber-500'}`}>
              {isFullAccess ? 'Sovereign Pro Synthesis' : 'Restricted Citizen Node'}
            </span>
          </p>
        </div>

        {isFullAccess ? (
          <div className="flex items-center gap-3 px-6 py-2 bg-violet-600/10 border border-violet-500/30 rounded-full text-violet-400 text-[9px] font-black uppercase tracking-widest">
             <ShieldCheck size={14} /> Sovereign Link Unlimited
          </div>
        ) : usage && (
          <div className="flex items-center gap-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {usage.remaining} / {usage.limit} Syntheses Remaining Today
             </p>
          </div>
        )}
      </div>

      {byokError && (
        <div className="p-8 glass-card bg-red-600/10 border-2 border-red-500/30 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-in zoom-in-95">
           <div className="flex items-center gap-6">
              <AlertCircle className="text-red-500" size={48} />
              <div className="space-y-1">
                 <h4 className="text-xl font-black text-white uppercase tracking-tight">Key Provision Required</h4>
                 <p className="text-sm text-gray-400 font-medium italic">Sovereign Pro nodes require your personal Gemini API Key to initiate this diagnostic.</p>
              </div>
           </div>
           <button 
            onClick={() => onNavigate?.(ToolType.SETTINGS)}
            className="px-10 py-4 bg-white text-black hover:bg-violet-600 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 shadow-2xl"
           >
              <Settings size={16} /> Open Vault Settings
           </button>
        </div>
      )}

      {upgradeError && (
        <div className="p-8 glass-card bg-violet-600/10 border-2 border-violet-500/30 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-in zoom-in-95">
           <div className="flex items-center gap-6">
              <Zap className="text-violet-500" size={48} />
              <div className="space-y-1">
                 <h4 className="text-xl font-black text-white uppercase tracking-tight">Upgrade to Sovereign</h4>
                 <p className="text-sm text-gray-400 font-medium italic">Advanced retention analytics and unlimited daily syntheses require a Sovereign Pro bond.</p>
              </div>
           </div>
           <button 
            onClick={() => onNavigate?.(ToolType.PRICING)}
            className="px-10 py-4 bg-violet-600 text-white hover:bg-violet-500 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shrink-0 shadow-2xl"
           >
              <ShieldCheck size={16} /> View Node Plans
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-card p-8 space-y-6 bg-black/40 border-white/10 shadow-2xl">
            <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <Zap size={14} /> Neural Input
            </h3>
            <textarea 
              value={sourceText} 
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste raw thoughts, a rough draft, or a link seed..."
              className="w-full h-48 bg-black/60 border border-white/10 rounded-2xl p-6 text-white text-base outline-none focus:ring-1 focus:ring-violet-500/50 resize-none leading-relaxed placeholder:text-gray-700 font-medium transition-all shadow-inner"
            />
            
            <div className="grid grid-cols-5 gap-2">
              {FORMATS.map(f => (
                <button 
                  key={f.id} 
                  onClick={() => setSelectedFormat(f.id)} 
                  className={`py-3 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2 ${
                    selectedFormat === f.id 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/30' 
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <f.icon size={14} />
                  <span className="hidden sm:inline">{f.name}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={handleRepurpose} 
              disabled={loading || !sourceText.trim() || (!isFullAccess && usage?.remaining === 0)} 
              className="w-full py-5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl font-black text-[12px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl border border-white/10"
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>} 
              {loading ? 'Synthesizing...' : !isFullAccess && usage?.remaining === 0 ? 'Daily Limit Reached' : 'Repurpose Content'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 flex flex-col min-h-[500px] relative overflow-hidden bg-black/40 border-white/10 shadow-2xl">
            {loading && (
               <div className="absolute top-0 left-0 w-full h-1 bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,1)] animate-scan-line z-20" />
            )}
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Send size={14} className="text-violet-400" /> Viral Workshop
              </h3>
              {result && !loading && (
                <div className="flex gap-2">
                  <button 
                    onClick={handleAnalyzeHeatmap} 
                    className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase flex items-center gap-2 transition-all ${
                      showHeatmap 
                        ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Flame size={14} /> Retention Heatmap
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                    }}
                    className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-[10px] font-black uppercase flex items-center gap-2 bg-white/5"
                  >
                    <Copy size={14} /> Copy
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              {loading && !result ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
                  <div className="relative">
                    <Cpu size={64} className="text-violet-500 animate-pulse" />
                    <div className="absolute -inset-4 border border-violet-500/20 rounded-full animate-ping opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-black text-white uppercase tracking-tighter">Neural Synthesis Active</p>
                    <p className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.5em] animate-pulse">Architecting {selectedFormat} pillars...</p>
                  </div>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  {showHeatmap ? (
                    <div className="space-y-4 animate-in fade-in duration-500">
                       {heatmapLoading ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                             <RefreshCw className="animate-spin text-orange-500" size={32} />
                             <p className="text-[10px] font-black uppercase tracking-[0.3em]">Mapping Engagement Density...</p>
                          </div>
                       ) : heatmap.length > 0 ? (
                         <div className="space-y-3">
                            <div className="flex items-center gap-4 mb-4">
                               <Info size={14} className="text-gray-600" />
                               <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Diagnostic Results: Click segments for strategic detail</p>
                            </div>
                            {heatmap.map((seg, i) => {
                               const style = getScoreColor(seg.score);
                               return (
                                 <div key={i} className={`group relative p-5 rounded-2xl border-l-4 transition-all hover:bg-white/[0.04] bg-black/20 ${style.border}`}>
                                    <div className="flex justify-between items-center mb-3">
                                       <div className="flex items-center gap-3">
                                          <span className={`text-[9px] font-black uppercase tracking-widest ${style.text}`}>{style.label}</span>
                                          <span className="text-[10px] font-mono text-gray-500">Node_ID: {i.toString().padStart(2, '0')}</span>
                                       </div>
                                       <span className={`text-[12px] font-black ${style.text}`}>{seg.score}/10</span>
                                    </div>
                                    
                                    <p className="text-sm md:text-base font-medium leading-relaxed text-gray-100 mb-4">{seg.text}</p>
                                    
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                       <div 
                                         className={`h-full transition-all duration-1000 ${style.bar}`} 
                                         style={{ width: `${seg.score * 10}%` }} 
                                       />
                                    </div>

                                    {/* Hover Context Block */}
                                    <div className="mt-4 p-4 bg-white/[0.03] border border-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 h-0 group-hover:h-auto overflow-hidden">
                                       <div className="flex items-start gap-3">
                                          <Zap size={14} className="text-violet-400 mt-0.5 shrink-0" />
                                          <p className="text-[11px] leading-relaxed text-gray-400 italic">
                                             <span className="text-white font-bold uppercase not-italic mr-2">Neural Insight:</span>
                                             {seg.reason}
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                               );
                            })}
                            <button 
                              onClick={() => setShowHeatmap(false)}
                              className="w-full py-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] hover:text-white transition-colors"
                            >
                              Exit Diagnostic View
                            </button>
                         </div>
                       ) : (
                          <div className="p-12 text-center glass-card border-dashed border-white/10 opacity-30">
                             <AlertCircle size={32} className="mx-auto mb-4" />
                             <p className="text-xs font-black uppercase tracking-widest">No segments found in synthesis</p>
                          </div>
                       )}
                    </div>
                  ) : (
                    <div className="glass-card !bg-black/40 !border-white/5 p-6 min-h-[120px] shadow-inner relative rounded-2xl">
                      <div className="text-white text-base leading-relaxed whitespace-pre-wrap font-medium font-sans selection:bg-violet-500/30">
                        {result}
                      </div>
                    </div>
                  )}

                  {!loading && !showHeatmap && (
                    <div className="glass-card !bg-violet-600/[0.04] !border-violet-500/20 p-6 space-y-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-violet-300 uppercase tracking-[0.3em]">
                          <ImageIcon size={14} className="inline mr-2"/> Visual Synthesis
                        </h4>
                        {isFullAccess ? (
                          <button 
                            onClick={handleGenerateImage} 
                            disabled={imageLoading} 
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all shadow-lg"
                          >
                             {imageLoading ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                          </button>
                        ) : (
                          <div className="text-[9px] font-black text-gray-700 uppercase flex items-center gap-2">
                             <Lock size={10} /> Sovereign Pro Only
                          </div>
                        )}
                      </div>
                      
                      {generatedImageUrl && (
                        <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
                          <img src={generatedImageUrl} className="w-full h-auto" alt="AI Generated Visual" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-20">
                  <Brain size={64} className="text-gray-400" />
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">Workshop Standby</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
