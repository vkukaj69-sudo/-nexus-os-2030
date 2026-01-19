/**
 * NEXUS LEVIATHAN - Attention Arbitrage Engine
 * Discovers and exploits attention gaps across platforms
 *
 * The system scans for topics with:
 * - High search volume
 * - Low competition
 * - Poor existing content quality
 *
 * Then creates targeted campaigns to dominate those gaps.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class AttentionArbitrageService {
  constructor(pool, scryerAgent, config = {}) {
    this.pool = pool;
    this.scryer = scryerAgent;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    this.platforms = config.platforms || ['twitter', 'reddit', 'linkedin', 'youtube', 'tiktok'];
  }

  /**
   * Scan all platforms for attention gaps
   */
  async discoverGaps(userId = null, niche = null) {
    console.log('[Arbitrage] Starting gap discovery scan...');
    const gaps = [];

    for (const platform of this.platforms) {
      try {
        // Get trending topics via Scryer agent
        let trends = [];

        if (this.scryer) {
          const trendResult = await this.scryer.execute({
            type: 'trend_analysis',
            payload: { platform, timeframe: '24h', niche }
          });
          trends = trendResult?.topics || trendResult?.trends || [];
        }

        // If no Scryer or no trends, use AI to generate potential gaps
        if (trends.length === 0) {
          trends = await this.generatePotentialTopics(platform, niche);
        }

        // Analyze each trend for opportunity
        for (const trend of trends.slice(0, 10)) { // Limit to top 10 per platform
          const analysis = await this.analyzeOpportunity(
            typeof trend === 'string' ? { name: trend } : trend,
            platform
          );

          if (analysis && analysis.opportunityScore > 0.5) {
            gaps.push(analysis);
          }
        }
      } catch (error) {
        console.error(`[Arbitrage] Error scanning ${platform}:`, error.message);
      }
    }

    // Store discovered gaps
    for (const gap of gaps) {
      await this.storeGap(gap);
    }

    console.log(`[Arbitrage] Discovered ${gaps.length} attention gaps`);
    return gaps;
  }

  /**
   * Generate potential topic gaps using AI
   */
  async generatePotentialTopics(platform, niche = null) {
    const prompt = `Generate 5 trending or emerging topics on ${platform} that likely have:
1. High search interest
2. Low-quality existing content
3. Opportunity for a creator to dominate

${niche ? `Focus on niche: ${niche}` : 'Consider general high-value topics'}

Return JSON array only:
["topic1", "topic2", "topic3", "topic4", "topic5"]`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Analyze a single topic for opportunity
   */
  async analyzeOpportunity(topic, platform) {
    const topicName = typeof topic === 'string' ? topic : (topic.name || topic.topic || topic.title);

    const prompt = `Analyze this topic for content opportunity on ${platform}.

Topic: ${topicName}
Platform: ${platform}

Evaluate:
1. Estimated monthly search volume (rough number)
2. Competition level (how many quality creators covering this, 0-1)
3. Content quality (quality of existing content, 0-1 where 1 is excellent)
4. Keywords to target
5. Unique angle a creator could take

Return ONLY valid JSON (no markdown):
{
  "searchVolume": number,
  "competition": 0.0-1.0,
  "quality": 0.0-1.0,
  "keywords": ["keyword1", "keyword2"],
  "angle": "unique angle description",
  "urgency": "low|medium|high",
  "reasoning": "why this is an opportunity"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) return null;

      const analysis = JSON.parse(jsonMatch[0]);

      // Calculate opportunity score
      // High volume + low competition + low quality = high opportunity
      const opportunityScore = analysis.searchVolume > 0
        ? Math.min(1, (analysis.searchVolume / 100000)) * (1 - analysis.competition) * (1 - analysis.quality)
        : (1 - analysis.competition) * (1 - analysis.quality);

      return {
        topic: topicName,
        platform,
        searchVolume: analysis.searchVolume || 1000,
        competition: analysis.competition,
        quality: analysis.quality,
        keywords: analysis.keywords || [],
        angle: analysis.angle,
        urgency: analysis.urgency,
        reasoning: analysis.reasoning,
        opportunityScore: Math.round(opportunityScore * 100) / 100
      };
    } catch (error) {
      console.error(`[Arbitrage] Analysis failed for ${topicName}:`, error.message);
      return null;
    }
  }

  /**
   * Store discovered gap in database
   */
  async storeGap(gap) {
    try {
      // Check if similar gap exists
      const existing = await this.pool.query(`
        SELECT id FROM attention_gaps
        WHERE topic ILIKE $1 AND platform = $2 AND status = 'active'
      `, [`%${gap.topic.substring(0, 50)}%`, gap.platform]);

      if (existing.rows.length > 0) {
        // Update existing
        await this.pool.query(`
          UPDATE attention_gaps
          SET search_volume = $1, competition_score = $2, quality_score = $3,
              keywords = $4, expires_at = NOW() + INTERVAL '7 days'
          WHERE id = $5
        `, [gap.searchVolume, gap.competition, gap.quality, JSON.stringify(gap.keywords), existing.rows[0].id]);

        return existing.rows[0].id;
      }

      // Insert new
      const result = await this.pool.query(`
        INSERT INTO attention_gaps
        (topic, platform, search_volume, competition_score, quality_score, keywords)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [gap.topic, gap.platform, gap.searchVolume, gap.competition, gap.quality, JSON.stringify(gap.keywords)]);

      return result.rows[0].id;
    } catch (error) {
      console.error('[Arbitrage] Failed to store gap:', error.message);
      return null;
    }
  }

  /**
   * Get top opportunities for a user
   */
  async getTopOpportunities(userId, limit = 10, platform = null) {
    let query = `
      SELECT * FROM attention_gaps
      WHERE status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
    `;
    const params = [];

    if (platform) {
      params.push(platform);
      query += ` AND platform = $${params.length}`;
    }

    query += ` ORDER BY opportunity_score DESC NULLS LAST LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Create a campaign to exploit an opportunity
   */
  async createCampaign(userId, gapId) {
    // Get the gap
    const gap = await this.pool.query('SELECT * FROM attention_gaps WHERE id = $1', [gapId]);
    if (!gap.rows[0]) {
      return { success: false, error: 'Gap not found' };
    }

    const gapData = gap.rows[0];

    // Generate campaign strategy
    const strategy = await this.generateStrategy(gapData);

    // Create campaign record
    const result = await this.pool.query(`
      INSERT INTO arbitrage_campaigns (user_id, gap_id, strategy, status)
      VALUES ($1, $2, $3, 'planning')
      RETURNING *
    `, [userId, gapId, strategy]);

    // Mark gap as being exploited
    await this.pool.query(
      'UPDATE attention_gaps SET status = $1 WHERE id = $2',
      ['exploited', gapId]
    );

    return {
      success: true,
      campaign: result.rows[0],
      strategy
    };
  }

  /**
   * Generate campaign strategy for a gap
   */
  async generateStrategy(gap) {
    const prompt = `Create a 7-day content blitz strategy to dominate this attention gap.

Topic: ${gap.topic}
Platform: ${gap.platform}
Keywords: ${JSON.stringify(gap.keywords || [])}
Competition Level: ${gap.competition_score || 0.5}
Current Content Quality: ${gap.quality_score || 0.5}

Generate a comprehensive strategy with:
1. 5 viral hooks/angles
2. Daily content plan (7 days)
3. Distribution strategy
4. Expected metrics

Return ONLY valid JSON:
{
  "hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"],
  "contentPlan": [
    {"day": 1, "type": "post|thread|video|story", "angle": "...", "cta": "...", "bestTime": "HH:MM"}
  ],
  "distribution": {
    "primary": "${gap.platform}",
    "secondary": ["platform1", "platform2"],
    "hashtags": ["#tag1", "#tag2"],
    "communities": ["community1"]
  },
  "expectedMetrics": {
    "reach": number,
    "engagement": number,
    "followers": number
  },
  "uniqueAngle": "what makes this campaign different"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return { error: 'Failed to generate strategy' };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[Arbitrage] Strategy generation failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get user's campaigns
   */
  async getUserCampaigns(userId, status = null) {
    let query = `
      SELECT ac.*, ag.topic, ag.platform, ag.opportunity_score
      FROM arbitrage_campaigns ac
      JOIN attention_gaps ag ON ac.gap_id = ag.id
      WHERE ac.user_id = $1
    `;
    const params = [userId];

    if (status) {
      params.push(status);
      query += ` AND ac.status = $${params.length}`;
    }

    query += ' ORDER BY ac.created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId, userId, status, performance = null) {
    const updates = ['status = $3', 'updated_at = NOW()'];
    const params = [campaignId, userId, status];

    if (performance) {
      params.push(performance);
      updates.push(`performance = $${params.length}`);
    }

    await this.pool.query(`
      UPDATE arbitrage_campaigns
      SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
    `, params);

    return { success: true };
  }

  /**
   * Add content piece to campaign
   */
  async addContentToCampaign(campaignId, userId, content) {
    const campaign = await this.pool.query(
      'SELECT content_pieces FROM arbitrage_campaigns WHERE id = $1 AND user_id = $2',
      [campaignId, userId]
    );

    if (!campaign.rows[0]) {
      return { success: false, error: 'Campaign not found' };
    }

    const pieces = campaign.rows[0].content_pieces || [];
    pieces.push({
      ...content,
      addedAt: new Date().toISOString()
    });

    await this.pool.query(
      'UPDATE arbitrage_campaigns SET content_pieces = $1 WHERE id = $2',
      [JSON.stringify(pieces), campaignId]
    );

    return { success: true, contentCount: pieces.length };
  }

  /**
   * Analyze campaign performance
   */
  async analyzeCampaignPerformance(campaignId, userId) {
    const campaign = await this.pool.query(`
      SELECT ac.*, ag.topic, ag.platform
      FROM arbitrage_campaigns ac
      JOIN attention_gaps ag ON ac.gap_id = ag.id
      WHERE ac.id = $1 AND ac.user_id = $2
    `, [campaignId, userId]);

    if (!campaign.rows[0]) {
      return { success: false, error: 'Campaign not found' };
    }

    const c = campaign.rows[0];

    const prompt = `Analyze this campaign's performance and suggest optimizations.

Topic: ${c.topic}
Platform: ${c.platform}
Strategy: ${JSON.stringify(c.strategy)}
Content Pieces: ${c.content_pieces?.length || 0}
Current Performance: ${JSON.stringify(c.performance || {})}

Provide:
1. Performance assessment
2. What's working
3. What needs improvement
4. Specific next steps

Return JSON:
{
  "assessment": "overall assessment",
  "score": 0-100,
  "working": ["..."],
  "improve": ["..."],
  "nextSteps": ["..."],
  "pivotSuggestion": "if strategy needs major change"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Analysis failed' };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = AttentionArbitrageService;
