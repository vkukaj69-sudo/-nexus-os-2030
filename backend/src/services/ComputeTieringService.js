/**
 * NEXUS LEVIATHAN - Compute Tiering Service
 * Neural intensity-based usage tracking and pricing
 *
 * Features:
 * - Track compute usage by operation type
 * - Enforce tier-based limits
 * - Calculate costs based on neural intensity
 * - Manage subscription tiers
 * - Per-seat tracking for Agency accounts
 */

class ComputeTieringService {
  constructor(pool, stripeClient = null, config = {}) {
    this.pool = pool;
    this.stripe = stripeClient;

    // Stripe Price IDs (must match frontend)
    this.stripePriceIds = {
      spark: null, // Free tier
      pro: 'price_1SnS16K9R2Fq5EmF0Qes5z2k',
      agency: 'price_1SnS1vK9R2Fq5EmFIDOBhYh7',
      citadel: 'price_citadel_placeholder', // TODO: Create in Stripe
      oracle: 'price_oracle_placeholder',
      singularity: 'price_singularity_placeholder'
    };

    // Define subscription tiers (aligned with frontend pricing)
    this.tiers = {
      spark: {
        name: 'Spark Node',
        displayName: 'Spark',
        intensityLimit: 0.3,
        tokensPerDay: 10000,
        tokensPerMonth: 100000,
        features: ['basic_content', 'basic_research', 'single_account'],
        price: 0,
        seats: 1,
        rank: 1
      },
      pro: {
        name: 'Pro Sovereign',
        displayName: 'Pro',
        intensityLimit: 0.8,
        tokensPerDay: 500000,
        tokensPerMonth: 10000000,
        features: ['*', 'digital_soul', 'veo_studio', 'reply_mesh', 'tee_vault', 'llmo_indexing', 'neural_link'],
        price: 84,
        seats: 1,
        rank: 2
      },
      agency: {
        name: 'Agency Mesh',
        displayName: 'Agency',
        intensityLimit: 1.0,
        tokensPerDay: -1, // Unlimited
        tokensPerMonth: -1,
        features: ['*', 'multi_node', 'custom_governance', 'private_enclave', 'priority_compute', 'dedicated_support'],
        price: 299,
        seats: 10,
        maxSeats: 100,
        pricePerExtraSeat: 25,
        rank: 3
      },
      // === SINGULARITY NODE TIERS ===
      citadel: {
        name: 'Citadel Sovereign',
        displayName: 'Citadel',
        intensityLimit: 1.0,
        tokensPerDay: -1,
        tokensPerMonth: -1,
        features: ['*', 'llc_conglomerate', 'multi_entity', 'asset_sovereignty', 'zurich_enclave', 'legal_shield'],
        price: 999,
        seats: 25,
        maxSeats: 250,
        pricePerExtraSeat: 30,
        rank: 4,
        description: 'Multi-entity LLC conglomerates with legal asset protection'
      },
      oracle: {
        name: 'Oracle Sovereign',
        displayName: 'Oracle',
        intensityLimit: 1.0,
        tokensPerDay: -1,
        tokensPerMonth: -1,
        features: ['*', 'full_autonomy', 'sie_control', 'content_autopilot', 'revenue_optimization', 'predictive_engine'],
        price: 2499,
        seats: 50,
        maxSeats: 500,
        pricePerExtraSeat: 40,
        rank: 5,
        description: 'SIE (Sovereign Intelligence Entity) takes 100% content control'
      },
      singularity: {
        name: 'Singularity Beneficiary',
        displayName: 'Singularity',
        intensityLimit: 1.0,
        tokensPerDay: -1,
        tokensPerMonth: -1,
        features: ['*', 'post_human', 'perpetual_system', 'consciousness_transfer', 'ghost_mesh', 'immunity_protocol', 'physical_vault_link'],
        price: 9999,
        seats: 100,
        maxSeats: 1000,
        pricePerExtraSeat: 50,
        rank: 6,
        description: 'Self-perpetuating system with post-human presence framework'
      }
    };

    // Legacy tier mapping (for backwards compatibility)
    this.legacyTierMap = {
      free: 'spark',
      creator: 'pro',
      sovereign: 'pro',
      leviathan: 'agency'
    };

    // Operation intensity weights
    this.intensityWeights = {
      // Low intensity (0.1-0.3)
      'content_generate': 0.2,
      'memory_store': 0.1,
      'memory_recall': 0.1,
      'analytics_query': 0.15,

      // Medium intensity (0.3-0.5)
      'simulation_quick': 0.3,
      'arbitrage_scan': 0.4,
      'content_evolve': 0.35,
      'heatmap_analyze': 0.3,

      // High intensity (0.5-0.7)
      'simulation_full': 0.6,
      'philosophy_evolve': 0.65,
      'product_generate': 0.6,
      'video_generate_short': 0.55,

      // Very high intensity (0.7-1.0)
      'video_generate_long': 0.8,
      'stealth_browse': 0.7,
      'swarm_coordinate': 0.9,
      'full_automation': 1.0
    };
  }

