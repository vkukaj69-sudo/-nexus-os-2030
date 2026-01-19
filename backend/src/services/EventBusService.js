/**
 * NEXUS LEVIATHAN - Event Bus Service
 * Event-driven workflow triggers and cross-service communication
 *
 * Events flow through here to:
 * 1. Trigger automated workflows
 * 2. Enable cross-agent communication
 * 3. Track system activity
 * 4. Power the feedback loop
 */

const EventEmitter = require('events');

class EventBusService extends EventEmitter {
  constructor(pool, workflowService, config = {}) {
    super();
    this.pool = pool;
    this.workflows = workflowService;
    this.handlers = new Map();
    this.eventLog = [];
    this.maxLogSize = config.maxLogSize || 1000;

    // Increase max listeners for complex event chains
    this.setMaxListeners(100);

    // Setup internal handlers
    this.setupInternalHandlers();
  }

  /**
   * Pre-defined NEXUS events
   */
  static Events = {
    // Content events
    CONTENT_GENERATED: 'content.generated',
    CONTENT_PUBLISHED: 'content.published',
    CONTENT_EVOLVED: 'content.evolved',

    // Video events
    VIDEO_REQUESTED: 'video.requested',
    VIDEO_COMPLETED: 'video.completed',
    VIDEO_FAILED: 'video.failed',

    // Goal events
    GOAL_CREATED: 'goal.created',
    GOAL_UPDATED: 'goal.updated',
    GOAL_COMPLETED: 'goal.completed',
    GOAL_FAILED: 'goal.failed',

    // Feedback events
    FEEDBACK_RECEIVED: 'feedback.received',
    FEEDBACK_POSITIVE: 'feedback.positive',
    FEEDBACK_NEGATIVE: 'feedback.negative',

    // Memory events
    MEMORY_STORED: 'memory.stored',
    MEMORY_RECALLED: 'memory.recalled',
    MEMORY_CONSOLIDATED: 'memory.consolidated',

    // Agent events
    AGENT_TASK_STARTED: 'agent.task.started',
    AGENT_TASK_COMPLETED: 'agent.task.completed',
    AGENT_ERROR: 'agent.error',

    // Soul events
    SOUL_UPDATED: 'soul.updated',
    SOUL_SYNCED: 'soul.synced',

    // Philosophy events
    PHILOSOPHY_EVOLVED: 'philosophy.evolved',
    PHILOSOPHY_RULE_APPLIED: 'philosophy.rule.applied',

    // Arbitrage events
    GAP_DISCOVERED: 'arbitrage.gap.discovered',
    CAMPAIGN_STARTED: 'arbitrage.campaign.started',
    CAMPAIGN_COMPLETED: 'arbitrage.campaign.completed',

    // Simulation events
    SIMULATION_COMPLETED: 'simulation.completed',
    SIMULATION_VALIDATED: 'simulation.validated',

    // Revenue events
    PRODUCT_CREATED: 'revenue.product.created',
    SALE_COMPLETED: 'revenue.sale.completed',
    REFERRAL_CONVERTED: 'revenue.referral.converted',

    // System events
    SYSTEM_HEALTH_CHECK: 'system.health',
    SYSTEM_ERROR: 'system.error',
    USER_LOGIN: 'user.login',
    USER_SIGNUP: 'user.signup'
  };

  /**
   * Setup internal event handlers
   */
  setupInternalHandlers() {
    // Log all events
    this.on('*', (eventType, payload) => {
      this.logEvent(eventType, payload);
    });

    // Auto-process triggers on events
    this.on('*', async (eventType, payload) => {
      await this.processTriggers(eventType, payload);
    });
  }

  /**
   * Emit an event (override to support wildcard)
   */
  async emit(eventType, payload = {}) {
    // Add metadata
    const enrichedPayload = {
      ...payload,
      _eventType: eventType,
      _timestamp: new Date().toISOString(),
      _eventId: this.generateEventId()
    };

    // Emit wildcard for global handlers
    super.emit('*', eventType, enrichedPayload);

    // Emit specific event
    super.emit(eventType, enrichedPayload);

    // Store in database for persistence
    if (payload.userId) {
      await this.persistEvent(eventType, enrichedPayload);
    }

    return enrichedPayload._eventId;
  }

  /**
   * Subscribe to events with pattern matching
   */
  subscribe(pattern, handler) {
    // Support wildcards like 'content.*' or 'agent.task.*'
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const wrappedHandler = (eventType, payload) => {
        if (regex.test(eventType)) {
          handler(eventType, payload);
        }
      };
      this.on('*', wrappedHandler);
      return () => this.off('*', wrappedHandler);
    }

