/**
 * NEXUS OS - Backend Server
 * Multi-Agent Orchestration System
 * 2030 Evolution Build
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');

// Import Agent System
const {
  registry,
  initializeAgents,
  getSystemStatus
} = require('./agents');

const app = express();
const PORT = process.env.PORT || 3001;

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Auto-migration: Create tables if they don't exist
const runMigrations = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        module VARCHAR(100) NOT NULL,
        metadata JSONB DEFAULT '{}',
        tokens_used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_module ON usage_logs(module)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at)`);
    console.log('[Migration] usage_logs table ready');
  } catch (err) {
    console.error('[Migration] Error:', err.message);
  }
};
runMigrations();

// Redis
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

// Job Queue
const taskQueue = new Queue('nexus-tasks', { connection: redisConnection });

// Initialize Agents
const agents = initializeAgents({
  pool,
  perplexityKey: process.env.PERPLEXITY_API_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY
});

// Give Mnemosyne access to database
agents.mnemosyne.setPool(pool);

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ═══════════════════════════════════════════
// HEALTH & STATUS
// ═══════════════════════════════════════════

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/status', async (req, res) => {
  const status = getSystemStatus();
  const sentinel = registry.get('sentinel_01');
  const health = await sentinel.processTask({ type: 'health_check' });

  res.json({
    success: true,
    ...health.result,
    agents: status.agents,
    timestamp: new Date()
  });
});

// ═══════════════════════════════════════════
// AUTH ENDPOINTS
// ═══════════════════════════════════════════

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
      [email, hashedPassword]
    );
    const token = jwt.sign(
      { userId: result.rows[0].id, email, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, user: result.rows[0], token });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, user: { id: user.id, email: user.email, role: user.role }, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// AGENT ENDPOINTS
// ═══════════════════════════════════════════

app.get('/api/agents/list', (req, res) => {
  const agents = registry.getAll().map(a => a.toJSON());
  res.json({ success: true, agents });
});

app.get('/api/agents/:id', (req, res) => {
  const agent = registry.get(req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json({ success: true, agent: agent.toJSON() });
});

app.post('/api/agents/:id/task', authenticate, async (req, res) => {
  try {
    const agent = registry.get(req.params.id);
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const { type, payload } = req.body;
    payload.userId = req.user.userId;
    payload.apiKey = payload.apiKey || null;

    const result = await agent.processTask({ type, payload });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// ORACLE - ORCHESTRATED TASKS
// ═══════════════════════════════════════════

app.post('/api/oracle/execute', authenticate, async (req, res) => {
  try {
    const oracle = registry.get('oracle_core');
    const { task, payload } = req.body;
    payload.userId = req.user.userId;

    const result = await oracle.processTask({ type: task, payload });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// SCRYER - INTELLIGENCE
// ═══════════════════════════════════════════

app.post('/api/scryer/analyze', authenticate, async (req, res) => {
  try {
    const scryer = registry.get('scryer_01');
    const { query, analysisType } = req.body;

    const result = await scryer.processTask({
      type: analysisType || 'research',
      payload: { query, topic: query }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// SCRIBE - CONTENT
// ═══════════════════════════════════════════

app.post('/api/scribe/generate', authenticate, async (req, res) => {
  try {
    const scribe = registry.get('scribe_01');
    const { content, platform, type = 'content_generate' } = req.body;

    const result = await scribe.processTask({
      type,
      payload: { topic: content, content, platform }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/scribe/transform', authenticate, async (req, res) => {
  try {
    const scribe = registry.get('scribe_01');
    const { content, fromPlatform, toPlatform } = req.body;

    const result = await scribe.processTask({
      type: 'content_transform',
      payload: { content, fromPlatform, toPlatform }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// BRAND GUARDIAN
// ═══════════════════════════════════════════

app.post('/api/brandguard/check', authenticate, async (req, res) => {
  try {
    const brandguard = registry.get('brandguard_01');
    const { content, contentType } = req.body;

    const result = await brandguard.processTask({
      type: 'brand_check',
      payload: { userId: req.user.userId, content, contentType }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// REPLY GUY - ENGAGEMENT
// ═══════════════════════════════════════════

app.post('/api/replyguy/draft', authenticate, async (req, res) => {
  try {
    const replyguy = registry.get('replyguy_01');
    const { originalPost, author, platform, strategy } = req.body;

    const result = await replyguy.processTask({
      type: 'reply_draft',
      payload: { originalPost, author, platform, strategy }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/replyguy/queue', authenticate, (req, res) => {
  const replyguy = registry.get('replyguy_01');
  res.json(replyguy.getReplyQueue());
});

// ═══════════════════════════════════════════
// COLLAB FINDER
// ═══════════════════════════════════════════

app.post('/api/collabfinder/find', authenticate, async (req, res) => {
  try {
    const collabfinder = registry.get('collabfinder_01');
    const { niche, creatorProfile, targetSize, collabType } = req.body;

    const result = await collabfinder.processTask({
      type: 'collab_find',
      payload: { niche, creatorProfile, targetSize, collabType }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// MNEMOSYNE - MEMORY
// ═══════════════════════════════════════════

app.post('/api/soul/ingest', authenticate, async (req, res) => {
  try {
    const mnemosyne = registry.get('mnemosyne_01');
    const result = await mnemosyne.processTask({
      type: 'soul_store',
      payload: { userId: req.user.userId, ...req.body }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/soul/retrieve', authenticate, async (req, res) => {
  try {
    const mnemosyne = registry.get('mnemosyne_01');
    const result = await mnemosyne.processTask({
      type: 'soul_retrieve',
      payload: { userId: req.user.userId }
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════

app.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║     NEXUS OS - 2030 EVOLUTION BUILD       ║');
  console.log('║     Multi-Agent Orchestration System      ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║  Port: ${PORT}                              ║`);
  console.log(`║  Agents: ${registry.getAll().length} online                       ║`);
  console.log('║  Status: OPERATIONAL                      ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
});

// ═══════════════════════════════════════════
// FUNNELSMITH - FUNNELS & LANDING PAGES
// ═══════════════════════════════════════════

app.post('/api/funnelsmith/create', authenticate, async (req, res) => {
  try {
    const funnelsmith = registry.get('funnelsmith_01');
    const { type = 'landing_page', ...payload } = req.body;
    const result = await funnelsmith.processTask({ type, payload });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// SITEFORGE - MICRO-WEBSITES
// ═══════════════════════════════════════════

app.post('/api/siteforge/create', authenticate, async (req, res) => {
  try {
    const siteforge = registry.get('siteforge_01');
    const { type = 'microsite_create', ...payload } = req.body;
    const result = await siteforge.processTask({ type, payload });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// MEMORY SERVICE
// ═══════════════════════════════════════════

const { MemoryService } = require('./services');
const memoryService = new MemoryService(pool, { geminiKey: process.env.GEMINI_API_KEY });

// Memory endpoints
app.post('/api/memory/store', authenticate, async (req, res) => {
  try {
    const { type, data } = req.body;
    const userId = req.user.userId;
    
    let result;
    switch (type) {
      case 'episodic':
        result = await memoryService.storeEpisodic(userId, data);
        break;
      case 'semantic':
        result = await memoryService.storeSemantic(userId, data);
        break;
      case 'procedural':
        result = await memoryService.storeProcedural(userId, data);
        break;
      default:
        return res.status(400).json({ error: 'Invalid memory type' });
    }
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/memory/recall', authenticate, async (req, res) => {
  try {
    const { type, query, agentId, limit = 5 } = req.body;
    const userId = req.user.userId;
    
    let result;
    switch (type) {
      case 'episodic':
        result = await memoryService.recallEpisodic(userId, query, limit);
        break;
      case 'semantic':
        result = await memoryService.recallSemantic(userId, query, limit);
        break;
      case 'procedural':
        result = await memoryService.recallProcedural(userId, agentId, query, limit);
        break;
      case 'context':
        result = await memoryService.buildContext(userId, query, agentId);
        break;
      default:
        return res.status(400).json({ error: 'Invalid memory type' });
    }
    res.json({ success: true, memories: result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/memory/consolidate', authenticate, async (req, res) => {
  try {
    const result = await memoryService.consolidate(req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Inject memory service into agents
agents.mnemosyne.memoryService = memoryService;

// ═══════════════════════════════════════════
// KNOWLEDGE GRAPH SERVICE
// ═══════════════════════════════════════════

const { KnowledgeService } = require('./services');
const knowledgeService = new KnowledgeService(pool, { geminiKey: process.env.GEMINI_API_KEY });

// Create entity
app.post('/api/knowledge/entity', authenticate, async (req, res) => {
  try {
    const result = await knowledgeService.createEntity(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Find entities
app.post('/api/knowledge/search', authenticate, async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    const entities = await knowledgeService.findEntities(req.user.userId, query, limit);
    res.json({ success: true, entities });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get entities by type
app.get('/api/knowledge/entities/:type', authenticate, async (req, res) => {
  try {
    const entities = await knowledgeService.getEntitiesByType(req.user.userId, req.params.type);
    res.json({ success: true, entities });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create relationship
app.post('/api/knowledge/relationship', authenticate, async (req, res) => {
  try {
    const result = await knowledgeService.createRelationship(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get entity graph
app.get('/api/knowledge/graph/:entityId', authenticate, async (req, res) => {
  try {
    const { depth = 2 } = req.query;
    const graph = await knowledgeService.getEntityGraph(req.user.userId, req.params.entityId, parseInt(depth));
    res.json({ success: true, graph });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Query graph with natural language
app.post('/api/knowledge/query', authenticate, async (req, res) => {
  try {
    const { question } = req.body;
    const result = await knowledgeService.queryGraph(req.user.userId, question);
    res.json({ success: true, ...result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Extract entities from text (auto-populate graph)
app.post('/api/knowledge/extract', authenticate, async (req, res) => {
  try {
    const { text, contextType = 'content' } = req.body;
    const result = await knowledgeService.extractAndStore(req.user.userId, text, contextType);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// REASONING ENGINE SERVICE
// ═══════════════════════════════════════════

const { ReasoningService } = require('./services');
const reasoningService = new ReasoningService(pool, { geminiKey: process.env.GEMINI_API_KEY });

// Create goal
app.post('/api/reasoning/goal', authenticate, async (req, res) => {
  try {
    const result = await reasoningService.createGoal(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Decompose goal into subtasks
app.post('/api/reasoning/goal/:goalId/decompose', authenticate, async (req, res) => {
  try {
    const result = await reasoningService.decomposeGoal(req.user.userId, req.params.goalId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get goals
app.get('/api/reasoning/goals', authenticate, async (req, res) => {
  try {
    const goals = await reasoningService.getGoals(req.user.userId, req.query.status);
    res.json({ success: true, goals });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Reason about something
app.post('/api/reasoning/think', authenticate, async (req, res) => {
  try {
    const { input, chainType = 'analysis', goalId } = req.body;
    const result = await reasoningService.reason(req.user.userId, input, chainType, goalId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Make a decision
app.post('/api/reasoning/decide', authenticate, async (req, res) => {
  try {
    const { decisionType, options, context } = req.body;
    const result = await reasoningService.makeDecision(req.user.userId, decisionType, options, context);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Chain of thought reasoning
app.post('/api/reasoning/chain', authenticate, async (req, res) => {
  try {
    const { problem, maxSteps = 5 } = req.body;
    const result = await reasoningService.chainOfThought(req.user.userId, problem, maxSteps);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// SELF-IMPROVEMENT SERVICE
// ═══════════════════════════════════════════

const { SelfImprovementService } = require('./services');
const improvementService = new SelfImprovementService(pool, { geminiKey: process.env.GEMINI_API_KEY });

// Record performance metric
app.post('/api/improve/metric', authenticate, async (req, res) => {
  try {
    const { agentId, metricType, value, context } = req.body;
    const result = await improvementService.recordMetric(req.user.userId, agentId, metricType, value, context);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get agent stats
app.get('/api/improve/stats/:agentId', authenticate, async (req, res) => {
  try {
    const stats = await improvementService.getAgentStats(req.user.userId, req.params.agentId, req.query.days || 30);
    res.json({ success: true, stats });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Submit feedback
app.post('/api/improve/feedback', authenticate, async (req, res) => {
  try {
    const { agentId, rating, feedbackType, comment, interactionId } = req.body;
    const result = await improvementService.submitFeedback(req.user.userId, agentId, { rating, feedbackType, comment, interactionId });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get active improvements
app.get('/api/improve/improvements/:agentId', authenticate, async (req, res) => {
  try {
    const improvements = await improvementService.getActiveImprovements(req.user.userId, req.params.agentId);
    res.json({ success: true, improvements });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Analyze agent performance
app.get('/api/improve/analyze/:agentId', authenticate, async (req, res) => {
  try {
    const analysis = await improvementService.analyzePerformance(req.user.userId, req.params.agentId);
    res.json(analysis);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create A/B experiment
app.post('/api/improve/experiment', authenticate, async (req, res) => {
  try {
    const result = await improvementService.createExperiment(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// SECURITY SERVICE
// ═══════════════════════════════════════════

const { SecurityService } = require('./services');
const securityService = new SecurityService(pool);

// Create API key
app.post('/api/security/apikey', authenticate, async (req, res) => {
  try {
    const { name, permissions, expiresIn } = req.body;
    const result = await securityService.createApiKey(req.user.userId, name, permissions, expiresIn);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// List API keys
app.get('/api/security/apikeys', authenticate, async (req, res) => {
  try {
    const keys = await securityService.listApiKeys(req.user.userId);
    res.json({ success: true, keys });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Revoke API key
app.delete('/api/security/apikey/:keyId', authenticate, async (req, res) => {
  try {
    const result = await securityService.revokeApiKey(req.user.userId, req.params.keyId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get audit log
app.get('/api/security/audit', authenticate, async (req, res) => {
  try {
    const logs = await securityService.getAuditLog(req.user.userId, req.query);
    res.json({ success: true, logs });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get security events
app.get('/api/security/events', authenticate, async (req, res) => {
  try {
    const events = await securityService.getSecurityEvents({ userId: req.user.userId, ...req.query });
    res.json({ success: true, events });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Grant permission
app.post('/api/security/permission', authenticate, async (req, res) => {
  try {
    const result = await securityService.grantPermission(req.body.targetUserId || req.user.userId, {
      ...req.body, grantedBy: req.user.userId
    });
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Check permission
app.get('/api/security/permission/check', authenticate, async (req, res) => {
  try {
    const { agentId, resourceType, action } = req.query;
    const allowed = await securityService.checkPermission(req.user.userId, agentId, resourceType, action);
    res.json({ success: true, allowed });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Revoke all sessions (logout everywhere)
app.post('/api/security/sessions/revoke-all', authenticate, async (req, res) => {
  try {
    const result = await securityService.revokeAllSessions(req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// ENTERPRISE SERVICE
// ═══════════════════════════════════════════

const { EnterpriseService } = require('./services');
const enterpriseService = new EnterpriseService(pool, securityService);

// Create organization
app.post('/api/org', authenticate, async (req, res) => {
  try {
    const result = await enterpriseService.createOrganization(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get user's organizations
app.get('/api/orgs', authenticate, async (req, res) => {
  try {
    const orgs = await enterpriseService.getUserOrganizations(req.user.userId);
    res.json({ success: true, organizations: orgs });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get organization details
app.get('/api/org/:orgId', authenticate, async (req, res) => {
  try {
    const org = await enterpriseService.getOrganization(req.params.orgId);
    const members = await enterpriseService.getOrgMembers(req.params.orgId);
    const workspaces = await enterpriseService.getOrgWorkspaces(req.params.orgId);
    res.json({ success: true, organization: org, members, workspaces });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Invite member
app.post('/api/org/:orgId/invite', authenticate, async (req, res) => {
  try {
    const { email, role } = req.body;
    const result = await enterpriseService.inviteMember(req.params.orgId, req.user.userId, email, role);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Accept invitation
app.post('/api/invite/accept', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    const result = await enterpriseService.acceptInvitation(token, req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create workspace
app.post('/api/org/:orgId/workspace', authenticate, async (req, res) => {
  try {
    const result = await enterpriseService.createWorkspace(req.params.orgId, req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get user's workspaces
app.get('/api/workspaces', authenticate, async (req, res) => {
  try {
    const workspaces = await enterpriseService.getUserWorkspaces(req.user.userId);
    res.json({ success: true, workspaces });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Share resource
app.post('/api/share', authenticate, async (req, res) => {
  try {
    const result = await enterpriseService.shareResource(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update member role
app.put('/api/org/:orgId/member/:userId', authenticate, async (req, res) => {
  try {
    const { role } = req.body;
    const result = await enterpriseService.updateMemberRole(req.params.orgId, req.user.userId, req.params.userId, role);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// WORKFLOW ENGINE SERVICE
// ═══════════════════════════════════════════

const { WorkflowService } = require('./services');
const workflowService = new WorkflowService(pool, {});

// Create workflow
app.post('/api/workflow', authenticate, async (req, res) => {
  try {
    const result = await workflowService.createWorkflow(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get user workflows
app.get('/api/workflows', authenticate, async (req, res) => {
  try {
    const workflows = await workflowService.getUserWorkflows(req.user.userId);
    res.json({ success: true, workflows });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get workflow details
app.get('/api/workflow/:workflowId', authenticate, async (req, res) => {
  try {
    const workflow = await workflowService.getWorkflow(req.params.workflowId);
    const runs = await workflowService.getWorkflowRuns(req.params.workflowId, 10);
    res.json({ success: true, workflow, runs });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update workflow
app.put('/api/workflow/:workflowId', authenticate, async (req, res) => {
  try {
    const result = await workflowService.updateWorkflow(req.params.workflowId, req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Execute workflow
app.post('/api/workflow/:workflowId/run', authenticate, async (req, res) => {
  try {
    const result = await workflowService.executeWorkflow(req.params.workflowId, req.user.userId, req.body.input || {});
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get run details
app.get('/api/workflow/run/:runId', authenticate, async (req, res) => {
  try {
    const run = await workflowService.getRunDetails(req.params.runId);
    res.json({ success: true, run });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create webhook
app.post('/api/workflow/:workflowId/webhook', authenticate, async (req, res) => {
  try {
    const result = await workflowService.createWebhook(req.user.userId, req.params.workflowId, req.body.name);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Webhook trigger endpoint (public)
app.post('/api/webhook/:endpointKey', async (req, res) => {
  try {
    const result = await workflowService.triggerWebhook(req.params.endpointKey, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// REALTIME SERVICE
// ═══════════════════════════════════════════

const { RealtimeService } = require('./services');
const realtimeService = new RealtimeService(pool);

// Get notifications
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const notifications = await realtimeService.getNotifications(req.user.userId, req.query.unread === 'true');
    const unreadCount = await realtimeService.getUnreadCount(req.user.userId);
    res.json({ success: true, notifications, unreadCount });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create notification (internal/admin)
app.post('/api/notification', authenticate, async (req, res) => {
  try {
    const result = await realtimeService.createNotification(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Mark notification as read
app.put('/api/notification/:notifId/read', authenticate, async (req, res) => {
  try {
    const result = await realtimeService.markAsRead(req.user.userId, req.params.notifId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Mark all as read
app.put('/api/notifications/read-all', authenticate, async (req, res) => {
  try {
    const result = await realtimeService.markAllAsRead(req.user.userId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get notification settings
app.get('/api/notifications/settings', authenticate, async (req, res) => {
  try {
    const settings = await realtimeService.getSettings(req.user.userId);
    res.json({ success: true, settings });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update notification settings
app.put('/api/notifications/settings', authenticate, async (req, res) => {
  try {
    const result = await realtimeService.updateSettings(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create channel
app.post('/api/channel', authenticate, async (req, res) => {
  try {
    const result = await realtimeService.createChannel(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get user channels
app.get('/api/channels', authenticate, async (req, res) => {
  try {
    const channels = await realtimeService.getUserChannels(req.user.userId);
    res.json({ success: true, channels });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Send message to channel
app.post('/api/channel/:channelId/message', authenticate, async (req, res) => {
  try {
    const { content, messageType, metadata } = req.body;
    const result = await realtimeService.sendMessage(req.user.userId, req.params.channelId, content, messageType, metadata);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get channel messages
app.get('/api/channel/:channelId/messages', authenticate, async (req, res) => {
  try {
    const messages = await realtimeService.getChannelMessages(req.params.channelId, req.query.limit || 50);
    res.json({ success: true, messages });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get agent statuses
app.get('/api/agents/status', authenticate, async (req, res) => {
  try {
    const statuses = await realtimeService.getAgentStatuses(req.user.userId);
    res.json({ success: true, statuses });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Update agent status
app.put('/api/agent/:agentId/status', authenticate, async (req, res) => {
  try {
    const { status, currentTask, progress } = req.body;
    const result = await realtimeService.updateAgentStatus(req.user.userId, req.params.agentId, status, currentTask, progress);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// ANALYTICS SERVICE
// ═══════════════════════════════════════════

const { AnalyticsService } = require('./services');
const analyticsService = new AnalyticsService(pool);

// Track event
app.post('/api/analytics/event', authenticate, async (req, res) => {
  try {
    const result = await analyticsService.trackEvent(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get usage stats
app.get('/api/analytics/usage', authenticate, async (req, res) => {
  try {
    const stats = await analyticsService.getUsageStats(req.user.userId, req.query.days || 30);
    res.json({ success: true, stats });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get usage by agent
app.get('/api/analytics/agents', authenticate, async (req, res) => {
  try {
    const agents = await analyticsService.getUsageByAgent(req.user.userId, req.query.days || 30);
    res.json({ success: true, agents });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get usage timeline
app.get('/api/analytics/timeline', authenticate, async (req, res) => {
  try {
    const timeline = await analyticsService.getUsageTimeline(req.user.userId, req.query.days || 7);
    res.json({ success: true, timeline });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get agent performance
app.get('/api/analytics/agent/:agentId', authenticate, async (req, res) => {
  try {
    const performance = await analyticsService.getAgentPerformance(req.user.userId, req.params.agentId, req.query.days || 30);
    res.json({ success: true, performance });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get insights
app.get('/api/analytics/insights', authenticate, async (req, res) => {
  try {
    const insights = await analyticsService.generateInsights(req.user.userId);
    res.json({ success: true, insights });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get daily metrics
app.get('/api/analytics/daily', authenticate, async (req, res) => {
  try {
    const metrics = await analyticsService.getDailyMetrics(req.user.userId, req.query.days || 30);
    res.json({ success: true, metrics });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create dashboard
app.post('/api/analytics/dashboard', authenticate, async (req, res) => {
  try {
    const result = await analyticsService.createDashboard(req.user.userId, req.body.name, req.body.widgets);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get dashboards
app.get('/api/analytics/dashboards', authenticate, async (req, res) => {
  try {
    const dashboards = await analyticsService.getDashboards(req.user.userId);
    res.json({ success: true, dashboards });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// System health
app.get('/api/analytics/health', authenticate, async (req, res) => {
  try {
    const health = await analyticsService.getSystemHealth(req.query.hours || 1);
    res.json({ success: true, health });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ═══════════════════════════════════════════
// PLUGIN & AI ROUTER SERVICE
// ═══════════════════════════════════════════

const { PluginService } = require('./services');
const pluginService = new PluginService(pool);

// Get AI providers
app.get('/api/ai/providers', authenticate, async (req, res) => {
  try {
    const providers = await pluginService.getUserProviders(req.user.userId);
    res.json({ success: true, providers });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Set provider API key
app.post('/api/ai/provider/:providerId/key', authenticate, async (req, res) => {
  try {
    const result = await pluginService.setUserProviderKey(req.user.userId, req.params.providerId, req.body.apiKey);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Route AI request
app.post('/api/ai/route', authenticate, async (req, res) => {
  try {
    const routing = await pluginService.routeRequest(req.user.userId, req.body);
    res.json({ success: true, routing });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create routing rule
app.post('/api/ai/routing-rule', authenticate, async (req, res) => {
  try {
    const result = await pluginService.createRoutingRule(req.user.userId, req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get routing rules
app.get('/api/ai/routing-rules', authenticate, async (req, res) => {
  try {
    const rules = await pluginService.getRoutingRules(req.user.userId);
    res.json({ success: true, rules });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get plugins (marketplace)
app.get('/api/plugins', authenticate, async (req, res) => {
  try {
    const plugins = await pluginService.getPlugins(req.query.category, req.query.search);
    res.json({ success: true, plugins });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get single plugin
app.get('/api/plugin/:pluginId', authenticate, async (req, res) => {
  try {
    const plugin = await pluginService.getPlugin(req.params.pluginId);
    const reviews = await pluginService.getPluginReviews(req.params.pluginId);
    res.json({ success: true, plugin, reviews });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create plugin (admin/developers)
app.post('/api/plugin', authenticate, async (req, res) => {
  try {
    const result = await pluginService.createPlugin(req.body);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Install plugin
app.post('/api/plugin/:pluginId/install', authenticate, async (req, res) => {
  try {
    const result = await pluginService.installPlugin(req.user.userId, req.params.pluginId, req.body.config);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Uninstall plugin
app.delete('/api/plugin/:pluginId/uninstall', authenticate, async (req, res) => {
  try {
    const result = await pluginService.uninstallPlugin(req.user.userId, req.params.pluginId);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Get user's installed plugins
app.get('/api/plugins/installed', authenticate, async (req, res) => {
  try {
    const plugins = await pluginService.getUserPlugins(req.user.userId);
    res.json({ success: true, plugins });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Toggle plugin
app.put('/api/plugin/:pluginId/toggle', authenticate, async (req, res) => {
  try {
    const result = await pluginService.togglePlugin(req.user.userId, req.params.pluginId, req.body.enabled);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Add review
app.post('/api/plugin/:pluginId/review', authenticate, async (req, res) => {
  try {
    const result = await pluginService.addReview(req.user.userId, req.params.pluginId, req.body.rating, req.body.review);
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});
