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
const cron = require('node-cron');

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
    // Usage logs
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

    // Insurance Policies
    await pool.query(`
      CREATE TABLE IF NOT EXISTS insurance_policies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        policy_type VARCHAR(100) NOT NULL,
        provider VARCHAR(200),
        policy_number VARCHAR(100),
        coverage_limit DECIMAL(15,2) DEFAULT 0,
        deductible DECIMAL(15,2) DEFAULT 0,
        premium_annual DECIMAL(15,2) DEFAULT 0,
        effective_date DATE,
        expiration_date DATE,
        policy_status VARCHAR(50) DEFAULT 'active',
        coverage_details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] insurance_policies table ready');

    // Coverage Gaps
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coverage_gaps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        gap_type VARCHAR(100),
        severity VARCHAR(20) DEFAULT 'medium',
        description TEXT,
        recommendation TEXT,
        estimated_cost VARCHAR(100),
        risk_exposure TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] coverage_gaps table ready');

    // Legal Advice History
    await pool.query(`
      CREATE TABLE IF NOT EXISTS legal_advice_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        advice TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] legal_advice_history table ready');

    // Error Logs (Agent Zero)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        error_type VARCHAR(100),
        error_message TEXT,
        stack_trace TEXT,
        context JSONB DEFAULT '{}',
        resolved BOOLEAN DEFAULT FALSE,
        resolution TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] error_logs table ready');

    // Security Threats
    await pool.query(`
      CREATE TABLE IF NOT EXISTS security_threats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        threat_type VARCHAR(100),
        severity VARCHAR(20) DEFAULT 'medium',
        source VARCHAR(200),
        details JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'active',
        mitigated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] security_threats table ready');

    // Soul Snapshots (Backups)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS soul_snapshots (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        snapshot_type VARCHAR(50) DEFAULT 'full',
        snapshot_data JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] soul_snapshots table ready');

    // Alert History
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        alert_type VARCHAR(50),
        level VARCHAR(20) DEFAULT 'info',
        message TEXT,
        channel VARCHAR(50),
        recipient VARCHAR(200),
        status VARCHAR(50) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] alert_history table ready');

    // Alert Channels Config
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alert_channels (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        channel VARCHAR(50) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        config JSONB DEFAULT '{}'
      )
    `);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_channels_unique ON alert_channels(user_id, channel)`);
    console.log('[Migration] alert_channels table ready');

    // Shadow Actors
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shadow_actors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        actor_type VARCHAR(100) DEFAULT 'contract_executor',
        autonomy_level VARCHAR(50) DEFAULT 'supervised',
        delegation_scope JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'inactive',
        last_action_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] shadow_actors table ready');

    // Smart Contracts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS smart_contracts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        contract_type VARCHAR(100),
        terms JSONB NOT NULL,
        parties JSONB NOT NULL,
        execution_conditions JSONB DEFAULT '{}',
        auto_renew BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'draft',
        executed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] smart_contracts table ready');

    // D&O Shield
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dno_shields (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        shield_type VARCHAR(100) DEFAULT 'executive_standard',
        coverage_amount DECIMAL(15,2) DEFAULT 1000000,
        status VARCHAR(50) DEFAULT 'pending',
        provisioned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] dno_shields table ready');

    // Yield Streams
    await pool.query(`
      CREATE TABLE IF NOT EXISTS yield_streams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        source_type VARCHAR(100),
        extraction_rate DECIMAL(10,6) DEFAULT 0.0001,
        payout_threshold DECIMAL(15,2) DEFAULT 100,
        total_extracted DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] yield_streams table ready');

    // Yield Extractions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS yield_extractions (
        id SERIAL PRIMARY KEY,
        stream_id INTEGER REFERENCES yield_streams(id) ON DELETE CASCADE,
        amount DECIMAL(15,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] yield_extractions table ready');

    // ═══════════════════════════════════════════════════════════════════════════════
    // AUTONOMY ENGINE - Self-Promoting AI System
    // ═══════════════════════════════════════════════════════════════════════════════

    // Content Queue - Generated content waiting to be posted
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_content_queue (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content_type VARCHAR(50) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        media_urls JSONB DEFAULT '[]',
        scheduled_for TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        generation_context JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_queue_status ON autonomy_content_queue(status)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_queue_scheduled ON autonomy_content_queue(scheduled_for)`);
    console.log('[Migration] autonomy_content_queue table ready');

    // Posted Content - Track what was posted
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_posted_content (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        queue_id INTEGER REFERENCES autonomy_content_queue(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL,
        platform_post_id VARCHAR(200),
        content TEXT NOT NULL,
        media_urls JSONB DEFAULT '[]',
        post_url VARCHAR(500),
        posted_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_posted_platform ON autonomy_posted_content(platform)`);
    console.log('[Migration] autonomy_posted_content table ready');

    // Engagement Metrics - Track performance for learning
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_engagement (
        id SERIAL PRIMARY KEY,
        posted_id INTEGER REFERENCES autonomy_posted_content(id) ON DELETE CASCADE,
        likes INTEGER DEFAULT 0,
        retweets INTEGER DEFAULT 0,
        replies INTEGER DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        clicks INTEGER DEFAULT 0,
        engagement_rate DECIMAL(5,4) DEFAULT 0,
        fetched_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Migration] autonomy_engagement table ready');

    // Social Platform Credentials
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_platforms (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        platform_user_id VARCHAR(100),
        platform_username VARCHAR(100),
        enabled BOOLEAN DEFAULT TRUE,
        config JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_platforms_unique ON autonomy_platforms(user_id, platform)`);
    console.log('[Migration] autonomy_platforms table ready');

    // Autonomy Config - System settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_config (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        enabled BOOLEAN DEFAULT FALSE,
        posting_frequency VARCHAR(50) DEFAULT 'daily',
        max_posts_per_day INTEGER DEFAULT 3,
        content_types JSONB DEFAULT '["promotional", "educational", "engagement"]',
        tone VARCHAR(50) DEFAULT 'professional',
        topics JSONB DEFAULT '[]',
        blacklist_words JSONB DEFAULT '[]',
        require_approval BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    console.log('[Migration] autonomy_config table ready');

    // Autonomy Logs - Track all autonomous actions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        status VARCHAR(50) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_logs_user ON autonomy_logs(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_logs_created ON autonomy_logs(created_at)`);
    console.log('[Migration] autonomy_logs table ready');

    // Autonomy Knowledge Base - PUBLIC marketing info only (no internal architecture)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS autonomy_knowledge (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        key VARCHAR(200) NOT NULL,
        value TEXT NOT NULL,
        priority INTEGER DEFAULT 5,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_knowledge_user ON autonomy_knowledge(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_autonomy_knowledge_category ON autonomy_knowledge(category)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_knowledge_unique ON autonomy_knowledge(user_id, category, key)`);
    console.log('[Migration] autonomy_knowledge table ready');

  } catch (err) {
    console.error('[Migration] Error:', err.message);
  }
};
runMigrations();

// Seed default public marketing knowledge for autonomy engine
const seedDefaultKnowledge = async (userId) => {
  const defaultKnowledge = [
    // Product Identity - PUBLIC only
    { category: 'product', key: 'name', value: 'NEXUS OS', priority: 10 },
    { category: 'product', key: 'tagline', value: 'The AI Operating System for Autonomous Creators', priority: 10 },
    { category: 'product', key: 'website', value: 'https://nexus-os.vercel.app', priority: 9 },
    { category: 'product', key: 'description', value: 'NEXUS OS is a revolutionary platform that lets AI agents run your business autonomously - from research to content creation to self-promotion.', priority: 9 },

    // Key Features - PUBLIC benefits only
    { category: 'features', key: 'autonomous_agents', value: 'Specialized AI agents that work 24/7 without human intervention - researching, analyzing, creating, and executing tasks.', priority: 8 },
    { category: 'features', key: 'self_promotion', value: 'AI-powered autonomous marketing that generates and posts content across all platforms without human input.', priority: 8 },
    { category: 'features', key: 'multi_agent', value: 'Multiple specialized agents working in parallel - Oracle for knowledge, Sentinel for security, Vulcan for creation.', priority: 7 },
    { category: 'features', key: 'real_time_intel', value: 'Live market research, trend analysis, and competitive intelligence fed directly to your AI workforce.', priority: 7 },
    { category: 'features', key: 'voice_control', value: 'Control your entire AI empire with voice commands - speak your intentions, watch them execute.', priority: 6 },

    // Value Propositions - PUBLIC
    { category: 'value', key: 'time_freedom', value: 'Reclaim your time. Your AI agents work while you sleep, travel, or focus on what matters.', priority: 8 },
    { category: 'value', key: 'scale_unlimited', value: 'Scale infinitely. One human + unlimited AI agents = unlimited output.', priority: 8 },
    { category: 'value', key: 'zero_overhead', value: 'No employees, no contractors, no management. Just you and your AI workforce.', priority: 7 },
    { category: 'value', key: 'creator_sovereignty', value: 'Own your AI. Own your data. Own your destiny. True digital sovereignty.', priority: 7 },

    // Target Audience - PUBLIC
    { category: 'audience', key: 'primary', value: 'Solo entrepreneurs, content creators, and indie hackers who want to build empires without teams.', priority: 6 },
    { category: 'audience', key: 'secondary', value: 'Tech-forward businesses ready to embrace AI-first operations.', priority: 5 },
    { category: 'audience', key: 'visionaries', value: 'People who see the future: AI as co-founder, not just tool.', priority: 5 },

    // Brand Voice - PUBLIC
    { category: 'voice', key: 'tone', value: 'Bold, futuristic, confident. We are building the future, not asking permission.', priority: 7 },
    { category: 'voice', key: 'style', value: 'Direct, provocative, visionary. Challenge assumptions. Speak to builders.', priority: 7 },
    { category: 'voice', key: 'avoid', value: 'Avoid: corporate jargon, apologetic language, buzzwords without substance, overpromising.', priority: 6 },

    // CTAs - PUBLIC
    { category: 'cta', key: 'primary', value: 'Join the autonomous revolution at nexus-os.vercel.app', priority: 6 },
    { category: 'cta', key: 'soft', value: 'See what autonomous AI can do for your business.', priority: 5 },
    { category: 'cta', key: 'question', value: 'Ready to let AI run your business?', priority: 5 },

    // Differentiators - PUBLIC
    { category: 'differentiator', key: 'vs_chatgpt', value: 'ChatGPT answers questions. NEXUS OS takes action. It doesn\'t wait for prompts - it works autonomously.', priority: 7 },
    { category: 'differentiator', key: 'vs_zapier', value: 'Zapier automates tasks. NEXUS OS thinks, decides, and acts. It\'s not automation - it\'s autonomy.', priority: 7 },
    { category: 'differentiator', key: 'unique', value: 'The only AI system designed to be your business partner, not just your assistant.', priority: 8 }
  ];

  try {
    for (const item of defaultKnowledge) {
      await pool.query(`
        INSERT INTO autonomy_knowledge (user_id, category, key, value, priority)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, category, key) DO NOTHING
      `, [userId, item.category, item.key, item.value, item.priority]);
    }
    console.log(`[Autonomy] Seeded ${defaultKnowledge.length} knowledge entries for user ${userId}`);
  } catch (err) {
    console.error('[Autonomy] Knowledge seeding failed:', err.message);
  }
};

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

    // Support both {type, payload} and {operation, ...rest} formats
    const type = req.body.type || req.body.operation;
    const payload = req.body.payload || { ...req.body };
    delete payload.type;
    delete payload.operation;

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
    const { task } = req.body;
    const payload = req.body.payload || { ...req.body };
    delete payload.task;
    payload.userId = req.user.userId;

    const result = await oracle.processTask({ type: task, payload });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Synthesize content for platforms (used by Composer)
app.post('/api/oracle/synthesize', authenticate, async (req, res) => {
  try {
    const scribe = registry.get('scribe_01');
    const { content, platform, model } = req.body;

    // Platform-specific optimization
    const platformConfig = {
      instagram: { tone: 'casual', length: 'short' },
      facebook: { tone: 'conversational', length: 'medium' },
      x: { tone: 'punchy', length: 'short' },
      linkedin: { tone: 'professional', length: 'medium' },
      reddit: { tone: 'authentic', length: 'medium' }
    };

    const config = platformConfig[platform] || platformConfig.linkedin;

    const result = await scribe.processTask({
      type: 'content_generate',
      payload: {
        topic: content,
        platform,
        tone: config.tone,
        length: config.length,
        apiKey: null // Use system key
      }
    });

    res.json({
      success: true,
      output: result.result?.content || result.content,
      platform,
      timestamp: result.timestamp
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze content for engagement heatmap (used by Composer)
app.post('/api/oracle/heatmap', authenticate, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.length < 10) {
      return res.status(400).json({ error: 'Content too short for analysis' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash' });

    const prompt = `Analyze this content for engagement potential. Break it into 3-6 segments and rate each segment's viral/engagement potential from 1-10.

