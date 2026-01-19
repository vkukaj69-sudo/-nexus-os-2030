# NEXUS LEVIATHAN - Master Architecture Plan
## Complete Autonomous Intelligence System

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXUS LEVIATHAN                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 4: REVENUE ENGINE                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Yield     │ │  Product    │ │  Affiliate  │ │  Compute    │       │
│  │  Harvester  │ │  Builder    │ │    Mesh     │ │   Tiering   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: EVASION (GHOST PROTOCOL)                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Stealth   │ │   Proxy     │ │  Fingerprint│ │    Rate     │       │
│  │   Browser   │ │    Mesh     │ │   Rotator   │ │   Limiter   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: INTELLIGENCE (DUAL-LOOP LEARNING)                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  Attention  │ │  Synthetic  │ │  Feedback   │ │  Philosophy │       │
│  │  Arbitrage  │ │  Simulator  │ │   Ledger    │ │  Rewriter   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 1: CORE SEGP (EXISTS - ENHANCE)                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Evolver   │ │  Scheduler  │ │  Event Bus  │ │    Goal     │       │
│  │    Loop     │ │   Service   │ │   Service   │ │   Engine    │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────────────────────┤
│  LAYER 0: FOUNDATION (EXISTS)                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │   Memory    │ │   Agents    │ │  Workflows  │ │   Digital   │       │
│  │   System    │ │   (11)      │ │   Engine    │ │    Soul     │       │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## DATABASE SCHEMA ADDITIONS

### New Tables Required

```sql
-- ═══════════════════════════════════════════════════════════════════════
-- ATTENTION ARBITRAGE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS attention_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic VARCHAR(500) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    search_volume INTEGER,
    competition_score FLOAT,
    quality_score FLOAT,
    opportunity_score FLOAT GENERATED ALWAYS AS (
        (search_volume::float / NULLIF(competition_score, 0)) * (1 - quality_score)
    ) STORED,
    keywords JSONB DEFAULT '[]',
    discovered_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

CREATE INDEX idx_attention_opportunity ON attention_gaps(opportunity_score DESC);
CREATE INDEX idx_attention_platform ON attention_gaps(platform, status);

CREATE TABLE IF NOT EXISTS arbitrage_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    gap_id UUID REFERENCES attention_gaps(id),
    strategy JSONB NOT NULL,
    content_pieces JSONB DEFAULT '[]',
    performance JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- SYNTHETIC PERSONA SIMULATOR
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS synthetic_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archetype VARCHAR(100) NOT NULL,
    demographics JSONB NOT NULL,
    psychographics JSONB NOT NULL,
    behavior_patterns JSONB DEFAULT '{}',
    engagement_weights JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    content_type VARCHAR(50),
    content TEXT NOT NULL,
    platform VARCHAR(50),
    persona_count INTEGER DEFAULT 1000,
    results JSONB DEFAULT '{}',
    predicted_metrics JSONB DEFAULT '{}',
    actual_metrics JSONB,
    accuracy_score FLOAT,
    simulated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS simulation_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulation_id UUID REFERENCES simulations(id),
    persona_id UUID REFERENCES synthetic_personas(id),
    reaction VARCHAR(50),
    engagement_probability FLOAT,
    reasoning TEXT,
    emotional_response JSONB
);

-- ═══════════════════════════════════════════════════════════════════════
-- FEEDBACK LEDGER (CROSS-PLATFORM)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    content TEXT,
    content_type VARCHAR(50),
    posted_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS feedback_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES content_posts(id),
    metric_type VARCHAR(50) NOT NULL,
    value FLOAT NOT NULL,
    source VARCHAR(50) DEFAULT 'first_party',
    collected_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sentiment_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES content_posts(id),
    mention_url TEXT,
    sentiment_score FLOAT,
    emotion JSONB,
    influence_score FLOAT,
    detected_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- PHILOSOPHY ENGINE (META-LEARNING)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS philosophy_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    rule_type VARCHAR(50) NOT NULL,
    condition JSONB NOT NULL,
    action JSONB NOT NULL,
    confidence FLOAT DEFAULT 0.5,
    times_applied INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS philosophy_evolution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    old_rules JSONB,
    new_rules JSONB,
    trigger_event TEXT,
    reasoning TEXT,
    evolved_at TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- GHOST PROTOCOL (EVASION)
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS proxy_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_type VARCHAR(50) DEFAULT 'residential',
    ip_address VARCHAR(45),
    geo_location JSONB,
    health_score FLOAT DEFAULT 1.0,
    last_used TIMESTAMP,
    ban_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS browser_fingerprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint_data JSONB NOT NULL,
    user_agent TEXT,
    screen_resolution VARCHAR(20),
    timezone VARCHAR(50),
    languages JSONB,
    webgl_hash VARCHAR(64),
    canvas_hash VARCHAR(64),
    uses INTEGER DEFAULT 0,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    session_data JSONB,
    cookies JSONB,
    fingerprint_id UUID REFERENCES browser_fingerprints(id),
    proxy_id UUID REFERENCES proxy_nodes(id),
    health VARCHAR(50) DEFAULT 'healthy',
    last_activity TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    limit_per_hour INTEGER,
    limit_per_day INTEGER,
    cooldown_seconds INTEGER,
    current_hour_count INTEGER DEFAULT 0,
    current_day_count INTEGER DEFAULT 0,
    last_reset TIMESTAMP DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════
-- REVENUE ENGINE
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS affiliate_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    link_code VARCHAR(50) UNIQUE NOT NULL,
    destination_url TEXT,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id INTEGER REFERENCES users(id),
    referred_id INTEGER REFERENCES users(id),
    link_id UUID REFERENCES affiliate_links(id),
    status VARCHAR(50) DEFAULT 'pending',
    compute_credits_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auto_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    product_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    content JSONB,
    stripe_product_id VARCHAR(100),
    stripe_price_id VARCHAR(100),
    price DECIMAL(10, 2),
    sales_count INTEGER DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    trigger_event TEXT,
    auto_generated BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yield_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_type VARCHAR(50),
    topic VARCHAR(255),
    estimated_revenue DECIMAL(10, 2),
    confidence FLOAT,
    action_plan JSONB,
    status VARCHAR(50) DEFAULT 'identified',
    discovered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compute_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id),
    operation_type VARCHAR(50),
    neural_intensity FLOAT,
    tokens_used INTEGER,
    compute_cost DECIMAL(10, 4),
    timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## SERVICE ARCHITECTURE

### Layer 1: Core SEGP Services

#### 1.1 EvolverService.js
```javascript
/**
 * Self-critique loop for all agent outputs
 * - Evaluates quality before delivery
 * - Applies learned improvements
 * - Tracks evolution patterns
 */