    // Direct event subscription
    this.on(pattern, handler);
    return () => this.off(pattern, handler);
  }

  /**
   * Process workflow triggers for an event
   */
  async processTriggers(eventType, payload) {
    if (!this.workflows) return;

    try {
      // Find matching triggers
      const triggers = await this.pool.query(`
        SELECT et.*, w.id as workflow_id, w.user_id
        FROM event_triggers et
        JOIN workflows w ON et.workflow_id = w.id
        WHERE et.event_type = $1 AND et.is_active = true AND w.is_active = true
      `, [eventType]);

      for (const trigger of triggers.rows) {
        // Check conditions
        if (!this.evaluateConditions(trigger.conditions, payload)) {
          continue;
        }

        // Check if trigger belongs to event's user (if userId present)
        if (payload.userId && trigger.user_id !== payload.userId) {
          continue;
        }

        console.log(`[EventBus] Triggering workflow for event: ${eventType}`);

        // Execute workflow
        this.workflows.executeWorkflow(
          trigger.workflow_id,
          trigger.user_id,
          { ...payload, triggeredBy: 'event', eventType },
          'event'
        ).catch(err => {
          console.error(`[EventBus] Workflow execution failed:`, err.message);
        });

        // Update trigger stats
        await this.pool.query(
          'UPDATE event_triggers SET triggered_count = triggered_count + 1 WHERE id = $1',
          [trigger.id]
        );
      }
    } catch (error) {
      console.error('[EventBus] Error processing triggers:', error.message);
    }
  }

  /**
   * Evaluate trigger conditions against payload
   */
  evaluateConditions(conditions, payload) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    for (const [field, expected] of Object.entries(conditions)) {
      const value = this.getNestedValue(payload, field);

      // Support operators
      if (typeof expected === 'object') {
        if (expected.$gt && !(value > expected.$gt)) return false;
        if (expected.$gte && !(value >= expected.$gte)) return false;
        if (expected.$lt && !(value < expected.$lt)) return false;
        if (expected.$lte && !(value <= expected.$lte)) return false;
        if (expected.$ne && value === expected.$ne) return false;
        if (expected.$in && !expected.$in.includes(value)) return false;
        if (expected.$contains && !String(value).includes(expected.$contains)) return false;
      } else {
        if (value !== expected) return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  /**
   * Create an event trigger
   */
  async createTrigger(userId, data) {
    const { workflowId, eventType, conditions = {}, name } = data;

    // Verify workflow belongs to user
    const workflow = await this.pool.query(
      'SELECT * FROM workflows WHERE id = $1 AND user_id = $2',
      [workflowId, userId]
    );

    if (!workflow.rows[0]) {
      return { success: false, error: 'Workflow not found' };
    }

    const result = await this.pool.query(`
      INSERT INTO event_triggers (user_id, workflow_id, event_type, conditions)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [userId, workflowId, eventType, conditions]);

    return { success: true, trigger: result.rows[0] };
  }

  /**
   * Get user's triggers
   */
  async getUserTriggers(userId) {
    const result = await this.pool.query(`
      SELECT et.*, w.name as workflow_name
      FROM event_triggers et
      JOIN workflows w ON et.workflow_id = w.id
      WHERE et.user_id = $1
      ORDER BY et.created_at DESC
    `, [userId]);

    return result.rows;
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(triggerId, userId) {
    await this.pool.query(
      'DELETE FROM event_triggers WHERE id = $1 AND user_id = $2',
      [triggerId, userId]
    );
    return { success: true };
  }

  /**
   * Toggle trigger active state
   */
  async toggleTrigger(triggerId, userId, isActive) {
    await this.pool.query(
      'UPDATE event_triggers SET is_active = $1 WHERE id = $2 AND user_id = $3',
      [isActive, triggerId, userId]
    );
    return { success: true };
  }

  /**
   * Log event to memory
   */
  logEvent(eventType, payload) {
    this.eventLog.push({
      type: eventType,
      payload: { ...payload },
      timestamp: new Date()
    });

    // Trim log if too large
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize / 2);
    }
  }

  /**
   * Persist event to database
   */
  async persistEvent(eventType, payload) {
    try {
      await this.pool.query(`
        INSERT INTO usage_events (user_id, event_type, event_data)
        VALUES ($1, $2, $3)
      `, [payload.userId, eventType, payload]);
    } catch (error) {
      // Silently fail - event logging shouldn't break the flow
      console.error('[EventBus] Failed to persist event:', error.message);
    }
  }

  /**
   * Get recent events for a user
   */
  async getRecentEvents(userId, limit = 50) {
    const result = await this.pool.query(`
      SELECT * FROM usage_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  }

  /**
   * Get available event types
   */
  getEventTypes() {
    return Object.entries(EventBusService.Events).map(([key, value]) => ({
      name: key,
      event: value
    }));
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Emit convenience methods for common events
   */
  async contentGenerated(userId, data) {
    return this.emit(EventBusService.Events.CONTENT_GENERATED, { userId, ...data });
  }

  async contentPublished(userId, data) {
    return this.emit(EventBusService.Events.CONTENT_PUBLISHED, { userId, ...data });
  }

  async videoCompleted(userId, data) {
    return this.emit(EventBusService.Events.VIDEO_COMPLETED, { userId, ...data });
  }

  async feedbackReceived(userId, data) {
    return this.emit(EventBusService.Events.FEEDBACK_RECEIVED, { userId, ...data });

    // Also emit positive/negative based on rating
    if (data.rating >= 4) {
      await this.emit(EventBusService.Events.FEEDBACK_POSITIVE, { userId, ...data });
    } else if (data.rating <= 2) {
      await this.emit(EventBusService.Events.FEEDBACK_NEGATIVE, { userId, ...data });
    }
  }

  async goalCompleted(userId, goalId, data = {}) {
    return this.emit(EventBusService.Events.GOAL_COMPLETED, { userId, goalId, ...data });
  }

  async agentTaskCompleted(userId, agentId, taskType, result) {
    return this.emit(EventBusService.Events.AGENT_TASK_COMPLETED, {
      userId,
      agentId,
      taskType,
      result,
      success: result?.success !== false
    });
  }

  async philosophyEvolved(userId, evolution) {
    return this.emit(EventBusService.Events.PHILOSOPHY_EVOLVED, { userId, ...evolution });
  }
}

module.exports = EventBusService;
