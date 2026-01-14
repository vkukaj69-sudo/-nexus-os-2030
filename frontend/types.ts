
export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  PRO = 'pro',
  AGENCY = 'agency',
  CITIZEN = 'citizen'
}

export enum OnboardingStep {
  IDLE = 'idle',
  DNA_INTAKE = 'dna_intake',
  NEURAL_SCAN = 'neural_scan',
  ALIGNMENT_RESULT = 'alignment_result',
  THE_ACCORD = 'the_accord',
  HARDWARE_BOND = 'hardware_bond',
  KEY_REVEAL = 'key_reveal'
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }

  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

export type ImageSize = '1K' | '2K' | '4K';
export type VideoAspectRatio = '16:9' | '9:16';

export type LegalSectionId = 'accord' | 'dominion' | 'reciprocity' | 'copyright' | 'conduct' | 'persistence';

export interface GlobalSnapshot {
  version: string;
  timestamp: number;
  soul: DigitalSoulProfile | null;
  infrastructure: {
    isVerified: boolean;
    isInsured: boolean;
    phase1Verified: boolean;
    accordAccepted: boolean;
    accordTimestamp?: number;
    accordVersionHash?: string;
  };
  meshCount: number;
}

export enum ToolType {
  SOVEREIGN_CORE = 'sovereign_core', 
  AGENT_HUB = 'agent_hub',           
  IDENTITY_NODE = 'identity_node',   
  DIGITAL_SOUL = 'digital_soul',
  KNOWLEDGE_GRAPH = 'knowledge_graph',
  DIGITAL_TWIN = 'digital_twin',
  COMPUTER_USE = 'computer_use',
  IMPACT_SIMULATOR = 'impact_simulator',
  COGNITIVE_COMPOSER = 'cognitive_composer',
  REPLY_GUY = 'reply_guy',
  RESEARCHER = 'researcher',
  TRENDS_LAB = 'trends_lab',
  COGNITIVE_PARTNER = 'cognitive_partner',
  LEGAL = 'legal',
  USER_MANAGEMENT = 'user_management', 
  DASHBOARD = 'dashboard',
  ALGO_ANALYZER = 'algo_analyzer',
  BRAIN_DUMP = 'brain_dump',
  COACH = 'coach',
  HISTORY_HUB = 'history_hub',
  LIBRARY = 'library',
  PRO_LAB = 'pro_lab',
  FUNNEL_BUILDER = 'funnel_builder',
  BRAND_LAB = 'brand_lab',
  SECURITY_NODE = 'security_node',
  VIDEO_STUDIO = 'video_studio',
  ROADMAP_LAB = 'roadmap_lab',
  MANIFESTO_LAB = 'manifesto_lab',
  NEURAL_LINK = 'neural_link',
  FOUNDRY = 'foundry',
  DOMINION_SCRYER = 'dominion_scryer',
  SETTINGS = 'settings',
  PRICING = 'pricing'
}

export interface RoadmapMilestone {
  id: string;
  phase: number;
  title: string;
  objective: string;
  targetReach: string;
  targetRevenue: string;
  status: 'locked' | 'active' | 'completed';
  tasks: string[];
}

export interface SearchSource {
  title: string;
  uri: string;
}

export type PlatformType = 'X' | 'LinkedIn' | 'Reddit' | 'YouTube' | 'TikTok' | 'Facebook' | 'Instagram';

export interface SecurityStatus {
  teeActive: boolean;
  hsmLocked: boolean;
  memoryEncrypted: boolean;
  threatLevel: 'low' | 'elevated' | 'critical';
  blockedAttacks: number;
  codeIntegrity: number; 
  quantumSafe: boolean;
  zeroTrustActive: boolean;
  kernelHealth: number;
  uptime: string;
}

export interface StripeStatus {
  isConnected: boolean;
  mode: string;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  billingAutomationActive?: boolean;
  currentArr: number;
  revenueBreakdown?: {
    seatSubscriptions: number;
    unitMarkups: number;
    pendingUsage: number;
  };
}

export interface VideoSynthesisState {
  id: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  progressMessage: string;
  videoUrl: string | null;
}

export interface NeuralThought {
  id: string;
  timestamp: number;
  reasoning: string;
  action: string;
  agent: string;
  status: 'thinking' | 'executing' | 'completed' | 'alert';
}

export interface AgentActivity {
  id: string;
  agentName: string;
  status: 'active' | 'completed' | 'paused' | 'hibernating';
  task: string;
  progress: number;
  specialty: 'Foundation Intelligence' | 'Agency Ops' | 'Infrastructure Sentinel' | 'Content Synthesis';
  tenantId: string; 
}

export interface DigitalSoulProfile {
  archetype: string;
  coreValues: string[];
  semanticFingerprint: string;
  purityScore: number;
  lastSync: string;
  evolutionStage: number;
  memoryNodes: number;
}

export interface SimulationResult {
  probabilityOfViralReach: number;
  audienceSentiment: number;
  syntheticFeedback: {
    persona: string;
    reaction: 'convert' | 'ignore' | 'offended' | 'intrigued';
    reasoning: string;
  }[];
}

export interface ViralPulseItem {
  topic: string;
  momentum: number;
  source: string;
  suggestedAngle: string;
  url: string;
}

export interface AnalysisResult {
  score: number;
  metrics: {
    hookStrength: number;
    readability: number;
    viralIndex: number;
    ragScore: number;
    semanticClarity: number;
    soulAlignment: number;
    authenticity: number;
  };
  feedback: string;
  suggestions: string[];
  aiSchema: string;
}

export interface FunnelDraft {
  headline: string;
  subheadline: string;
  cta: string;
  heroText: string;
  accentColor: string;
  features: { title: string; desc: string }[];
  jsonLd: string;
}

export interface GoogleTrendItem {
  keyword: string;
  intent: 'commercial' | 'transactional' | 'informational';
  searchVolume: string;
  growth: string;
  difficulty: number;
}

export interface HeatmapSegment {
  text: string;
  score: number;
  reason: string;
}

export interface ContentIdea {
  type: string;
  title: string;
  hook: string;
  reasoning: string;
}

export interface TimingInsight {
  time: string;
  platform: string;
  reason: string;
  intensity: number; 
}

export interface CoachResponse {
  ideas: ContentIdea[];
  timingInsights: TimingInsight[];
}

export interface CreatorAccount {
  username: string;
  niche: string;
  stats: {
    followers: string;
    avgEngagement: string;
  };
  strategyNotes: string;
  topPosts: string[];
  sources?: SearchSource[];
}

export type ReplyStatus = 'pending' | 'approved' | 'rejected';

export interface QueuedReply {
  id: string;
  sourceAccount: string;
  sourceHandle: string;
  originalPost: string;
  draftContent: string;
  tone: string;
  status: ReplyStatus;
  confidenceScore: number;
  timestamp: number;
}

export interface Inspiration {
  id: string;
  author: string;
  content: string;
  category: string;
}

// Added missing interface to resolve error in views/DigitalTwin.tsx
export interface DigitalTwinState {
  status: string;
  purity: number;
  activeThreads: number;
  scheduledPosts: number;
}

// Added missing interface to resolve error in views/ComputerUse.tsx
export interface ComputerTask {
  id: string;
  name: string;
  target: string;
  steps: string[];
  status: string;
}

// Added missing interface to resolve error in views/Foundry.tsx
export interface FoundryModule {
  id: string;
  name: string;
  type: string;
  status: string;
  value: string;
}