```

#### 1.2 SchedulerService.js
```javascript
/**
 * Cron-based autonomous task execution
 * - Runs scheduled workflows
 * - Handles missed tasks
 * - Dynamic schedule adjustment
 */
```

#### 1.3 EventBusService.js
```javascript
/**
 * Event-driven automation
 * - Emits system events
 * - Triggers workflows on events
 * - Cross-service communication
 */
```

---

### Layer 2: Intelligence Services

#### 2.1 AttentionArbitrageService.js
```javascript
/**
 * NEXUS LEVIATHAN - Attention Arbitrage Engine
 * Discovers and exploits attention gaps across platforms
 */

class AttentionArbitrageService {
  constructor(pool, scryerAgent, config = {}) {
    this.pool = pool;
    this.scryer = scryerAgent;
    this.platforms = ['twitter', 'reddit', 'tiktok', 'linkedin', 'youtube'];
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // Scan all platforms for attention gaps
  async discoverGaps() {
    const gaps = [];

    for (const platform of this.platforms) {
      // Get trending topics
      const trends = await this.scryer.execute({
        type: 'trend_analysis',
        payload: { platform, timeframe: '24h' }
      });

      // Analyze each trend for opportunity
      for (const trend of trends.topics || []) {
        const analysis = await this.analyzeOpportunity(trend, platform);
        if (analysis.opportunityScore > 0.7) {
          gaps.push(analysis);
        }
      }
    }

    // Store discovered gaps
    for (const gap of gaps) {
      await this.pool.query(`
        INSERT INTO attention_gaps
        (topic, platform, search_volume, competition_score, quality_score, keywords)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [gap.topic, gap.platform, gap.searchVolume, gap.competition, gap.quality, gap.keywords]);
    }

    return gaps;
  }

  async analyzeOpportunity(topic, platform) {
    const prompt = `Analyze this trending topic for content opportunity.

Topic: ${topic.name}
Platform: ${platform}
Current Volume: ${topic.volume || 'Unknown'}

Evaluate:
1. Search volume (estimated monthly searches)
2. Competition (how many quality creators covering this)
3. Quality score (quality of existing content, 0-1)
4. Keywords to target

Return JSON:
{
  "searchVolume": number,
  "competition": 0.0-1.0,
  "quality": 0.0-1.0,
  "keywords": ["..."],
  "angle": "unique angle to take",
  "urgency": "low|medium|high"
}`;

    const result = await this.model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);

    return {
      topic: topic.name,
      platform,
      ...analysis,
      opportunityScore: (analysis.searchVolume / 10000) * (1 - analysis.competition) * (1 - analysis.quality)
    };
  }

  // Get best opportunities for a user
  async getTopOpportunities(userId, limit = 10) {
    const result = await this.pool.query(`
      SELECT * FROM attention_gaps
      WHERE status = 'active'
        AND expires_at > NOW()
      ORDER BY opportunity_score DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // Create campaign for an opportunity
  async createCampaign(userId, gapId) {
    const gap = await this.pool.query('SELECT * FROM attention_gaps WHERE id = $1', [gapId]);
    if (!gap.rows[0]) return { success: false, error: 'Gap not found' };

    const strategy = await this.generateStrategy(gap.rows[0]);

    const result = await this.pool.query(`
      INSERT INTO arbitrage_campaigns (user_id, gap_id, strategy)
      VALUES ($1, $2, $3) RETURNING id
    `, [userId, gapId, strategy]);

    return { success: true, campaignId: result.rows[0].id, strategy };
  }

  async generateStrategy(gap) {
    const prompt = `Create a content strategy to dominate this attention gap.

Topic: ${gap.topic}
Platform: ${gap.platform}
Keywords: ${JSON.stringify(gap.keywords)}
Opportunity Score: ${gap.opportunity_score}

Generate a 7-day blitz strategy:
{
  "hooks": ["5 viral hooks"],
  "contentPieces": [
    {"day": 1, "type": "...", "angle": "...", "cta": "..."}
  ],
  "distribution": {"primary": "...", "secondary": ["..."]},
  "expectedReach": number
}`;

    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);
  }
}
```

#### 2.2 SyntheticSimulatorService.js
```javascript
/**
 * NEXUS LEVIATHAN - Synthetic Persona Simulator
 * Tests content against 10,000 AI personas before posting
 */

class SyntheticSimulatorService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.personaCount = config.personaCount || 1000;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // Generate diverse persona pool
  async generatePersonaPool(count = 100) {
    const archetypes = [
      'tech_enthusiast', 'skeptic', 'early_adopter', 'casual_scroller',
      'influencer', 'business_owner', 'student', 'professional',
      'creator', 'investor', 'critic', 'fan'
    ];

    const demographics = [
      { age: '18-24', income: 'low' },
      { age: '25-34', income: 'medium' },
      { age: '35-44', income: 'high' },
      { age: '45-54', income: 'high' },
      { age: '55+', income: 'medium' }
    ];

    for (let i = 0; i < count; i++) {
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      const demo = demographics[Math.floor(Math.random() * demographics.length)];

      const prompt = `Generate a detailed synthetic persona for content testing.

Archetype: ${archetype}
Age Range: ${demo.age}
Income Level: ${demo.income}

Return JSON:
{
  "psychographics": {
    "values": ["..."],
    "interests": ["..."],
    "painPoints": ["..."],
    "aspirations": ["..."]
  },
  "behaviorPatterns": {
    "scrollSpeed": "fast|medium|slow",
    "engagementThreshold": 0.0-1.0,
    "shareThreshold": 0.0-1.0,
    "commentTriggers": ["..."]
  },
  "engagementWeights": {
    "humor": 0.0-1.0,
    "controversy": 0.0-1.0,
    "education": 0.0-1.0,
    "inspiration": 0.0-1.0,
    "fear": 0.0-1.0,
    "curiosity": 0.0-1.0
  }
}`;

      const result = await this.model.generateContent(prompt);
      const persona = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);

      await this.pool.query(`
        INSERT INTO synthetic_personas (archetype, demographics, psychographics, behavior_patterns, engagement_weights)
        VALUES ($1, $2, $3, $4, $5)
      `, [archetype, demo, persona.psychographics, persona.behaviorPatterns, persona.engagementWeights]);
    }
  }

  // Simulate content against persona pool
  async simulate(userId, content, platform, personaCount = 1000) {
    // Get random personas
    const personas = await this.pool.query(`
      SELECT * FROM synthetic_personas
      ORDER BY RANDOM()
      LIMIT $1
    `, [Math.min(personaCount, 100)]); // Batch for efficiency

    // Run simulation
    const results = {
      totalReach: 0,
      engagementRate: 0,
      shareRate: 0,
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      predictedComments: [],
      viralProbability: 0
    };

    const batchPrompt = `Simulate how these ${personas.rows.length} personas would react to this content.

CONTENT:
${content}

PLATFORM: ${platform}

PERSONAS:
${JSON.stringify(personas.rows.map(p => ({
  archetype: p.archetype,
  weights: p.engagement_weights,
  threshold: p.behavior_patterns?.engagementThreshold
})))}

For each persona, predict:
- Would they stop scrolling? (0-1)
- Would they engage? (0-1)
- Would they share? (0-1)
- Sentiment (positive/neutral/negative)
- Potential comment (if any)

Return JSON:
{
  "reactions": [
    {"personaIndex": 0, "stopScroll": 0.8, "engage": 0.6, "share": 0.2, "sentiment": "positive", "comment": "..."}
  ],
  "aggregateMetrics": {
    "avgStopScroll": 0.0-1.0,
    "avgEngagement": 0.0-1.0,
    "avgShare": 0.0-1.0,
    "viralProbability": 0.0-1.0
  },
  "topComments": ["..."],
  "concerns": ["potential issues"],
  "improvements": ["suggestions"]
}`;

    const simResult = await this.model.generateContent(batchPrompt);
    const simulation = JSON.parse(simResult.response.text().match(/\{[\s\S]*\}/)[0]);

    // Scale up to requested persona count
    const scaleFactor = personaCount / personas.rows.length;

    // Store simulation
    const simRecord = await this.pool.query(`
      INSERT INTO simulations (user_id, content_type, content, platform, persona_count, results, predicted_metrics)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [
      userId,
      'post',
      content,
      platform,
      personaCount,
      simulation,
      {
        reach: Math.round(simulation.aggregateMetrics.avgStopScroll * personaCount * scaleFactor),
        engagement: simulation.aggregateMetrics.avgEngagement,
        shares: Math.round(simulation.aggregateMetrics.avgShare * personaCount * scaleFactor),
        viralProbability: simulation.aggregateMetrics.viralProbability
      }
    ]);

    return {
      simulationId: simRecord.rows[0].id,
      ...simulation,
      scaledMetrics: {
        estimatedReach: Math.round(simulation.aggregateMetrics.avgStopScroll * personaCount * scaleFactor * 100),
        estimatedEngagements: Math.round(simulation.aggregateMetrics.avgEngagement * personaCount * scaleFactor * 10),
        estimatedShares: Math.round(simulation.aggregateMetrics.avgShare * personaCount * scaleFactor * 5),
        viralProbability: simulation.aggregateMetrics.viralProbability
      }
    };
  }

  // Compare simulation prediction with actual results
  async recordActualResults(simulationId, actualMetrics) {
    const sim = await this.pool.query('SELECT * FROM simulations WHERE id = $1', [simulationId]);
    if (!sim.rows[0]) return;

    const predicted = sim.rows[0].predicted_metrics;
    const accuracy = this.calculateAccuracy(predicted, actualMetrics);

    await this.pool.query(`
      UPDATE simulations
      SET actual_metrics = $1, accuracy_score = $2
      WHERE id = $3
    `, [actualMetrics, accuracy, simulationId]);

    // Learn from discrepancy
    if (accuracy < 0.7) {
      await this.adjustPersonaWeights(sim.rows[0], actualMetrics);
    }
  }

  calculateAccuracy(predicted, actual) {
    const metrics = ['reach', 'engagement', 'shares'];
    let totalError = 0;

    for (const m of metrics) {
      if (predicted[m] && actual[m]) {
        const error = Math.abs(predicted[m] - actual[m]) / Math.max(predicted[m], actual[m], 1);
        totalError += error;
      }
    }

    return Math.max(0, 1 - (totalError / metrics.length));
  }

  async adjustPersonaWeights(simulation, actual) {
    // Meta-learning: adjust persona engagement weights based on prediction errors
    // This is the "philosophy rewriter" in action
    console.log('[Simulator] Adjusting persona weights based on prediction error');
  }
}
```

#### 2.3 FeedbackLedgerService.js
```javascript
/**
 * NEXUS LEVIATHAN - Cross-Platform Feedback Ledger
 * Tracks 1st and 3rd party engagement data
 */

class FeedbackLedgerService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.platforms = config.platforms || ['twitter', 'linkedin', 'reddit'];
  }

  // Record a published post
  async recordPost(userId, platform, externalId, content, metadata = {}) {
    const result = await this.pool.query(`
      INSERT INTO content_posts (user_id, platform, external_id, content, content_type, posted_at, metadata)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id
    `, [userId, platform, externalId, content, metadata.type || 'post', metadata]);

    return result.rows[0].id;
  }

  // Record 1st party metrics (likes, shares, etc)
  async record1stParty(postId, metrics) {
    const entries = Object.entries(metrics);
    for (const [type, value] of entries) {
      await this.pool.query(`
        INSERT INTO feedback_ledger (post_id, metric_type, value, source)
        VALUES ($1, $2, $3, 'first_party')
      `, [postId, type, value]);
    }
  }

  // Record 3rd party mentions/sentiment
  async record3rdParty(postId, mentionUrl, sentiment, emotion, influence) {
    await this.pool.query(`
      INSERT INTO sentiment_tracking (post_id, mention_url, sentiment_score, emotion, influence_score)
      VALUES ($1, $2, $3, $4, $5)
    `, [postId, mentionUrl, sentiment, emotion, influence]);
  }

  // Get aggregated feedback for a post
  async getPostFeedback(postId) {
    const firstParty = await this.pool.query(`
      SELECT metric_type, SUM(value) as total, AVG(value) as average
      FROM feedback_ledger
      WHERE post_id = $1 AND source = 'first_party'
      GROUP BY metric_type
    `, [postId]);

    const sentiment = await this.pool.query(`
      SELECT AVG(sentiment_score) as avg_sentiment,
             COUNT(*) as mention_count,
             SUM(influence_score) as total_influence
      FROM sentiment_tracking
      WHERE post_id = $1
    `, [postId]);

    return {
      metrics: firstParty.rows,
      sentiment: sentiment.rows[0]
    };
  }

  // Analyze patterns across all posts
  async analyzePatterns(userId, days = 30) {
    const result = await this.pool.query(`
      SELECT cp.platform, cp.content_type,
             AVG(fl.value) FILTER (WHERE fl.metric_type = 'likes') as avg_likes,
             AVG(fl.value) FILTER (WHERE fl.metric_type = 'shares') as avg_shares,
             AVG(st.sentiment_score) as avg_sentiment
      FROM content_posts cp
      LEFT JOIN feedback_ledger fl ON cp.id = fl.post_id
      LEFT JOIN sentiment_tracking st ON cp.id = st.post_id
      WHERE cp.user_id = $1 AND cp.posted_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY cp.platform, cp.content_type
    `, [userId, days]);

    return result.rows;
  }
}
```

#### 2.4 PhilosophyRewriterService.js
```javascript
/**
 * NEXUS LEVIATHAN - Philosophy Rewriter
 * Meta-learning system that evolves the system's core beliefs
 */

class PhilosophyRewriterService {
  constructor(pool, memoryService, config = {}) {
    this.pool = pool;
    this.memory = memoryService;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // Get current philosophy rules for a user
  async getCurrentPhilosophy(userId) {
    const result = await this.pool.query(`
      SELECT * FROM philosophy_rules
      WHERE user_id = $1 AND confidence > 0.3
      ORDER BY success_rate DESC
    `, [userId]);
    return result.rows;
  }

  // Analyze performance and evolve philosophy
  async evolve(userId) {
    // Get current rules
    const currentRules = await this.getCurrentPhilosophy(userId);

    // Get recent performance data
    const performance = await this.pool.query(`
      SELECT
        cp.platform,
        cp.content_type,
        AVG(CASE WHEN fl.metric_type = 'engagement' THEN fl.value END) as avg_engagement,
        COUNT(*) as post_count
      FROM content_posts cp
      LEFT JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1 AND cp.posted_at > NOW() - INTERVAL '7 days'
      GROUP BY cp.platform, cp.content_type
    `, [userId]);

    // Get failed predictions
    const failures = await this.pool.query(`
      SELECT * FROM simulations
      WHERE user_id = $1 AND accuracy_score < 0.5
      ORDER BY simulated_at DESC LIMIT 10
    `, [userId]);

    // AI analysis for philosophy evolution
    const prompt = `You are a meta-learning system. Analyze this data and evolve the system's philosophy.

CURRENT PHILOSOPHY RULES:
${JSON.stringify(currentRules.map(r => ({ type: r.rule_type, condition: r.condition, action: r.action, success: r.success_rate })))}

RECENT PERFORMANCE:
${JSON.stringify(performance.rows)}

PREDICTION FAILURES:
${failures.rows.length} predictions had <50% accuracy

Based on this data, generate NEW or UPDATED philosophy rules.
A philosophy rule defines WHAT the system believes works.

Return JSON:
{
  "insights": ["what we learned"],
  "deprecateRules": ["rule IDs to reduce confidence"],
  "newRules": [
    {
      "ruleType": "content_strategy|platform_preference|timing|tone|topic_selection",
      "condition": {"platform": "...", "metric": "...", "threshold": ...},
      "action": {"strategy": "...", "parameters": {...}},
      "reasoning": "why this rule"
    }
  ],
  "evolutionSummary": "what changed and why"
}`;

    const result = await this.model.generateContent(prompt);
    const evolution = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);

    // Apply evolution
    // 1. Deprecate old rules
    for (const ruleId of evolution.deprecateRules || []) {
      await this.pool.query(`
        UPDATE philosophy_rules SET confidence = confidence * 0.5 WHERE id = $1
      `, [ruleId]);
    }

    // 2. Create new rules
    for (const rule of evolution.newRules || []) {
      await this.pool.query(`
        INSERT INTO philosophy_rules (user_id, rule_type, condition, action, confidence)
        VALUES ($1, $2, $3, $4, 0.6)
      `, [userId, rule.ruleType, rule.condition, rule.action]);
    }

    // 3. Log evolution
    await this.pool.query(`
      INSERT INTO philosophy_evolution_log (user_id, old_rules, new_rules, trigger_event, reasoning)
      VALUES ($1, $2, $3, 'scheduled_evolution', $4)
    `, [userId, currentRules, evolution.newRules, evolution.evolutionSummary]);

    // 4. Update agent instruction sets based on new philosophy
    await this.updateAgentInstructions(userId, evolution.newRules);

    return evolution;
  }

  async updateAgentInstructions(userId, newRules) {
    // This propagates philosophy changes to all agents
    // Each agent's behavior is modified by the new rules
    for (const rule of newRules || []) {
      await this.memory.storeSemantic(userId, {
        memoryType: 'philosophy',
        subject: 'system',
        predicate: `believes ${rule.ruleType}`,
        object: JSON.stringify(rule.action),
        confidence: 0.6,
        source: 'evolution'
      });
    }
  }

  // Apply philosophy to a decision
  async applyPhilosophy(userId, context) {
    const rules = await this.getCurrentPhilosophy(userId);
    const applicableRules = rules.filter(r => this.matchesCondition(r.condition, context));

    // Return actions from applicable rules
    return applicableRules.map(r => ({
      ruleId: r.id,
      action: r.action,
      confidence: r.confidence
    }));
  }

  matchesCondition(condition, context) {
    for (const [key, value] of Object.entries(condition)) {
      if (context[key] !== value) return false;
    }
    return true;
  }
}
```

---

### Layer 3: Ghost Protocol Services

#### 3.1 StealthBrowserService.js
```javascript
/**
 * NEXUS LEVIATHAN - Stealth Browser
 * Human-like browser automation with fingerprint rotation
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class StealthBrowserService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.browsers = new Map();
    this.config = config;
  }

  // Get or create a fingerprint
  async getFingerprint() {
    // Try to get an unused fingerprint
    let fp = await this.pool.query(`
      SELECT * FROM browser_fingerprints
      WHERE uses < 50
      ORDER BY uses ASC, RANDOM()
      LIMIT 1
    `);

    if (!fp.rows[0]) {
      // Generate new fingerprint
      fp = await this.generateFingerprint();
    } else {
      fp = fp.rows[0];
      await this.pool.query('UPDATE browser_fingerprints SET uses = uses + 1 WHERE id = $1', [fp.id]);
    }

    return fp;
  }

  async generateFingerprint() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];

    const resolutions = ['1920x1080', '2560x1440', '1366x768', '1536x864'];
    const timezones = ['America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo'];

    const fingerprint = {
      user_agent: userAgents[Math.floor(Math.random() * userAgents.length)],
      screen_resolution: resolutions[Math.floor(Math.random() * resolutions.length)],
      timezone: timezones[Math.floor(Math.random() * timezones.length)],
      languages: ['en-US', 'en'],
      webgl_hash: require('crypto').randomBytes(32).toString('hex'),
      canvas_hash: require('crypto').randomBytes(32).toString('hex')
    };

    const result = await this.pool.query(`
      INSERT INTO browser_fingerprints (fingerprint_data, user_agent, screen_resolution, timezone, languages, webgl_hash, canvas_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [fingerprint, fingerprint.user_agent, fingerprint.screen_resolution, fingerprint.timezone, fingerprint.languages, fingerprint.webgl_hash, fingerprint.canvas_hash]);

    return result.rows[0];
  }

  // Launch stealth browser with fingerprint
  async launchBrowser(fingerprintId = null, proxyId = null) {
    const fingerprint = fingerprintId
      ? (await this.pool.query('SELECT * FROM browser_fingerprints WHERE id = $1', [fingerprintId])).rows[0]
      : await this.getFingerprint();

    const proxy = proxyId
      ? (await this.pool.query('SELECT * FROM proxy_nodes WHERE id = $1', [proxyId])).rows[0]
      : null;

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      `--window-size=${fingerprint.screen_resolution.replace('x', ',')}`
    ];

    if (proxy) {
      args.push(`--proxy-server=${proxy.ip_address}`);
    }

    const browser = await puppeteer.launch({
      headless: 'new',
      args
    });

    const page = await browser.newPage();

    // Apply fingerprint
    await page.setUserAgent(fingerprint.user_agent);
    await page.setViewport({
      width: parseInt(fingerprint.screen_resolution.split('x')[0]),
      height: parseInt(fingerprint.screen_resolution.split('x')[1])
    });

    // Override timezone
    await page.emulateTimezone(fingerprint.timezone);

    // Inject fingerprint spoofing
    await page.evaluateOnNewDocument((fp) => {
      // Override WebGL fingerprint
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.apply(this, arguments);
      };

      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', { get: () => fp.languages });
    }, fingerprint);

    const browserId = require('crypto').randomUUID();
    this.browsers.set(browserId, { browser, page, fingerprint, proxy });

    return { browserId, page };
  }

