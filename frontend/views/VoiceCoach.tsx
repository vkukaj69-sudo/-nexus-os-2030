
import React, { useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic2, Square, RefreshCw, Zap, Headphones, BrainCircuit, Waves, MessageSquareText, Sparkles, ShieldCheck, Target, Clock, Activity } from 'lucide-react';
import { getCoachIdeas } from '../geminiService';
import { ContentIdea, TimingInsight } from '../types';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const VoiceCoach: React.FC = () => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('Ready for Blitz');
  const [transcript, setTranscript] = useState('');
  const [aiSpoken, setAiSpoken] = useState('');
  
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [timings, setTimings] = useState<TimingInsight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [context, setContext] = useState('Recently focused on tech strategy, high-leverage solo entrepreneurship, and agentic AI. My audience likes tactical threads.');

  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const response = await getCoachIdeas(context);
      setIdeas(response.ideas);
      setTimings(response.timingInsights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const startSession = async () => {
    setActive(true);
    setStatus('Linking Strategic Node...');
    setTranscript('');
    setAiSpoken('');

    // Resume/Start AudioContexts on user gesture (required for Mobile browsers)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!outAudioContextRef.current) {
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    await audioContextRef.current.resume();
    await outAudioContextRef.current.resume();

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setStatus('Sovereign Strategist Online');
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            sessionPromise.then(s => s.sendRealtimeInput({ 
              media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
            }));
          };
          source.connect(processor);
          processor.connect(audioContextRef.current!.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.outputTranscription) {
            setAiSpoken(prev => prev + (msg.serverContent?.outputTranscription?.text || ''));
          }
          if (msg.serverContent?.inputTranscription) {
            setTranscript(prev => prev + (msg.serverContent?.inputTranscription?.text || ''));
          }
          if (msg.serverContent?.turnComplete) {
            setAiSpoken('');
            setTranscript('');
          }

          const base64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64 && outAudioContextRef.current) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioContextRef.current.currentTime);
            const buffer = await decodeAudioData(decode(base64), outAudioContextRef.current, 24000, 1);
            const source = outAudioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(outAudioContextRef.current.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            sourcesRef.current.add(source);
          }
        },
        onclose: () => stopSession(),
        onerror: () => setStatus('Neural Link Error')
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
        systemInstruction: `You are the Sovereign Coach for Nexus OS.`
      }
    });

    sessionRef.current = sessionPromise;
  };

  const stopSession = () => {
    setActive(false);
    setStatus('Ready for Blitz');
    if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-32">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-2 bg-violet-600/10 border border-violet-500/30 rounded-full">
           <Target size={16} className="text-violet-400" />
           <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em]">Current Objective: Phase 02 Blitz</span>
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase text-gradient">Sovereign Strategist</h1>
        <p className="text-gray-400 text-xl font-medium">Speak with the master architect of your digital dominion.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-10 flex flex-col items-center justify-center space-y-10 relative overflow-hidden bg-black shadow-2xl rounded-[3rem] border-2 border-white/5">
             {active && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                  <Waves className="w-[120%] h-[120%] text-blue-500 animate-pulse" />
               </div>
             )}

             <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-1000 ${active ? 'bg-blue-600 shadow-[0_0_80px_rgba(59,130,246,0.6)] scale-110 border-4 border-white/20' : 'bg-white/5 border-2 border-white/10'}`}>
                <BrainCircuit size={48} className={active ? 'text-white' : 'text-gray-700'} />
             </div>

             <div className="text-center space-y-4 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">{status}</h3>
                <button 
                  onClick={active ? stopSession : startSession}
                  className={`w-full py-6 rounded-2xl font-black text-[13px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 relative z-10 shadow-xl ${active ? 'bg-red-500/20 text-red-400 border-2 border-red-500/40' : 'bg-blue-600 text-white hover:bg-blue-500 border-2 border-white/10'}`}
                >
                   {active ? <Square size={20} fill="currentColor" /> : <Mic2 size={20} />}
                   {active ? 'Terminate' : 'Speak'}
                </button>
             </div>
          </div>

          <div className="glass-card p-8 space-y-6 bg-white/[0.02] border border-white/10 rounded-[2.5rem]">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                   <Clock size={16} /> Neural Timing Map
                </h3>
                <button onClick={fetchInsights} disabled={loadingInsights} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                   <RefreshCw size={14} className={loadingInsights ? 'animate-spin' : ''} />
                </button>
             </div>
             
             {timings.length > 0 ? (
               <div className="space-y-5">
                  {timings.map((t, i) => (
                    <div key={i} className="space-y-2 group">
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                          <span className="text-gray-200">{t.time}</span>
                          <span className="text-violet-400">{t.platform}</span>
                       </div>
                       <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-violet-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(139,92,246,0.5)]" style={{ width: `${t.intensity}%` }} />
                       </div>
                       <p className="text-[9px] text-gray-500 italic opacity-0 group-hover:opacity-100 transition-opacity leading-tight">{t.reason}</p>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="text-center py-6 opacity-30">
                  <Activity size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]">Awaiting Analysis</p>
               </div>
             )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           {active ? (
             <div className="glass-card p-12 bg-black border-2 border-white/5 rounded-[4rem] min-h-[600px] flex flex-col gap-10 shadow-3xl">
                <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner">
                   <div className="flex items-center gap-4 mb-4">
                      <Headphones size={24} className="text-blue-400" />
                      <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Sovereign Output</span>
                   </div>
                   <p className="text-2xl text-gray-200 leading-relaxed italic font-medium">"{aiSpoken || 'Listening to your niche analysis...'}"</p>
                </div>
                <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner flex-1">
                   <div className="flex items-center gap-4 mb-4">
                      <MessageSquareText size={24} className="text-emerald-400" />
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Live DNA Stream</span>
                   </div>
                   <p className="text-2xl text-gray-500 font-bold leading-relaxed">{transcript || '...'}</p>
                </div>
             </div>
           ) : (
             <div className="space-y-8">
                <div className="glass-card p-12 space-y-10 bg-white/[0.02] border border-white/10 rounded-[4rem]">
                   <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.5em] flex items-center gap-4">
                         <Sparkles size={20} className="text-violet-400" /> Strategic Pillars
                      </h3>
                      <button 
                        onClick={fetchInsights}
                        className="px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl"
                      >
                         {loadingInsights ? <RefreshCw className="animate-spin" size={14} /> : 'Sync History'}
                      </button>
                   </div>
                   
                   {ideas.length > 0 ? (
                     <div className="grid grid-cols-1 gap-6">
                        {ideas.map((idea, i) => (
                          <div key={i} className="p-8 bg-black/40 border border-white/10 rounded-[2.5rem] hover:border-violet-500/50 transition-all group shadow-xl">
                             <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{idea.type}</span>
                             </div>
                             <h4 className="text-2xl font-black text-white mb-4 group-hover:text-violet-300 transition-colors">{idea.title}</h4>
                             <p className="text-base text-gray-400 italic mb-6">"{idea.hook}"</p>
                             <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                <Zap size={14} className="text-violet-400" />
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{idea.reasoning}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-32 text-center opacity-20 px-8">
                        <Target size={80} className="mx-auto text-gray-700 mb-6" />
                        <p className="text-sm font-black uppercase tracking-[0.5em]">Awaiting Content Seed</p>
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
