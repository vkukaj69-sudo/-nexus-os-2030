
import React, { useState } from 'react';
import { Download, Monitor, ShieldCheck, Zap, BookOpen, ExternalLink, Mail, Layout, Globe, Command, Check, RefreshCw, Loader2 } from 'lucide-react';

const ProTip = ({ icon: Icon, title, desc }: any) => (
  <div className="glass-card p-6 border-white/5 hover:border-violet-500/30 transition-all">
    <div className="w-10 h-10 bg-violet-600/10 rounded-xl flex items-center justify-center mb-4 text-violet-400">
      <Icon size={20} />
    </div>
    <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
    <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
  </div>
);

export const ProLab: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Nexus Bridge v2.4 package initialized. Check your secure downloads folder.");
    }, 2000);
  };

  const handleVerify = () => {
    if (!email) return;
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setIsVerified(true);
    }, 1500);
  };

  const handleSchedule = () => {
    setScheduling(true);
    setTimeout(() => {
      window.open('https://calendly.com/nexus-os/onboarding', '_blank');
      setScheduling(false);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gradient">Nexus Pro Installation & Ops</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">Complete the setup to enable real-time scraping, email alerts, and the full power of the Nexus 2026 suite.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 border-violet-500/20 bg-violet-500/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Download size={120} className="text-violet-500" />
           </div>
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
             <Monitor className="text-violet-400" />
             Chrome Extension Setup
           </h3>
           <ol className="space-y-6 relative">
              {[
                { step: "01", title: "Download Package", desc: "Download the nexus-bridge-v2.zip from your dashboard." },
                { step: "02", title: "Enable Dev Mode", desc: "Go to chrome://extensions and toggle 'Developer Mode' on." },
                { step: "03", title: "Load Unpacked", desc: "Select the unzipped folder to install the bridge." },
                { step: "04", title: "Sync Auth", desc: "Pin the extension and click 'Nexus Connect' to pair with this app." }
              ].map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-lg font-black text-violet-600/40 font-mono shrink-0">{s.step}</span>
                  <div>
                    <h5 className="text-sm font-bold text-white">{s.title}</h5>
                    <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  </div>
                </li>
              ))}
           </ol>
           <button 
             onClick={handleDownload}
             disabled={downloading}
             className="w-full mt-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl"
           >
             {downloading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
             {downloading ? 'Encrypting Payload...' : 'Download Bridge v2.4'}
           </button>
        </div>

        <div className="space-y-6">
           <div className={`glass-card p-6 transition-all duration-500 ${isVerified ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-4 ${isVerified ? 'text-emerald-400' : 'text-gray-400'}`}>
                 {isVerified ? <Check size={16} /> : <ShieldCheck size={16} />} 
                 {isVerified ? 'Email Engine Active' : 'Email Engine Verification'}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">Verify your primary email to receive real-time alerts when your targets post on X or Reddit.</p>
              <div className="flex gap-2">
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isVerified}
                  placeholder="Enter professional email..." 
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-xs outline-none focus:border-violet-500 transition-all" 
                />
                <button 
                  onClick={handleVerify}
                  disabled={verifying || isVerified || !email}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isVerified ? 'bg-emerald-600/20 text-emerald-400 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                >
                  {verifying ? <RefreshCw size={14} className="animate-spin" /> : isVerified ? 'Verified' : 'Verify'}
                </button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <ProTip 
                icon={Zap} 
                title="Ghost Mode" 
                desc="Enable 'Stealth Mode' in Bridge to scrape without triggering 'Read' receipts on LinkedIn."
              />
              <ProTip 
                icon={Globe} 
                title="Subreddit Deep-Scan" 
                desc="Paste any Subreddit URL to extract the last 50 hot topics automatically."
              />
           </div>
        </div>
      </div>

      <div className="space-y-8">
        <h3 className="text-2xl font-bold flex items-center gap-3">
          <BookOpen className="text-violet-400" />
          Pro Performance Playbook
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <ProTip 
             icon={Command} 
             title="The CMD+K Secret" 
             desc="Use CMD+K anywhere to quick-jump between Researcher and Composer without losing state."
           />
           <ProTip 
             icon={Mail} 
             title="Auto-Repurpose Alerts" 
             desc="Check your email settings to automatically get 'Draft Replies' in your inbox for top accounts."
           />
           <ProTip 
             icon={Layout} 
             title="Visual Previews" 
             desc="Always toggle 'Social Preview' before saving to Library to catch formatting glitches."
           />
        </div>
      </div>
      
      <div className="glass-card p-8 text-center bg-white/5 border-white/10 shadow-2xl">
         <h3 className="text-lg font-bold mb-2">Need White-Glove Onboarding?</h3>
         <p className="text-gray-400 text-sm mb-6">Our success team is available for 1-on-1 calls for Enterprise creators.</p>
         <button 
           onClick={handleSchedule}
           disabled={scheduling}
           className="px-8 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-violet-600 hover:text-white transition-all inline-flex items-center gap-2 group disabled:opacity-50"
         >
            {scheduling ? <Loader2 className="animate-spin" size={14} /> : 'Schedule Call'}
            {!scheduling && <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
         </button>
      </div>
    </div>
  );
};
