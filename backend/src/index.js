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