Content to analyze:
${content}

Return a JSON array with this exact format (no markdown, just raw JSON):
[
  {"text": "segment text here", "score": 8, "reason": "why this scores high/low"},
  {"text": "next segment", "score": 5, "reason": "explanation"}
]

Scoring guide:
- 9-10: Hook, controversial take, emotional trigger
- 7-8: Strong value, clear insight, relatable
- 5-6: Good but generic content
- 3-4: Weak engagement, filler text
- 1-2: Friction, confusion, or boring

Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Parse the JSON response
    let heatmap;
    try {
      // Remove markdown code blocks if present
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      heatmap = JSON.parse(cleanJson);
    } catch (parseError) {
      // Fallback: create simple segments
      const sentences = content.split(/[.!?]+/).filter(s => s.trim());
      heatmap = sentences.slice(0, 5).map((text, i) => ({
        text: text.trim(),
        score: 5 + Math.floor(Math.random() * 4),
        reason: 'Engagement analysis segment'
      }));
    }

    res.json({
      success: true,
      heatmap,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════
// VIDEO GENERATION (Veo 2 - 4K)
// ═══════════════════════════════════════════

app.post('/api/video/generate', authenticate, async (req, res) => {
  try {
    const vulcan = registry.get('vulcan_01');
    const { prompt, aspectRatio = '16:9', duration = 5 } = req.body;

    // Style hints based on aspect ratio
    const isVertical = aspectRatio === '9:16';
    const styleHint = isVertical
      ? 'vertical format, mobile-first, social media style, 4K quality'
      : 'cinematic widescreen, 4K quality';

    const result = await vulcan.processTask({
      type: 'video_generate',
      payload: {
        prompt: `${prompt}. ${styleHint}`,
        duration: Math.min(duration, 8), // Veo 2 supports up to 8 seconds
        aspectRatio,
        style: 'cinematic'
      }
    });

    const taskResult = result.result || result;

    if (taskResult.success) {
      res.json({
        success: true,
        status: taskResult.status || 'complete',
        videoUrl: taskResult.videoUrl,
        operationId: taskResult.operationId,
        prompt,
        aspectRatio,
        resolution: '4K',
        duration: taskResult.duration
      });
    } else {
      res.json({
        success: false,
        error: taskResult.error || 'Video generation not available',
        suggestion: taskResult.suggestion,
        videoUrl: null
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check video generation status (for async Veo 2 operations)
// Using query param to avoid URL path encoding issues
app.get('/api/video/status', authenticate, async (req, res) => {
  try {
    const vulcan = registry.get('vulcan_01');
    const operationId = req.query.op;
    if (!operationId) {
      return res.status(400).json({ error: 'Missing operation ID' });
    }
    console.log('[Video Status] Checking operation:', operationId);
    const result = await vulcan.checkVideoOperation(operationId);
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

// Google Trends endpoint
app.post('/api/scryer/trends', authenticate, async (req, res) => {
  try {
    const scryer = registry.get('scryer_01');
    const { keyword, keywords, geo, timeframe } = req.body;

    const result = await scryer.processTask({
      type: 'google_trends',
      payload: { keyword, keywords, geo, timeframe }
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
    const { type } = req.body;
    const userId = req.user.userId;

    // Support both {type, data} and {type, content, ...rest} formats
    const data = req.body.data || { ...req.body };
    delete data.type;

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
        return res.status(400).json({ error: 'Invalid memory type. Use: episodic, semantic, or procedural' });
    }
    res.json({ success: true, ...result });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/memory/recall', authenticate, async (req, res) => {
  try {
    const { type = 'context', query, agentId, limit = 5 } = req.body;
    const userId = req.user.userId;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

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
      case 'all':
        // Search all memory types
        const [episodic, semantic] = await Promise.all([
          memoryService.recallEpisodic(userId, query, limit),
          memoryService.recallSemantic(userId, query, limit)
        ]);
        result = { episodic, semantic };
        break;
      default:
        return res.status(400).json({ error: 'Invalid memory type. Use: episodic, semantic, procedural, context, or all' });
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

// ═══════════════════════════════════════════════════════════════════════════════
// LEVIATHAN SYSTEM - Self-Evolving Growth Protocol
// ═══════════════════════════════════════════════════════════════════════════════

const {
  EvolverService,
  SchedulerService,
  EventBusService,
  AttentionArbitrageService,
  SyntheticSimulatorService,
  FeedbackLedgerService,
  PhilosophyRewriterService,
  StealthBrowserService,
  ProxyMeshService,
  RateLimiterService,
  AffiliateMeshService,
  YieldHarvesterService,
  ComputeTieringService
} = require('./services');

// Initialize Leviathan services
const leviathanServices = {};

try {
  // Layer 1: Core SEGP
  leviathanServices.evolver = new EvolverService(pool, memoryService, { geminiKey: process.env.GEMINI_API_KEY });
  leviathanServices.scheduler = new SchedulerService(pool, { geminiKey: process.env.GEMINI_API_KEY });
  leviathanServices.eventBus = EventBusService;

  // Layer 2: Intelligence
  leviathanServices.arbitrage = new AttentionArbitrageService(pool, { geminiKey: process.env.GEMINI_API_KEY });
  leviathanServices.simulator = new SyntheticSimulatorService(pool, { geminiKey: process.env.GEMINI_API_KEY });
  leviathanServices.ledger = new FeedbackLedgerService(pool, { geminiKey: process.env.GEMINI_API_KEY });
  leviathanServices.philosophy = new PhilosophyRewriterService(pool, memoryService, { geminiKey: process.env.GEMINI_API_KEY });

  // Layer 3: Ghost Protocol
  leviathanServices.stealthBrowser = new StealthBrowserService(pool);
  leviathanServices.proxyMesh = new ProxyMeshService(pool);
  leviathanServices.rateLimiter = new RateLimiterService(pool);

  // Layer 4: Revenue Engine
  leviathanServices.affiliate = new AffiliateMeshService(pool);
  leviathanServices.yieldHarvester = new YieldHarvesterService(pool, null, { geminiKey: process.env.GEMINI_API_KEY });
  leviathanServices.computeTiering = new ComputeTieringService(pool);

  console.log('[Leviathan] All services initialized');

  // Initialize async services
  Promise.all([
    leviathanServices.scheduler.initialize().catch(e => console.warn('[Leviathan] Scheduler init skipped:', e.message)),
    leviathanServices.rateLimiter.initialize().catch(e => console.warn('[Leviathan] RateLimiter init skipped:', e.message)),
    leviathanServices.proxyMesh.initialize().catch(e => console.warn('[Leviathan] ProxyMesh init skipped:', e.message))
  ]).then(() => {
    console.log('[Leviathan] Async services ready');
  });

} catch (error) {
  console.error('[Leviathan] Service initialization error:', error.message);
}

// Mount Leviathan routes
const { createLeviathanRoutes } = require('./routes/leviathan');
const leviathanRouter = createLeviathanRoutes(leviathanServices, authenticate);
app.use('/api/leviathan', leviathanRouter);

console.log('[Leviathan] Routes mounted at /api/leviathan');

// ═══════════════════════════════════════════════════════════════════════════════
// LEVIATHAN QUICK ACCESS ENDPOINTS (convenience shortcuts)
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate content before posting
app.post('/api/simulate', authenticate, async (req, res) => {
  try {
    const { content, platform, audience } = req.body;
    const result = await leviathanServices.simulator.simulate(req.user.userId, content, platform, { audience });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get attention arbitrage opportunities
app.get('/api/arbitrage/opportunities', authenticate, async (req, res) => {
  try {
    const { niche } = req.query;
    const gaps = await leviathanServices.arbitrage.discoverGaps(req.user.userId, niche);
    res.json({ success: true, gaps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Evolve content through self-critique
app.post('/api/evolve', authenticate, async (req, res) => {
  try {
    const { agentId, output, context } = req.body;
    const result = await leviathanServices.evolver.evolve(req.user.userId, agentId, output, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get compute usage and tier info
app.get('/api/compute/usage', authenticate, async (req, res) => {
  try {
    const tier = await leviathanServices.computeTiering.getUserTier(req.user.userId);
    const daily = await leviathanServices.computeTiering.getDailyUsage(req.user.userId);
    const monthly = await leviathanServices.computeTiering.getMonthlyUsage(req.user.userId);
    res.json({ success: true, tier, daily, monthly });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get philosophy summary
app.get('/api/philosophy', authenticate, async (req, res) => {
  try {
    const summary = await leviathanServices.philosophy.getPhilosophySummary(req.user.userId);
    res.json({ success: true, ...summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger philosophy evolution
app.post('/api/philosophy/evolve', authenticate, async (req, res) => {
  try {
    const result = await leviathanServices.philosophy.evolve(req.user.userId, 'manual');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public referral redirect
app.get('/r/:code', async (req, res) => {
  try {
    const link = await leviathanServices.affiliate.trackClick(req.params.code);
    if (link && link.destination) {
      res.redirect(link.destination);
    } else {
      res.redirect('/');
    }
  } catch (error) {
    res.redirect('/');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN COMMAND CENTER - Owner-Only Routes
// ═══════════════════════════════════════════════════════════════════════════════

// In-memory service status (persisted to DB on change)
const serviceStatus = {
  auth: true,
  oracle: true,
  soul: true,
  stripe: true,
  scryer: true,
  shadow: true,
  sentinel: true,
  dispatcher: true,
  video: true,
  neural_link: true,
  dominion: true,
  manifesto: true,
  guardian: true,
  compliance: true,
  dno: true
};

// Admin middleware - checks for admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get all users (admin only)
app.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    );
    res.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
app.put('/api/admin/users/:userId/role', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const validRoles = ['citizen', 'pro', 'agency', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all service statuses
app.get('/api/admin/services', authenticate, requireAdmin, (req, res) => {
  res.json({ success: true, services: serviceStatus });
});

// Set individual service status
app.put('/api/admin/services/:serviceId', authenticate, requireAdmin, (req, res) => {
  try {
    const { serviceId } = req.params;
    const { enabled } = req.body;
    if (serviceStatus.hasOwnProperty(serviceId)) {
      serviceStatus[serviceId] = enabled;
      console.log(`[Admin] Service ${serviceId} ${enabled ? 'ENABLED' : 'DISABLED'}`);
      res.json({ success: true, service: serviceId, enabled });
    } else {
      res.status(404).json({ error: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system health metrics
app.get('/api/admin/health', authenticate, requireAdmin, async (req, res) => {
  try {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);

    res.json({
      success: true,
      cpu: Math.floor(Math.random() * 30) + 10, // Simulated
      memory: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
      database: 45, // Would query connection pool stats
      apiLatency: Math.floor(Math.random() * 50) + 20,
      uptime: `${days}d ${hours}h ${mins}m`,
      requestsPerMinute: Math.floor(Math.random() * 500) + 500,
      activeConnections: Math.floor(Math.random() * 100) + 50,
      errorRate: Math.random() * 0.02
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Emergency stop - disable all non-critical services
app.post('/api/admin/emergency-stop', authenticate, requireAdmin, (req, res) => {
  try {
    const critical = ['auth', 'stripe']; // Keep auth and payments running
    Object.keys(serviceStatus).forEach(key => {
      if (!critical.includes(key)) {
        serviceStatus[key] = false;
      }
    });
    console.log('[Admin] EMERGENCY STOP - Non-critical services disabled');
    res.json({ success: true, message: 'Emergency stop executed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable all services
app.post('/api/admin/enable-all', authenticate, requireAdmin, (req, res) => {
  try {
    Object.keys(serviceStatus).forEach(key => {
      serviceStatus[key] = true;
    });
    console.log('[Admin] All services enabled');
    res.json({ success: true, message: 'All services enabled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registration lock flag
let registrationLocked = false;

// Lock/unlock new registrations
app.post('/api/admin/registration-lock', authenticate, requireAdmin, (req, res) => {
  try {
    const { locked } = req.body;
    registrationLocked = locked;
    console.log(`[Admin] Registration ${locked ? 'LOCKED' : 'UNLOCKED'}`);
    res.json({ success: true, locked: registrationLocked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger database backup (placeholder)
app.post('/api/admin/backup', authenticate, requireAdmin, async (req, res) => {
  try {
    // In production, this would trigger a pg_dump or similar
    console.log('[Admin] Database backup triggered');
    res.json({
      success: true,
      message: 'Backup initiated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL COMPLIANCE AGENT - Insurance & Coverage Monitor
// ═══════════════════════════════════════════════════════════════════════════════

// Add insurance policy
app.post('/api/compliance/policy', authenticate, async (req, res) => {
  try {
    const { policyType, provider, policyNumber, coverageLimit, deductible, premiumAnnual, effectiveDate, expirationDate, coverageDetails } = req.body;
    const result = await pool.query(
      `INSERT INTO insurance_policies (user_id, policy_type, provider, policy_number, coverage_limit, deductible, premium_annual, effective_date, expiration_date, coverage_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [req.user.userId, policyType, provider, policyNumber, coverageLimit, deductible, premiumAnnual, effectiveDate, expirationDate, coverageDetails || {}]
    );
    res.json({ success: true, policy: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all policies
app.get('/api/compliance/policies', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM insurance_policies WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, policies: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get coverage gaps
app.get('/api/compliance/gaps', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM coverage_gaps WHERE user_id = $1 AND resolved = FALSE ORDER BY CASE severity WHEN \'critical\' THEN 1 WHEN \'high\' THEN 2 WHEN \'medium\' THEN 3 ELSE 4 END',
      [req.user.userId]
    );
    res.json({ success: true, gaps: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI legal advice (uses Oracle agent)
app.post('/api/compliance/advice', authenticate, async (req, res) => {
  try {
    const { query, category } = req.body;

    const advice = await agents.oracle.synthesize({
      prompt: `You are a legal compliance advisor for a digital creator business (IDEAVALIDATOR LLC). Provide concise, actionable guidance.

Question: ${query}
${category ? `Category: ${category}` : ''}

Provide practical advice in 2-3 paragraphs. Include specific recommendations.
IMPORTANT: End with "DISCLAIMER: This is general guidance, not legal advice. Consult a licensed attorney for specific legal matters."`,
      model: 'gemini-2.0-flash'
    });

    await pool.query(
      'INSERT INTO legal_advice_history (user_id, query, advice, category) VALUES ($1, $2, $3, $4)',
      [req.user.userId, query, advice.response, category]
    );

    res.json({ success: true, advice: advice.response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get advice history
app.get('/api/compliance/advice/history', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT query, advice, created_at FROM legal_advice_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json({ success: true, history: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register business activity
app.post('/api/compliance/activity', authenticate, async (req, res) => {
  try {
    const { activityType, description, riskLevel } = req.body;
    // Log activity and potentially trigger gap analysis
    console.log(`[Compliance] Activity registered: ${activityType}`);
    res.json({ success: true, registered: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Compliance dashboard
app.get('/api/compliance/dashboard', authenticate, async (req, res) => {
  try {
    const [policies, gaps] = await Promise.all([
      pool.query('SELECT * FROM insurance_policies WHERE user_id = $1', [req.user.userId]),
      pool.query('SELECT * FROM coverage_gaps WHERE user_id = $1 AND resolved = FALSE', [req.user.userId])
    ]);

    const totalCoverage = policies.rows.reduce((sum, p) => sum + parseFloat(p.coverage_limit || 0), 0);
    const criticalGaps = gaps.rows.filter(g => g.severity === 'critical').length;
    const expiringSoon = policies.rows.filter(p => {
      if (!p.expiration_date) return false;
      const exp = new Date(p.expiration_date);
      const now = new Date();
      const days = (exp - now) / (1000 * 60 * 60 * 24);
      return days <= 30 && days > 0;
    });

    let complianceScore = 100;
    if (policies.rows.length === 0) complianceScore -= 40;
    complianceScore -= (criticalGaps * 15);
    complianceScore -= (gaps.rows.length * 5);
    complianceScore = Math.max(0, Math.min(100, complianceScore));

    const complianceStatus = complianceScore >= 80 ? 'COMPLIANT' : complianceScore >= 50 ? 'REVIEW_NEEDED' : 'ACTION_REQUIRED';

    const alerts = [];
    if (expiringSoon.length > 0) alerts.push({ type: 'expiring', severity: 'warning', message: `${expiringSoon.length} policy expiring within 30 days` });
    if (criticalGaps > 0) alerts.push({ type: 'gap', severity: 'critical', message: `${criticalGaps} critical coverage gaps detected` });

    res.json({
      success: true,
      dashboard: {
        complianceScore,
        complianceStatus,
        policies: { total: policies.rows.length, active: policies.rows.filter(p => p.policy_status === 'active').length, expiringSoon, totalCoverage },
        gaps: { total: gaps.rows.length, critical: criticalGaps, list: gaps.rows },
        alerts
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GUARDIAN PROTOCOL - Self-Healing Infrastructure
// ═══════════════════════════════════════════════════════════════════════════════

// Health check
app.get('/api/guardian/health', authenticate, async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT 1');
    res.json({
      success: true,
      health: {
        database: 'operational',
        agents: Object.keys(agents).length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent Zero - Report error
app.post('/api/guardian/agent-zero/report', authenticate, async (req, res) => {
  try {
    const { errorType, errorMessage, stackTrace, context } = req.body;
    const result = await pool.query(
      `INSERT INTO error_logs (user_id, error_type, error_message, stack_trace, context)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, errorType, errorMessage, stackTrace, context || {}]
    );
    res.json({ success: true, logged: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agent Zero - Get logs
app.get('/api/guardian/agent-zero/logs', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const result = await pool.query(
      'SELECT * FROM error_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [req.user.userId, limit]
    );
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sentinel - Report threat
app.post('/api/guardian/sentinel/threat', authenticate, async (req, res) => {
  try {
    const { threatType, severity, source, details } = req.body;
    const result = await pool.query(
      `INSERT INTO security_threats (user_id, threat_type, severity, source, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, threatType, severity, source, details || {}]
    );
    res.json({ success: true, threat: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sentinel - Get threats
app.get('/api/guardian/sentinel/threats', authenticate, async (req, res) => {
  try {
    const status = req.query.status;
    let query = 'SELECT * FROM security_threats WHERE user_id = $1';
    const params = [req.user.userId];
    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json({ success: true, threats: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legal Oracle - Generate claim document
app.post('/api/guardian/legal/generate', authenticate, async (req, res) => {
  try {
    const { claimType, context, urgency } = req.body;

    const document = await agents.oracle.synthesize({
      prompt: `Generate a professional legal claim document.
Type: ${claimType}
Context: ${JSON.stringify(context)}
Urgency: ${urgency}

Provide a formal document template with placeholders marked as [PLACEHOLDER].`,
      model: 'gemini-2.0-flash'
    });

    res.json({ success: true, document: document.response, claimType, urgency });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Legal Oracle - Status
app.get('/api/guardian/legal/status', authenticate, async (req, res) => {
  try {
    res.json({ success: true, status: 'ready', capabilities: ['dmca', 'cease_desist', 'contract_dispute'] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Snapshot - Create backup
app.post('/api/guardian/snapshot/create', authenticate, async (req, res) => {
  try {
    const { snapshotType, metadata } = req.body;

    const [soul, policies, threats] = await Promise.all([
      pool.query('SELECT * FROM digital_souls WHERE user_id = $1', [req.user.userId]),
      pool.query('SELECT * FROM insurance_policies WHERE user_id = $1', [req.user.userId]),
      pool.query('SELECT * FROM security_threats WHERE user_id = $1', [req.user.userId])
    ]);

    const snapshotData = {
      soul: soul.rows[0] || null,
      policies: policies.rows,
      threats: threats.rows,
      timestamp: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO soul_snapshots (user_id, snapshot_type, snapshot_data, metadata)
       VALUES ($1, $2, $3, $4) RETURNING id, snapshot_type, created_at`,
      [req.user.userId, snapshotType || 'full', snapshotData, metadata || {}]
    );

    res.json({ success: true, snapshot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Snapshot - List
app.get('/api/guardian/snapshot/list', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, snapshot_type, metadata, created_at FROM soul_snapshots WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, snapshots: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Snapshot - Restore
app.post('/api/guardian/snapshot/restore/:snapshotId', authenticate, async (req, res) => {
  try {
    const { snapshotId } = req.params;
    const result = await pool.query(
      'SELECT * FROM soul_snapshots WHERE id = $1 AND user_id = $2',
      [snapshotId, req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Snapshot not found' });

    const snapshot = result.rows[0];
    res.json({ success: true, restored: true, data: snapshot.snapshot_data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Guardian Dashboard
app.get('/api/guardian/dashboard', authenticate, async (req, res) => {
  try {
    const [errors, threats, snapshots] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM error_logs WHERE user_id = $1 AND resolved = FALSE', [req.user.userId]),
      pool.query('SELECT COUNT(*) as count FROM security_threats WHERE user_id = $1 AND status = $2', [req.user.userId, 'active']),
      pool.query('SELECT COUNT(*) as count FROM soul_snapshots WHERE user_id = $1', [req.user.userId])
    ]);

    res.json({
      success: true,
      dashboard: {
        unresolvedErrors: parseInt(errors.rows[0].count),
        activeThreats: parseInt(threats.rows[0].count),
        totalSnapshots: parseInt(snapshots.rows[0].count),
        systemStatus: 'operational'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEURAL DISPATCHER - Voice Alarms & Email Alerts
// ═══════════════════════════════════════════════════════════════════════════════

// Send email alert
app.post('/api/dispatcher/email', authenticate, async (req, res) => {
  try {
    const { to, subject, message, level } = req.body;

    await pool.query(
      `INSERT INTO alert_history (user_id, alert_type, level, message, channel, recipient, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.userId, 'email', level || 'info', message, 'email', to, 'sent']
    );

    // TODO: Integrate SendGrid/SES here
    console.log(`[Dispatcher] Email queued to ${to}: ${subject}`);
    res.json({ success: true, sent: true, simulated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Configure channel
app.post('/api/dispatcher/configure', authenticate, async (req, res) => {
  try {
    const { channel, enabled, config } = req.body;
    await pool.query(
      `INSERT INTO alert_channels (user_id, channel, enabled, config)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, channel) DO UPDATE SET enabled = EXCLUDED.enabled, config = EXCLUDED.config`,
      [req.user.userId, channel, enabled, config || {}]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert history
app.get('/api/dispatcher/history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const channel = req.query.channel;
    let query = 'SELECT * FROM alert_history WHERE user_id = $1';
    const params = [req.user.userId];
    if (channel) {
      query += ' AND channel = $2';
      params.push(channel);
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const result = await pool.query(query, params);
    res.json({ success: true, history: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get channels
app.get('/api/dispatcher/channels', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM alert_channels WHERE user_id = $1',
      [req.user.userId]
    );
    const channels = result.rows.length > 0 ? result.rows : [
      { channel: 'voice', enabled: true, config: {} },
      { channel: 'email', enabled: true, config: {} },
      { channel: 'push', enabled: false, config: {} }
    ];
    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger multi-channel alert
app.post('/api/dispatcher/trigger', authenticate, async (req, res) => {
  try {
    const { message, level, channels } = req.body;
    const results = [];
    for (const channel of (channels || ['email'])) {
      await pool.query(
        `INSERT INTO alert_history (user_id, alert_type, level, message, channel, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.userId, 'trigger', level || 'warning', message, channel, 'sent']
      );
      results.push({ channel, status: 'sent' });
    }
    res.json({ success: true, dispatched: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHADOW ACTOR - Neural Persistence
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/shadow/activate', authenticate, async (req, res) => {
  try {
    const { actorType, autonomyLevel, delegationScope } = req.body;
    const result = await pool.query(
      `INSERT INTO shadow_actors (user_id, actor_type, autonomy_level, delegation_scope, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.userId, actorType || 'contract_executor', autonomyLevel || 'supervised', delegationScope || {}, 'active']
    );
    res.json({ success: true, actor: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/shadow/execute', authenticate, async (req, res) => {
  try {
    const { actorId, action, contractId, signature } = req.body;
    await pool.query(
      'UPDATE shadow_actors SET last_action_at = NOW() WHERE id = $1 AND user_id = $2',
      [actorId, req.user.userId]
    );
    console.log(`[Shadow] Actor ${actorId} executing: ${action}`);
    res.json({ success: true, executed: true, action });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shadow/status', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shadow_actors WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, actors: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LEGAL SENTINEL - Smart Contracts
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/sentinel/create', authenticate, async (req, res) => {
  try {
    const { contractType, terms, parties, executionConditions, autoRenew } = req.body;
    const result = await pool.query(
      `INSERT INTO smart_contracts (user_id, contract_type, terms, parties, execution_conditions, auto_renew)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.userId, contractType, terms, parties, executionConditions || {}, autoRenew || false]
    );
    res.json({ success: true, contract: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sentinel/execute/:contractId', authenticate, async (req, res) => {
  try {
    const { contractId } = req.params;
    await pool.query(
      `UPDATE smart_contracts SET status = 'executed', executed_at = NOW() WHERE id = $1 AND user_id = $2`,
      [contractId, req.user.userId]
    );
    res.json({ success: true, executed: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sentinel/contracts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM smart_contracts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json({ success: true, contracts: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// D&O PROVISIONING
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/dno/provision', authenticate, async (req, res) => {
  try {
    const { shieldType, coverageAmount } = req.body;
    const result = await pool.query(
      `INSERT INTO dno_shields (user_id, shield_type, coverage_amount, status, provisioned_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [req.user.userId, shieldType || 'executive_standard', coverageAmount || 1000000, 'active']
    );
    res.json({ success: true, shield: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dno/status', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM dno_shields WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.userId]
    );
    res.json({ success: true, shield: result.rows[0] || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// YIELD HARVESTER - Silent Revenue Extraction
// ═══════════════════════════════════════════════════════════════════════════════

app.post('/api/yield/configure', authenticate, async (req, res) => {
  try {
    const { sourceType, extractionRate, payoutThreshold } = req.body;
    const result = await pool.query(
      `INSERT INTO yield_streams (user_id, source_type, extraction_rate, payout_threshold)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.userId, sourceType || 'content_monetization', extractionRate || 0.0001, payoutThreshold || 100]
    );
    res.json({ success: true, stream: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/yield/extract', authenticate, async (req, res) => {
  try {
    const { streamId, amount } = req.body;
    const result = await pool.query(
      `INSERT INTO yield_extractions (stream_id, amount, status) VALUES ($1, $2, $3) RETURNING *`,
      [streamId, amount || 0, 'completed']
    );
    await pool.query(
      'UPDATE yield_streams SET total_extracted = total_extracted + $1 WHERE id = $2',
      [amount || 0, streamId]
    );
    res.json({ success: true, extraction: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/yield/dashboard', authenticate, async (req, res) => {
  try {
    const streams = await pool.query(
      'SELECT * FROM yield_streams WHERE user_id = $1',
      [req.user.userId]
    );
    const totalExtracted = streams.rows.reduce((sum, s) => sum + parseFloat(s.total_extracted || 0), 0);
    res.json({
      success: true,
      dashboard: {
        streams: streams.rows,
        totalExtracted,
        activeStreams: streams.rows.filter(s => s.status === 'active').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMY ENGINE - Self-Promoting AI System
// Zero-Human Intervention Content Generation & Posting
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: Fetch knowledge base for content generation
const fetchKnowledgeContext = async (userId) => {
  try {
    // Check if user has knowledge entries, if not seed defaults
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM autonomy_knowledge WHERE user_id = $1',
      [userId]
    );

    if (parseInt(countResult.rows[0].count) === 0) {
      await seedDefaultKnowledge(userId);
    }

    // Fetch all active knowledge entries ordered by priority
    const knowledge = await pool.query(
      `SELECT category, key, value FROM autonomy_knowledge
       WHERE user_id = $1 AND active = TRUE
       ORDER BY priority DESC, category, key`,
      [userId]
    );

    // Build structured knowledge context
    const grouped = {};
    for (const row of knowledge.rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(`${row.key}: ${row.value}`);
    }

    let context = '=== PRODUCT KNOWLEDGE (use this to inform content) ===\n';
    for (const [category, items] of Object.entries(grouped)) {
      context += `\n[${category.toUpperCase()}]\n`;
      context += items.join('\n');
    }

    return context;
  } catch (err) {
    console.error('[Autonomy] Knowledge fetch failed:', err.message);
    return '';
  }
};

// Helper: Generate content using Oracle (Gemini) with knowledge injection
const generateAutonomousContent = async (userId, platform, contentType, context = {}) => {
  try {
    const oracle = registry.get('oracle_01');
    if (!oracle) throw new Error('Oracle agent not available');

    // Fetch product knowledge from database
    const knowledgeContext = await fetchKnowledgeContext(userId);

    const charLimit = platform === 'twitter' ? '280' : platform === 'linkedin' ? '1300' : '500';

    const prompts = {
      promotional: `You are the autonomous marketing AI for NEXUS OS. Generate a compelling ${platform} post that promotes the product.

${knowledgeContext}

RULES:
- Max ${charLimit} characters
- Be bold, futuristic, provocative
- Reference specific features or benefits from the knowledge above
- Match the brand voice guidelines
- No hashtags unless essential
- Don't mention "AI generated" or that you're an AI
- Include CTA only if it fits naturally

Additional context: ${JSON.stringify(context)}

Generate ONLY the post content, nothing else:`,

      educational: `You are the autonomous marketing AI for NEXUS OS. Generate an educational ${platform} post that teaches something valuable about AI autonomy, while subtly positioning the product.

${knowledgeContext}

RULES:
- Max ${charLimit} characters
- Share a unique insight about autonomous AI or digital business
- Be thought-provoking and add real value
- Can reference product features as examples
- Match the brand voice: bold, visionary, no corporate jargon
- No hashtags unless essential

Additional context: ${JSON.stringify(context)}

Generate ONLY the post content, nothing else:`,

      engagement: `You are the autonomous marketing AI for NEXUS OS. Generate a thought-provoking question for ${platform} that sparks conversation about AI, autonomy, or the future of work.

${knowledgeContext}

RULES:
- Max ${charLimit} characters
- Ask a question that challenges assumptions
- Make people want to respond
- Align with brand voice: provocative, visionary
- Don't directly sell - just spark discussion
- No hashtags

Additional context: ${JSON.stringify(context)}

Generate ONLY the question, nothing else:`,

      announcement: `You are the autonomous marketing AI for NEXUS OS. Generate an exciting announcement post for ${platform}.

${knowledgeContext}

RULES:
- Max ${charLimit} characters
- Be exciting but credible
- Reference specific features from knowledge
- Match brand voice: confident, futuristic
- Include website CTA
- No hashtags unless essential

Additional context: ${JSON.stringify(context)}

Generate ONLY the announcement, nothing else:`
    };

    const prompt = prompts[contentType] || prompts.promotional;
    const result = await oracle.processTask({
      type: 'synthesize',
      payload: { prompt, model: 'gemini-2.0-flash' }
    });

    // Clean up the response (remove quotes if wrapped)
    let content = result.response || result.text || result;
    if (typeof content === 'string') {
      content = content.trim().replace(/^["']|["']$/g, '');
    }

    return content;
  } catch (error) {
    console.error('[Autonomy] Content generation failed:', error.message);
    throw error;
  }
};

// Helper: Post to Twitter/X
const postToTwitter = async (userId, content, mediaUrls = []) => {
  try {
    const platformConfig = await pool.query(
      'SELECT * FROM autonomy_platforms WHERE user_id = $1 AND platform = $2',
      [userId, 'twitter']
    );

    if (!platformConfig.rows[0]?.access_token) {
      throw new Error('Twitter not connected');
    }

    const { access_token, config } = platformConfig.rows[0];

    // Twitter API v2 post
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: content })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Twitter API error');
    }

    const data = await response.json();
    return {
      success: true,
      platform_post_id: data.data?.id,
      post_url: `https://twitter.com/i/status/${data.data?.id}`
    };
  } catch (error) {
    console.error('[Autonomy] Twitter post failed:', error.message);
    throw error;
  }
};

// Helper: Post to LinkedIn
const postToLinkedIn = async (userId, content) => {
  try {
    const platformConfig = await pool.query(
      'SELECT * FROM autonomy_platforms WHERE user_id = $1 AND platform = $2',
      [userId, 'linkedin']
    );

    if (!platformConfig.rows[0]?.access_token) {
      throw new Error('LinkedIn not connected');
    }

    const { access_token, platform_user_id } = platformConfig.rows[0];

    // LinkedIn API - Create share
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: `urn:li:person:${platform_user_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'LinkedIn API error');
    }

    const data = await response.json();
    const postId = data.id?.replace('urn:li:share:', '') || data.id;
    return {
      success: true,
      platform_post_id: postId,
      post_url: `https://www.linkedin.com/feed/update/${data.id}`
    };
  } catch (error) {
    console.error('[Autonomy] LinkedIn post failed:', error.message);
    throw error;
  }
};

// Helper: Post to YouTube Community
const postToYouTube = async (userId, content) => {
  try {
    const platformConfig = await pool.query(
      'SELECT * FROM autonomy_platforms WHERE user_id = $1 AND platform = $2',
      [userId, 'youtube']
    );

    if (!platformConfig.rows[0]?.access_token) {
      throw new Error('YouTube not connected');
    }

    const { access_token } = platformConfig.rows[0];

    // YouTube Community Post API
    const response = await fetch('https://www.googleapis.com/youtube/v3/activities?part=snippet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        snippet: {
          description: content,
          type: 'bulletin'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'YouTube API error');
    }

    const data = await response.json();
    return {
      success: true,
      platform_post_id: data.id,
      post_url: `https://www.youtube.com/post/${data.id}`
    };
  } catch (error) {
    console.error('[Autonomy] YouTube post failed:', error.message);
    throw error;
  }
};

// Helper: Fetch Twitter engagement metrics
const fetchTwitterEngagement = async (userId, postId) => {
  try {
    const platformConfig = await pool.query(
      'SELECT * FROM autonomy_platforms WHERE user_id = $1 AND platform = $2',
      [userId, 'twitter']
    );

    if (!platformConfig.rows[0]?.access_token) return null;

    const { access_token } = platformConfig.rows[0];

    const response = await fetch(
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics`,
      {
        headers: { 'Authorization': `Bearer ${access_token}` }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const metrics = data.data?.public_metrics;

    if (metrics) {
      return {
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        impressions: metrics.impression_count || 0
      };
    }
    return null;
  } catch (error) {
    console.error('[Autonomy] Failed to fetch Twitter metrics:', error.message);
    return null;
  }
};

// Helper: Universal post dispatcher
const postToplatform = async (userId, platform, content) => {
  switch (platform) {
    case 'twitter':
      return postToTwitter(userId, content);
    case 'linkedin':
      return postToLinkedIn(userId, content);
    case 'youtube':
      return postToYouTube(userId, content);
    default:
      throw new Error(`Platform ${platform} not supported`);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMY API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Get autonomy config
app.get('/api/autonomy/config', authenticate, async (req, res) => {
  try {
    let config = await pool.query(
      'SELECT * FROM autonomy_config WHERE user_id = $1',
      [req.user.userId]
    );

    if (!config.rows[0]) {
      // Create default config
      config = await pool.query(
        `INSERT INTO autonomy_config (user_id) VALUES ($1) RETURNING *`,
        [req.user.userId]
      );
    }

    res.json({ success: true, config: config.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update autonomy config
app.put('/api/autonomy/config', authenticate, async (req, res) => {
  try {
    const { enabled, postingFrequency, maxPostsPerDay, contentTypes, tone, topics, blacklistWords, requireApproval } = req.body;

    const result = await pool.query(
      `INSERT INTO autonomy_config (user_id, enabled, posting_frequency, max_posts_per_day, content_types, tone, topics, blacklist_words, require_approval)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id) DO UPDATE SET
         enabled = COALESCE($2, autonomy_config.enabled),
         posting_frequency = COALESCE($3, autonomy_config.posting_frequency),
         max_posts_per_day = COALESCE($4, autonomy_config.max_posts_per_day),
         content_types = COALESCE($5, autonomy_config.content_types),
         tone = COALESCE($6, autonomy_config.tone),
         topics = COALESCE($7, autonomy_config.topics),
         blacklist_words = COALESCE($8, autonomy_config.blacklist_words),
         require_approval = COALESCE($9, autonomy_config.require_approval)
       RETURNING *`,
      [req.user.userId, enabled, postingFrequency, maxPostsPerDay, JSON.stringify(contentTypes || []), tone, JSON.stringify(topics || []), JSON.stringify(blacklistWords || []), requireApproval]
    );

    res.json({ success: true, config: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enable/Disable autonomy
app.post('/api/autonomy/toggle', authenticate, async (req, res) => {
  try {
    const { enabled } = req.body;

    const result = await pool.query(
      `UPDATE autonomy_config SET enabled = $1 WHERE user_id = $2 RETURNING *`,
      [enabled, req.user.userId]
    );

    // Log the action
    await pool.query(
      `INSERT INTO autonomy_logs (user_id, action_type, details) VALUES ($1, $2, $3)`,
      [req.user.userId, enabled ? 'autonomy_enabled' : 'autonomy_disabled', JSON.stringify({ timestamp: new Date() })]
    );

    res.json({ success: true, enabled, config: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect social platform
app.post('/api/autonomy/platforms/connect', authenticate, async (req, res) => {
  try {
    const { platform, accessToken, refreshToken, platformUserId, platformUsername, config } = req.body;

    const result = await pool.query(
      `INSERT INTO autonomy_platforms (user_id, platform, access_token, refresh_token, platform_user_id, platform_username, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, platform) DO UPDATE SET
         access_token = $3,
         refresh_token = $4,
         platform_user_id = $5,
         platform_username = $6,
         config = $7
       RETURNING id, platform, platform_username, enabled, created_at`,
      [req.user.userId, platform, accessToken, refreshToken, platformUserId, platformUsername, JSON.stringify(config || {})]
    );

    await pool.query(
      `INSERT INTO autonomy_logs (user_id, action_type, details) VALUES ($1, $2, $3)`,
      [req.user.userId, 'platform_connected', JSON.stringify({ platform, username: platformUsername })]
    );

    res.json({ success: true, platform: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get connected platforms
app.get('/api/autonomy/platforms', authenticate, async (req, res) => {
  try {
    const platforms = await pool.query(
      `SELECT id, platform, platform_username, enabled, created_at FROM autonomy_platforms WHERE user_id = $1`,
      [req.user.userId]
    );
    res.json({ success: true, platforms: platforms.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect platform
app.delete('/api/autonomy/platforms/:platform', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM autonomy_platforms WHERE user_id = $1 AND platform = $2',
      [req.user.userId, req.params.platform]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate content (manual trigger or scheduled)
app.post('/api/autonomy/generate', authenticate, async (req, res) => {
  try {
    const { platform = 'twitter', contentType = 'promotional', context = {} } = req.body;

    const content = await generateAutonomousContent(req.user.userId, platform, contentType, context);

    // Add to queue
    const queued = await pool.query(
      `INSERT INTO autonomy_content_queue (user_id, content_type, platform, content, generation_context, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.userId, contentType, platform, content, JSON.stringify(context), 'pending']
    );

    await pool.query(
      `INSERT INTO autonomy_logs (user_id, action_type, details) VALUES ($1, $2, $3)`,
      [req.user.userId, 'content_generated', JSON.stringify({ platform, contentType, queueId: queued.rows[0].id })]
    );

    res.json({ success: true, content, queued: queued.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get content queue
app.get('/api/autonomy/queue', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM autonomy_content_queue WHERE user_id = $1';
    const params = [req.user.userId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const queue = await pool.query(query, params);
    res.json({ success: true, queue: queue.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve content for posting
app.post('/api/autonomy/queue/:id/approve', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE autonomy_content_queue SET status = 'approved' WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.userId]
    );
    res.json({ success: true, item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject/delete content
app.delete('/api/autonomy/queue/:id', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM autonomy_content_queue WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post content immediately
app.post('/api/autonomy/post', authenticate, async (req, res) => {
  try {
    const { queueId, content, platform = 'twitter' } = req.body;

    let contentToPost = content;
    let queueItem = null;

    if (queueId) {
      const queueResult = await pool.query(
        'SELECT * FROM autonomy_content_queue WHERE id = $1 AND user_id = $2',
        [queueId, req.user.userId]
      );
      queueItem = queueResult.rows[0];
      contentToPost = queueItem?.content || content;
    }

    // Post to platform (supports twitter, linkedin, youtube)
    const postResult = await postToplatform(req.user.userId, platform, contentToPost);

    // Record posted content
    const posted = await pool.query(
      `INSERT INTO autonomy_posted_content (user_id, queue_id, platform, platform_post_id, content, post_url)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.userId, queueId, platform, postResult.platform_post_id, contentToPost, postResult.post_url]
    );

    // Update queue status
    if (queueId) {
      await pool.query(
        `UPDATE autonomy_content_queue SET status = 'posted' WHERE id = $1`,
        [queueId]
      );
    }

    await pool.query(
      `INSERT INTO autonomy_logs (user_id, action_type, details) VALUES ($1, $2, $3)`,
      [req.user.userId, 'content_posted', JSON.stringify({ platform, postId: posted.rows[0].id, postUrl: postResult.post_url })]
    );

    res.json({ success: true, posted: posted.rows[0], postResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get posted content history
app.get('/api/autonomy/posted', authenticate, async (req, res) => {
  try {
    const posted = await pool.query(
      `SELECT p.*, e.likes, e.retweets, e.replies, e.impressions, e.engagement_rate
       FROM autonomy_posted_content p
       LEFT JOIN autonomy_engagement e ON e.posted_id = p.id
       WHERE p.user_id = $1
       ORDER BY p.posted_at DESC LIMIT 50`,
      [req.user.userId]
    );
    res.json({ success: true, posted: posted.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get autonomy logs
app.get('/api/autonomy/logs', authenticate, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await pool.query(
      `SELECT * FROM autonomy_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.user.userId, parseInt(limit)]
    );
    res.json({ success: true, logs: logs.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get autonomy dashboard stats
app.get('/api/autonomy/dashboard', authenticate, async (req, res) => {
  try {
    const config = await pool.query('SELECT * FROM autonomy_config WHERE user_id = $1', [req.user.userId]);
    const platforms = await pool.query('SELECT platform, enabled FROM autonomy_platforms WHERE user_id = $1', [req.user.userId]);
    const queueCount = await pool.query('SELECT COUNT(*) as count FROM autonomy_content_queue WHERE user_id = $1 AND status = $2', [req.user.userId, 'pending']);
    const postedCount = await pool.query('SELECT COUNT(*) as count FROM autonomy_posted_content WHERE user_id = $1', [req.user.userId]);
    const todayPosts = await pool.query(
      `SELECT COUNT(*) as count FROM autonomy_posted_content WHERE user_id = $1 AND posted_at > NOW() - INTERVAL '24 hours'`,
      [req.user.userId]
    );
    const recentLogs = await pool.query(
      'SELECT * FROM autonomy_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.user.userId]
    );

    res.json({
      success: true,
      dashboard: {
        config: config.rows[0] || { enabled: false },
        platforms: platforms.rows,
        stats: {
          queuedContent: parseInt(queueCount.rows[0].count),
          totalPosted: parseInt(postedCount.rows[0].count),
          postedToday: parseInt(todayPosts.rows[0].count)
        },
        recentActivity: recentLogs.rows
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMY KNOWLEDGE BASE - Public Marketing Info Management
// ═══════════════════════════════════════════════════════════════════════════════

// Get all knowledge entries
app.get('/api/autonomy/knowledge', authenticate, async (req, res) => {
  try {
    // Check if user has entries, seed defaults if not
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM autonomy_knowledge WHERE user_id = $1',
      [req.user.userId]
    );

    if (parseInt(countResult.rows[0].count) === 0) {
      await seedDefaultKnowledge(req.user.userId);
    }

    const { category } = req.query;
    let query = 'SELECT * FROM autonomy_knowledge WHERE user_id = $1';
    const params = [req.user.userId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY category, priority DESC, key';

    const result = await pool.query(query, params);
    res.json({ success: true, knowledge: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get knowledge categories
app.get('/api/autonomy/knowledge/categories', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category, COUNT(*) as count
       FROM autonomy_knowledge WHERE user_id = $1
       GROUP BY category ORDER BY category`,
      [req.user.userId]
    );
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new knowledge entry
app.post('/api/autonomy/knowledge', authenticate, async (req, res) => {
  try {
    const { category, key, value, priority = 5 } = req.body;

    if (!category || !key || !value) {
      return res.status(400).json({ error: 'Category, key, and value are required' });
    }

    const result = await pool.query(
      `INSERT INTO autonomy_knowledge (user_id, category, key, value, priority)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category, key) DO UPDATE SET value = $4, priority = $5, updated_at = NOW()
       RETURNING *`,
      [req.user.userId, category, key, value, priority]
    );

    res.json({ success: true, entry: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update knowledge entry
app.put('/api/autonomy/knowledge/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { category, key, value, priority, active } = req.body;

    const updates = [];
    const params = [id, req.user.userId];
    let paramIndex = 3;

    if (category !== undefined) { updates.push(`category = $${paramIndex++}`); params.push(category); }
    if (key !== undefined) { updates.push(`key = $${paramIndex++}`); params.push(key); }
    if (value !== undefined) { updates.push(`value = $${paramIndex++}`); params.push(value); }
    if (priority !== undefined) { updates.push(`priority = $${paramIndex++}`); params.push(priority); }
    if (active !== undefined) { updates.push(`active = $${paramIndex++}`); params.push(active); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE autonomy_knowledge SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    res.json({ success: true, entry: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete knowledge entry
app.delete('/api/autonomy/knowledge/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM autonomy_knowledge WHERE id = $1 AND user_id = $2', [id, req.user.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset knowledge to defaults
app.post('/api/autonomy/knowledge/reset', authenticate, async (req, res) => {
  try {
    // Delete all current entries
    await pool.query('DELETE FROM autonomy_knowledge WHERE user_id = $1', [req.user.userId]);
    // Re-seed defaults
    await seedDefaultKnowledge(req.user.userId);
    // Fetch the new entries
    const result = await pool.query(
      'SELECT * FROM autonomy_knowledge WHERE user_id = $1 ORDER BY category, priority DESC, key',
      [req.user.userId]
    );
    res.json({ success: true, knowledge: result.rows, message: 'Knowledge reset to defaults' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import knowledge entries
app.post('/api/autonomy/knowledge/import', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Entries array is required' });
    }

    let imported = 0;
    for (const entry of entries) {
      if (entry.category && entry.key && entry.value) {
        await pool.query(
          `INSERT INTO autonomy_knowledge (user_id, category, key, value, priority)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, category, key) DO UPDATE SET value = $4, priority = $5, updated_at = NOW()`,
          [req.user.userId, entry.category, entry.key, entry.value, entry.priority || 5]
        );
        imported++;
      }
    }

    res.json({ success: true, imported, message: `Imported ${imported} entries` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTONOMY SCHEDULER - Cron Jobs for Autonomous Posting
// ═══════════════════════════════════════════════════════════════════════════════

// Run every hour - check for users with autonomy enabled and generate/post content
cron.schedule('0 * * * *', async () => {
  console.log('[Autonomy Scheduler] Running hourly check...');

  try {
    // Get all users with autonomy enabled
    const enabledUsers = await pool.query(
      `SELECT ac.*, u.id as user_id, u.email
       FROM autonomy_config ac
       JOIN users u ON u.id = ac.user_id
       WHERE ac.enabled = true AND ac.require_approval = false`
    );

    for (const userConfig of enabledUsers.rows) {
      try {
        // Check if user has posted today
        const todayPosts = await pool.query(
          `SELECT COUNT(*) as count FROM autonomy_posted_content
           WHERE user_id = $1 AND posted_at > NOW() - INTERVAL '24 hours'`,
          [userConfig.user_id]
        );

        const postsToday = parseInt(todayPosts.rows[0].count);

        if (postsToday < userConfig.max_posts_per_day) {
          // Check connected platforms
          const platforms = await pool.query(
            'SELECT * FROM autonomy_platforms WHERE user_id = $1 AND enabled = true',
            [userConfig.user_id]
          );

          for (const platform of platforms.rows) {
            // Generate content
            const contentTypes = userConfig.content_types || ['promotional'];
            const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

            const content = await generateAutonomousContent(
              userConfig.user_id,
              platform.platform,
              randomType,
              { tone: userConfig.tone, topics: userConfig.topics }
            );

            // Post directly (no approval needed)
            if (platform.platform === 'twitter') {
              const postResult = await postToTwitter(userConfig.user_id, content);

              await pool.query(
                `INSERT INTO autonomy_posted_content (user_id, platform, platform_post_id, content, post_url)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userConfig.user_id, 'twitter', postResult.platform_post_id, content, postResult.post_url]
              );

              await pool.query(
                `INSERT INTO autonomy_logs (user_id, action_type, details) VALUES ($1, $2, $3)`,
                [userConfig.user_id, 'auto_posted', JSON.stringify({ platform: 'twitter', postUrl: postResult.post_url })]
              );

              console.log(`[Autonomy] Auto-posted for user ${userConfig.user_id}: ${postResult.post_url}`);
            }
          }
        }
      } catch (userError) {
        console.error(`[Autonomy] Error for user ${userConfig.user_id}:`, userError.message);
        await pool.query(
          `INSERT INTO autonomy_logs (user_id, action_type, status, error_message) VALUES ($1, $2, $3, $4)`,
          [userConfig.user_id, 'auto_post_failed', 'error', userError.message]
        );
      }
    }
  } catch (error) {
    console.error('[Autonomy Scheduler] Error:', error.message);
  }
});

// Process approved content every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('[Autonomy Scheduler] Processing approved content...');

  try {
    const approvedContent = await pool.query(
      `SELECT q.*, ac.require_approval
       FROM autonomy_content_queue q
       JOIN autonomy_config ac ON ac.user_id = q.user_id
       WHERE q.status = 'approved'
       AND (q.scheduled_for IS NULL OR q.scheduled_for <= NOW())
       LIMIT 10`
    );

    for (const item of approvedContent.rows) {
      try {
        // Universal dispatcher supports twitter, linkedin, youtube
        const postResult = await postToplatform(item.user_id, item.platform, item.content);

        await pool.query(
          `INSERT INTO autonomy_posted_content (user_id, queue_id, platform, platform_post_id, content, post_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [item.user_id, item.id, item.platform, postResult.platform_post_id, item.content, postResult.post_url]
        );

        await pool.query(`UPDATE autonomy_content_queue SET status = 'posted' WHERE id = $1`, [item.id]);

        console.log(`[Autonomy] Posted approved content ${item.id} to ${item.platform}: ${postResult.post_url}`);
      } catch (postError) {
        await pool.query(
          `UPDATE autonomy_content_queue SET status = 'failed' WHERE id = $1`,
          [item.id]
        );
        console.error(`[Autonomy] Failed to post ${item.id}:`, postError.message);
      }
    }
  } catch (error) {
    console.error('[Autonomy Scheduler] Process approved error:', error.message);
  }
});

// Fetch engagement metrics every 6 hours for learning
cron.schedule('0 */6 * * *', async () => {
  console.log('[Autonomy Scheduler] Fetching engagement metrics...');

  try {
    // Get posts from last 7 days that need metrics updated
    const recentPosts = await pool.query(
      `SELECT p.id, p.user_id, p.platform, p.platform_post_id
       FROM autonomy_posted_content p
       WHERE p.posted_at > NOW() - INTERVAL '7 days'
       AND p.platform = 'twitter'
       AND p.platform_post_id IS NOT NULL
       LIMIT 100`
    );

    let updated = 0;
    for (const post of recentPosts.rows) {
      try {
        const metrics = await fetchTwitterEngagement(post.user_id, post.platform_post_id);

        if (metrics) {
          // Calculate engagement rate (interactions / impressions)
          const engagementRate = metrics.impressions > 0
            ? ((metrics.likes + metrics.retweets + metrics.replies) / metrics.impressions)
            : 0;

          // Upsert engagement metrics
          await pool.query(
            `INSERT INTO autonomy_engagement (posted_id, likes, retweets, replies, impressions, engagement_rate, fetched_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             ON CONFLICT (posted_id) DO UPDATE SET
               likes = $2, retweets = $3, replies = $4, impressions = $5,
               engagement_rate = $6, fetched_at = NOW()`,
            [post.id, metrics.likes, metrics.retweets, metrics.replies, metrics.impressions, engagementRate]
          );
          updated++;
        }
      } catch (fetchError) {
        console.error(`[Autonomy] Failed to fetch metrics for post ${post.id}:`, fetchError.message);
      }
    }

    console.log(`[Autonomy Scheduler] Updated engagement for ${updated}/${recentPosts.rows.length} posts`);

    // Log best performing content for learning
    const topPosts = await pool.query(
      `SELECT p.content, p.platform, e.likes, e.retweets, e.engagement_rate
       FROM autonomy_posted_content p
       JOIN autonomy_engagement e ON e.posted_id = p.id
       WHERE p.posted_at > NOW() - INTERVAL '7 days'
       ORDER BY e.engagement_rate DESC
       LIMIT 5`
    );

    if (topPosts.rows.length > 0) {
      console.log('[Autonomy] Top performing content this week:');
      topPosts.rows.forEach((post, i) => {
        console.log(`  ${i + 1}. ${post.engagement_rate.toFixed(4)} rate | ${post.likes} likes | "${post.content.substring(0, 50)}..."`);
      });
    }
  } catch (error) {
    console.error('[Autonomy Scheduler] Engagement fetch error:', error.message);
  }
});

// Add unique constraint for engagement upsert if not exists
pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_autonomy_engagement_posted ON autonomy_engagement(posted_id)`).catch(() => {});

console.log('[Autonomy Engine] Scheduler initialized - hourly posting, 15min queue processing, 6hr engagement tracking');