  // Human-like actions
  async humanType(page, selector, text, options = {}) {
    await page.waitForSelector(selector);
    await page.click(selector);

    for (const char of text) {
      await page.type(selector, char, { delay: 50 + Math.random() * 100 });
      if (Math.random() > 0.95) {
        await this.humanPause(100, 300);
      }
    }
  }

  async humanClick(page, selector) {
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    const box = await element.boundingBox();

    // Click at random point within element
    await page.mouse.move(
      box.x + Math.random() * box.width,
      box.y + Math.random() * box.height,
      { steps: 10 + Math.floor(Math.random() * 10) }
    );

    await this.humanPause(50, 150);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }

  async humanScroll(page, distance = 500) {
    const scrolls = Math.ceil(distance / 100);
    for (let i = 0; i < scrolls; i++) {
      await page.evaluate((d) => window.scrollBy(0, d), 100 + Math.random() * 50);
      await this.humanPause(100, 300);
    }
  }

  async humanPause(min = 500, max = 2000) {
    await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
  }

  // Close browser
  async closeBrowser(browserId) {
    const browserData = this.browsers.get(browserId);
    if (browserData) {
      await browserData.browser.close();
      this.browsers.delete(browserId);
    }
  }
}
```

#### 3.2 ProxyMeshService.js
```javascript
/**
 * NEXUS LEVIATHAN - Proxy Mesh
 * Distributed proxy rotation and health monitoring
 */

