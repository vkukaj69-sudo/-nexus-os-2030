/**
 * NEXUS LEVIATHAN - Rate Limiter Service
 * Platform-aware action throttling to avoid detection
 *
 * Features:
 * - Per-platform rate limits
 * - Per-action rate limits
 * - Automatic cooldown management
 * - Queue system for rate-limited actions
 */

class RateLimiterService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.cache = new Map(); // In-memory cache for fast lookups
    this.resetInterval = config.resetInterval || 3600000; // 1 hour
    this.queue = new Map(); // Queued actions waiting for rate limit reset
    this.resetChecker = null;
  }

  /**
   * Initialize rate limiter
   */
  async initialize() {
    // Load limits from database
    const limits = await this.pool.query('SELECT * FROM rate_limits');

    for (const limit of limits.rows) {
      const key = `${limit.platform}:${limit.action_type}`;
      this.cache.set(key, {
        ...limit,
        hourlyCount: limit.current_hour_count || 0,
        dailyCount: limit.current_day_count || 0,
        lastAction: null
      });
    }

    // Start reset checker
    this.resetChecker = setInterval(() => this.checkResets(), 60000); // Check every minute

    console.log(`[RateLimiter] Initialized with ${limits.rows.length} rate limit rules`);
  }

  /**
   * Check if action is allowed
   */
  async canPerform(platform, actionType, userId = null) {
    const key = `${platform}:${actionType}`;
    let limit = this.cache.get(key);

    if (!limit) {
      // Create default conservative limit
      limit = await this.createDefaultLimit(platform, actionType);
    }

    // Check hourly limit
    if (limit.hourlyCount >= limit.limit_per_hour) {
      const resetIn = this.getTimeUntilHourlyReset(limit);
      return {
        allowed: false,
        reason: 'hourly_limit_exceeded',
        waitSeconds: Math.ceil(resetIn / 1000),
        limit: limit.limit_per_hour,
        current: limit.hourlyCount
      };
    }

    // Check daily limit
    if (limit.dailyCount >= limit.limit_per_day) {
      const resetIn = this.getTimeUntilDailyReset(limit);
      return {
        allowed: false,
        reason: 'daily_limit_exceeded',
        waitSeconds: Math.ceil(resetIn / 1000),
        limit: limit.limit_per_day,
        current: limit.dailyCount
      };
    }

    // Check cooldown
    if (limit.lastAction) {
      const elapsed = Date.now() - limit.lastAction;
      const cooldownMs = (limit.cooldown_seconds || 0) * 1000;

      if (elapsed < cooldownMs) {
        return {
          allowed: false,
          reason: 'cooldown_active',
          waitSeconds: Math.ceil((cooldownMs - elapsed) / 1000),
          cooldown: limit.cooldown_seconds
        };
      }
    }

    return {
      allowed: true,
      cooldownSeconds: limit.cooldown_seconds || 0,
      hourlyRemaining: limit.limit_per_hour - limit.hourlyCount,
      dailyRemaining: limit.limit_per_day - limit.dailyCount
    };
  }

  /**
   * Record an action
   */
  async recordAction(platform, actionType, userId = null) {
    const key = `${platform}:${actionType}`;
    let limit = this.cache.get(key);

    if (!limit) {
      limit = await this.createDefaultLimit(platform, actionType);
    }

    // Update counts
    limit.hourlyCount++;
    limit.dailyCount++;
    limit.lastAction = Date.now();

    // Update cache
    this.cache.set(key, limit);

    // Update database
    await this.pool.query(`
      UPDATE rate_limits
      SET current_hour_count = current_hour_count + 1,
          current_day_count = current_day_count + 1
      WHERE platform = $1 AND action_type = $2
    `, [platform, actionType]);

    return {
      success: true,
      hourlyRemaining: limit.limit_per_hour - limit.hourlyCount,
      dailyRemaining: limit.limit_per_day - limit.dailyCount
    };
  }

  /**
   * Create default limit for unknown platform/action
   */
  async createDefaultLimit(platform, actionType) {
    // Default conservative limits
    const defaults = {
      post: { hour: 3, day: 20, cooldown: 300 },
      like: { hour: 20, day: 200, cooldown: 30 },
      comment: { hour: 10, day: 100, cooldown: 60 },
      follow: { hour: 10, day: 100, cooldown: 60 },
      share: { hour: 5, day: 50, cooldown: 120 },
      message: { hour: 10, day: 50, cooldown: 120 },
      default: { hour: 10, day: 100, cooldown: 60 }
    };

    const config = defaults[actionType] || defaults.default;

    await this.pool.query(`
      INSERT INTO rate_limits (platform, action_type, limit_per_hour, limit_per_day, cooldown_seconds)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (platform, action_type) DO NOTHING
    `, [platform, actionType, config.hour, config.day, config.cooldown]);

    const limit = {
      platform,
      action_type: actionType,
      limit_per_hour: config.hour,
      limit_per_day: config.day,
      cooldown_seconds: config.cooldown,
      hourlyCount: 0,
      dailyCount: 0,
      lastAction: null
    };

    this.cache.set(`${platform}:${actionType}`, limit);
    return limit;
  }

  /**
   * Set custom limits for a platform/action
   */
  async setLimits(platform, actionType, config) {
    const { perHour, perDay, cooldown } = config;

    await this.pool.query(`
      INSERT INTO rate_limits (platform, action_type, limit_per_hour, limit_per_day, cooldown_seconds)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (platform, action_type)
      DO UPDATE SET limit_per_hour = $3, limit_per_day = $4, cooldown_seconds = $5
    `, [platform, actionType, perHour, perDay, cooldown]);

    const key = `${platform}:${actionType}`;
    const existing = this.cache.get(key) || {};

    this.cache.set(key, {
      ...existing,
      platform,
      action_type: actionType,
      limit_per_hour: perHour,
      limit_per_day: perDay,
      cooldown_seconds: cooldown
    });

    return { success: true };
  }

  /**
   * Check and perform resets
   */
  async checkResets() {
    const now = Date.now();

    for (const [key, limit] of this.cache.entries()) {
      // Check hourly reset
      if (!limit.lastHourlyReset || now - limit.lastHourlyReset >= 3600000) {
        limit.hourlyCount = 0;
        limit.lastHourlyReset = now;
      }

      // Check daily reset
      if (!limit.lastDailyReset || now - limit.lastDailyReset >= 86400000) {
        limit.dailyCount = 0;
        limit.lastDailyReset = now;
      }
    }

    // Also reset in database periodically
    await this.pool.query(`
      UPDATE rate_limits
      SET current_hour_count = 0
      WHERE last_reset < NOW() - INTERVAL '1 hour'
    `);

    await this.pool.query(`
      UPDATE rate_limits
      SET current_day_count = 0, last_reset = NOW()
      WHERE last_reset < NOW() - INTERVAL '1 day'
    `);
  }

  /**
   * Get time until hourly reset
   */
  getTimeUntilHourlyReset(limit) {
    if (!limit.lastHourlyReset) return 3600000;
    const elapsed = Date.now() - limit.lastHourlyReset;
    return Math.max(0, 3600000 - elapsed);
  }

  /**
   * Get time until daily reset
   */
  getTimeUntilDailyReset(limit) {
    if (!limit.lastDailyReset) return 86400000;
    const elapsed = Date.now() - limit.lastDailyReset;
    return Math.max(0, 86400000 - elapsed);
  }

  /**
   * Queue an action for later execution
   */
  async queueAction(platform, actionType, action, userId = null) {
    const key = `${platform}:${actionType}`;

    if (!this.queue.has(key)) {
      this.queue.set(key, []);
    }

    this.queue.get(key).push({
      action,
      userId,
      queuedAt: Date.now()
    });

    return {
      success: true,
      position: this.queue.get(key).length
    };
  }

  /**
   * Process queued actions
   */
  async processQueue(platform, actionType) {
    const key = `${platform}:${actionType}`;
    const queue = this.queue.get(key) || [];

    if (queue.length === 0) {
      return { processed: 0 };
    }

    let processed = 0;

    while (queue.length > 0) {
      const check = await this.canPerform(platform, actionType);

      if (!check.allowed) {
        break;
      }

      const item = queue.shift();

      try {
        // Execute the queued action
        if (typeof item.action === 'function') {
          await item.action();
        }

        await this.recordAction(platform, actionType, item.userId);
        processed++;

        // Wait for cooldown
        if (check.cooldownSeconds > 0) {
          await new Promise(r => setTimeout(r, check.cooldownSeconds * 1000));
        }
      } catch (error) {
        console.error(`[RateLimiter] Queued action failed:`, error.message);
      }
    }

    return { processed, remaining: queue.length };
  }

  /**
   * Get current limits status
   */
  async getStatus(platform = null) {
    if (platform) {
      const result = [];
      for (const [key, limit] of this.cache.entries()) {
        if (key.startsWith(platform)) {
          result.push({
            platform: limit.platform,
            actionType: limit.action_type,
            hourly: {
              limit: limit.limit_per_hour,
              used: limit.hourlyCount,
              remaining: limit.limit_per_hour - limit.hourlyCount
            },
            daily: {
              limit: limit.limit_per_day,
              used: limit.dailyCount,
              remaining: limit.limit_per_day - limit.dailyCount
            },
            cooldown: limit.cooldown_seconds
          });
        }
      }
      return result;
    }

    // Return all
    const result = await this.pool.query('SELECT * FROM rate_limits ORDER BY platform, action_type');
    return result.rows.map(limit => ({
      ...limit,
      hourlyRemaining: limit.limit_per_hour - (limit.current_hour_count || 0),
      dailyRemaining: limit.limit_per_day - (limit.current_day_count || 0)
    }));
  }

  /**
   * Reset limits for a platform
   */
  async resetLimits(platform, actionType = null) {
    if (actionType) {
      const key = `${platform}:${actionType}`;
      const limit = this.cache.get(key);
      if (limit) {
        limit.hourlyCount = 0;
        limit.dailyCount = 0;
      }

      await this.pool.query(`
        UPDATE rate_limits
        SET current_hour_count = 0, current_day_count = 0
        WHERE platform = $1 AND action_type = $2
      `, [platform, actionType]);
    } else {
      // Reset all for platform
      for (const [key, limit] of this.cache.entries()) {
        if (key.startsWith(platform)) {
          limit.hourlyCount = 0;
          limit.dailyCount = 0;
        }
      }

      await this.pool.query(`
        UPDATE rate_limits
        SET current_hour_count = 0, current_day_count = 0
        WHERE platform = $1
      `, [platform]);
    }

    return { success: true };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    if (this.resetChecker) {
      clearInterval(this.resetChecker);
    }
    console.log('[RateLimiter] Shutdown complete');
  }
}

module.exports = RateLimiterService;
