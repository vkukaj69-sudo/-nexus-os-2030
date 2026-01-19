/**
 * NEXUS LEVIATHAN - Evolver Service
 * Self-critique loop for output enhancement before delivery
 *
 * Every agent output passes through this service to:
 * 1. Evaluate quality against learned standards
 * 2. Check brand/voice consistency with Digital Soul
 * 3. Apply accumulated improvements
 * 4. Optionally regenerate with enhancements
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class EvolverService {
  constructor(pool, memoryService, config = {}) {
    this.pool = pool;
    this.memory = memoryService;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    this.maxIterations = config.maxIterations || 3;
    this.qualityThreshold = config.qualityThreshold || 0.85;
  }

  /**
   * Main evolution loop - critiques and improves output
   * @param {number} userId - User ID
   * @param {string} agentId - Agent that produced the output
   * @param {string|object} output - The output to evolve
   * @param {object} context - Additional context (platform, content type, etc)
   * @returns {object} Evolution result with original and evolved output
   */
  async evolve(userId, agentId, output, context = {}) {
    const startTime = Date.now();

    // 1. Get user's Digital Soul for voice consistency
    const soul = await this.getSoul(userId);

    // 2. Get active improvements for this agent
    const improvements = await this.getActiveImprovements(userId, agentId);

    // 3. Get philosophy rules that apply
    const philosophyRules = await this.getApplicablePhilosophy(userId, context);

    // 4. Self-critique loop
    let current = typeof output === 'string' ? output : JSON.stringify(output);
    let iterations = 0;
    const evolutionLog = [];

    while (iterations < this.maxIterations) {
      const critique = await this.critique(current, soul, improvements, philosophyRules, context);
      evolutionLog.push({
        iteration: iterations + 1,
        score: critique.score,
        issues: critique.issues,
        suggestions: critique.suggestions,
        voiceConsistency: critique.voiceConsistency
      });

      // If quality is good enough, stop
      if (critique.score >= this.qualityThreshold || !critique.shouldImprove) {
        break;
      }

      // Regenerate with improvements
      current = await this.regenerate(current, critique.suggestions, soul, context);
      iterations++;
    }

    // 5. Log evolution for learning
    await this.logEvolution(userId, agentId, output, current, evolutionLog, Date.now() - startTime);

    // 6. Update improvement effectiveness based on usage
    await this.updateImprovementStats(improvements, evolutionLog);

    return {
      original: output,
      evolved: current,
      iterations,
      evolutionLog,
      finalScore: evolutionLog[evolutionLog.length - 1]?.score || 0,
      executionTimeMs: Date.now() - startTime
    };
  }

  /**
   * Critique output quality
   */
  async critique(output, soul, improvements, philosophyRules, context) {
    const prompt = `You are a quality assurance system. Critique this AI output for quality and consistency.

OUTPUT TO EVALUATE:
${output}

CREATOR VOICE PROFILE (Digital Soul):
${soul ? `
- Archetype: ${soul.dna_signature?.archetype || 'Not defined'}
- Core Values: ${JSON.stringify(soul.dna_signature?.coreValues || [])}
- Semantic Fingerprint: ${soul.semantic_fingerprint || 'Not defined'}
- Communication Style: ${soul.dna_signature?.communicationStyle || 'Not defined'}
` : 'No Digital Soul defined - use general best practices'}

LEARNED IMPROVEMENTS TO APPLY:
${improvements.length > 0 ? improvements.map(i => `- ${i.improvement} (effectiveness: ${(i.effectiveness * 100).toFixed(0)}%)`).join('\n') : 'None - this is a new user'}

ACTIVE PHILOSOPHY RULES:
${philosophyRules.length > 0 ? philosophyRules.map(r => `- ${r.rule_type}: ${JSON.stringify(r.action)}`).join('\n') : 'None'}

CONTEXT:
- Platform: ${context.platform || 'general'}
- Content Type: ${context.contentType || 'general'}
- Goal: ${context.goal || 'engagement'}

Evaluate the output on:
1. Quality (clarity, value, actionability)
2. Voice consistency with the creator's soul
3. Platform appropriateness
4. Potential issues or red flags
5. Specific improvements to make

Return ONLY valid JSON (no markdown):
{
  "score": 0.0-1.0,
  "shouldImprove": boolean,
  "issues": ["specific issues found"],
  "suggestions": ["specific actionable improvements"],
  "voiceConsistency": 0.0-1.0,
  "platformFit": 0.0-1.0,
  "strengths": ["what's working well"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          score: 0.7,
          shouldImprove: false,
          issues: [],
          suggestions: [],
          voiceConsistency: 0.7,
          platformFit: 0.7,
          strengths: []
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[Evolver] Critique failed:', error.message);
      return {
        score: 0.7,
        shouldImprove: false,
        issues: ['Critique evaluation failed'],
        suggestions: [],
        voiceConsistency: 0.7,
        platformFit: 0.7,
        strengths: []
      };
    }
  }

  /**
   * Regenerate output with improvements
   */
  async regenerate(output, suggestions, soul, context) {
    const prompt = `Improve this content based on the suggestions while maintaining the creator's voice.

ORIGINAL CONTENT:
${output}

IMPROVEMENTS TO MAKE:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

CREATOR VOICE TO MAINTAIN:
${soul ? `
- Tone: ${soul.dna_signature?.communicationStyle || 'professional'}
- Values: ${JSON.stringify(soul.dna_signature?.coreValues || [])}
` : 'Use professional, engaging tone'}

PLATFORM: ${context.platform || 'general'}

Return ONLY the improved content, maintaining the same format as the original. Do not add any explanation or meta-commentary.`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('[Evolver] Regeneration failed:', error.message);
      return output; // Return original if regeneration fails
    }
  }

  /**
   * Get user's Digital Soul
   */
  async getSoul(userId) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM digital_soul WHERE user_id = $1',
        [userId]
      );

      if (result.rows[0]) {
        const soul = result.rows[0];
        // Parse dna_signature if it's a string
        if (typeof soul.dna_signature === 'string') {
          soul.dna_signature = JSON.parse(soul.dna_signature);
        }
        return soul;
      }
      return null;
    } catch (error) {
      console.error('[Evolver] Failed to get soul:', error.message);
      return null;
    }
  }

  /**
   * Get active improvements for user/agent
   */
  async getActiveImprovements(userId, agentId) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM improvements
        WHERE user_id = $1
          AND (agent_id = $2 OR agent_id IS NULL)
          AND active = true
          AND effectiveness > 0.3
        ORDER BY effectiveness DESC
        LIMIT 10
      `, [userId, agentId]);

      return result.rows;
    } catch (error) {
      console.error('[Evolver] Failed to get improvements:', error.message);
      return [];
    }
  }

  /**
   * Get applicable philosophy rules
   */
  async getApplicablePhilosophy(userId, context) {
    try {
      const result = await this.pool.query(`
        SELECT * FROM philosophy_rules
        WHERE user_id = $1
          AND is_active = true
          AND confidence > 0.4
        ORDER BY success_rate DESC
        LIMIT 5
      `, [userId]);

      // Filter rules that match context
      return result.rows.filter(rule => {
        const condition = rule.condition || {};
        for (const [key, value] of Object.entries(condition)) {
          if (context[key] && context[key] !== value) {
            return false;
          }
        }
        return true;
      });
    } catch (error) {
      console.error('[Evolver] Failed to get philosophy:', error.message);
      return [];
    }
  }

  /**
   * Log evolution for learning
   */
  async logEvolution(userId, agentId, original, evolved, log, executionTime) {
    try {
      // Store as episodic memory if memory service available
      if (this.memory && this.memory.storeEpisodic) {
        await this.memory.storeEpisodic(userId, {
          agentId: agentId || 'evolver',
          interactionType: 'evolution',
          input: typeof original === 'string' ? original.substring(0, 500) : JSON.stringify(original).substring(0, 500),
          output: evolved.substring(0, 500),
          outcome: log[log.length - 1]?.score >= this.qualityThreshold ? 'success' : 'partial',
          context: {
            evolutionLog: log,
            iterations: log.length,
            executionTimeMs: executionTime
          }
        });
      }
    } catch (error) {
      console.error('[Evolver] Failed to log evolution:', error.message);
    }
  }

  /**
   * Update improvement effectiveness based on evolution results
   */
  async updateImprovementStats(improvements, evolutionLog) {
    if (improvements.length === 0 || evolutionLog.length === 0) return;

    const finalScore = evolutionLog[evolutionLog.length - 1]?.score || 0;
    const improved = finalScore >= this.qualityThreshold;

    try {
      for (const imp of improvements) {
        // Exponential moving average for effectiveness
        await this.pool.query(`
          UPDATE improvements
          SET times_applied = times_applied + 1,
              effectiveness = effectiveness * 0.9 + $1 * 0.1,
              updated_at = NOW()
          WHERE id = $2
        `, [improved ? 1.0 : 0.0, imp.id]);
      }
    } catch (error) {
      console.error('[Evolver] Failed to update improvement stats:', error.message);
    }
  }

  /**
   * Quick evolution - single pass, no iteration
   * Use for time-sensitive operations
   */
  async quickEvolve(userId, agentId, output, context = {}) {
    const soul = await this.getSoul(userId);
    const improvements = await this.getActiveImprovements(userId, agentId);

    const critique = await this.critique(
      typeof output === 'string' ? output : JSON.stringify(output),
      soul,
      improvements,
      [],
      context
    );

    if (critique.score >= this.qualityThreshold) {
      return { evolved: output, score: critique.score, improved: false };
    }

    const evolved = await this.regenerate(output, critique.suggestions, soul, context);
    return { evolved, score: critique.score, improved: true, suggestions: critique.suggestions };
  }

  /**
   * Batch evolve multiple outputs
   */
  async batchEvolve(userId, agentId, outputs, context = {}) {
    const results = [];

    for (const output of outputs) {
      const result = await this.quickEvolve(userId, agentId, output, context);
      results.push(result);
    }

    return results;
  }
}

module.exports = EvolverService;