class ProxyMeshService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.providers = config.providers || [];
    this.healthCheckInterval = config.healthCheckInterval || 60000;
  }

  async initialize() {
    // Start health check loop
    setInterval(() => this.healthCheckAll(), this.healthCheckInterval);
  }

  // Get a healthy proxy for a platform
  async getProxy(platform = null, geoTarget = null) {
    let query = `
      SELECT * FROM proxy_nodes
      WHERE is_active = true AND health_score > 0.5
    `;
    const params = [];

    if (geoTarget) {
      query += ` AND geo_location->>'country' = $${params.length + 1}`;
      params.push(geoTarget);
    }

    query += ` ORDER BY health_score DESC, last_used ASC NULLS FIRST LIMIT 1`;

    const result = await this.pool.query(query, params);

    if (result.rows[0]) {
      await this.pool.query('UPDATE proxy_nodes SET last_used = NOW() WHERE id = $1', [result.rows[0].id]);
    }

    return result.rows[0];
  }

  // Add proxy node
  async addNode(nodeData) {
    const { ipAddress, nodeType = 'residential', geoLocation } = nodeData;

    const result = await this.pool.query(`
      INSERT INTO proxy_nodes (ip_address, node_type, geo_location)
      VALUES ($1, $2, $3) RETURNING id
    `, [ipAddress, nodeType, geoLocation]);

    return result.rows[0].id;
  }

  // Report proxy ban/failure
  async reportBan(proxyId, platform) {
    await this.pool.query(`
      UPDATE proxy_nodes
      SET ban_count = ban_count + 1,
          health_score = GREATEST(0, health_score - 0.2)
      WHERE id = $1
    `, [proxyId]);

    // If too many bans, deactivate
    const node = await this.pool.query('SELECT * FROM proxy_nodes WHERE id = $1', [proxyId]);
    if (node.rows[0]?.ban_count >= 5) {
      await this.pool.query('UPDATE proxy_nodes SET is_active = false WHERE id = $1', [proxyId]);
    }
  }

  // Health check all proxies
  async healthCheckAll() {
    const nodes = await this.pool.query('SELECT * FROM proxy_nodes WHERE is_active = true');

    for (const node of nodes.rows) {
      const healthy = await this.checkProxyHealth(node);
      await this.pool.query(`
        UPDATE proxy_nodes
        SET health_score = $1
        WHERE id = $2
      `, [healthy ? Math.min(1, node.health_score + 0.1) : Math.max(0, node.health_score - 0.1), node.id]);
    }
  }

  async checkProxyHealth(node) {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        agent: new (require('https-proxy-agent').HttpsProxyAgent)(`http://${node.ip_address}`)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Rotate to new proxy
  async rotate(currentProxyId, platform) {
    await this.reportBan(currentProxyId, platform);
    return this.getProxy(platform);
  }
}
```

#### 3.3 RateLimiterService.js
```javascript
/**
 * NEXUS LEVIATHAN - Rate Limiter
 * Platform-aware action throttling
 */

