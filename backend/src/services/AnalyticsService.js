/**
 * NEXUS OS - Analytics Service
 * Usage metrics, insights, performance tracking
 */

class AnalyticsService {
  constructor(pool) {
    this.pool = pool;
  }

  // ═══════════════════════════════════════════
  // EVENT TRACKING
  // ═══════════════════════════════════════════

  async trackEvent(userId, data) {
    const { eventType, agentId = null, resourceType = null, resourceId = null, tokensUsed = 0, durationMs = null, metadata = {}, orgId = null } = data;

    await this.pool.query(`
      INSERT INTO usage_events (user_id, org_id, event_type, agent_id, resource_type, resource_id, tokens_used, duration_ms, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [userId, orgId, eventType, agentId, resourceType, resourceId, tokensUsed, durationMs, metadata]);

    // Update daily metrics
    await this.updateDailyMetrics(userId, orgId, { tokensUsed, agentId, durationMs, isError: eventType === 'error' });

    return { success: true };
  }

  async updateDailyMetrics(userId, orgId, data) {
    const today = new Date().toISOString().split('T')[0];
    const { tokensUsed = 0, agentId = null, durationMs = null, isError = false, isWorkflow = false } = data;

    // Upsert daily metrics
    await this.pool.query(`
      INSERT INTO daily_metrics (user_id, org_id, metric_date, total_requests, total_tokens, error_count, workflow_runs)
      VALUES ($1, $2, $3, 1, $4, $5, $6)
      ON CONFLICT (user_id, metric_date) DO UPDATE SET
        total_requests = daily_metrics.total_requests + 1,
        total_tokens = daily_metrics.total_tokens + $4,
        error_count = daily_metrics.error_count + $5,
        workflow_runs = daily_metrics.workflow_runs + $6
    `, [userId, orgId, today, tokensUsed, isError ? 1 : 0, isWorkflow ? 1 : 0]);
  }

  // ═══════════════════════════════════════════
  // USAGE ANALYTICS
  // ═══════════════════════════════════════════

  async getUsageStats(userId, days = 30) {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_events,
        SUM(tokens_used) as total_tokens,
        AVG(duration_ms) as avg_duration,
        COUNT(DISTINCT agent_id) as agents_used,
        COUNT(DISTINCT DATE(created_at)) as active_days
      FROM usage_events
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
    `, [userId, days]);

    return result.rows[0];
  }

  async getUsageByAgent(userId, days = 30) {
    const result = await this.pool.query(`
      SELECT 
        agent_id,
        COUNT(*) as call_count,
        SUM(tokens_used) as tokens_used,
        AVG(duration_ms) as avg_duration
      FROM usage_events
      WHERE user_id = $1 AND agent_id IS NOT NULL AND created_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY agent_id
      ORDER BY call_count DESC
    `, [userId, days]);

    return result.rows;
  }

