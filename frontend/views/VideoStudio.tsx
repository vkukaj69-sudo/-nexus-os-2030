
import React, { useState } from 'react';
import { Clapperboard, RefreshCw, Video, Camera, Key, ExternalLink, Bot, Monitor, Smartphone, ShieldCheck, LockKeyhole } from 'lucide-react';
import { nexusApi } from '../api/nexusClient';
import { VideoAspectRatio } from '../types';

export const VideoStudio: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('Standby');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const presets = [
    { name: 'Cyberpunk Noir', style: 'Neon lighting, futuristic rain, cinematic impact, dark aesthetics.' },
    { name: 'Hyper-Realistic', style: '8K resolution, detailed textures, global illumination, photography style.' },
    { name: 'Studio Fashion', style: 'Softbox lighting, minimalist background, vogue aesthetic, clean motion.' },
    { name: 'Anime 2030', style: 'High-end anime studio style, dynamic action sequences, cel-shaded brilliance.' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setVideoUrl(null);
    setProgress("Synchronizing with Veo 3.1 Node...");

    try {
      const styleContext = selectedPreset 
        ? presets.find(p => p.name === selectedPreset)?.style 
        : "";
      
      const fullPrompt = styleContext ? `${prompt}. Visual Style: ${styleContext}` : prompt;

      // Video synthesis is now an orchestrated backend operation
      const res = await nexusApi.request('/video/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          prompt: fullPrompt, 
          aspectRatio, 
          model: 'veo-3.1-fast-generate-preview' 
        })
      });

      if (res.videoUrl) {
        setVideoUrl(res.videoUrl);
        setProgress("Synthesis Complete.");
      } else {
        throw new Error("Canvas deviation detected.");
      }
    } catch (e: any) {
      console.error("Nexus Video Failure:", e);
      setProgress("Hardware Deviation: " + (e?.message || "Internal Node Error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-16 animate-in fade-in duration-1000 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="space-y-4 flex-1">
          <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-400 text-[10px] font-black uppercase tracking-[0.5em]">
             <LockKeyhole size={14} /> Production Enclave Active
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none text-gradient uppercase">Cinematic Forge</h1>
          <p className="text-gray-300 text-xl md:text-3xl font-bold max-w-4xl leading-relaxed">
            Manifest high-fidelity motion via <span className="text-white">Veo 3.1 Isolated Node</span>.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
         <div className="lg:col-span-1 space-y-8 md:space-y-10">
            <div className="glass-card p-8 md:p-12 space-y-10 bg-white/[0.02] border-white/10 shadow-2xl">
               <h3 className="text-xs font-black text-violet-400 uppercase tracking-[0.5em] flex items-center gap-4">
                  <Clapperboard size={24} /> Neural Script
               </h3>
               <textarea 
                 value={prompt} onChange={(e) => setPrompt(e.target.value)}
                 placeholder="Describe the cinematic manifest..."
                 className="w-full h-48 md:h-56 bg-black border-2 border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-lg md:text-xl text-white outline-none focus:ring-4 focus:ring-violet-500/40 focus:border-violet-400 resize-none font-bold transition-all placeholder:text-gray-800"
               />
               
               <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Aesthetic Presets</p>
                  <div className="grid grid-cols-2 gap-4">
                     {presets.map(p => (
                       <button 
                         key={p.name}
                         onClick={() => setSelectedPreset(p.name === selectedPreset ? null : p.name)}
                         className={`p-3 md:p-4 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedPreset === p.name ? 'bg-violet-600 border-violet-500 text-white shadow-xl' : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:border-white/10'}`}
                       >
                         {p.name}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="flex gap-4 bg-white/5 p-2 rounded-3xl border border-white/10">
                  <button onClick={() => setAspectRatio('16:9')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${aspectRatio === '16:9' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Monitor size={16} /> 16:9</button>
                  <button onClick={() => setAspectRatio('9:16')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${aspectRatio === '9:16' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Smartphone size={16} /> 9:16</button>
               </div>

               <button 
                 onClick={handleGenerate} 
                 disabled={loading || !prompt.trim()} 
                 className="w-full py-6 md:py-8 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-base md:text-lg uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-[0_0_60px_rgba(139,92,246,0.5)] border-2 border-white/20 active:scale-95"
               >
                  {loading ? <RefreshCw className="animate-spin" size={28} /> : <Video size={28} />}
                  Synthesize Motion
               </button>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-10">
            <div className="glass-card p-6 md:p-12 bg-black border-2 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden min-h-[500px] md:min-h-[800px] flex flex-col rounded-[3rem] md:rounded-[4rem]">
               {loading && (
                 <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-3xl flex flex-col items-center justify-center space-y-10 md:space-y-12 animate-in fade-in duration-500">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] md:rounded-[3rem] bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_0_120px_rgba(139,92,246,0.6)] animate-pulse relative">
                       <Bot className="text-white w-12 h-12 md:w-16 md:h-16 animate-bounce" />
                       <div className="absolute inset-0 border-4 border-white/20 rounded-[2.5rem] md:rounded-[3rem] animate-ping" />
                    </div>
                    <div className="text-center space-y-4 md:space-y-6">
                       <p className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase px-8 md:px-12">{progress}</p>
                       <p className="text-[10px] md:text-[11px] font-black text-blue-400 uppercase tracking-[0.5em] md:tracking-[1em] animate-pulse">Hardware Secure Relay</p>
                    </div>
                 </div>
               )}

               <div className="flex-1 flex items-center justify-center bg-[#050505] rounded-[2rem] md:rounded-[3rem] border-2 border-white/5 relative overflow-hidden group">
                  {videoUrl ? (
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      playsInline
                      className={`max-w-full max-h-full rounded-2xl md:rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] ${aspectRatio === '9:16' ? 'h-full aspect-[9/16]' : 'w-full aspect-video'}`} 
                    />
                  ) : (
                    <div className="text-center space-y-8 md:space-y-10 opacity-20 px-8 md:px-12">
                       <Camera className="mx-auto text-gray-700 w-24 h-24 md:w-32 md:h-32 group-hover:scale-110 transition-transform duration-1000" />
                       <p className="text-[12px] md:text-[18px] font-black text-gray-600 uppercase tracking-[1em] md:tracking-[1.5em]">Vault Awaiting Ingest</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