class RateLimiterService {
  constructor(pool) {
    this.pool = pool;
    this.limits = new Map();
  }

  async initialize() {
    // Load limits from database
    const limits = await this.pool.query('SELECT * FROM rate_limits');
    for (const limit of limits.rows) {
      this.limits.set(`${limit.platform}:${limit.action_type}`, limit);
    }

    // Reset counters hourly
    setInterval(() => this.resetHourlyCounters(), 3600000);
  }

  // Check if action is allowed
  async canPerform(platform, actionType) {
    const key = `${platform}:${actionType}`;
    let limit = this.limits.get(key);

    if (!limit) {
      // Default conservative limits
      limit = {
        limit_per_hour: 10,
        limit_per_day: 50,
        cooldown_seconds: 60,
        current_hour_count: 0,
        current_day_count: 0
      };
    }

    if (limit.current_hour_count >= limit.limit_per_hour) {
      return { allowed: false, reason: 'hourly_limit', waitSeconds: 3600 };
    }

    if (limit.current_day_count >= limit.limit_per_day) {
      return { allowed: false, reason: 'daily_limit', waitSeconds: 86400 };
    }

    return { allowed: true, cooldownSeconds: limit.cooldown_seconds };
  }

  // Record action
  async recordAction(platform, actionType) {
    const key = `${platform}:${actionType}`;

    await this.pool.query(`
      UPDATE rate_limits
      SET current_hour_count = current_hour_count + 1,
          current_day_count = current_day_count + 1
      WHERE platform = $1 AND action_type = $2
    `, [platform, actionType]);

    const limit = this.limits.get(key);
    if (limit) {
      limit.current_hour_count++;
      limit.current_day_count++;
    }
  }

