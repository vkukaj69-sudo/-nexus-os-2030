/**
 * NEXUS OS - Self-Improvement Service
 * Learning, adaptation, and performance optimization
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class SelfImprovementService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
  }

  cleanJson(text) {
    return text.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');
  }

  // ═══════════════════════════════════════════
  // PERFORMANCE TRACKING
  // ═══════════════════════════════════════════

  async recordMetric(userId, agentId, metricType, value, context = {}) {
    const result = await this.pool.query(`
      INSERT INTO agent_performance (user_id, agent_id, metric_type, value, context)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [userId, agentId, metricType, value, context]);
    return { success: true, metricId: result.rows[0].id };
  }

  async getAgentStats(userId, agentId, days = 30) {
    const result = await this.pool.query(`
      SELECT metric_type, 
             AVG(value) as avg_value,
             MIN(value) as min_value,
             MAX(value) as max_value,
             COUNT(*) as count
      FROM agent_performance 
      WHERE user_id = $1 AND agent_id = $2 
        AND recorded_at > NOW() - INTERVAL '1 day' * $3
      GROUP BY metric_type
    `, [userId, agentId, days]);
    return result.rows;
  }

  async getPerformanceTrend(userId, agentId, metricType, days = 7) {
    const result = await this.pool.query(`
      SELECT DATE(recorded_at) as date, AVG(value) as avg_value
      FROM agent_performance
      WHERE user_id = $1 AND agent_id = $2 AND metric_type = $3
        AND recorded_at > NOW() - INTERVAL '1 day' * $4
      GROUP BY DATE(recorded_at)
      ORDER BY date
    `, [userId, agentId, metricType, days]);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // FEEDBACK SYSTEM
  // ═══════════════════════════════════════════

  async submitFeedback(userId, agentId, data) {
    const { rating, feedbackType = 'general', comment = '', interactionId = null } = data;

    const result = await this.pool.query(`
      INSERT INTO feedback (user_id, agent_id, interaction_id, rating, feedback_type, comment)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [userId, agentId, interactionId, rating, feedbackType, comment]);

    // Record as performance metric
    await this.recordMetric(userId, agentId, 'user_rating', rating, { feedbackType, comment });

    // Trigger learning if rating is low
    if (rating <= 2) {
      await this.learnFromFeedback(userId, agentId, { rating, feedbackType, comment });
    }

    return { success: true, feedbackId: result.rows[0].id };
  }

  async getAgentFeedback(userId, agentId, limit = 20) {
    const result = await this.pool.query(`
      SELECT * FROM feedback 
      WHERE user_id = $1 AND agent_id = $2
      ORDER BY created_at DESC LIMIT $3
    `, [userId, agentId, limit]);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // LEARNING & IMPROVEMENTS
  // ═══════════════════════════════════════════

  async learnFromFeedback(userId, agentId, feedback) {
    const prompt = `Analyze this feedback and suggest an improvement for the AI agent.

Agent: ${agentId}
Rating: ${feedback.rating}/5
Type: ${feedback.feedbackType}
Comment: ${feedback.comment || 'No comment'}

Return JSON only:
{"improvement": "specific actionable improvement", "triggerPattern": "when to apply this", "type": "prompt_adjustment|behavior_rule|preference"}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = this.cleanJson(result.response.text());
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, error: 'Failed to generate improvement' };

      const learning = JSON.parse(jsonMatch[0]);

      const impResult = await this.pool.query(`
        INSERT INTO improvements (user_id, agent_id, improvement_type, trigger_pattern, improvement, source)
        VALUES ($1, $2, $3, $4, $5, 'feedback') RETURNING id
      `, [userId, agentId, learning.type || 'behavior_rule', learning.triggerPattern, learning.improvement]);

      return { success: true, improvementId: impResult.rows[0].id, learning };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getActiveImprovements(userId, agentId = null) {
    let query = 'SELECT * FROM improvements WHERE user_id = $1 AND active = true';
    const params = [userId];
    if (agentId) { query += ' AND (agent_id = $2 OR agent_id IS NULL)'; params.push(agentId); }
    query += ' ORDER BY effectiveness DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async applyImprovement(improvementId) {
    await this.pool.query(`
      UPDATE improvements SET times_applied = times_applied + 1, updated_at = NOW()
      WHERE id = $1
    `, [improvementId]);
  }

  async updateEffectiveness(improvementId, success) {
    // Exponential moving average
    await this.pool.query(`
      UPDATE improvements 
      SET effectiveness = effectiveness * 0.9 + $2 * 0.1, updated_at = NOW()
      WHERE id = $1
    `, [improvementId, success ? 1.0 : 0.0]);
  }

  // ═══════════════════════════════════════════
  // A/B EXPERIMENTS
  // ═══════════════════════════════════════════

  async createExperiment(userId, data) {
    const { agentId, name, hypothesis, variantA, variantB } = data;

    const result = await this.pool.query(`
      INSERT INTO experiments (user_id, agent_id, name, hypothesis, variant_a, variant_b)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [userId, agentId, name, hypothesis, variantA, variantB]);

    return { success: true, experimentId: result.rows[0].id };
  }

  async recordExperimentResult(experimentId, variant, success) {
    const field = variant === 'a' ? 'results_a' : 'results_b';
    await this.pool.query(`
      UPDATE experiments 
      SET ${field} = jsonb_set(
        jsonb_set(${field}, '{trials}', (COALESCE((${field}->>'trials')::int, 0) + 1)::text::jsonb),
        '{successes}', (COALESCE((${field}->>'successes')::int, 0) + $2)::text::jsonb
      )
      WHERE id = $1
    `, [experimentId, success ? 1 : 0]);
  }

  async concludeExperiment(experimentId) {
    const exp = await this.pool.query('SELECT * FROM experiments WHERE id = $1', [experimentId]);
    if (!exp.rows[0]) return { success: false, error: 'Experiment not found' };

    const { results_a, results_b } = exp.rows[0];
    const rateA = results_a.trials > 0 ? results_a.successes / results_a.trials : 0;
    const rateB = results_b.trials > 0 ? results_b.successes / results_b.trials : 0;
    const winner = rateA >= rateB ? 'a' : 'b';

    await this.pool.query(`
      UPDATE experiments SET status = 'completed', winner = $2, completed_at = NOW()
      WHERE id = $1
    `, [experimentId, winner]);

    return { success: true, winner, rateA, rateB };
  }

  // ═══════════════════════════════════════════
  // SELF-ANALYSIS
  // ═══════════════════════════════════════════

  async analyzePerformance(userId, agentId) {
    const stats = await this.getAgentStats(userId, agentId, 30);
    const feedback = await this.getAgentFeedback(userId, agentId, 10);
    const improvements = await this.getActiveImprovements(userId, agentId);

    const prompt = `Analyze this agent's performance and suggest optimizations.

Stats: ${JSON.stringify(stats)}
Recent Feedback: ${JSON.stringify(feedback.map(f => ({ rating: f.rating, type: f.feedback_type, comment: f.comment })))}
Active Improvements: ${improvements.length}

Return JSON:
{"analysis": "...", "strengths": ["..."], "weaknesses": ["..."], "recommendations": ["..."]}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = this.cleanJson(result.response.text());
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, error: 'Analysis failed' };

      return { success: true, ...JSON.parse(jsonMatch[0]), stats, feedbackCount: feedback.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SelfImprovementService;