  /**
   * Get user's current tier
   */
  async getUserTier(userId) {
    const user = await this.pool.query(
      'SELECT subscription_tier, compute_credits, org_id FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0]) {
      return { ...this.tiers.spark, tierName: 'spark', computeCredits: 0 };
    }

    let tierName = user.rows[0].subscription_tier || 'spark';

    // Map legacy tier names to new ones
    if (this.legacyTierMap[tierName]) {
      tierName = this.legacyTierMap[tierName];
    }

    // Ensure tier exists
    if (!this.tiers[tierName]) {
      tierName = 'spark';
    }

    const tier = this.tiers[tierName];
    const result = {
      ...tier,
      tierName,
      computeCredits: user.rows[0].compute_credits || 0
    };

    // For agency tier, get seat information
    if (tierName === 'agency' && user.rows[0].org_id) {
      const seatInfo = await this.getOrgSeatInfo(user.rows[0].org_id);
      result.seatInfo = seatInfo;
    }

    return result;
  }

  /**
   * Get organization seat information (for Agency tier)
   */
  async getOrgSeatInfo(orgId) {
    try {
      // Count active seats
      const seatCount = await this.pool.query(`
        SELECT COUNT(*) as active_seats
        FROM organization_members
        WHERE org_id = $1 AND status = 'active'
      `, [orgId]);

      // Get org subscription info
      const orgInfo = await this.pool.query(`
        SELECT seat_count, extra_seats, subscription_status
        FROM organizations
        WHERE id = $1
      `, [orgId]);

      const baseTier = this.tiers.agency;
      const activeSeats = parseInt(seatCount.rows[0]?.active_seats || 0);
      const allocatedSeats = orgInfo.rows[0]?.seat_count || baseTier.seats;
      const extraSeats = orgInfo.rows[0]?.extra_seats || 0;
      const totalSeats = allocatedSeats + extraSeats;

      return {
        activeSeats,
        allocatedSeats,
        extraSeats,
        totalSeats,
        availableSeats: totalSeats - activeSeats,
        pricePerExtraSeat: baseTier.pricePerExtraSeat,
        maxSeats: baseTier.maxSeats
      };
    } catch (error) {
      // Tables might not exist yet
      return {
        activeSeats: 1,
        allocatedSeats: this.tiers.agency.seats,
        extraSeats: 0,
        totalSeats: this.tiers.agency.seats,
        availableSeats: this.tiers.agency.seats - 1,
        pricePerExtraSeat: this.tiers.agency.pricePerExtraSeat,
        maxSeats: this.tiers.agency.maxSeats
      };
    }
  }