  async resetHourlyCounters() {
    await this.pool.query('UPDATE rate_limits SET current_hour_count = 0');
    for (const limit of this.limits.values()) {
      limit.current_hour_count = 0;
    }
  }

  // Set custom limits
  async setLimits(platform, actionType, limits) {
    await this.pool.query(`
      INSERT INTO rate_limits (platform, action_type, limit_per_hour, limit_per_day, cooldown_seconds)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (platform, action_type)
      DO UPDATE SET limit_per_hour = $3, limit_per_day = $4, cooldown_seconds = $5
    `, [platform, actionType, limits.perHour, limits.perDay, limits.cooldown]);

    this.limits.set(`${platform}:${actionType}`, {
      ...limits,
      current_hour_count: 0,
      current_day_count: 0
    });
  }
}
```

---

### Layer 4: Revenue Engine Services

#### 4.1 AffiliateMeshService.js
```javascript
/**
 * NEXUS LEVIATHAN - Affiliate Mesh
 * Decentralized referral and compute credit system
 */

class AffiliateMeshService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.creditRate = config.creditRate || 100; // Credits per referral
  }

  // Generate affiliate link for user
  async generateLink(userId, destination = 'https://nexus-os.ai') {
    const code = require('crypto').randomBytes(8).toString('hex');

    const result = await this.pool.query(`
      INSERT INTO affiliate_links (user_id, link_code, destination_url)
      VALUES ($1, $2, $3) RETURNING *
    `, [userId, code, destination]);

    return {
      linkCode: code,
      fullUrl: `https://nexus-os.ai/r/${code}`,
      link: result.rows[0]
    };
  }

  // Track click
  async trackClick(linkCode, metadata = {}) {
    await this.pool.query(`
      UPDATE affiliate_links
      SET click_count = click_count + 1
      WHERE link_code = $1
    `, [linkCode]);
  }

  // Process referral signup
  async processReferral(linkCode, newUserId) {
    const link = await this.pool.query(
      'SELECT * FROM affiliate_links WHERE link_code = $1',
      [linkCode]
    );

    if (!link.rows[0]) return { success: false, error: 'Invalid link' };

    const referrerId = link.rows[0].user_id;

    // Create referral record
    await this.pool.query(`
      INSERT INTO referrals (referrer_id, referred_id, link_id, status)
      VALUES ($1, $2, $3, 'pending')
    `, [referrerId, newUserId, link.rows[0].id]);

    // Update conversion count
    await this.pool.query(`
      UPDATE affiliate_links
      SET conversion_count = conversion_count + 1
      WHERE id = $1
    `, [link.rows[0].id]);

    return { success: true, referrerId };
  }

  // Award compute credits when referred user pays
  async awardCredits(referralId, amount) {
    const referral = await this.pool.query('SELECT * FROM referrals WHERE id = $1', [referralId]);
    if (!referral.rows[0]) return;

    const credits = Math.floor(amount * 0.2 * this.creditRate); // 20% of payment as credits

    await this.pool.query(`
      UPDATE referrals
      SET status = 'completed', compute_credits_earned = $1
      WHERE id = $2
    `, [credits, referralId]);

    // Add credits to user's account
    await this.pool.query(`
      UPDATE users
      SET compute_credits = COALESCE(compute_credits, 0) + $1
      WHERE id = $2
    `, [credits, referral.rows[0].referrer_id]);

    return { creditsAwarded: credits };
  }

  // Get user's referral stats
  async getStats(userId) {
    const links = await this.pool.query(
      'SELECT * FROM affiliate_links WHERE user_id = $1',
      [userId]
    );

    const referrals = await this.pool.query(`
      SELECT status, COUNT(*) as count, SUM(compute_credits_earned) as total_credits
      FROM referrals
      WHERE referrer_id = $1
      GROUP BY status
    `, [userId]);

    return {
      links: links.rows,
      referrals: referrals.rows,
      totalClicks: links.rows.reduce((sum, l) => sum + l.click_count, 0),
      totalConversions: links.rows.reduce((sum, l) => sum + l.conversion_count, 0)
    };
  }

  // Auto-inject referral link into content
  async injectReferralLink(userId, content) {
    const link = await this.pool.query(
      'SELECT * FROM affiliate_links WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (!link.rows[0]) {
      const newLink = await this.generateLink(userId);
      return content + `\n\n${newLink.fullUrl}`;
    }

    return content + `\n\nhttps://nexus-os.ai/r/${link.rows[0].link_code}`;
  }
}
```

#### 4.2 YieldHarvesterService.js
```javascript
/**
 * NEXUS LEVIATHAN - Yield Harvester
 * Autonomous product creation and monetization
 */

