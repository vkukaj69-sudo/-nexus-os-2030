/**
 * NEXUS LEVIATHAN - Feedback Ledger Service
 * Cross-platform engagement tracking and analysis
 *
 * Tracks:
 * - 1st party metrics (direct engagement)
 * - 3rd party mentions and sentiment
 * - Pattern analysis across all content
 *
 * Powers the learning loop that improves predictions.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class FeedbackLedgerService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    this.platforms = config.platforms || ['twitter', 'linkedin', 'reddit', 'youtube', 'tiktok', 'instagram'];
  }

  /**
   * Record a published post
   */
  async recordPost(userId, platform, data) {
    const { externalId, content, contentType = 'post', metadata = {} } = data;

    const result = await this.pool.query(`
      INSERT INTO content_posts
      (user_id, platform, external_id, content, content_type, posted_at, metadata)
      VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      RETURNING id
    `, [userId, platform, externalId, content, contentType, metadata]);

    return {
      success: true,
      postId: result.rows[0].id
    };
  }

  /**
   * Record 1st party metrics (likes, shares, etc.)
   */
  async record1stParty(postId, metrics) {
    const entries = Object.entries(metrics);
    const recorded = [];

    for (const [metricType, value] of entries) {
      if (typeof value === 'number') {
        await this.pool.query(`
          INSERT INTO feedback_ledger (post_id, metric_type, value, source)
          VALUES ($1, $2, $3, 'first_party')
        `, [postId, metricType, value]);
        recorded.push(metricType);
      }
    }

    return { success: true, recorded };
  }

  /**
   * Record 3rd party mentions and sentiment
   */
  async record3rdParty(postId, data) {
    const { mentionUrl, sentiment, emotion = {}, influence = 0 } = data;

    await this.pool.query(`
      INSERT INTO sentiment_tracking
      (post_id, mention_url, sentiment_score, emotion, influence_score)
      VALUES ($1, $2, $3, $4, $5)
    `, [postId, mentionUrl, sentiment, emotion, influence]);

    return { success: true };
  }

  /**
   * Update metrics for a post (incremental)
   */
  async updateMetrics(postId, metrics, source = 'first_party') {
    for (const [metricType, value] of Object.entries(metrics)) {
      if (typeof value !== 'number') continue;

      // Check if metric exists
      const existing = await this.pool.query(`
        SELECT id, value FROM feedback_ledger
        WHERE post_id = $1 AND metric_type = $2 AND source = $3
        ORDER BY collected_at DESC LIMIT 1
      `, [postId, metricType, source]);

      if (existing.rows[0]) {
        // Only update if value changed
        if (existing.rows[0].value !== value) {
          await this.pool.query(`
            INSERT INTO feedback_ledger (post_id, metric_type, value, source)
            VALUES ($1, $2, $3, $4)
          `, [postId, metricType, value, source]);
        }
      } else {
        await this.pool.query(`
          INSERT INTO feedback_ledger (post_id, metric_type, value, source)
          VALUES ($1, $2, $3, $4)
        `, [postId, metricType, value, source]);
      }
    }

    return { success: true };
  }

  /**
   * Get aggregated feedback for a post
   */
  async getPostFeedback(postId) {
    const post = await this.pool.query(
      'SELECT * FROM content_posts WHERE id = $1',
      [postId]
    );

    if (!post.rows[0]) {
      return { success: false, error: 'Post not found' };
    }

    // Get latest metrics
    const metrics = await this.pool.query(`
      SELECT DISTINCT ON (metric_type)
        metric_type, value, source, collected_at
      FROM feedback_ledger
      WHERE post_id = $1
      ORDER BY metric_type, collected_at DESC
    `, [postId]);

    // Get sentiment summary
    const sentiment = await this.pool.query(`
      SELECT
        AVG(sentiment_score) as avg_sentiment,
        COUNT(*) as mention_count,
        SUM(influence_score) as total_influence
      FROM sentiment_tracking
      WHERE post_id = $1
    `, [postId]);

    // Get metric history
    const history = await this.pool.query(`
      SELECT metric_type, value, collected_at
      FROM feedback_ledger
      WHERE post_id = $1
      ORDER BY collected_at ASC
    `, [postId]);

    return {
      success: true,
      post: post.rows[0],
      currentMetrics: metrics.rows.reduce((acc, m) => {
        acc[m.metric_type] = m.value;
        return acc;
      }, {}),
      sentiment: sentiment.rows[0],
      history: history.rows
    };
  }

  /**
   * Analyze patterns across all posts for a user
   */
  async analyzePatterns(userId, days = 30) {
    // Get performance by platform and content type
    const performance = await this.pool.query(`
      SELECT
        cp.platform,
        cp.content_type,
        COUNT(DISTINCT cp.id) as post_count,
        AVG(CASE WHEN fl.metric_type = 'likes' THEN fl.value END) as avg_likes,
        AVG(CASE WHEN fl.metric_type = 'shares' THEN fl.value END) as avg_shares,
        AVG(CASE WHEN fl.metric_type = 'comments' THEN fl.value END) as avg_comments,
        AVG(CASE WHEN fl.metric_type = 'views' THEN fl.value END) as avg_views,
        AVG(CASE WHEN fl.metric_type = 'engagement' THEN fl.value END) as avg_engagement
      FROM content_posts cp
      LEFT JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1
        AND cp.posted_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY cp.platform, cp.content_type
      ORDER BY avg_engagement DESC NULLS LAST
    `, [userId, days]);

    // Get sentiment trends
    const sentimentTrend = await this.pool.query(`
      SELECT
        DATE(st.detected_at) as date,
        AVG(st.sentiment_score) as avg_sentiment
      FROM sentiment_tracking st
      JOIN content_posts cp ON st.post_id = cp.id
      WHERE cp.user_id = $1
        AND st.detected_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(st.detected_at)
      ORDER BY date
    `, [userId, days]);

    // Get top performing content
    const topContent = await this.pool.query(`
      SELECT
        cp.id,
        cp.platform,
        cp.content,
        cp.posted_at,
        SUM(CASE WHEN fl.metric_type = 'engagement' THEN fl.value ELSE 0 END) as total_engagement
      FROM content_posts cp
      JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1
        AND cp.posted_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY cp.id
      ORDER BY total_engagement DESC
      LIMIT 10
    `, [userId, days]);

    return {
      byPlatform: performance.rows,
      sentimentTrend: sentimentTrend.rows,
      topContent: topContent.rows,
      period: `${days} days`
    };
  }

  /**
   * Get content insights using AI
   */
  async getInsights(userId, days = 30) {
    const patterns = await this.analyzePatterns(userId, days);

    const prompt = `Analyze this creator's content performance and provide actionable insights.

PERFORMANCE DATA:
${JSON.stringify(patterns.byPlatform, null, 2)}

TOP CONTENT:
${patterns.topContent.slice(0, 5).map(c => `- ${c.platform}: "${c.content?.substring(0, 100)}..." (engagement: ${c.total_engagement})`).join('\n')}

SENTIMENT TREND:
${JSON.stringify(patterns.sentimentTrend.slice(-7), null, 2)}

Provide specific, actionable insights:

Return JSON:
{
  "summary": "overall performance summary",
  "topInsights": [
    {"insight": "...", "action": "specific action to take", "priority": "high|medium|low"}
  ],
  "platformRecommendations": {
    "focus": "platform to focus on",
    "avoid": "platform to reduce",
    "reason": "why"
  },
  "contentRecommendations": [
    {"type": "...", "reason": "...", "example": "..."}
  ],
  "timing": {
    "bestDays": ["..."],
    "bestHours": ["..."]
  },
  "warnings": ["potential issues to watch"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return {
          success: true,
          ...JSON.parse(jsonMatch[0]),
          rawPatterns: patterns
        };
      }
    } catch (error) {
      console.error('[Ledger] Insights generation failed:', error.message);
    }

    return {
      success: true,
      summary: 'Analysis could not be completed',
      rawPatterns: patterns
    };
  }

  /**
   * Compare predicted vs actual metrics
   */
  async compareWithPrediction(postId, simulationId) {
    const post = await this.getPostFeedback(postId);
    if (!post.success) return post;

    const simulation = await this.pool.query(
      'SELECT predicted_metrics FROM simulations WHERE id = $1',
      [simulationId]
    );

    if (!simulation.rows[0]) {
      return { success: false, error: 'Simulation not found' };
    }

    const predicted = simulation.rows[0].predicted_metrics;
    const actual = post.currentMetrics;

    // Calculate accuracy per metric
    const comparison = {};
    for (const [key, predictedValue] of Object.entries(predicted)) {
      const actualValue = actual[key] || 0;
      if (typeof predictedValue === 'number') {
        comparison[key] = {
          predicted: predictedValue,
          actual: actualValue,
          delta: actualValue - predictedValue,
          accuracy: predictedValue > 0
            ? Math.max(0, 1 - Math.abs(actualValue - predictedValue) / predictedValue)
            : (actualValue === 0 ? 1 : 0)
        };
      }
    }

    return {
      success: true,
      comparison,
      overallAccuracy: Object.values(comparison)
        .filter(c => typeof c.accuracy === 'number')
        .reduce((sum, c) => sum + c.accuracy, 0) / Object.keys(comparison).length
    };
  }

  /**
   * Get engagement velocity (rate of change)
   */
  async getEngagementVelocity(postId, metric = 'likes') {
    const history = await this.pool.query(`
      SELECT value, collected_at
      FROM feedback_ledger
      WHERE post_id = $1 AND metric_type = $2
      ORDER BY collected_at ASC
    `, [postId, metric]);

    if (history.rows.length < 2) {
      return { velocity: 0, trend: 'insufficient_data' };
    }

    // Calculate velocity between last two readings
    const latest = history.rows[history.rows.length - 1];
    const previous = history.rows[history.rows.length - 2];

    const timeDiff = (new Date(latest.collected_at) - new Date(previous.collected_at)) / 3600000; // hours
    const valueDiff = latest.value - previous.value;

    const velocity = timeDiff > 0 ? valueDiff / timeDiff : 0;

    return {
      velocity: Math.round(velocity * 100) / 100,
      trend: velocity > 1 ? 'accelerating' : velocity > 0 ? 'growing' : velocity < 0 ? 'declining' : 'stable',
      perHour: velocity,
      history: history.rows
    };
  }

  /**
   * Get user's recent posts
   */
  async getRecentPosts(userId, limit = 20, platform = null) {
    let query = `
      SELECT cp.*,
        (SELECT jsonb_object_agg(metric_type, value)
         FROM (SELECT DISTINCT ON (metric_type) metric_type, value
               FROM feedback_ledger WHERE post_id = cp.id
               ORDER BY metric_type, collected_at DESC) m
        ) as metrics
      FROM content_posts cp
      WHERE cp.user_id = $1
    `;
    const params = [userId];

    if (platform) {
      params.push(platform);
      query += ` AND cp.platform = $${params.length}`;
    }

    query += ` ORDER BY cp.posted_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Link post to simulation for validation
   */
  async linkToSimulation(postId, simulationId) {
    // Update post metadata
    await this.pool.query(`
      UPDATE content_posts
      SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{simulationId}', to_jsonb($1::text))
      WHERE id = $2
    `, [simulationId, postId]);

    return { success: true };
  }
}

module.exports = FeedbackLedgerService;
