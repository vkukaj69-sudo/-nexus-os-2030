/**
 * NEXUS LEVIATHAN - Yield Harvester Service
 * Autonomous product creation and monetization
 *
 * Features:
 * - Detect monetization opportunities from content performance
 * - Auto-generate digital products (courses, ebooks, templates)
 * - Create Stripe products and pricing
 * - Track and optimize revenue
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class YieldHarvesterService {
  constructor(pool, stripeClient = null, config = {}) {
    this.pool = pool;
    this.stripe = stripeClient;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
    this.baseUrl = config.baseUrl || 'https://nexus-os.ai';
  }

  /**
   * Detect monetization opportunities for a user
   */
  async detectOpportunities(userId) {
    console.log(`[YieldHarvester] Detecting opportunities for user ${userId}...`);

    // Get top performing content
    const topContent = await this.pool.query(`
      SELECT
        cp.*,
        SUM(CASE WHEN fl.metric_type = 'engagement' THEN fl.value ELSE 0 END) as total_engagement,
        SUM(CASE WHEN fl.metric_type = 'shares' THEN fl.value ELSE 0 END) as total_shares
      FROM content_posts cp
      LEFT JOIN feedback_ledger fl ON cp.id = fl.post_id
      WHERE cp.user_id = $1 AND cp.posted_at > NOW() - INTERVAL '30 days'
      GROUP BY cp.id
      HAVING SUM(CASE WHEN fl.metric_type = 'engagement' THEN fl.value ELSE 0 END) > 0
      ORDER BY total_engagement DESC
      LIMIT 10
    `, [userId]);

    // Get dominated attention gaps
    const dominatedGaps = await this.pool.query(`
      SELECT ag.*, ac.performance
      FROM attention_gaps ag
      JOIN arbitrage_campaigns ac ON ag.id = ac.gap_id
      WHERE ac.user_id = $1 AND ac.status = 'active'
    `, [userId]);

    // Get user's Digital Soul for voice/niche
    const soul = await this.pool.query(
      'SELECT * FROM digital_soul WHERE user_id = $1',
      [userId]
    );

    // AI analysis for opportunities
    const prompt = `Analyze this creator's performance and suggest monetization opportunities.

TOP PERFORMING CONTENT:
${JSON.stringify(topContent.rows.slice(0, 5).map(c => ({
  platform: c.platform,
  content: c.content?.substring(0, 200),
  engagement: c.total_engagement,
  shares: c.total_shares
})), null, 2)}

DOMINATED ATTENTION GAPS:
${JSON.stringify(dominatedGaps.rows.map(g => ({
  topic: g.topic,
  platform: g.platform,
  opportunity: g.opportunity_score
})), null, 2)}

CREATOR PROFILE:
${soul.rows[0] ? JSON.stringify({
  niche: soul.rows[0].dna_signature?.niche,
  values: soul.rows[0].dna_signature?.coreValues
}) : 'Not defined'}

Suggest 1-3 digital products that could be auto-generated based on this data.
Consider: micro-courses, ebooks, templates, tools, community access.

Return ONLY valid JSON:
{
  "opportunities": [
    {
      "type": "micro_course|ebook|template|tool|community|service",
      "title": "specific product title",
      "description": "compelling description",
      "targetAudience": "who would buy this",
      "estimatedPrice": number in USD,
      "estimatedRevenue": estimated monthly revenue,
      "confidence": 0.0-1.0,
      "contentOutline": ["section 1", "section 2"],
      "reasoning": "why this product based on the data"
    }
  ]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return { opportunities: [] };
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Store opportunities
      for (const opp of analysis.opportunities) {
        await this.pool.query(`
          INSERT INTO yield_opportunities
          (user_id, opportunity_type, topic, estimated_revenue, confidence, action_plan)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, opp.type, opp.title, opp.estimatedRevenue, opp.confidence, opp]);
      }

      return analysis;
    } catch (error) {
      console.error('[YieldHarvester] Detection failed:', error.message);
      return { opportunities: [], error: error.message };
    }
  }

  /**
   * Get user's opportunities
   */
  async getOpportunities(userId, status = null) {
    let query = 'SELECT * FROM yield_opportunities WHERE user_id = $1';
    const params = [userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY confidence DESC, discovered_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Create a product from an opportunity
   */
  async createProduct(userId, opportunityId) {
    // Get opportunity
    const opp = await this.pool.query(
      'SELECT * FROM yield_opportunities WHERE id = $1 AND user_id = $2',
      [opportunityId, userId]
    );

    if (!opp.rows[0]) {
      return { success: false, error: 'Opportunity not found' };
    }

    const opportunity = opp.rows[0];
    const plan = opportunity.action_plan;

    console.log(`[YieldHarvester] Creating product: ${plan.title}`);

    // Generate product content
    const content = await this.generateProductContent(plan);

    // Create Stripe product if available
    let stripeData = {};
    if (this.stripe) {
      stripeData = await this.createStripeProduct(plan);
    }

    // Store product
    const product = await this.pool.query(`
      INSERT INTO auto_products
      (user_id, product_type, title, description, content, stripe_product_id, stripe_price_id, price, trigger_event, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
      RETURNING *
    `, [
      userId,
      plan.type,
      plan.title,
      plan.description,
      content,
      stripeData.productId || null,
      stripeData.priceId || null,
      plan.estimatedPrice,
      `opportunity:${opportunityId}`
    ]);

    // Update opportunity status
    await this.pool.query(
      'UPDATE yield_opportunities SET status = $1 WHERE id = $2',
      ['converted', opportunityId]
    );

    return {
      success: true,
      product: product.rows[0],
      checkoutUrl: stripeData.priceId
        ? `${this.baseUrl}/checkout/${product.rows[0].id}`
        : null
    };
  }

  /**
   * Generate product content using AI
   */
  async generateProductContent(plan) {
    const prompt = `Create comprehensive content for this digital product:

PRODUCT TYPE: ${plan.type}
TITLE: ${plan.title}
DESCRIPTION: ${plan.description}
TARGET AUDIENCE: ${plan.targetAudience}

OUTLINE:
${plan.contentOutline?.join('\n') || 'Generate appropriate sections'}

Generate the full product content. Make it valuable, actionable, and professional.

For a micro_course: Create 5-7 lessons with key takeaways
For an ebook: Create chapters with detailed content
For a template: Create the template with instructions
For a tool: Create usage guide and examples

Return as structured JSON:
{
  "sections": [
    {
      "title": "section title",
      "content": "full content in markdown",
      "keyTakeaways": ["..."]
    }
  ],
  "bonusContent": "additional value",
  "callToAction": "what to do next"
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { sections: [{ title: plan.title, content: 'Content generation in progress' }] };
    } catch (error) {
      console.error('[YieldHarvester] Content generation failed:', error.message);
      return { sections: [], error: error.message };
    }
  }

  /**
   * Create Stripe product
   */
  async createStripeProduct(plan) {
    if (!this.stripe) {
      return {};
    }

    try {
      const product = await this.stripe.products.create({
        name: plan.title,
        description: plan.description
      });

      const price = await this.stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(plan.estimatedPrice * 100),
        currency: 'usd'
      });

      return {
        productId: product.id,
        priceId: price.id
      };
    } catch (error) {
      console.error('[YieldHarvester] Stripe product creation failed:', error.message);
      return {};
    }
  }

  /**
   * Record a sale
   */
  async recordSale(productId, amount, customerId = null) {
    await this.pool.query(`
      UPDATE auto_products
      SET sales_count = sales_count + 1,
          revenue = revenue + $1,
          updated_at = NOW()
      WHERE id = $2
    `, [amount, productId]);

    return { success: true };
  }

  /**
   * Get user's products
   */
  async getUserProducts(userId, status = null) {
    let query = 'SELECT * FROM auto_products WHERE user_id = $1';
    const params = [userId];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  /**
   * Get product by ID
   */
  async getProduct(productId) {
    const result = await this.pool.query(
      'SELECT * FROM auto_products WHERE id = $1',
      [productId]
    );
    return result.rows[0];
  }

  /**
   * Update product status
   */
  async updateProductStatus(productId, userId, status) {
    await this.pool.query(`
      UPDATE auto_products
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
    `, [status, productId, userId]);

    return { success: true };
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(userId, days = 30) {
    // Revenue by product
    const byProduct = await this.pool.query(`
      SELECT
        id,
        title,
        product_type,
        sales_count,
        revenue,
        price
      FROM auto_products
      WHERE user_id = $1 AND sales_count > 0
      ORDER BY revenue DESC
    `, [userId]);

    // Total revenue
    const totals = await this.pool.query(`
      SELECT
        SUM(sales_count) as total_sales,
        SUM(revenue) as total_revenue
      FROM auto_products
      WHERE user_id = $1
    `, [userId]);

    // Opportunities not yet converted
    const pendingOpportunities = await this.pool.query(`
      SELECT
        SUM(estimated_revenue) as potential_revenue,
        COUNT(*) as count
      FROM yield_opportunities
      WHERE user_id = $1 AND status IN ('identified', 'ready')
    `, [userId]);

    return {
      products: byProduct.rows,
      totalSales: parseInt(totals.rows[0]?.total_sales || 0),
      totalRevenue: parseFloat(totals.rows[0]?.total_revenue || 0),
      pendingOpportunities: {
        count: parseInt(pendingOpportunities.rows[0]?.count || 0),
        potentialRevenue: parseFloat(pendingOpportunities.rows[0]?.potential_revenue || 0)
      }
    };
  }

  /**
   * Auto-scan for new opportunities (scheduled job)
   */
  async autoScan(userId) {
    // Check if user has enough activity for meaningful analysis
    const activityCheck = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM content_posts
      WHERE user_id = $1 AND posted_at > NOW() - INTERVAL '7 days'
    `, [userId]);

    if (parseInt(activityCheck.rows[0].count) < 3) {
      return { success: false, reason: 'Insufficient recent activity' };
    }

    // Check for existing unexploited opportunities
    const existing = await this.pool.query(`
      SELECT COUNT(*) as count
      FROM yield_opportunities
      WHERE user_id = $1 AND status = 'identified'
    `, [userId]);

    if (parseInt(existing.rows[0].count) >= 5) {
      return { success: false, reason: 'Too many pending opportunities' };
    }

    return await this.detectOpportunities(userId);
  }
}

module.exports = YieldHarvesterService;