  async getUsageTimeline(userId, days = 7) {
    const result = await this.pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as events,
        SUM(tokens_used) as tokens
      FROM usage_events
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId, days]);

    return result.rows;
  }

  async getDailyMetrics(userId, days = 30) {
    const result = await this.pool.query(`
      SELECT * FROM daily_metrics
      WHERE user_id = $1 AND metric_date > NOW() - INTERVAL '1 day' * $2
      ORDER BY metric_date DESC
    `, [userId, days]);

    return result.rows;
  }

  // ═══════════════════════════════════════════
  // AGENT ANALYTICS
  // ═══════════════════════════════════════════

  async getAgentPerformance(userId, agentId, days = 30) {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_calls,
        AVG(duration_ms) as avg_response_time,
        MIN(duration_ms) as min_response_time,
        MAX(duration_ms) as max_response_time,
        SUM(tokens_used) as total_tokens,
        COUNT(CASE WHEN metadata->>'success' = 'false' THEN 1 END) as error_count
      FROM usage_events
      WHERE user_id = $1 AND agent_id = $2 AND created_at > NOW() - INTERVAL '1 day' * $3
    `, [userId, agentId, days]);

    return result.rows[0];
  }

  async getTopAgents(userId, limit = 5) {
    const result = await this.pool.query(`
      SELECT 
        agent_id,
        COUNT(*) as usage_count,
        SUM(tokens_used) as total_tokens
      FROM usage_events
      WHERE user_id = $1 AND agent_id IS NOT NULL
      GROUP BY agent_id
      ORDER BY usage_count DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  // ═══════════════════════════════════════════
  // SYSTEM HEALTH
  // ═══════════════════════════════════════════

  async recordHealth(metricName, value, unit = null, tags = {}) {
    await this.pool.query(`
      INSERT INTO system_health (metric_name, metric_value, unit, tags)
      VALUES ($1, $2, $3, $4)
    `, [metricName, value, unit, tags]);

    return { success: true };
  }

  async getSystemHealth(hours = 1) {
    const result = await this.pool.query(`
      SELECT metric_name, AVG(metric_value) as avg_value, MAX(metric_value) as max_value, unit
      FROM system_health
      WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
      GROUP BY metric_name, unit
    `, [hours]);

    return result.rows;
  }

  async getHealthTimeline(metricName, hours = 24) {
    const result = await this.pool.query(`
      SELECT 
        DATE_TRUNC('hour', recorded_at) as hour,
        AVG(metric_value) as value
      FROM system_health
      WHERE metric_name = $1 AND recorded_at > NOW() - INTERVAL '1 hour' * $2
      GROUP BY DATE_TRUNC('hour', recorded_at)
      ORDER BY hour
    `, [metricName, hours]);

    return result.rows;
  }

  // ═══════════════════════════════════════════
  // DASHBOARDS
  // ═══════════════════════════════════════════

  async createDashboard(userId, name, widgets = []) {
    const result = await this.pool.query(`
      INSERT INTO analytics_dashboards (user_id, name, widgets)
      VALUES ($1, $2, $3) RETURNING *
    `, [userId, name, JSON.stringify(widgets)]);

    return { success: true, dashboard: result.rows[0] };
  }

  async getDashboards(userId) {
    const result = await this.pool.query(
      'SELECT * FROM analytics_dashboards WHERE user_id = $1 ORDER BY is_default DESC, name',
      [userId]
    );
    return result.rows;
  }

  async updateDashboard(dashboardId, userId, data) {
    const { name, widgets } = data;
    const updates = ['updated_at = NOW()'];
    const params = [dashboardId, userId];
    let paramCount = 2;

    if (name) { paramCount++; updates.push(`name = $${paramCount}`); params.push(name); }
    if (widgets) { paramCount++; updates.push(`widgets = $${paramCount}`); params.push(JSON.stringify(widgets)); }

    await this.pool.query(
      `UPDATE analytics_dashboards SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2`,
      params
    );

    return { success: true };
  }

  // ═══════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════

  async generateInsights(userId) {
    const stats = await this.getUsageStats(userId, 30);
    const topAgents = await this.getTopAgents(userId, 3);
    const timeline = await this.getUsageTimeline(userId, 7);

    // Calculate trends
    const recentWeek = timeline.slice(-7);
    const previousWeek = timeline.slice(-14, -7);
    
    const recentTotal = recentWeek.reduce((sum, d) => sum + parseInt(d.events || 0), 0);
    const previousTotal = previousWeek.reduce((sum, d) => sum + parseInt(d.events || 0), 0);
    const growthRate = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal * 100).toFixed(1) : 0;

    return {
      summary: {
        totalEvents: parseInt(stats.total_events || 0),
        totalTokens: parseInt(stats.total_tokens || 0),
        avgDuration: Math.round(stats.avg_duration || 0),
        activeDays: parseInt(stats.active_days || 0),
        agentsUsed: parseInt(stats.agents_used || 0)
      },
      topAgents,
      trends: {
        weeklyGrowth: parseFloat(growthRate),
        direction: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable'
      },
      timeline
    };
  }
}

module.exports = AnalyticsService;
