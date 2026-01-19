/**
 * NEXUS LEVIATHAN - Affiliate Mesh Service
 * Decentralized referral and compute credit system
 *
 * Features:
 * - Generate unique affiliate links per user
 * - Track clicks and conversions
 * - Award compute credits for referrals
 * - Auto-inject referral links into content
 */

class AffiliateMeshService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.creditRate = config.creditRate || 100; // Credits per referral
    this.commissionRate = config.commissionRate || 0.2; // 20% revenue share
    this.baseUrl = config.baseUrl || 'https://nexus-os.ai';
  }

  /**
   * Generate affiliate link for a user
   */
  async generateLink(userId, destination = null) {
    const crypto = require('crypto');
    const code = crypto.randomBytes(8).toString('hex');

    const result = await this.pool.query(`
      INSERT INTO affiliate_links (user_id, link_code, destination_url)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [userId, code, destination || this.baseUrl]);

    const link = result.rows[0];

    return {
      success: true,
      linkCode: code,
      fullUrl: `${this.baseUrl}/r/${code}`,
      link
    };
  }

  /**
   * Get user's existing links
   */
  async getUserLinks(userId) {
    const result = await this.pool.query(`
      SELECT * FROM affiliate_links
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return result.rows.map(link => ({
      ...link,
      fullUrl: `${this.baseUrl}/r/${link.link_code}`
    }));
  }

  /**
   * Track a click
   */
  async trackClick(linkCode, metadata = {}) {
    const link = await this.pool.query(
      'SELECT * FROM affiliate_links WHERE link_code = $1 AND is_active = true',
      [linkCode]
    );

    if (!link.rows[0]) {
      return { success: false, error: 'Link not found or inactive' };
    }

    await this.pool.query(`
      UPDATE affiliate_links
      SET click_count = click_count + 1
      WHERE link_code = $1
    `, [linkCode]);

    return {
      success: true,
      destination: link.rows[0].destination_url || this.baseUrl,
      referrerId: link.rows[0].user_id
    };
  }

  /**
   * Process a referral signup
   */
  async processReferral(linkCode, newUserId) {
    const link = await this.pool.query(
      'SELECT * FROM affiliate_links WHERE link_code = $1',
      [linkCode]
    );

    if (!link.rows[0]) {
      return { success: false, error: 'Invalid referral link' };
    }

    const referrerId = link.rows[0].user_id;

    // Can't refer yourself
    if (referrerId === newUserId) {
      return { success: false, error: 'Self-referral not allowed' };
    }

    // Check if already referred
    const existing = await this.pool.query(
      'SELECT id FROM referrals WHERE referred_id = $1',
      [newUserId]
    );

    if (existing.rows.length > 0) {
      return { success: false, error: 'User already has a referrer' };
    }

    // Create referral record
    const result = await this.pool.query(`
      INSERT INTO referrals (referrer_id, referred_id, link_id, status)
      VALUES ($1, $2, $3, 'pending')
      RETURNING id
    `, [referrerId, newUserId, link.rows[0].id]);

    // Update conversion count
    await this.pool.query(`
      UPDATE affiliate_links
      SET conversion_count = conversion_count + 1
      WHERE id = $1
    `, [link.rows[0].id]);

    return {
      success: true,
      referralId: result.rows[0].id,
      referrerId
    };
  }

  /**
   * Award credits when referred user makes a payment
   */
  async awardCredits(referralId, paymentAmount) {
    const referral = await this.pool.query(
      'SELECT * FROM referrals WHERE id = $1 AND status = $2',
      [referralId, 'pending']
    );

    if (!referral.rows[0]) {
      return { success: false, error: 'Referral not found or already completed' };
    }

    const credits = Math.floor(paymentAmount * this.commissionRate * this.creditRate);
    const revenueShare = paymentAmount * this.commissionRate;

    // Update referral
    await this.pool.query(`
      UPDATE referrals
      SET status = 'completed',
          compute_credits_earned = $1,
          revenue_share = $2
      WHERE id = $3
    `, [credits, revenueShare, referralId]);

    // Add credits to referrer's account
    await this.pool.query(`
      UPDATE users
      SET compute_credits = COALESCE(compute_credits, 0) + $1
      WHERE id = $2
    `, [credits, referral.rows[0].referrer_id]);

    // Update link revenue
    await this.pool.query(`
      UPDATE affiliate_links
      SET revenue_generated = revenue_generated + $1
      WHERE id = $2
    `, [revenueShare, referral.rows[0].link_id]);

    return {
      success: true,
      creditsAwarded: credits,
      revenueShare,
      referrerId: referral.rows[0].referrer_id
    };
  }

  /**
   * Get user's referral stats
   */
  async getStats(userId) {
    // Get all links
    const links = await this.pool.query(`
      SELECT * FROM affiliate_links WHERE user_id = $1
    `, [userId]);

    // Get referrals by status
    const referrals = await this.pool.query(`
      SELECT
        status,
        COUNT(*) as count,
        SUM(compute_credits_earned) as total_credits,
        SUM(revenue_share) as total_revenue
      FROM referrals
      WHERE referrer_id = $1
      GROUP BY status
    `, [userId]);

    // Get user's current credits
    const user = await this.pool.query(
      'SELECT compute_credits FROM users WHERE id = $1',
      [userId]
    );

    return {
      links: links.rows.map(l => ({
        ...l,
        fullUrl: `${this.baseUrl}/r/${l.link_code}`
      })),
      referralStats: referrals.rows.reduce((acc, r) => {
        acc[r.status] = {
          count: parseInt(r.count),
          credits: parseInt(r.total_credits || 0),
          revenue: parseFloat(r.total_revenue || 0)
        };
        return acc;
      }, {}),
      totalClicks: links.rows.reduce((sum, l) => sum + l.click_count, 0),
      totalConversions: links.rows.reduce((sum, l) => sum + l.conversion_count, 0),
      totalRevenue: links.rows.reduce((sum, l) => sum + parseFloat(l.revenue_generated), 0),
      computeCredits: user.rows[0]?.compute_credits || 0
    };
  }

  /**
   * Auto-inject referral link into content
   */
  async injectReferralLink(userId, content, options = {}) {
    // Get user's primary link or create one
    let link = await this.pool.query(`
      SELECT * FROM affiliate_links
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (!link.rows[0]) {
      const newLink = await this.generateLink(userId);
      link = { rows: [newLink.link] };
    }

    const fullUrl = `${this.baseUrl}/r/${link.rows[0].link_code}`;

    // Different injection styles
    const style = options.style || 'subtle';

    switch (style) {
      case 'cta':
        return content + `\n\n🚀 Start your sovereign journey: ${fullUrl}`;

      case 'signature':
        return content + `\n\n---\nPowered by NEXUS OS | ${fullUrl}`;

      case 'inline':
        // Find a natural place to insert
        if (content.includes('[link]')) {
          return content.replace('[link]', fullUrl);
        }
        return content + ` ${fullUrl}`;

      case 'subtle':
      default:
        return content + `\n\n${fullUrl}`;
    }
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit = 10) {
    const result = await this.pool.query(`
      SELECT
        u.id,
        u.email,
        COUNT(r.id) as referral_count,
        SUM(r.compute_credits_earned) as total_credits,
        SUM(r.revenue_share) as total_revenue
      FROM users u
      LEFT JOIN referrals r ON u.id = r.referrer_id AND r.status = 'completed'
      GROUP BY u.id
      HAVING COUNT(r.id) > 0
      ORDER BY referral_count DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map((row, index) => ({
      rank: index + 1,
      userId: row.id,
      email: row.email?.substring(0, 3) + '***', // Mask email
      referrals: parseInt(row.referral_count),
      credits: parseInt(row.total_credits || 0),
      revenue: parseFloat(row.total_revenue || 0)
    }));
  }

  /**
   * Deactivate a link
   */
  async deactivateLink(linkId, userId) {
    await this.pool.query(`
      UPDATE affiliate_links
      SET is_active = false
      WHERE id = $1 AND user_id = $2
    `, [linkId, userId]);

    return { success: true };
  }

  /**
   * Get pending referrals (for conversion tracking)
   */
  async getPendingReferrals(referrerId) {
    const result = await this.pool.query(`
      SELECT r.*, u.email as referred_email, u.created_at as signup_date
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `, [referrerId]);

    return result.rows;
  }
}

module.exports = AffiliateMeshService;
