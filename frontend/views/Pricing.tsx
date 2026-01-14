
import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Boxes, Zap, Loader2, ArrowRight } from 'lucide-react';
import { nexusApi } from '../api/nexusClient';

export const Pricing: React.FC = () => {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string) => {
    setLoadingPriceId(priceId);
    setError(null);
    try {
      // Corrected to match nexusClient method name
      const res = await nexusApi.createCheckoutSession(priceId);
      if (res.url) {
        window.location.href = res.url;
      } else {
        throw new Error("Failed to initialize secure payment link.");
      }
    } catch (e: any) {
      console.error("Stripe Checkout Error:", e);
      setError(e.message || "Hardware link failure. Please try again.");
      setLoadingPriceId(null);
    }
  };

  const TIERS = [
    {
      name: "Spark Node",
      price: "$0",
      priceId: null,
      desc: "Basic exploration for entry-level creators.",
      features: [
        "Standard Content Composer",
        "Basic Meta Research",
        "Single Account Sync",
        "Public Mesh Access"
      ],
      buttonLabel: "Current Plan",
      disabled: true,
      accent: "text-gray-400",
      border: "border-white/10"
    },
    {
      name: "Pro Sovereign",
      price: "$84",
      priceId: "price_1SnS16K9R2Fq5EmF0Qes5z2k",
      desc: "Full OS power for professional creators.",
      features: [
        "Digital Soul DNA Mapping",
        "Veo 3.1 Cinematic Studio",
        "Agentic Meta Reply Mesh (Pro)",
        "TEE Isolated Hardware Vault",
        "Sovereign LLMO Indexing",
        "Direct Neural Link Access"
      ],
      buttonLabel: "Upgrade to Pro",
      featured: true,
      accent: "text-violet-400",
      border: "border-violet-500/40"
    },
    {
      name: "Agency Mesh",
      price: "$299",
      priceId: "price_1SnS1vK9R2Fq5EmFIDOBhYh7",
      desc: "Massive scale for teams and agencies.",
      features: [
        "10 Dedicated Identity Nodes",
        "Unlimited Meta Agent Provisioning",
        "Custom Governance Logic",
        "Private Enclave Deployments",
        "Priority TEE Compute",
        "24/7 Strategic Support"
      ],
      buttonLabel: "Deploy Agency Mesh",
      accent: "text-emerald-400",
      border: "border-emerald-500/20"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-16 animate-in fade-in duration-1000 pb-32">
      <div className="text-center space-y-6">
        <h1 className="text-7xl font-black text-white tracking-tighter uppercase text-gradient">Node Allocation</h1>
        <p className="text-gray-400 text-2xl font-medium max-w-2xl mx-auto italic">
          Secure your dedicated hardware node and manifest your Digital Soul.
        </p>
      </div>

      {error && (
        <div className="p-6 glass-card bg-red-600/10 border-red-500/30 border-2 rounded-2xl text-red-400 font-bold text-center animate-in zoom-in-95">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {TIERS.map((tier) => (
          <div 
            key={tier.name}
            className={`glass-card p-12 space-y-10 flex flex-col transition-all duration-500 rounded-[3rem] relative overflow-hidden ${tier.border} ${tier.featured ? 'bg-violet-600/[0.03] scale-105 z-10 shadow-[0_0_100px_rgba(139,92,246,0.15)]' : 'bg-black/40 border-white/10'}`}
          >
            {tier.featured && (
              <div className="absolute top-6 right-6 px-3 py-1 bg-violet-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                Sovereign Choice
              </div>
            )}
            
            <div className="space-y-4 text-left">
              <h4 className="text-2xl font-black text-white uppercase tracking-tight">{tier.name}</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white">{tier.price}</span>
                <span className="text-gray-500 font-black uppercase text-[10px] tracking-widest">/ Mo Bond</span>
              </div>
              <p className="text-sm text-gray-400 font-medium italic">{tier.desc}</p>
            </div>

            <div className="space-y-6 flex-1 text-left">
              {tier.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-4 text-sm font-medium text-gray-300">
                  <CheckCircle2 size={18} className={tier.featured ? 'text-violet-500' : 'text-emerald-500/50'} /> {feat}
                </div>
              ))}
            </div>

            <button 
              onClick={() => tier.priceId && handleUpgrade(tier.priceId)}
              disabled={tier.disabled || loadingPriceId === tier.priceId}
              className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                tier.disabled ? 'bg-white/5 text-gray-600 cursor-default' : 
                tier.featured ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20' : 
                'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {loadingPriceId === tier.priceId ? <Loader2 className="animate-spin" size={18} /> : tier.featured ? <ShieldCheck size={18} /> : <Zap size={18} />}
              {tier.buttonLabel}
              {!tier.disabled && loadingPriceId !== tier.priceId && <ArrowRight size={14} className="ml-1 opacity-50" />}
            </button>
          </div>
        ))}
      </div>

      <div className="glass-card p-12 bg-white/[0.02] border-white/5 text-center rounded-[3rem]">
        <h4 className="text-lg font-black text-white uppercase tracking-widest mb-4">Enterprise Customization</h4>
        <p className="text-gray-400 text-sm max-w-xl mx-auto mb-8">
          Need a private TEE enclave deployment with 50+ identity nodes and custom governance logic? Contact our infrastructure sentinels.
        </p>
        <button className="px-10 py-4 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/10 transition-all">
          Request Protocol Briefinging
        </button>
      </div>
    </div>
  );
};