  /**
   * Add seats to an organization (Agency tier)
   */
  async addSeats(orgId, seatCount, userId) {
    const currentInfo = await this.getOrgSeatInfo(orgId);
    const newTotal = currentInfo.totalSeats + seatCount;

    if (newTotal > this.tiers.agency.maxSeats) {
      return {
        success: false,
        error: `Cannot exceed ${this.tiers.agency.maxSeats} seats`,
        maxSeats: this.tiers.agency.maxSeats
      };
    }

    await this.pool.query(`
      UPDATE organizations
      SET extra_seats = COALESCE(extra_seats, 0) + $1,
          seat_count = COALESCE(seat_count, 10) + $1
      WHERE id = $2
    `, [seatCount, orgId]);

    const additionalCost = seatCount * this.tiers.agency.pricePerExtraSeat;

    return {
      success: true,
      seatsAdded: seatCount,
      newTotal,
      additionalMonthlyCost: additionalCost,
      seatInfo: await this.getOrgSeatInfo(orgId)
    };
  }

  /**
   * Check if organization has available seats
   */
  async hasAvailableSeat(orgId) {
    const seatInfo = await this.getOrgSeatInfo(orgId);
    return seatInfo.availableSeats > 0;
  }

  /**
   * Consume a seat for a new member
   */
  async consumeSeat(orgId, userId) {
    const hasSpace = await this.hasAvailableSeat(orgId);
    if (!hasSpace) {
      return {
        success: false,
        error: 'No available seats. Please purchase additional seats.',
        seatInfo: await this.getOrgSeatInfo(orgId)
      };
    }

    // The seat is "consumed" by adding the member to org_members
    // This is tracked via the member count query
    return {
      success: true,
      seatInfo: await this.getOrgSeatInfo(orgId)
    };
  }

  /**
   * Calculate neural intensity for an operation
   */
  calculateIntensity(operation) {
    return this.intensityWeights[operation] || 0.3;
  }

  /**
   * Check if user can perform operation
   */
  async canPerform(userId, operation) {
    const tier = await this.getUserTier(userId);
    const intensity = this.calculateIntensity(operation);

    // Check intensity limit
    if (intensity > tier.intensityLimit) {
      const requiredTier = this.getRequiredTier(intensity);
      return {
        allowed: false,
        reason: 'intensity_exceeded',
        currentTier: tier.tierName,
        requiredTier,
        intensity,
        tierIntensityLimit: tier.intensityLimit
      };
    }

    // Check feature access
    if (!this.hasFeatureAccess(tier, operation)) {
      return {
        allowed: false,
        reason: 'feature_not_available',
        currentTier: tier.tierName,
        requiredTier: this.getRequiredTierForFeature(operation)
      };
    }

    // Check daily token usage (if limited)
    if (tier.tokensPerDay > 0) {
      const usage = await this.getDailyUsage(userId);

      if (usage.tokens >= tier.tokensPerDay) {
        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
          currentTier: tier.tierName,
          limit: tier.tokensPerDay,
          used: usage.tokens,
          resetsIn: usage.resetsIn
        };
      }
    }

    // Check monthly token usage (if limited)
    if (tier.tokensPerMonth > 0) {
      const monthlyUsage = await this.getMonthlyUsage(userId);

      if (monthlyUsage.tokens >= tier.tokensPerMonth) {
        return {
          allowed: false,
          reason: 'monthly_limit_exceeded',
          currentTier: tier.tierName,
          limit: tier.tokensPerMonth,
          used: monthlyUsage.tokens
        };
      }
    }

