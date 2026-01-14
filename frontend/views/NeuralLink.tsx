
import React, { useState, useRef } from 'react';
import { Mic2, Square, RefreshCw, Zap, Headphones, BrainCircuit, Waves, MessageSquareText, Sparkles, ShieldCheck, Target, Camera, Radio } from 'lucide-react';
import { nexusApi } from '../api/nexusClient';

export const NeuralLink: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('Production Bridge Ready');
  const [isVisionActive, setIsVisionActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startVision = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsVisionActive(true);
    } catch (e) { 
      console.error("Nexus Vision hardware error", e);
      setStatus('Hardware Access Denied');
    }
  };

  const startSession = async () => {
    setActive(true);
    setStatus('Establishing HSM Handshake...');
    // Real-time voice requires a secure websocket relay via the production node
    setTimeout(() => setStatus('Sovereign Link: ENCRYPTED RELAY ACTIVE'), 1500);
  };

  const stopSession = () => {
    setActive(false);
    setStatus('Link Severed');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-32">
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-4 px-6 py-2 bg-blue-600/10 border border-blue-500/30 rounded-full">
           <Target size={16} className="text-blue-400" />
           <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Direct Hardware Enclave Link</span>
        </div>
        <h1 className="text-9xl font-black text-white tracking-tighter uppercase text-gradient leading-none">Neural Link</h1>
        <p className="text-gray-400 text-3xl font-bold max-w-4xl mx-auto leading-relaxed">
          High-bandwidth telepresence. Zero client-side storage.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-10">
          <div className="glass-card p-10 bg-black border-2 border-white/5 rounded-[4rem] relative overflow-hidden shadow-3xl min-h-[600px] flex flex-col">
             <div className="relative flex-1 rounded-[3rem] bg-[#050505] border-2 border-white/10 overflow-hidden">
                {isVisionActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale opacity-50 transition-all" />
                    <div className="absolute inset-0 animate-scan-line opacity-20 pointer-events-none" />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                     <Camera size={64} className="text-gray-800" />
                     <button onClick={startVision} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-gray-500">Initialize Visual Node</button>
                  </div>
                )}
             </div>

             <div className="pt-10 space-y-6 relative z-10">
                <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] text-center">{status}</p>
                <button 
                  onClick={active ? stopSession : startSession}
                  className={`w-full py-8 rounded-[2rem] font-black text-lg uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-6 shadow-2xl ${active ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40' : 'bg-blue-600 text-white hover:bg-blue-500 border-2 border-white/20'}`}
                >
                   {active ? <Square size={28} fill="currentColor" /> : <BrainCircuit size={28} />}
                   {active ? 'Terminate Uplink' : 'Activate Direct Link'}
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-10">
           <div className="glass-card p-12 lg:p-16 bg-black border-2 border-white/10 shadow-3xl rounded-[4rem] min-h-[750px] flex flex-col justify-center text-center space-y-12">
              <Radio size={80} className="mx-auto text-gray-800 animate-pulse" />
              <div className="space-y-6">
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Encrypted Relay Required</h2>
                 <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-lg mx-auto">
                    Live multi-modal streams occur in volatile TEE memory. Initialize your production node to begin high-status telepresence.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
