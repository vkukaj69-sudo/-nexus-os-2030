
import { nexusApi } from "./api/nexusClient";
import { 
  AnalysisResult, 
  DigitalSoulProfile, 
  ViralPulseItem, 
  HeatmapSegment,
  CreatorAccount,
  FunnelDraft,
  GoogleTrendItem,
  ImageSize,
  VideoAspectRatio,
  NeuralThought,
  PlatformType,
  SearchSource,
  CoachResponse
} from "./types";

/**
 * PRODUCTION HARDENING: 
 * Frontend keys removed. All intelligence synthesis is routed via the TEE-isolated Nexus Oracle.
 */

const parseSafeJson = (text: string, fallback: any) => {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch (e) {
    console.error("Nexus Neural Parse Error:", e);
    return fallback;
  }
};

export const analyzeHeatmap = async (text: string): Promise<HeatmapSegment[]> => {
  try {
    const res = await nexusApi.request('/oracle/heatmap', {
      method: 'POST',
      body: JSON.stringify({ content: text })
    });
    return res.heatmap || [];
  } catch (e) {
    console.error("Heatmap Node Error:", e);
    return [];
  }
};

export const generateManifesto = async (topic: string, soul: DigitalSoulProfile | null): Promise<any> => {
  const prompt = `Synthesize Sovereign Manifesto for: "${topic}". Persona: ${soul?.archetype}. JSON with headline, manifestoText, hooks (array), visualPrompt.`;
  const res = await nexusApi.synthesize(prompt, "gemini-3-pro-preview");
  return parseSafeJson(res.text, {});
};

export const syncDigitalSoul = async (inputs: string): Promise<DigitalSoulProfile> => {
  const res = await nexusApi.synthesize(`Extract Identity DNA from: "${inputs}". JSON with archetype, coreValues, semanticFingerprint, purityScore.`, "gemini-3-pro-preview");
  const dna = parseSafeJson(res.text, {});
  await nexusApi.saveSoul(dna);
  return dna;
};

export const getViralPulse = async (niche: string): Promise<ViralPulseItem[]> => {
  const res = await nexusApi.synthesize(`Trend analysis for: "${niche}". JSON array: {topic, momentum, source, suggestedAngle, url}.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, []);
};

export const analyzeContent = async (text: string): Promise<AnalysisResult> => {
  const res = await nexusApi.synthesize(`Score content: "${text}". JSON: {score, metrics, feedback, suggestions, aiSchema}.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, {});
};

export const simulateImpact = async (content: string, soulProfile: DigitalSoulProfile | null): Promise<any> => {
  const res = await nexusApi.synthesize(`Simulate impact for: "${content}". DNA: ${soulProfile?.archetype}. JSON: {probabilityOfViralReach, syntheticFeedback}.`, "gemini-3-pro-preview");
  return parseSafeJson(res.text, {});
};

export const orchestrateGoal = async (goal: string, soul: DigitalSoulProfile | null): Promise<NeuralThought> => {
  const res = await nexusApi.synthesize(`Process intent: "${goal}". DNA: ${soul?.archetype}. JSON thought trace.`, "gemini-3-pro-preview");
  const parsed = parseSafeJson(res.text, {});
  return { id: Math.random().toString(36).substring(7), timestamp: Date.now(), agent: 'Oracle_Core', status: 'completed', ...parsed };
};

export const generateGenesisBlitzPlan = async (niche: string, soul: DigitalSoulProfile | null): Promise<any> => {
  const res = await nexusApi.synthesize(`Generate Blitz Strategy for: "${niche}". JSON: {arbitrage, yieldForecast, meshConfig, viralHooks}.`, "gemini-3-pro-preview");
  return parseSafeJson(res.text, {});
};

export const convertBrainDump = async (dump: string): Promise<{ posts: string[], threads: string[] }> => {
  const res = await nexusApi.synthesize(`Convert brain dump to assets: "${dump}". JSON: {posts, threads}.`, "gemini-3-pro-preview");
  return parseSafeJson(res.text, { posts: [], threads: [] });
};

export const getCoachIdeas = async (context: string): Promise<CoachResponse> => {
  const res = await nexusApi.synthesize(`Generate coaching ideas for: "${context}". JSON: {ideas, timingInsights}.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, { ideas: [], timingInsights: [] });
};

export const generateStreamingContent = async (prompt: string, onChunk: (text: string) => void) => {
  const res = await nexusApi.synthesize(prompt);
  onChunk(res.text || '');
};

export const generateProImage = async (prompt: string, size: ImageSize = '1K'): Promise<string> => {
  const res = await nexusApi.synthesize(prompt, 'gemini-3-pro-image-preview', { imageConfig: { imageSize: size } });
  return res.imageUrl || ''; 
};

export const generateReply = async (post: string, tone: string): Promise<string[]> => {
  const res = await nexusApi.synthesize(`Generate 3 ${tone} replies to: "${post}". JSON array.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, []);
};

export const analyzeAccount = async (handle: string, platform: PlatformType): Promise<CreatorAccount> => {
  const res = await nexusApi.synthesize(`Research @${handle} on ${platform}. JSON creator account profile.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, { username: handle, niche: '', stats: { followers: '0', avgEngagement: '0%' }, strategyNotes: '', topPosts: [] });
};

export const analyzeHistoryData = async (history: string): Promise<any> => {
  const res = await nexusApi.synthesize(`Analyze history: "${history}". JSON winning topics and hooks.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, { winningTopics: [], hookStyles: [], engagementInsights: '' });
};

export const repurposeInVoice = async (content: string, voice: string): Promise<string> => {
  const res = await nexusApi.synthesize(`Repurpose: "${content}" with voice: "${voice}".`, "gemini-3-flash-preview");
  return res.text || '';
};

export const generateFunnel = async (source: string): Promise<FunnelDraft> => {
  const res = await nexusApi.synthesize(`Generate micro-funnel from: "${source}". JSON headline, features, cta, etc.`, "gemini-3-pro-preview");
  return parseSafeJson(res.text, { headline: '', subheadline: '', cta: '', heroText: '', accentColor: '', features: [], jsonLd: '' });
};

export const getGoogleTrends = async (niche: string): Promise<{ trends: GoogleTrendItem[], sources: SearchSource[] }> => {
  const res = await nexusApi.synthesize(`Search trends for: "${niche}". JSON trends array and sources.`, "gemini-3-flash-preview");
  return parseSafeJson(res.text, { trends: [], sources: [] });
};