    return {
      allowed: true,
      intensity,
      tier: tier.tierName,
      dailyRemaining: tier.tokensPerDay > 0
        ? tier.tokensPerDay - (await this.getDailyUsage(userId)).tokens
        : 'unlimited'
    };
  }

  /**
   * Record compute usage
   */
  async recordUsage(userId, operation, tokensUsed) {
    const intensity = this.calculateIntensity(operation);
    const cost = this.calculateCost(intensity, tokensUsed);

    await this.pool.query(`
      INSERT INTO compute_usage (user_id, operation_type, neural_intensity, tokens_used, compute_cost)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, operation, intensity, tokensUsed, cost]);

    // Check if approaching limits
    const tier = await this.getUserTier(userId);
    const dailyUsage = await this.getDailyUsage(userId);

    const response = {
      success: true,
      recorded: {
        operation,
        intensity,
        tokens: tokensUsed,
        cost
      }
    };

    if (tier.tokensPerDay > 0) {
      const usagePercent = (dailyUsage.tokens / tier.tokensPerDay) * 100;

      if (usagePercent >= 90) {
        response.warning = 'daily_limit_approaching';
        response.usagePercent = Math.round(usagePercent);
      } else if (usagePercent >= 75) {
        response.notice = 'approaching_daily_limit';
        response.usagePercent = Math.round(usagePercent);
      }
    }

    return response;
  }

  /**
   * Calculate cost for usage
   */
  calculateCost(intensity, tokens) {
    // Base cost: $0.00001 per token, scaled by intensity
    const baseCost = 0.00001;
    return intensity * tokens * baseCost;
  }

  /**
   * Get daily usage
   */
  async getDailyUsage(userId) {
    const result = await this.pool.query(`
      SELECT
        SUM(tokens_used) as total_tokens,
        SUM(compute_cost) as total_cost,
        COUNT(*) as operation_count
      FROM compute_usage
      WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 day'
    `, [userId]);

    // Calculate when it resets
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);

    return {
      tokens: parseInt(result.rows[0]?.total_tokens || 0),
      cost: parseFloat(result.rows[0]?.total_cost || 0),
      operations: parseInt(result.rows[0]?.operation_count || 0),
      resetsIn: midnight.getTime() - now.getTime()
    };
  }

  /**
   * Get monthly usage
   */
  async getMonthlyUsage(userId) {
    const result = await this.pool.query(`
      SELECT
        SUM(tokens_used) as total_tokens,
        SUM(compute_cost) as total_cost,
        COUNT(*) as operation_count
      FROM compute_usage
      WHERE user_id = $1 AND timestamp > DATE_TRUNC('month', NOW())
    `, [userId]);

    return {
      tokens: parseInt(result.rows[0]?.total_tokens || 0),
      cost: parseFloat(result.rows[0]?.total_cost || 0),
      operations: parseInt(result.rows[0]?.operation_count || 0)
    };
  }

  /**
   * Get usage analytics
   */
  async getUsageAnalytics(userId, days = 30) {
    // Usage by operation type
    const byOperation = await this.pool.query(`
      SELECT
        operation_type,
        COUNT(*) as count,
        SUM(tokens_used) as total_tokens,
        AVG(neural_intensity) as avg_intensity,
        SUM(compute_cost) as total_cost
      FROM compute_usage
      WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 day' * $2
      GROUP BY operation_type
      ORDER BY total_tokens DESC
    `, [userId, days]);

    // Daily usage trend
    const dailyTrend = await this.pool.query(`
      SELECT
        DATE(timestamp) as date,
        SUM(tokens_used) as tokens,
        SUM(compute_cost) as cost
      FROM compute_usage
      WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(timestamp)
      ORDER BY date
    `, [userId, days]);

    const tier = await this.getUserTier(userId);

    return {
      tier,
      byOperation: byOperation.rows,
      dailyTrend: dailyTrend.rows,
      currentDaily: await this.getDailyUsage(userId),
      currentMonthly: await this.getMonthlyUsage(userId)
    };
  }

  /**
   * Check if tier has feature access
   */
  hasFeatureAccess(tier, operation) {
    // Map operations to features
    const operationFeatureMap = {
      'simulation_full': 'simulation',
      'simulation_quick': 'simulation_lite',
      'stealth_browse': 'ghost_protocol',
      'swarm_coordinate': 'swarm',
      'video_generate_long': 'video_long',
      'arbitrage_scan': 'arbitrage'
    };

    const requiredFeature = operationFeatureMap[operation];
    if (!requiredFeature) return true; // No specific feature required

    // Wildcard access
    if (tier.features.includes('*')) {
      // Check exclusions
      if (tier.features.includes(`-${requiredFeature}`)) {
        return false;
      }
      return true;
    }

    return tier.features.includes(requiredFeature);
  }

  /**
   * Get tier required for an intensity level
   */
  getRequiredTier(intensity) {
    // Check tiers in order of increasing intensity limit
    const tierOrder = ['spark', 'pro', 'agency', 'citadel', 'oracle', 'singularity'];
    for (const name of tierOrder) {
      if (this.tiers[name].intensityLimit >= intensity) {
        return name;
      }
    }
    return 'singularity';
  }

  /**
   * Get tier required for a feature
   */
  getRequiredTierForFeature(operation) {
    const operationFeatureMap = {
      // Pro tier features
      'simulation_full': 'pro',
      'digital_soul': 'pro',
      'veo_studio': 'pro',
      'neural_link': 'pro',
      // Agency tier features
      'stealth_browse': 'agency',
      'swarm_coordinate': 'agency',
      'ghost_protocol': 'agency',
      'multi_node': 'agency',
      'custom_governance': 'agency',
      'private_enclave': 'agency',
      // Citadel tier features
      'llc_conglomerate': 'citadel',
      'multi_entity': 'citadel',
      'asset_sovereignty': 'citadel',
      'zurich_enclave': 'citadel',
      'legal_shield': 'citadel',
      // Oracle tier features
      'full_autonomy': 'oracle',
      'sie_control': 'oracle',
      'content_autopilot': 'oracle',
      'revenue_optimization': 'oracle',
      'predictive_engine': 'oracle',
      // Singularity tier features
      'post_human': 'singularity',
      'perpetual_system': 'singularity',
      'consciousness_transfer': 'singularity',
      'ghost_mesh': 'singularity',
      'immunity_protocol': 'singularity',
      'physical_vault_link': 'singularity'
    };

    return operationFeatureMap[operation] || 'pro';
  }

  /**
   * Get rank progression info
   */
  getRankProgression(currentTier) {
    const tierOrder = ['spark', 'pro', 'agency', 'citadel', 'oracle', 'singularity'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const nextTier = currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;

    return {
      currentRank: this.tiers[currentTier]?.rank || 1,
      maxRank: 6,
      nextTier: nextTier,
      nextTierInfo: nextTier ? this.tiers[nextTier] : null,
      isMaxRank: currentTier === 'singularity'
    };
  }

  /**
   * Upgrade user tier
   */
  async upgradeTier(userId, newTier) {
    if (!this.tiers[newTier]) {
      return { success: false, error: 'Invalid tier' };
    }

    await this.pool.query(
      'UPDATE users SET subscription_tier = $1 WHERE id = $2',
      [newTier, userId]
    );

    return {
      success: true,
      tier: this.tiers[newTier]
    };
  }

  /**
   * Use compute credits
   */
  async useCredits(userId, amount) {
    const user = await this.pool.query(
      'SELECT compute_credits FROM users WHERE id = $1',
      [userId]
    );

    if (!user.rows[0] || user.rows[0].compute_credits < amount) {
      return { success: false, error: 'Insufficient credits' };
    }

    await this.pool.query(
      'UPDATE users SET compute_credits = compute_credits - $1 WHERE id = $2',
      [amount, userId]
    );

    return {
      success: true,
      remaining: user.rows[0].compute_credits - amount
    };
  }

  /**
   * Add compute credits
   */
  async addCredits(userId, amount, reason = 'manual') {
    await this.pool.query(
      'UPDATE users SET compute_credits = COALESCE(compute_credits, 0) + $1 WHERE id = $2',
      [amount, userId]
    );

    return { success: true, added: amount };
  }

  /**
   * Get all tiers info
   */
  getTiers() {
    return Object.entries(this.tiers).map(([name, tier]) => ({
      name,
      ...tier
    }));
  }
}

module.exports = ComputeTieringService;