class YieldHarvesterService {
  constructor(pool, stripeClient, config = {}) {
    this.pool = pool;
    this.stripe = stripeClient;
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // Detect monetization opportunities
  async detectOpportunities(userId) {
    // Analyze recent high-performing content
    const topContent = await this.pool.query(`
      SELECT cp.*, AVG(fl.value) as avg_engagement
      FROM content_posts cp
      JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1 AND cp.posted_at > NOW() - INTERVAL '30 days'
      GROUP BY cp.id
      ORDER BY avg_engagement DESC
      LIMIT 10
    `, [userId]);

    // Analyze attention gaps being dominated
    const dominatedGaps = await this.pool.query(`
      SELECT ag.* FROM attention_gaps ag
      JOIN arbitrage_campaigns ac ON ag.id = ac.gap_id
      WHERE ac.user_id = $1 AND ac.status = 'active'
        AND (ac.performance->>'engagement')::float > 0.1
    `, [userId]);

    const opportunities = [];

    // AI analysis for product opportunities
    const prompt = `Analyze this creator's performance and suggest monetization opportunities.

TOP PERFORMING CONTENT:
${JSON.stringify(topContent.rows.map(c => ({ content: c.content?.substring(0, 200), engagement: c.avg_engagement })))}

DOMINATED ATTENTION GAPS:
${JSON.stringify(dominatedGaps.rows.map(g => ({ topic: g.topic, opportunity: g.opportunity_score })))}

Suggest 1-3 digital products that could be auto-generated:
{
  "opportunities": [
    {
      "type": "micro_course|ebook|template|tool|community",
      "title": "...",
      "description": "...",
      "estimatedPrice": number,
      "estimatedRevenue": number,
      "confidence": 0.0-1.0,
      "contentOutline": ["..."]
    }
  ]
}`;

    const result = await this.model.generateContent(prompt);
    const analysis = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);

    for (const opp of analysis.opportunities) {
      await this.pool.query(`
        INSERT INTO yield_opportunities (opportunity_type, topic, estimated_revenue, confidence, action_plan)
        VALUES ($1, $2, $3, $4, $5)
      `, [opp.type, opp.title, opp.estimatedRevenue, opp.confidence, opp]);
      opportunities.push(opp);
    }

    return opportunities;
  }

  // Auto-create a digital product
  async createProduct(userId, opportunityId) {
    const opp = await this.pool.query('SELECT * FROM yield_opportunities WHERE id = $1', [opportunityId]);
    if (!opp.rows[0]) return { success: false, error: 'Opportunity not found' };

    const opportunity = opp.rows[0];
    const actionPlan = opportunity.action_plan;

    // Generate product content
    const contentPrompt = `Create a complete ${actionPlan.type} on: ${actionPlan.title}

Outline:
${actionPlan.contentOutline?.join('\n') || 'Generate based on title'}

Generate the full product content in markdown format.
Make it comprehensive, valuable, and actionable.`;

    const contentResult = await this.model.generateContent(contentPrompt);
    const productContent = contentResult.response.text();

    // Create Stripe product
    const stripeProduct = await this.stripe.products.create({
      name: actionPlan.title,
      description: actionPlan.description
    });

    const stripePrice = await this.stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(actionPlan.estimatedPrice * 100),
      currency: 'usd'
    });

    // Store product
    const product = await this.pool.query(`
      INSERT INTO auto_products
      (user_id, product_type, title, description, content, stripe_product_id, stripe_price_id, price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') RETURNING *
    `, [
      userId,
      actionPlan.type,
      actionPlan.title,
      actionPlan.description,
      { markdown: productContent, outline: actionPlan.contentOutline },
      stripeProduct.id,
      stripePrice.id,
      actionPlan.estimatedPrice
    ]);

    // Update opportunity status
    await this.pool.query('UPDATE yield_opportunities SET status = $1 WHERE id = $2', ['converted', opportunityId]);

    return {
      success: true,
      product: product.rows[0],
      checkoutUrl: `https://nexus-os.ai/checkout/${product.rows[0].id}`
    };
  }

  // Record sale
  async recordSale(productId, amount) {
    await this.pool.query(`
      UPDATE auto_products
      SET sales_count = sales_count + 1, revenue = revenue + $1
      WHERE id = $2
    `, [amount, productId]);
  }
}
```

#### 4.3 ComputeTieringService.js
```javascript
/**
 * NEXUS LEVIATHAN - Compute Tiering
 * Neural intensity-based pricing
 */

