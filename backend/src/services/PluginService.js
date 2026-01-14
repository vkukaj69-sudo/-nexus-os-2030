/**
 * NEXUS OS - Plugin & AI Router Service
 * Multi-model orchestration, plugin marketplace
 */

const crypto = require('crypto');

class PluginService {
  constructor(pool) {
    this.pool = pool;
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'nexus-default-key-change-me';
  }

  // ═══════════════════════════════════════════
  // AI PROVIDERS
  // ═══════════════════════════════════════════

  async getProviders() {
    const result = await this.pool.query(
      'SELECT id, name, provider_type, models, default_model, is_active FROM ai_providers WHERE is_active = true'
    );
    return result.rows;
  }

  async setUserProviderKey(userId, providerId, apiKey) {
    // Simple encryption (in production use proper encryption)
    const encrypted = Buffer.from(apiKey).toString('base64');

    await this.pool.query(`
      INSERT INTO user_provider_keys (user_id, provider_id, api_key_encrypted)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, provider_id) DO UPDATE SET api_key_encrypted = $3
    `, [userId, providerId, encrypted]);

    return { success: true };
  }

  async getUserProviderKey(userId, providerId) {
    const result = await this.pool.query(
      'SELECT api_key_encrypted FROM user_provider_keys WHERE user_id = $1 AND provider_id = $2',
      [userId, providerId]
    );

    if (!result.rows[0]) return null;
    return Buffer.from(result.rows[0].api_key_encrypted, 'base64').toString();
  }

  async getUserProviders(userId) {
    const result = await this.pool.query(`
      SELECT p.*, upk.is_default, CASE WHEN upk.id IS NOT NULL THEN true ELSE false END as configured
      FROM ai_providers p
      LEFT JOIN user_provider_keys upk ON p.id = upk.provider_id AND upk.user_id = $1
      WHERE p.is_active = true
    `, [userId]);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // AI ROUTER
  // ═══════════════════════════════════════════

  async routeRequest(userId, request) {
    const { task, complexity = 'medium', preferSpeed = false, preferCost = false } = request;

    // Get user's routing rules
    const rules = await this.pool.query(`
      SELECT * FROM routing_rules WHERE user_id = $1 AND is_active = true ORDER BY priority DESC
    `, [userId]);

    // Check rules for match
    for (const rule of rules.rows) {
      if (this.matchesCondition(rule.conditions, request)) {
        return {
          provider: rule.target_provider,
          model: rule.target_model,
          rule: rule.name
        };
      }
    }

    // Default routing logic
    let provider = 'anthropic';
    let model = 'claude-3-sonnet';

    if (complexity === 'high' || task === 'reasoning') {
      model = 'claude-3-opus';
    } else if (preferSpeed || complexity === 'low') {
      model = 'claude-3-haiku';
    } else if (preferCost) {
      provider = 'openai';
      model = 'gpt-3.5-turbo';
    }

    return { provider, model, rule: 'default' };
  }

  matchesCondition(conditions, request) {
    if (!conditions || Object.keys(conditions).length === 0) return false;

    for (const [key, value] of Object.entries(conditions)) {
      if (request[key] !== value) return false;
    }
    return true;
  }

  async createRoutingRule(userId, data) {
    const { name, conditions, targetProvider, targetModel, priority = 0 } = data;

    const result = await this.pool.query(`
      INSERT INTO routing_rules (user_id, name, conditions, target_provider, target_model, priority)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [userId, name, conditions, targetProvider, targetModel, priority]);

    return { success: true, rule: result.rows[0] };
  }

  async getRoutingRules(userId) {
    const result = await this.pool.query(
      'SELECT * FROM routing_rules WHERE user_id = $1 ORDER BY priority DESC',
      [userId]
    );
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // PLUGIN MARKETPLACE
  // ═══════════════════════════════════════════

  async getPlugins(category = null, search = null) {
    let query = 'SELECT * FROM plugins WHERE is_public = true';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    if (search) {
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY install_count DESC, rating DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async getPlugin(pluginId) {
    const result = await this.pool.query('SELECT * FROM plugins WHERE id = $1', [pluginId]);
    return result.rows[0];
  }

  async createPlugin(data) {
    const { name, description, version = '1.0.0', author, category, configSchema = {}, endpoints = [], isOfficial = false } = data;
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const result = await this.pool.query(`
      INSERT INTO plugins (name, slug, description, version, author, category, config_schema, endpoints, is_official)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [name, slug, description, version, author, category, configSchema, JSON.stringify(endpoints), isOfficial]);

    return { success: true, plugin: result.rows[0] };
  }

  async installPlugin(userId, pluginId, config = {}, orgId = null) {
    await this.pool.query(`
      INSERT INTO installed_plugins (user_id, org_id, plugin_id, config)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, plugin_id) DO UPDATE SET config = $4, is_enabled = true
    `, [userId, orgId, pluginId, config]);

    // Increment install count
    await this.pool.query('UPDATE plugins SET install_count = install_count + 1 WHERE id = $1', [pluginId]);

    return { success: true };
  }

  async uninstallPlugin(userId, pluginId) {
    await this.pool.query(
      'DELETE FROM installed_plugins WHERE user_id = $1 AND plugin_id = $2',
      [userId, pluginId]
    );
    return { success: true };
  }

  async getUserPlugins(userId) {
    const result = await this.pool.query(`
      SELECT p.*, ip.config, ip.is_enabled, ip.installed_at
      FROM plugins p
      JOIN installed_plugins ip ON p.id = ip.plugin_id
      WHERE ip.user_id = $1
    `, [userId]);
    return result.rows;
  }

  async togglePlugin(userId, pluginId, enabled) {
    await this.pool.query(
      'UPDATE installed_plugins SET is_enabled = $1 WHERE user_id = $2 AND plugin_id = $3',
      [enabled, userId, pluginId]
    );
    return { success: true };
  }

  // ═══════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════

  async addReview(userId, pluginId, rating, review) {
    await this.pool.query(`
      INSERT INTO plugin_reviews (plugin_id, user_id, rating, review)
      VALUES ($1, $2, $3, $4)
    `, [pluginId, userId, rating, review]);

    // Update average rating
    const avgResult = await this.pool.query(
      'SELECT AVG(rating) as avg FROM plugin_reviews WHERE plugin_id = $1',
      [pluginId]
    );
    await this.pool.query(
      'UPDATE plugins SET rating = $1 WHERE id = $2',
      [avgResult.rows[0].avg, pluginId]
    );

    return { success: true };
  }

  async getPluginReviews(pluginId) {
    const result = await this.pool.query(`
      SELECT pr.*, u.email FROM plugin_reviews pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.plugin_id = $1 ORDER BY pr.created_at DESC
    `, [pluginId]);
    return result.rows;
  }
}

module.exports = PluginService;
