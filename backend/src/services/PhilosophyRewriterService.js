/**
 * NEXUS LEVIATHAN - Philosophy Rewriter Service
 * Meta-learning system that evolves the system's core beliefs
 *
 * The Philosophy Engine:
 * 1. Observes patterns in content performance
 * 2. Extracts rules about what works
 * 3. Updates all agents' behavior based on learned rules
 * 4. Continuously refines its understanding
 *
 * This is the "brain" that makes NEXUS truly self-evolving.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class PhilosophyRewriterService {
  constructor(pool, memoryService, config = {}) {
    this.pool = pool;
    this.memory = memoryService;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });

    // Evolution frequency - how often to trigger auto-evolution
    this.evolutionInterval = config.evolutionInterval || 86400000; // 24 hours
  }

  /**
   * Get current philosophy rules for a user
   */
  async getCurrentPhilosophy(userId) {
    const result = await this.pool.query(`
      SELECT * FROM philosophy_rules
      WHERE user_id = $1 AND is_active = true AND confidence > 0.3
      ORDER BY success_rate DESC, confidence DESC
    `, [userId]);

    return result.rows;
  }

  /**
   * Main evolution function - analyzes data and evolves philosophy
   */
  async evolve(userId, triggerEvent = 'manual') {
    console.log(`[Philosophy] Starting evolution for user ${userId}...`);

    // 1. Get current rules
    const currentRules = await this.getCurrentPhilosophy(userId);

    // 2. Gather performance data
    const performanceData = await this.gatherPerformanceData(userId);

    // 3. Get failed predictions (where we were wrong)
    const failures = await this.getFailedPredictions(userId);

    // 4. Get successful patterns
    const successes = await this.getSuccessfulPatterns(userId);

    // 5. AI analysis for philosophy evolution
    const evolution = await this.analyzeAndEvolve(
      currentRules,
      performanceData,
      failures,
      successes
    );

    // 6. Apply evolution
    await this.applyEvolution(userId, currentRules, evolution);

    // 7. Log evolution
    await this.logEvolution(userId, currentRules, evolution, triggerEvent);

    // 8. Propagate to agents via memory
    await this.propagateToAgents(userId, evolution.newRules || []);

    console.log(`[Philosophy] Evolution complete. ${evolution.newRules?.length || 0} new rules, ${evolution.deprecatedRules?.length || 0} deprecated`);

    return evolution;
  }

  /**
   * Gather performance data for analysis
   */
  async gatherPerformanceData(userId, days = 30) {
    // Content performance by platform
    const platformPerformance = await this.pool.query(`
      SELECT
        cp.platform,
        cp.content_type,
        COUNT(*) as post_count,
        AVG(CASE WHEN fl.metric_type = 'engagement' THEN fl.value END) as avg_engagement,
        AVG(CASE WHEN fl.metric_type = 'likes' THEN fl.value END) as avg_likes,
        AVG(CASE WHEN fl.metric_type = 'shares' THEN fl.value END) as avg_shares
      FROM content_posts cp
      LEFT JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1 AND cp.posted_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY cp.platform, cp.content_type
    `, [userId, days]);

    // Agent performance
    const agentPerformance = await this.pool.query(`
      SELECT
        agent_id,
        metric_type,
        AVG(value) as avg_value,
        COUNT(*) as sample_count
      FROM agent_performance
      WHERE user_id = $1 AND recorded_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY agent_id, metric_type
    `, [userId, days]);

    // Time-based patterns
    const timingPatterns = await this.pool.query(`
      SELECT
        EXTRACT(DOW FROM cp.posted_at) as day_of_week,
        EXTRACT(HOUR FROM cp.posted_at) as hour,
        AVG(CASE WHEN fl.metric_type = 'engagement' THEN fl.value END) as avg_engagement
      FROM content_posts cp
      LEFT JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1 AND cp.posted_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY day_of_week, hour
      HAVING COUNT(*) >= 2
      ORDER BY avg_engagement DESC NULLS LAST
    `, [userId, days]);

    return {
      platformPerformance: platformPerformance.rows,
      agentPerformance: agentPerformance.rows,
      timingPatterns: timingPatterns.rows.slice(0, 10)
    };
  }

  /**
   * Get failed predictions for learning
   */
  async getFailedPredictions(userId, limit = 10) {
    const result = await this.pool.query(`
      SELECT * FROM simulations
      WHERE user_id = $1
        AND accuracy_score IS NOT NULL
        AND accuracy_score < 0.5
      ORDER BY simulated_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * Get successful patterns
   */
  async getSuccessfulPatterns(userId, limit = 10) {
    const result = await this.pool.query(`
      SELECT
        cp.*,
        SUM(CASE WHEN fl.metric_type = 'engagement' THEN fl.value ELSE 0 END) as total_engagement
      FROM content_posts cp
      JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1
      GROUP BY cp.id
      HAVING SUM(CASE WHEN fl.metric_type = 'engagement' THEN fl.value ELSE 0 END) > 0
      ORDER BY total_engagement DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * AI analysis to generate evolution
   */
  async analyzeAndEvolve(currentRules, performance, failures, successes) {
    const prompt = `You are a meta-learning system. Analyze this data and evolve the system's philosophy.

CURRENT PHILOSOPHY RULES:
${currentRules.length > 0 ? JSON.stringify(currentRules.map(r => ({
  id: r.id,
  type: r.rule_type,
  condition: r.condition,
  action: r.action,
  successRate: r.success_rate,
  confidence: r.confidence
})), null, 2) : 'No existing rules'}

PERFORMANCE DATA:
${JSON.stringify(performance, null, 2)}

FAILED PREDICTIONS (where we were wrong):
${failures.length > 0 ? JSON.stringify(failures.map(f => ({
  content: f.content?.substring(0, 200),
  platform: f.platform,
  predicted: f.predicted_metrics,
  actual: f.actual_metrics,
  accuracy: f.accuracy_score
})), null, 2) : 'No failures recorded'}

SUCCESSFUL CONTENT:
${successes.length > 0 ? JSON.stringify(successes.map(s => ({
  platform: s.platform,
  contentType: s.content_type,
  content: s.content?.substring(0, 200),
  engagement: s.total_engagement
})), null, 2) : 'No successes recorded'}

Based on this data, generate philosophy evolution:

1. Which existing rules should have REDUCED confidence (not working)?
2. Which existing rules should have INCREASED confidence (working well)?
3. What NEW rules should be created based on observed patterns?

A philosophy rule defines WHAT the system believes works and WHEN to apply it.

Return ONLY valid JSON:
{
  "insights": ["key insight 1", "key insight 2"],
  "deprecatedRules": ["rule_id_1", "rule_id_2"],
  "boostedRules": ["rule_id_1"],
  "newRules": [
    {
      "ruleType": "content_strategy|platform_preference|timing|tone|topic_selection|engagement|monetization",
      "condition": {"platform": "twitter", "contentType": "thread"},
      "action": {
        "strategy": "description of what to do",
        "parameters": {"key": "value"}
      },
      "reasoning": "why this rule based on data",
      "confidence": 0.6
    }
  ],
  "evolutionSummary": "what changed and why in 2-3 sentences"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return { insights: ['Evolution analysis failed'], newRules: [] };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[Philosophy] Evolution analysis failed:', error.message);
      return { insights: ['Error during evolution'], newRules: [], error: error.message };
    }
  }

  /**
   * Apply the evolution changes
   */
  async applyEvolution(userId, currentRules, evolution) {
    // 1. Reduce confidence of deprecated rules
    for (const ruleId of evolution.deprecatedRules || []) {
      await this.pool.query(`
        UPDATE philosophy_rules
        SET confidence = GREATEST(0.1, confidence * 0.5),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [ruleId, userId]);
    }

    // 2. Boost confidence of successful rules
    for (const ruleId of evolution.boostedRules || []) {
      await this.pool.query(`
        UPDATE philosophy_rules
        SET confidence = LEAST(0.95, confidence * 1.2),
            success_rate = LEAST(1.0, success_rate + 0.1),
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `, [ruleId, userId]);
    }

    // 3. Create new rules
    for (const rule of evolution.newRules || []) {
      // Check if similar rule exists
      const existing = await this.pool.query(`
        SELECT id FROM philosophy_rules
        WHERE user_id = $1
          AND rule_type = $2
          AND condition = $3
      `, [userId, rule.ruleType, rule.condition]);

      if (existing.rows.length === 0) {
        await this.pool.query(`
          INSERT INTO philosophy_rules
          (user_id, rule_type, condition, action, confidence)
          VALUES ($1, $2, $3, $4, $5)
        `, [userId, rule.ruleType, rule.condition, rule.action, rule.confidence || 0.6]);
      }
    }
  }

  /**
   * Log evolution for history
   */
  async logEvolution(userId, oldRules, evolution, triggerEvent) {
    await this.pool.query(`
      INSERT INTO philosophy_evolution_log
      (user_id, old_rules, new_rules, trigger_event, reasoning)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      userId,
      JSON.stringify(oldRules.map(r => ({ id: r.id, type: r.rule_type, confidence: r.confidence }))),
      JSON.stringify(evolution.newRules || []),
      triggerEvent,
      evolution.evolutionSummary || 'No summary'
    ]);
  }

  /**
   * Propagate philosophy changes to agents via memory
   */
  async propagateToAgents(userId, newRules) {
    if (!this.memory) return;

    for (const rule of newRules) {
      try {
        await this.memory.storeSemantic(userId, {
          memoryType: 'philosophy',
          subject: 'nexus_system',
          predicate: `learned_${rule.ruleType}`,
          object: JSON.stringify(rule.action),
          confidence: rule.confidence || 0.6,
          source: 'philosophy_evolution'
        });
      } catch (error) {
        console.error('[Philosophy] Failed to propagate rule:', error.message);
      }
    }
  }

  /**
   * Apply philosophy to a decision context
   */
  async applyPhilosophy(userId, context) {
    const rules = await this.getCurrentPhilosophy(userId);

    // Find rules that match the context
    const applicableRules = rules.filter(r => this.matchesCondition(r.condition, context));

    // Sort by confidence and success rate
    applicableRules.sort((a, b) =>
      (b.confidence * b.success_rate) - (a.confidence * a.success_rate)
    );

    // Update times_applied for used rules
    for (const rule of applicableRules) {
      await this.pool.query(`
        UPDATE philosophy_rules
        SET times_applied = times_applied + 1
        WHERE id = $1
      `, [rule.id]);
    }

    return applicableRules.map(r => ({
      ruleId: r.id,
      ruleType: r.rule_type,
      action: r.action,
      confidence: r.confidence,
      successRate: r.success_rate
    }));
  }

  /**
   * Check if a rule's condition matches the context
   */
  matchesCondition(condition, context) {
    if (!condition || Object.keys(condition).length === 0) {
      return true; // Universal rule
    }

    for (const [key, value] of Object.entries(condition)) {
      if (context[key] === undefined) continue;
      if (context[key] !== value) return false;
    }

    return true;
  }

  /**
   * Record rule outcome for learning
   */
  async recordRuleOutcome(ruleId, success) {
    // Exponential moving average for success rate
    await this.pool.query(`
      UPDATE philosophy_rules
      SET success_rate = success_rate * 0.9 + $1 * 0.1,
          times_applied = times_applied + 1,
          updated_at = NOW()
      WHERE id = $2
    `, [success ? 1.0 : 0.0, ruleId]);
  }

  /**
   * Create a manual rule
   */
  async createRule(userId, data) {
    const { ruleType, condition, action, confidence = 0.7 } = data;

    const result = await this.pool.query(`
      INSERT INTO philosophy_rules
      (user_id, rule_type, condition, action, confidence)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, ruleType, condition, action, confidence]);

    return { success: true, rule: result.rows[0] };
  }

  /**
   * Delete a rule
   */
  async deleteRule(ruleId, userId) {
    await this.pool.query(
      'DELETE FROM philosophy_rules WHERE id = $1 AND user_id = $2',
      [ruleId, userId]
    );
    return { success: true };
  }

  /**
   * Get evolution history
   */
  async getEvolutionHistory(userId, limit = 10) {
    const result = await this.pool.query(`
      SELECT * FROM philosophy_evolution_log
      WHERE user_id = $1
      ORDER BY evolved_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * Get philosophy summary for display
   */
  async getPhilosophySummary(userId) {
    const rules = await this.getCurrentPhilosophy(userId);
    const history = await this.getEvolutionHistory(userId, 5);

    // Group by rule type
    const byType = {};
    for (const rule of rules) {
      if (!byType[rule.rule_type]) {
        byType[rule.rule_type] = [];
      }
      byType[rule.rule_type].push({
        action: rule.action,
        confidence: rule.confidence,
        successRate: rule.success_rate
      });
    }

    return {
      totalRules: rules.length,
      byType,
      recentEvolutions: history.length,
      lastEvolution: history[0]?.evolved_at || null,
      topRules: rules.slice(0, 5).map(r => ({
        type: r.rule_type,
        action: r.action?.strategy || JSON.stringify(r.action).substring(0, 100),
        effectiveness: Math.round(r.confidence * r.success_rate * 100)
      }))
    };
  }
}

module.exports = PhilosophyRewriterService;
