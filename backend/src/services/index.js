/**
 * NEXUS LEVIATHAN - Services Index
 * Complete service registry for autonomous intelligence system
 */

// ═══════════════════════════════════════════════════════════════════════
// LAYER 0: FOUNDATION (Existing)
// ═══════════════════════════════════════════════════════════════════════
const MemoryService = require('./MemoryService');
const KnowledgeService = require('./KnowledgeService');
const ReasoningService = require('./ReasoningService');
const SelfImprovementService = require('./SelfImprovementService');
const SecurityService = require('./SecurityService');
const EnterpriseService = require('./EnterpriseService');
const WorkflowService = require('./WorkflowService');
const RealtimeService = require('./RealtimeService');
const AnalyticsService = require('./AnalyticsService');
const PluginService = require('./PluginService');

// ═══════════════════════════════════════════════════════════════════════
// LAYER 1: CORE SEGP
// ═══════════════════════════════════════════════════════════════════════
const EvolverService = require('./EvolverService');
const SchedulerService = require('./SchedulerService');
const EventBusService = require('./EventBusService');

// ═══════════════════════════════════════════════════════════════════════
// LAYER 2: INTELLIGENCE
// ═══════════════════════════════════════════════════════════════════════
const AttentionArbitrageService = require('./AttentionArbitrageService');
const SyntheticSimulatorService = require('./SyntheticSimulatorService');
const FeedbackLedgerService = require('./FeedbackLedgerService');
const PhilosophyRewriterService = require('./PhilosophyRewriterService');

// ═══════════════════════════════════════════════════════════════════════
// LAYER 3: GHOST PROTOCOL
// ═══════════════════════════════════════════════════════════════════════
const StealthBrowserService = require('./StealthBrowserService');
const ProxyMeshService = require('./ProxyMeshService');
const RateLimiterService = require('./RateLimiterService');

// ═══════════════════════════════════════════════════════════════════════
// LAYER 4: REVENUE ENGINE
// ═══════════════════════════════════════════════════════════════════════
const AffiliateMeshService = require('./AffiliateMeshService');
const YieldHarvesterService = require('./YieldHarvesterService');
const ComputeTieringService = require('./ComputeTieringService');

module.exports = {
  // Layer 0: Foundation
  MemoryService,
  KnowledgeService,
  ReasoningService,
  SelfImprovementService,
  SecurityService,
  EnterpriseService,
  WorkflowService,
  RealtimeService,
  AnalyticsService,
  PluginService,

  // Layer 1: Core SEGP
  EvolverService,
  SchedulerService,
  EventBusService,

  // Layer 2: Intelligence
  AttentionArbitrageService,
  SyntheticSimulatorService,
  FeedbackLedgerService,
  PhilosophyRewriterService,

  // Layer 3: Ghost Protocol
  StealthBrowserService,
  ProxyMeshService,
  RateLimiterService,

  // Layer 4: Revenue Engine
  AffiliateMeshService,
  YieldHarvesterService,
  ComputeTieringService
};
