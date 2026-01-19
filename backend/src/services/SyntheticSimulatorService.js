/**
 * NEXUS LEVIATHAN - Synthetic Persona Simulator
 * Tests content against AI-generated personas before publishing
 *
 * Predicts:
 * - Engagement probability
 * - Viral potential
 * - Sentiment distribution
 * - Potential comments/reactions
 *
 * Then validates predictions against real results to improve accuracy.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class SyntheticSimulatorService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    this.defaultPersonaCount = config.personaCount || 1000;
  }

  /**
   * Generate a pool of diverse synthetic personas
   */
  async generatePersonaPool(count = 100) {
    console.log(`[Simulator] Generating ${count} synthetic personas...`);

    const archetypes = [
      'tech_enthusiast', 'skeptic', 'early_adopter', 'casual_scroller',
      'influencer', 'business_owner', 'student', 'professional',
      'creator', 'investor', 'critic', 'superfan', 'lurker', 'troll'
    ];

    const demographics = [
      { ageRange: '18-24', income: 'low', education: 'some_college' },
      { ageRange: '25-34', income: 'medium', education: 'bachelors' },
      { ageRange: '35-44', income: 'high', education: 'masters' },
      { ageRange: '45-54', income: 'high', education: 'bachelors' },
      { ageRange: '55+', income: 'medium', education: 'various' }
    ];

    const generated = [];

    // Generate in batches for efficiency
    const batchSize = 10;
    for (let i = 0; i < count; i += batchSize) {
      const batch = await this.generatePersonaBatch(
        Math.min(batchSize, count - i),
        archetypes,
        demographics
      );
      generated.push(...batch);
    }

    console.log(`[Simulator] Generated ${generated.length} personas`);
    return generated;
  }

  /**
   * Generate a batch of personas
   */
  async generatePersonaBatch(count, archetypes, demographics) {
    const personas = [];

    for (let i = 0; i < count; i++) {
      const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      const demo = demographics[Math.floor(Math.random() * demographics.length)];

      const prompt = `Generate a detailed synthetic persona for social media content testing.

Archetype: ${archetype}
Age Range: ${demo.ageRange}
Income Level: ${demo.income}
Education: ${demo.education}

Create a realistic persona with specific traits. Return ONLY valid JSON:
{
  "psychographics": {
    "values": ["value1", "value2", "value3"],
    "interests": ["interest1", "interest2", "interest3"],
    "painPoints": ["pain1", "pain2"],
    "aspirations": ["aspiration1", "aspiration2"],
    "fears": ["fear1"]
  },
  "behaviorPatterns": {
    "scrollSpeed": "fast|medium|slow",
    "engagementThreshold": 0.0-1.0,
    "shareThreshold": 0.0-1.0,
    "commentTriggers": ["trigger1", "trigger2"],
    "peakActivityHours": [9, 12, 18, 21]
  },
  "engagementWeights": {
    "humor": 0.0-1.0,
    "controversy": 0.0-1.0,
    "education": 0.0-1.0,
    "inspiration": 0.0-1.0,
    "fear": 0.0-1.0,
    "curiosity": 0.0-1.0,
    "outrage": 0.0-1.0,
    "nostalgia": 0.0-1.0
  }
}`;

      try {
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const persona = JSON.parse(jsonMatch[0]);

          // Store in database
          const dbResult = await this.pool.query(`
            INSERT INTO synthetic_personas
            (archetype, demographics, psychographics, behavior_patterns, engagement_weights)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [
            archetype,
            demo,
            persona.psychographics,
            persona.behaviorPatterns,
            persona.engagementWeights
          ]);

          personas.push({
            id: dbResult.rows[0].id,
            archetype,
            demographics: demo,
            ...persona
          });
        }
      } catch (error) {
        console.error('[Simulator] Persona generation failed:', error.message);
      }
    }

    return personas;
  }

  /**
   * Simulate content against persona pool
   */
  async simulate(userId, content, platform, options = {}) {
    const personaCount = options.personaCount || this.defaultPersonaCount;
    const contentType = options.contentType || 'post';

    console.log(`[Simulator] Running simulation with ${personaCount} personas...`);

    // Get random personas from pool
    const personas = await this.pool.query(`
      SELECT * FROM synthetic_personas
      ORDER BY RANDOM()
      LIMIT $1
    `, [Math.min(personaCount, 100)]); // Batch for efficiency

    if (personas.rows.length === 0) {
      // Generate personas if none exist
      await this.generatePersonaPool(50);
      return this.simulate(userId, content, platform, options);
    }

    // Run batch simulation
    const simulation = await this.runBatchSimulation(
      content,
      platform,
      contentType,
      personas.rows
    );

    // Scale results to requested persona count
    const scaleFactor = personaCount / personas.rows.length;
    const scaledMetrics = this.scaleMetrics(simulation.aggregateMetrics, scaleFactor, personaCount);

    // Store simulation
    const simRecord = await this.pool.query(`
      INSERT INTO simulations
      (user_id, content_type, content, platform, persona_count, results, predicted_metrics)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      userId,
      contentType,
      content.substring(0, 5000),
      platform,
      personaCount,
      simulation,
      scaledMetrics
    ]);

    return {
      simulationId: simRecord.rows[0].id,
      personaCount,
      platform,
      ...simulation,
      scaledMetrics,
      recommendations: simulation.improvements || []
    };
  }

  /**
   * Run simulation against batch of personas
   */
  async runBatchSimulation(content, platform, contentType, personas) {
    const prompt = `Simulate how these ${personas.length} diverse personas would react to this ${contentType} on ${platform}.

CONTENT TO TEST:
${content}

PLATFORM: ${platform}

PERSONA PROFILES:
${JSON.stringify(personas.slice(0, 20).map(p => ({
  archetype: p.archetype,
  values: p.psychographics?.values,
  weights: p.engagement_weights,
  threshold: p.behavior_patterns?.engagementThreshold
})), null, 2)}

For each persona archetype, predict their reaction. Then aggregate the results.

Return ONLY valid JSON:
{
  "personaReactions": [
    {
      "archetype": "string",
      "stopScroll": 0.0-1.0,
      "engage": 0.0-1.0,
      "share": 0.0-1.0,
      "sentiment": "positive|neutral|negative",
      "likelyComment": "example comment or null",
      "reasoning": "why they react this way"
    }
  ],
  "aggregateMetrics": {
    "avgStopScroll": 0.0-1.0,
    "avgEngagement": 0.0-1.0,
    "avgShare": 0.0-1.0,
    "viralProbability": 0.0-1.0,
    "sentimentBreakdown": {
      "positive": 0.0-1.0,
      "neutral": 0.0-1.0,
      "negative": 0.0-1.0
    }
  },
  "topComments": ["likely comment 1", "likely comment 2", "likely comment 3"],
  "concerns": ["potential issue 1", "potential issue 2"],
  "improvements": ["suggestion 1", "suggestion 2"],
  "bestPostTime": "HH:MM format",
  "viralFactors": ["what could make this go viral"],
  "riskFactors": ["what could cause backlash"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return this.getDefaultSimulation();
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[Simulator] Batch simulation failed:', error.message);
      return this.getDefaultSimulation();
    }
  }

  /**
   * Scale metrics to full persona count
   */
  scaleMetrics(metrics, scaleFactor, totalPersonas) {
    return {
      estimatedReach: Math.round(metrics.avgStopScroll * totalPersonas * 100),
      estimatedEngagements: Math.round(metrics.avgEngagement * totalPersonas * 10),
      estimatedShares: Math.round(metrics.avgShare * totalPersonas * 5),
      estimatedComments: Math.round(metrics.avgEngagement * totalPersonas * 2),
      viralProbability: Math.round(metrics.viralProbability * 100),
      sentimentBreakdown: metrics.sentimentBreakdown
    };
  }

  /**
   * Default simulation result for errors
   */
  getDefaultSimulation() {
    return {
      personaReactions: [],
      aggregateMetrics: {
        avgStopScroll: 0.5,
        avgEngagement: 0.3,
        avgShare: 0.1,
        viralProbability: 0.2,
        sentimentBreakdown: { positive: 0.4, neutral: 0.4, negative: 0.2 }
      },
      topComments: [],
      concerns: ['Simulation could not complete'],
      improvements: ['Try again with different content'],
      bestPostTime: '10:00',
      viralFactors: [],
      riskFactors: []
    };
  }

  /**
   * Record actual results and calculate accuracy
   */
  async recordActualResults(simulationId, actualMetrics) {
    const sim = await this.pool.query(
      'SELECT * FROM simulations WHERE id = $1',
      [simulationId]
    );

    if (!sim.rows[0]) {
      return { success: false, error: 'Simulation not found' };
    }

    const predicted = sim.rows[0].predicted_metrics;
    const accuracy = this.calculateAccuracy(predicted, actualMetrics);

    await this.pool.query(`
      UPDATE simulations
      SET actual_metrics = $1, accuracy_score = $2
      WHERE id = $3
    `, [actualMetrics, accuracy, simulationId]);

    // If accuracy is low, trigger persona weight adjustment
    if (accuracy < 0.5) {
      await this.adjustPersonaWeights(sim.rows[0], predicted, actualMetrics);
    }

    return {
      success: true,
      accuracy,
      predicted,
      actual: actualMetrics,
      delta: this.calculateDelta(predicted, actualMetrics)
    };
  }

  /**
   * Calculate prediction accuracy
   */
  calculateAccuracy(predicted, actual) {
    const metrics = ['estimatedReach', 'estimatedEngagements', 'viralProbability'];
    let totalError = 0;
    let validMetrics = 0;

    for (const m of metrics) {
      const p = predicted[m] || 0;
      const a = actual[m] || 0;

      if (p > 0 || a > 0) {
        const error = Math.abs(p - a) / Math.max(p, a, 1);
        totalError += error;
        validMetrics++;
      }
    }

    return validMetrics > 0 ? Math.max(0, 1 - (totalError / validMetrics)) : 0.5;
  }

  /**
   * Calculate delta between predicted and actual
   */
  calculateDelta(predicted, actual) {
    const delta = {};
    for (const [key, value] of Object.entries(predicted)) {
      if (typeof value === 'number' && actual[key] !== undefined) {
        delta[key] = actual[key] - value;
      }
    }
    return delta;
  }

  /**
   * Adjust persona weights based on prediction errors
   */
  async adjustPersonaWeights(simulation, predicted, actual) {
    console.log('[Simulator] Adjusting persona weights based on prediction error');

    // This is the meta-learning component
    // Analyze what types of personas were over/under-predicted

    const prompt = `Analyze this prediction error and suggest persona adjustments.

Content: ${simulation.content?.substring(0, 500)}
Platform: ${simulation.platform}

Predicted: ${JSON.stringify(predicted)}
Actual: ${JSON.stringify(actual)}

What persona engagement weights should be adjusted?
Return JSON:
{
  "adjustments": [
    {"archetype": "...", "weight": "...", "direction": "increase|decrease", "amount": 0.1-0.3}
  ],
  "insight": "why the prediction was off"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const adjustments = JSON.parse(jsonMatch[0]);

        // Apply adjustments to persona pool
        for (const adj of adjustments.adjustments || []) {
          await this.pool.query(`
            UPDATE synthetic_personas
            SET engagement_weights = jsonb_set(
              engagement_weights,
              $1,
              to_jsonb(GREATEST(0, LEAST(1,
                COALESCE((engagement_weights->>$2)::float, 0.5) ${adj.direction === 'increase' ? '+' : '-'} $3
              )))
            )
            WHERE archetype = $4
          `, [`{${adj.weight}}`, adj.weight, adj.amount, adj.archetype]);
        }

        console.log('[Simulator] Applied', adjustments.adjustments?.length || 0, 'persona adjustments');
      }
    } catch (error) {
      console.error('[Simulator] Weight adjustment failed:', error.message);
    }
  }

  /**
   * Get simulation history for a user
   */
  async getSimulationHistory(userId, limit = 20) {
    const result = await this.pool.query(`
      SELECT id, platform, content_type, persona_count,
             predicted_metrics, actual_metrics, accuracy_score, simulated_at
      FROM simulations
      WHERE user_id = $1
      ORDER BY simulated_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * Get simulation accuracy stats
   */
  async getAccuracyStats(userId) {
    const result = await this.pool.query(`
      SELECT
        platform,
        COUNT(*) as total_simulations,
        AVG(accuracy_score) as avg_accuracy,
        MIN(accuracy_score) as min_accuracy,
        MAX(accuracy_score) as max_accuracy
      FROM simulations
      WHERE user_id = $1 AND accuracy_score IS NOT NULL
      GROUP BY platform
    `, [userId]);

    return result.rows;
  }

  /**
   * Quick simulation - faster, less detailed
   */
  async quickSimulate(content, platform) {
    const prompt = `Quick viral potential check for this ${platform} content:

"${content.substring(0, 1000)}"

Return JSON only:
{
  "viralScore": 0-100,
  "stopScrollProbability": 0.0-1.0,
  "sentiment": "positive|neutral|negative",
  "topConcern": "main issue if any",
  "quickFix": "one improvement"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { viralScore: 50 };
    } catch {
      return { viralScore: 50, error: 'Quick simulation failed' };
    }
  }
}

module.exports = SyntheticSimulatorService;
