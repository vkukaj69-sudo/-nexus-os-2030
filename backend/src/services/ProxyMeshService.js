/**
 * NEXUS LEVIATHAN - Proxy Mesh Service
 * Distributed proxy rotation and health monitoring
 *
 * Features:
 * - Multi-type proxy support (residential, datacenter, mobile)
 * - Geo-targeting
 * - Health monitoring and auto-rotation
 * - Ban detection and recovery
 */

class ProxyMeshService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.healthCheckInterval = config.healthCheckInterval || 300000; // 5 minutes
    this.minHealthScore = config.minHealthScore || 0.3;
    this.maxBanCount = config.maxBanCount || 5;
    this.isRunning = false;
    this.healthChecker = null;
  }

  /**
   * Initialize proxy mesh
   */
  async initialize() {
    if (this.isRunning) return;

    console.log('[ProxyMesh] Initializing...');

    // Start health check loop
    this.healthChecker = setInterval(
      () => this.healthCheckAll(),
      this.healthCheckInterval
    );

    this.isRunning = true;
    console.log('[ProxyMesh] Initialized');
  }

  /**
   * Get a healthy proxy
   */
  async getProxy(platform = null, geoTarget = null, nodeType = null) {
    let query = `
      SELECT * FROM proxy_nodes
      WHERE is_active = true
        AND health_score >= $1
        AND ban_count < $2
    `;
    const params = [this.minHealthScore, this.maxBanCount];

    if (geoTarget) {
      params.push(geoTarget);
      query += ` AND (geo_location->>'country' = $${params.length} OR geo_location->>'region' = $${params.length})`;
    }

    if (nodeType) {
      params.push(nodeType);
      query += ` AND node_type = $${params.length}`;
    }

    // Prefer proxies not recently used
    query += ` ORDER BY health_score DESC, last_used ASC NULLS FIRST LIMIT 1`;

    const result = await this.pool.query(query, params);

    if (result.rows.length === 0) {
      // Fall back to any available proxy
      const fallback = await this.pool.query(`
        SELECT * FROM proxy_nodes
        WHERE is_active = true
        ORDER BY health_score DESC
        LIMIT 1
      `);

      if (fallback.rows.length === 0) {
        return null;
      }

      return this.markProxyUsed(fallback.rows[0]);
    }

    return this.markProxyUsed(result.rows[0]);
  }

  /**
   * Mark proxy as used
   */
  async markProxyUsed(proxy) {
    await this.pool.query(
      'UPDATE proxy_nodes SET last_used = NOW() WHERE id = $1',
      [proxy.id]
    );
    return proxy;
  }

  /**
   * Add a proxy node
   */
  async addNode(data) {
    const {
      ipAddress,
      port = 80,
      nodeType = 'residential',
      geoLocation = {}
    } = data;

    // Check if already exists
    const existing = await this.pool.query(
      'SELECT id FROM proxy_nodes WHERE ip_address = $1',
      [ipAddress]
    );

    if (existing.rows.length > 0) {
      return { success: false, error: 'Proxy already exists', id: existing.rows[0].id };
    }

    const result = await this.pool.query(`
      INSERT INTO proxy_nodes (ip_address, port, node_type, geo_location)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [ipAddress, port, nodeType, geoLocation]);

    return { success: true, id: result.rows[0].id };
  }

  /**
   * Add multiple proxy nodes
   */
  async addNodes(proxies) {
    const results = [];
    for (const proxy of proxies) {
      const result = await this.addNode(proxy);
      results.push(result);
    }
    return results;
  }

  /**
   * Report proxy ban/failure
   */
  async reportBan(proxyId, platform = null, reason = 'unknown') {
    await this.pool.query(`
      UPDATE proxy_nodes
      SET ban_count = ban_count + 1,
          health_score = GREATEST(0, health_score - 0.2)
      WHERE id = $1
    `, [proxyId]);

    // Check if should deactivate
    const node = await this.pool.query(
      'SELECT * FROM proxy_nodes WHERE id = $1',
      [proxyId]
    );

    if (node.rows[0]?.ban_count >= this.maxBanCount) {
      await this.deactivateProxy(proxyId);
      console.log(`[ProxyMesh] Proxy ${proxyId} deactivated due to excessive bans`);
    }

    return { success: true };
  }

  /**
   * Report proxy success
   */
  async reportSuccess(proxyId) {
    await this.pool.query(`
      UPDATE proxy_nodes
      SET health_score = LEAST(1.0, health_score + 0.05)
      WHERE id = $1
    `, [proxyId]);

    return { success: true };
  }

  /**
   * Deactivate a proxy
   */
  async deactivateProxy(proxyId) {
    await this.pool.query(
      'UPDATE proxy_nodes SET is_active = false WHERE id = $1',
      [proxyId]
    );
    return { success: true };
  }

  /**
   * Reactivate a proxy
   */
  async reactivateProxy(proxyId) {
    await this.pool.query(`
      UPDATE proxy_nodes
      SET is_active = true, ban_count = 0, health_score = 0.5
      WHERE id = $1
    `, [proxyId]);
    return { success: true };
  }

  /**
   * Health check all active proxies
   */
  async healthCheckAll() {
    const proxies = await this.pool.query(
      'SELECT * FROM proxy_nodes WHERE is_active = true'
    );

    console.log(`[ProxyMesh] Running health check on ${proxies.rows.length} proxies...`);

    let healthy = 0;
    let unhealthy = 0;

    for (const proxy of proxies.rows) {
      const isHealthy = await this.checkProxyHealth(proxy);

      if (isHealthy) {
        await this.pool.query(`
          UPDATE proxy_nodes
          SET health_score = LEAST(1.0, health_score + 0.1)
          WHERE id = $1
        `, [proxy.id]);
        healthy++;
      } else {
        await this.pool.query(`
          UPDATE proxy_nodes
          SET health_score = GREATEST(0, health_score - 0.15)
          WHERE id = $1
        `, [proxy.id]);
        unhealthy++;

        // Deactivate if health score too low
        if (proxy.health_score - 0.15 < this.minHealthScore) {
          await this.deactivateProxy(proxy.id);
        }
      }
    }

    console.log(`[ProxyMesh] Health check complete: ${healthy} healthy, ${unhealthy} unhealthy`);
  }

  /**
   * Check individual proxy health
   */
  async checkProxyHealth(proxy) {
    try {
      // Try to fetch a test URL through the proxy
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
        // Note: In production, you'd use a proper proxy agent here
        // This is simplified for the example
      });

      clearTimeout(timeout);

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Rotate to a new proxy (after ban or failure)
   */
  async rotate(currentProxyId, platform = null, geoTarget = null) {
    // Report the current proxy as problematic
    if (currentProxyId) {
      await this.reportBan(currentProxyId, platform);
    }

    // Get a new proxy
    return this.getProxy(platform, geoTarget);
  }

  /**
   * Get proxy statistics
   */
  async getStats() {
    const stats = await this.pool.query(`
      SELECT
        node_type,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        AVG(health_score) as avg_health,
        SUM(ban_count) as total_bans
      FROM proxy_nodes
      GROUP BY node_type
    `);

    const total = await this.pool.query(`
      SELECT
        COUNT(*) as total_proxies,
        COUNT(*) FILTER (WHERE is_active = true) as active_proxies,
        AVG(health_score) as avg_health
      FROM proxy_nodes
    `);

    return {
      byType: stats.rows,
      overall: total.rows[0]
    };
  }

  /**
   * Get all proxies (for admin)
   */
  async getAllProxies(includeInactive = false) {
    let query = 'SELECT * FROM proxy_nodes';
    if (!includeInactive) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY health_score DESC';

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Delete a proxy
   */
  async deleteProxy(proxyId) {
    await this.pool.query('DELETE FROM proxy_nodes WHERE id = $1', [proxyId]);
    return { success: true };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    if (this.healthChecker) {
      clearInterval(this.healthChecker);
    }
    this.isRunning = false;
    console.log('[ProxyMesh] Shutdown complete');
  }
}

module.exports = ProxyMeshService;
