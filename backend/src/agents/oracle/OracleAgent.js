/**
 * NEXUS OS - Oracle Core Agent
 * The Master Orchestrator
 * Routes tasks, coordinates agents, makes decisions
 */

const BaseAgent = require('../BaseAgent');
const { registry } = require('../AgentRegistry');

class OracleAgent extends BaseAgent {
  constructor() {
    super({
      id: 'oracle_core',
      name: 'Master Orchestrator',
      specialty: 'Sovereign Logic - Task Delegation',
      capabilities: ['orchestrate', 'route', 'decompose', 'coordinate']
    });

    this.taskHistory = [];
    this.decisionLog = [];
  }

  // Analyze task and determine best approach
  analyzeTask(task) {
    const { type, payload, priority = 'medium' } = task;

    // Task routing rules
    const routing = {
      // Research & Intelligence
      'research': { agent: 'scryer_01', complexity: 2 },
      'trend_analysis': { agent: 'scryer_01', complexity: 3 },
      'competitor_intel': { agent: 'scryer_01', complexity: 4 },
      
      // Content Creation
      'content_generate': { agent: 'scribe_01', complexity: 2 },
      'content_transform': { agent: 'scribe_01', complexity: 1 },
      'content_enhance': { agent: 'scribe_01', complexity: 2 },
      
      // Media
      'video_generate': { agent: 'vulcan_01', complexity: 5 },
      'image_generate': { agent: 'vulcan_01', complexity: 3 },
      'thumbnail_create': { agent: 'vulcan_01', complexity: 2 },
      
      // Memory & Knowledge
      'memory_store': { agent: 'mnemosyne_01', complexity: 1 },
      'memory_retrieve': { agent: 'mnemosyne_01', complexity: 1 },
      'knowledge_query': { agent: 'mnemosyne_01', complexity: 2 },
      
      // Brand & Security
      'brand_check': { agent: 'brandguard_01', complexity: 2 },
      'security_audit': { agent: 'sentinel_01', complexity: 3 },
      
      // Engagement
      'reply_draft': { agent: 'replyguy_01', complexity: 2 },
      'engagement_plan': { agent: 'replyguy_01', complexity: 3 },
      
      // Partnerships
      'collab_find': { agent: 'collabfinder_01', complexity: 3 },
      'outreach_draft': { agent: 'collabfinder_01', complexity: 2 }
    };

    return routing[type] || { agent: 'oracle_core', complexity: 1 };
  }

  // Decompose complex tasks into subtasks
  decomposeTask(task) {
    const { type, payload } = task;
    const subtasks = [];

    // Complex task decomposition
    if (type === 'full_content_pipeline') {
      subtasks.push(
        { type: 'trend_analysis', payload: { topic: payload.topic }, order: 1 },
        { type: 'content_generate', payload: { topic: payload.topic }, order: 2 },
        { type: 'brand_check', payload: { content: null }, order: 3 }, // Will receive content from step 2
        { type: 'image_generate', payload: { topic: payload.topic }, order: 4 }
      );
    }

    if (type === 'viral_content_analysis') {
      subtasks.push(
        { type: 'trend_analysis', payload: { topic: payload.topic }, order: 1 },
        { type: 'competitor_intel', payload: { topic: payload.topic }, order: 2 },
        { type: 'content_generate', payload: { insights: null }, order: 3 }
      );
    }

    if (type === 'engagement_campaign') {
      subtasks.push(
        { type: 'trend_analysis', payload: { niche: payload.niche }, order: 1 },
        { type: 'collab_find', payload: { niche: payload.niche }, order: 2 },
        { type: 'reply_draft', payload: { targets: null }, order: 3 },
        { type: 'outreach_draft', payload: { collaborators: null }, order: 4 }
      );
    }

    return subtasks.length > 0 ? subtasks : [task];
  }

  // Main execution
  async execute(task) {
    const analysis = this.analyzeTask(task);
    const subtasks = this.decomposeTask(task);

    this.logDecision({
      task: task.type,
      analysis,
      subtasks: subtasks.length,
      timestamp: new Date()
    });

    // Single task - route directly
    if (subtasks.length === 1 && analysis.agent !== 'oracle_core') {
      const targetAgent = registry.get(analysis.agent);
      
      if (!targetAgent) {
        throw new Error(`Agent ${analysis.agent} not available`);
      }

      return await targetAgent.processTask(task);
    }

    // Multi-step task - orchestrate
    const results = [];
    let previousResult = null;

    for (const subtask of subtasks.sort((a, b) => a.order - b.order)) {
      // Inject previous result if needed
      if (previousResult && subtask.payload) {
        subtask.payload.previousResult = previousResult;
      }

      const subAnalysis = this.analyzeTask(subtask);
      const targetAgent = registry.get(subAnalysis.agent);

      if (!targetAgent) {
        console.warn(`Agent ${subAnalysis.agent} not available, skipping subtask`);
        continue;
      }

      const result = await targetAgent.processTask(subtask);
      results.push(result);
      previousResult = result;
    }

    return {
      type: 'orchestrated',
      originalTask: task.type,
      subtasksCompleted: results.length,
      results
    };
  }

  // Log decisions for transparency
  logDecision(decision) {
    this.decisionLog.push(decision);
    if (this.decisionLog.length > 100) {
      this.decisionLog.shift(); // Keep last 100
    }
  }

  // Get decision history
  getDecisionLog() {
    return this.decisionLog;
  }

  // Override toJSON to include decision log
  toJSON() {
    return {
      ...super.toJSON(),
      decisionLogSize: this.decisionLog.length,
      recentDecisions: this.decisionLog.slice(-5)
    };
  }
}

module.exports = OracleAgent;