class ComputeTieringService {
  constructor(pool, stripeClient) {
    this.pool = pool;
    this.stripe = stripeClient;

    this.tiers = {
      free: { intensityLimit: 0.2, tokensPerDay: 10000, features: ['basic'] },
      creator: { intensityLimit: 0.5, tokensPerDay: 100000, features: ['basic', 'scheduling', 'analytics'] },
      sovereign: { intensityLimit: 0.8, tokensPerDay: 500000, features: ['basic', 'scheduling', 'analytics', 'simulation', 'arbitrage'] },
      leviathan: { intensityLimit: 1.0, tokensPerDay: -1, features: ['*'] } // Unlimited
    };
  }

  // Calculate neural intensity for an operation
  calculateIntensity(operation) {
    const intensityWeights = {
      'content_generate': 0.3,
      'simulation_run': 0.6,
      'video_generate': 0.8,
      'arbitrage_scan': 0.5,
      'philosophy_evolve': 0.7,
      'stealth_browse': 0.4,
      'product_create': 0.9
    };

    return intensityWeights[operation] || 0.3;
  }

  // Check if user can perform operation
  async canPerform(userId, operation) {
    const user = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const tier = user.rows[0]?.subscription_tier || 'free';
    const tierConfig = this.tiers[tier];

    const intensity = this.calculateIntensity(operation);

    if (intensity > tierConfig.intensityLimit) {
      return {
        allowed: false,
        reason: 'intensity_exceeded',
        requiredTier: this.getRequiredTier(intensity)
      };
    }

    // Check daily token usage
    const usage = await this.pool.query(`
      SELECT SUM(tokens_used) as total
      FROM compute_usage
      WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 day'
    `, [userId]);

    if (tierConfig.tokensPerDay > 0 && (usage.rows[0]?.total || 0) >= tierConfig.tokensPerDay) {
      return {
        allowed: false,
        reason: 'token_limit_exceeded',
        requiredTier: this.getNextTier(tier)
      };
    }

    return { allowed: true, intensity, tier };
  }

  // Record compute usage
  async recordUsage(userId, operation, tokensUsed) {
    const intensity = this.calculateIntensity(operation);
    const cost = intensity * tokensUsed * 0.00001; // Example cost calculation

    await this.pool.query(`
      INSERT INTO compute_usage (user_id, operation_type, neural_intensity, tokens_used, compute_cost)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, operation, intensity, tokensUsed, cost]);

    // Check if approaching limit
    const usage = await this.pool.query(`
      SELECT SUM(tokens_used) as total
      FROM compute_usage
      WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 day'
    `, [userId]);

    const user = await this.pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const tier = user.rows[0]?.subscription_tier || 'free';
    const limit = this.tiers[tier].tokensPerDay;

    if (limit > 0 && usage.rows[0]?.total >= limit * 0.8) {
      return { warning: 'approaching_limit', usagePercent: (usage.rows[0].total / limit) * 100 };
    }

    return { recorded: true };
  }

  getRequiredTier(intensity) {
    for (const [tier, config] of Object.entries(this.tiers)) {
      if (config.intensityLimit >= intensity) return tier;
    }
    return 'leviathan';
  }

  getNextTier(currentTier) {
    const tiers = ['free', 'creator', 'sovereign', 'leviathan'];
    const idx = tiers.indexOf(currentTier);
    return tiers[Math.min(idx + 1, tiers.length - 1)];
  }
}
```

---

## IMPLEMENTATION ORDER

```
WEEK 1: CORE SEGP
├── Day 1: Database migrations (all new tables)
├── Day 2: EvolverService + SchedulerService
├── Day 3: EventBusService + integration
├── Day 4: Connect WorkflowService to real agents
└── Day 5: Testing & fixes

WEEK 2: INTELLIGENCE LAYER
├── Day 1-2: AttentionArbitrageService
├── Day 3-4: SyntheticSimulatorService
├── Day 5: FeedbackLedgerService
└── Day 6-7: PhilosophyRewriterService

WEEK 3: GHOST PROTOCOL
├── Day 1-2: StealthBrowserService
├── Day 3: ProxyMeshService
├── Day 4: RateLimiterService
└── Day 5: Integration testing

WEEK 4: REVENUE ENGINE
├── Day 1-2: AffiliateMeshService
├── Day 3-4: YieldHarvesterService
├── Day 5: ComputeTieringService
└── Day 6-7: Full system integration

WEEK 5: HARDENING
├── Day 1-3: Edge cases & error handling
├── Day 4-5: Performance optimization
└── Day 6-7: Documentation & deployment
```

---

## API ENDPOINTS TO ADD

```javascript
// Attention Arbitrage
app.get('/api/arbitrage/gaps', auth, async (req, res) => {});
app.post('/api/arbitrage/campaigns', auth, async (req, res) => {});
app.post('/api/arbitrage/scan', auth, async (req, res) => {});

// Synthetic Simulator
app.post('/api/simulate', auth, async (req, res) => {});
app.post('/api/simulate/:id/actual', auth, async (req, res) => {});

// Feedback Ledger
app.post('/api/ledger/record', auth, async (req, res) => {});
app.get('/api/ledger/patterns', auth, async (req, res) => {});

// Philosophy
app.get('/api/philosophy/rules', auth, async (req, res) => {});
app.post('/api/philosophy/evolve', auth, async (req, res) => {});

// Ghost Protocol
app.post('/api/ghost/session', auth, async (req, res) => {});
app.post('/api/ghost/action', auth, async (req, res) => {});

// Revenue
app.get('/api/affiliate/stats', auth, async (req, res) => {});
app.post('/api/affiliate/generate', auth, async (req, res) => {});
app.get('/api/yield/opportunities', auth, async (req, res) => {});
app.post('/api/yield/create-product', auth, async (req, res) => {});
```

---

## DEPENDENCIES

```json
{
  "puppeteer-extra": "^3.3.6",
  "puppeteer-extra-plugin-stealth": "^2.11.2",
  "https-proxy-agent": "^7.0.2",
  "cron": "^3.1.6",
  "node-cron": "^3.0.3",
  "crypto": "built-in"
}
```

---

## NOTES

1. **UI UNCHANGED** - All services are backend-only
2. **Existing agents preserved** - New services wrap/enhance them
3. **Database additive** - New tables, no changes to existing
4. **Incremental deployment** - Each layer can go live independently

---

*NEXUS LEVIATHAN - Master Plan v1.0*
*Generated: 2026-01-19*
