/**
 * NEXUS OS - Realtime Service
 * WebSockets, notifications, live updates
 */

class RealtimeService {
  constructor(pool, io = null) {
    this.pool = pool;
    this.io = io; // Socket.IO instance
    this.connections = new Map(); // userId -> socket
  }

  setIO(io) {
    this.io = io;
  }

  // ═══════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════

  async createNotification(userId, data) {
    const { type = 'info', title, message = '', source = null, data: notifData = {} } = data;

    const result = await this.pool.query(`
      INSERT INTO notifications (user_id, type, title, message, source, data)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [userId, type, title, message, source, notifData]);

    const notification = result.rows[0];

    // Push via WebSocket if connected
    this.pushToUser(userId, 'notification', notification);

    return { success: true, notification };
  }

  async getNotifications(userId, unreadOnly = false, limit = 50) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    if (unreadOnly) query += ' AND read = false';
    query += ' ORDER BY created_at DESC LIMIT $2';

    const result = await this.pool.query(query, [userId, limit]);
    return result.rows;
  }

  async markAsRead(userId, notificationId) {
    await this.pool.query(
      'UPDATE notifications SET read = true, read_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );
    return { success: true };
  }

  async markAllAsRead(userId) {
    await this.pool.query(
      'UPDATE notifications SET read = true, read_at = NOW() WHERE user_id = $1 AND read = false',
      [userId]
    );
    return { success: true };
  }

  async getUnreadCount(userId) {
    const result = await this.pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  // ═══════════════════════════════════════════
  // NOTIFICATION SETTINGS
  // ═══════════════════════════════════════════

  async getSettings(userId) {
    const result = await this.pool.query(
      'SELECT * FROM notification_settings WHERE user_id = $1',
      [userId]
    );
    
    if (!result.rows[0]) {
      // Create default settings
      const newResult = await this.pool.query(
        'INSERT INTO notification_settings (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
      return newResult.rows[0];
    }
    
    return result.rows[0];
  }

  async updateSettings(userId, settings) {
    const fields = ['email_enabled', 'push_enabled', 'agent_updates', 'workflow_updates', 'security_alerts', 'marketing', 'quiet_hours_start', 'quiet_hours_end'];
    const updates = ['updated_at = NOW()'];
    const params = [userId];
    let paramCount = 1;

    for (const field of fields) {
      if (settings[field] !== undefined) {
        paramCount++;
        updates.push(`${field} = $${paramCount}`);
        params.push(settings[field]);
      }
    }

    await this.pool.query(`
      INSERT INTO notification_settings (user_id) VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET ${updates.join(', ')}
    `, params);

    return { success: true };
  }

  // ═══════════════════════════════════════════
  // CHANNELS
  // ═══════════════════════════════════════════

  async createChannel(userId, data) {
    const { name, channelType = 'private', orgId = null, workspaceId = null } = data;

    const result = await this.pool.query(`
      INSERT INTO channels (name, channel_type, org_id, workspace_id, created_by)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [name, channelType, orgId, workspaceId, userId]);

    const channel = result.rows[0];

    // Subscribe creator
    await this.subscribeToChannel(userId, channel.id);

    return { success: true, channel };
  }

  async subscribeToChannel(userId, channelId) {
    await this.pool.query(`
      INSERT INTO channel_subscriptions (channel_id, user_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [channelId, userId]);

    // Join socket room if connected
    const socket = this.connections.get(userId);
    if (socket) socket.join(`channel:${channelId}`);

    return { success: true };
  }

  async unsubscribeFromChannel(userId, channelId) {
    await this.pool.query(
      'DELETE FROM channel_subscriptions WHERE channel_id = $1 AND user_id = $2',
      [channelId, userId]
    );

    const socket = this.connections.get(userId);
    if (socket) socket.leave(`channel:${channelId}`);

    return { success: true };
  }

  async getUserChannels(userId) {
    const result = await this.pool.query(`
      SELECT c.* FROM channels c
      JOIN channel_subscriptions cs ON c.id = cs.channel_id
      WHERE cs.user_id = $1
    `, [userId]);
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // REALTIME MESSAGES
  // ═══════════════════════════════════════════

  async sendMessage(userId, channelId, content, messageType = 'text', metadata = {}) {
    const result = await this.pool.query(`
      INSERT INTO realtime_messages (channel_id, user_id, message_type, content, metadata)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [channelId, userId, messageType, content, metadata]);

    const message = result.rows[0];

    // Broadcast to channel
    this.pushToChannel(channelId, 'message', message);

    return { success: true, message };
  }

  async sendAgentMessage(channelId, agentId, content, metadata = {}) {
    const result = await this.pool.query(`
      INSERT INTO realtime_messages (channel_id, agent_id, message_type, content, metadata)
      VALUES ($1, $2, 'agent_response', $3, $4) RETURNING *
    `, [channelId, agentId, content, metadata]);

    const message = result.rows[0];
    this.pushToChannel(channelId, 'agent_message', message);

    return { success: true, message };
  }

  async getChannelMessages(channelId, limit = 50, before = null) {
    let query = 'SELECT * FROM realtime_messages WHERE channel_id = $1';
    const params = [channelId];

    if (before) {
      query += ' AND created_at < $2';
      params.push(before);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await this.pool.query(query, params);
    return result.rows.reverse();
  }

  // ═══════════════════════════════════════════
  // AGENT STATUS
  // ═══════════════════════════════════════════

  async updateAgentStatus(userId, agentId, status, currentTask = null, progress = 0) {
    await this.pool.query(`
      INSERT INTO agent_status (user_id, agent_id, status, current_task, progress, last_activity, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (user_id, agent_id) DO UPDATE SET
        status = $3, current_task = $4, progress = $5, last_activity = NOW(), updated_at = NOW()
    `, [userId, agentId, status, currentTask, progress]);

    // Push status update
    this.pushToUser(userId, 'agent_status', { agentId, status, currentTask, progress });

    return { success: true };
  }

  async getAgentStatuses(userId) {
    const result = await this.pool.query(
      'SELECT * FROM agent_status WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  // ═══════════════════════════════════════════
  // WEBSOCKET HELPERS
  // ═══════════════════════════════════════════

  registerConnection(userId, socket) {
    this.connections.set(userId, socket);
    console.log(`[WS] User ${userId} connected`);
  }

  removeConnection(userId) {
    this.connections.delete(userId);
    console.log(`[WS] User ${userId} disconnected`);
  }

  pushToUser(userId, event, data) {
    const socket = this.connections.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
    // Also emit via IO if available
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  pushToChannel(channelId, event, data) {
    if (this.io) {
      this.io.to(`channel:${channelId}`).emit(event, data);
    }
  }

  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }
}

module.exports = RealtimeService;
