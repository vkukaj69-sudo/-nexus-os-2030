/**
 * NEXUS OS - Security Service
 * Zero-trust authentication, audit logging, permissions
 */

const crypto = require('crypto');

class SecurityService {
  constructor(pool) {
    this.pool = pool;
  }

  // ═══════════════════════════════════════════
  // API KEY MANAGEMENT
  // ═══════════════════════════════════════════

  generateApiKey() {
    const key = `nxs_${crypto.randomBytes(32).toString('hex')}`;
    const prefix = key.substring(0, 10);
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return { key, prefix, hash };
  }

  async createApiKey(userId, name, permissions = ['read'], expiresIn = null) {
    const { key, prefix, hash } = this.generateApiKey();
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

    const result = await this.pool.query(`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, key_prefix, permissions, expires_at
    `, [userId, name, hash, prefix, JSON.stringify(permissions), expiresAt]);

    await this.audit(userId, 'api_key.create', 'api_key', result.rows[0].id, { name });

    return { success: true, apiKey: key, ...result.rows[0] };
  }

  async validateApiKey(key) {
    if (!key || !key.startsWith('nxs_')) return null;

    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const result = await this.pool.query(`
      SELECT ak.*, u.email, u.role FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = $1 AND ak.active = true
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    `, [hash]);

    if (result.rows[0]) {
      await this.pool.query('UPDATE api_keys SET last_used = NOW() WHERE id = $1', [result.rows[0].id]);
      return result.rows[0];
    }
    return null;
  }

  async revokeApiKey(userId, keyId) {
    await this.pool.query('UPDATE api_keys SET active = false WHERE id = $1 AND user_id = $2', [keyId, userId]);
    await this.audit(userId, 'api_key.revoke', 'api_key', keyId, {});
    return { success: true };
  }

  async listApiKeys(userId) {
    const result = await this.pool.query(`
      SELECT id, name, key_prefix, permissions, rate_limit, last_used, expires_at, active, created_at
      FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC
    `, [userId]);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // AUDIT LOGGING
  // ═══════════════════════════════════════════

  async audit(userId, action, resourceType = null, resourceId = null, details = {}, req = null) {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await this.pool.query(`
      INSERT INTO audit_log (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, action, resourceType, resourceId, details, ipAddress, userAgent]);
  }

  async getAuditLog(userId, filters = {}) {
    let query = 'SELECT * FROM audit_log WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;

    if (filters.action) {
      paramCount++;
      query += ` AND action LIKE $${paramCount}`;
      params.push(`%${filters.action}%`);
    }
    if (filters.resourceType) {
      paramCount++;
      query += ` AND resource_type = $${paramCount}`;
      params.push(filters.resourceType);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // PERMISSION MANAGEMENT
  // ═══════════════════════════════════════════

  async grantPermission(userId, data) {
    const { agentId, resourceType, actions, conditions = {}, expiresAt = null, grantedBy } = data;

    const result = await this.pool.query(`
      INSERT INTO permissions (user_id, agent_id, resource_type, actions, conditions, granted_by, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [userId, agentId, resourceType, JSON.stringify(actions), conditions, grantedBy, expiresAt]);

    await this.audit(grantedBy || userId, 'permission.grant', 'permission', result.rows[0].id, { agentId, resourceType, actions });

    return { success: true, permissionId: result.rows[0].id };
  }

  async checkPermission(userId, agentId, resourceType, action) {
    const result = await this.pool.query(`
      SELECT * FROM permissions 
      WHERE user_id = $1 AND resource_type = $3 AND actions ? $4
        AND (agent_id = $2 OR agent_id IS NULL)
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `, [userId, agentId, resourceType, action]);

    return result.rows.length > 0;
  }

  async getUserPermissions(userId) {
    const result = await this.pool.query(`
      SELECT * FROM permissions WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId]);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // SECURITY EVENTS
  // ═══════════════════════════════════════════

  async logSecurityEvent(userId, eventType, severity, details, ipAddress = null) {
    const result = await this.pool.query(`
      INSERT INTO security_events (user_id, event_type, severity, details, ip_address)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [userId, eventType, severity, details, ipAddress]);

    // Alert on critical events
    if (severity === 'critical') {
      console.error(`[SECURITY CRITICAL] User ${userId}: ${eventType}`, details);
    }

    return result.rows[0].id;
  }

  async getSecurityEvents(filters = {}) {
    let query = 'SELECT * FROM security_events WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.userId) {
      paramCount++;
      query += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
    }
    if (filters.severity) {
      paramCount++;
      query += ` AND severity = $${paramCount}`;
      params.push(filters.severity);
    }
    if (filters.unresolved) {
      query += ' AND resolved = false';
    }

    query += ' ORDER BY created_at DESC LIMIT 100';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async resolveSecurityEvent(eventId) {
    await this.pool.query('UPDATE security_events SET resolved = true WHERE id = $1', [eventId]);
    return { success: true };
  }

  // ═══════════════════════════════════════════
  // RATE LIMITING
  // ═══════════════════════════════════════════

  rateLimiters = new Map();

  async checkRateLimit(identifier, limit = 100, windowMs = 60000) {
    const now = Date.now();
    const key = `${identifier}`;
    
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, { count: 0, resetAt: now + windowMs });
    }

    const limiter = this.rateLimiters.get(key);
    
    if (now > limiter.resetAt) {
      limiter.count = 0;
      limiter.resetAt = now + windowMs;
    }

    limiter.count++;

    if (limiter.count > limit) {
      return { allowed: false, remaining: 0, resetAt: limiter.resetAt };
    }

    return { allowed: true, remaining: limit - limiter.count, resetAt: limiter.resetAt };
  }

  // ═══════════════════════════════════════════
  // SESSION MANAGEMENT
  // ═══════════════════════════════════════════

  async createSession(userId, deviceInfo = {}, ipAddress = null, expiresInHours = 24) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const result = await this.pool.query(`
      INSERT INTO sessions (user_id, token_hash, device_info, ip_address, expires_at)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [userId, tokenHash, deviceInfo, ipAddress, expiresAt]);

    await this.audit(userId, 'session.create', 'session', result.rows[0].id, { deviceInfo });

    return { sessionId: result.rows[0].id, token, expiresAt };
  }

  async validateSession(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await this.pool.query(`
      SELECT s.*, u.email, u.role FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = $1 AND s.revoked = false AND s.expires_at > NOW()
    `, [tokenHash]);

    if (result.rows[0]) {
      await this.pool.query('UPDATE sessions SET last_activity = NOW() WHERE id = $1', [result.rows[0].id]);
      return result.rows[0];
    }
    return null;
  }

  async revokeSession(sessionId) {
    await this.pool.query('UPDATE sessions SET revoked = true WHERE id = $1', [sessionId]);
    return { success: true };
  }

  async revokeAllSessions(userId) {
    await this.pool.query('UPDATE sessions SET revoked = true WHERE user_id = $1', [userId]);
    await this.audit(userId, 'session.revoke_all', null, null, {});
    return { success: true };
  }
}

module.exports = SecurityService;
