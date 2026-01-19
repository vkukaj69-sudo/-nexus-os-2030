/**
 * NEXUS LEVIATHAN - Scheduler Service
 * Cron-based autonomous task execution
 *
 * Handles:
 * - Scheduled workflow execution
 * - Missed task recovery
 * - Dynamic schedule management
 * - Rate limit aware scheduling
 */

const cron = require('node-cron');

class SchedulerService {
  constructor(pool, workflowService, config = {}) {
    this.pool = pool;
    this.workflows = workflowService;
    this.activeJobs = new Map();
    this.timezone = config.timezone || 'UTC';
    this.checkInterval = config.checkInterval || 60000; // 1 minute
    this.isRunning = false;
  }

  /**
   * Initialize scheduler and load all active tasks
   */
  async initialize() {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    console.log('[Scheduler] Initializing...');

    // Load all active scheduled tasks
    const tasks = await this.pool.query(`
      SELECT st.*, w.name as workflow_name
      FROM scheduled_tasks st
      JOIN workflows w ON st.workflow_id = w.id
      WHERE st.is_active = true
    `);

    for (const task of tasks.rows) {
      await this.scheduleTask(task);
    }

    // Start background job to check for missed tasks
    this.missedTaskChecker = setInterval(() => this.checkMissedTasks(), this.checkInterval);

    // Start job to expire old attention gaps
    this.gapExpiryChecker = setInterval(() => this.expireAttentionGaps(), 3600000); // Hourly

    // Start rate limit reset job
    this.rateLimitResetter = setInterval(() => this.resetRateLimits(), 3600000); // Hourly

    this.isRunning = true;
    console.log(`[Scheduler] Initialized with ${tasks.rows.length} active tasks`);
  }

  /**
   * Schedule a single task
   */
  async scheduleTask(task) {
    // Validate cron expression
    if (!cron.validate(task.cron_expression)) {
      console.error(`[Scheduler] Invalid cron expression for task ${task.id}: ${task.cron_expression}`);
      return;
    }

    // Stop existing job if any
    if (this.activeJobs.has(task.id)) {
      this.activeJobs.get(task.id).stop();
    }

    // Create new cron job
    const job = cron.schedule(task.cron_expression, async () => {
      console.log(`[Scheduler] Executing task: ${task.name} (${task.id})`);
      await this.executeScheduledTask(task);
    }, {
      timezone: task.timezone || this.timezone
    });

    this.activeJobs.set(task.id, job);

    // Calculate and store next run time
    const nextRun = this.getNextRunTime(task.cron_expression, task.timezone || this.timezone);
    await this.pool.query(
      'UPDATE scheduled_tasks SET next_run_at = $1 WHERE id = $2',
      [nextRun, task.id]
    );

    console.log(`[Scheduler] Scheduled task "${task.name}" - next run: ${nextRun}`);
  }

  /**
   * Execute a scheduled task
   */
  async executeScheduledTask(task) {
    const startTime = Date.now();

    try {
      // Execute the workflow
      const result = await this.workflows.executeWorkflow(
        task.workflow_id,
        task.user_id,
        {
          triggeredBy: 'scheduler',
          taskId: task.id,
          taskName: task.name,
          scheduledTime: new Date().toISOString()
        },
        'scheduled'
      );

      // Update task stats
      const nextRun = this.getNextRunTime(task.cron_expression, task.timezone || this.timezone);
      await this.pool.query(`
        UPDATE scheduled_tasks
        SET run_count = run_count + 1,
            last_run_at = NOW(),
            next_run_at = $1
        WHERE id = $2
      `, [nextRun, task.id]);

      console.log(`[Scheduler] Task "${task.name}" completed in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      console.error(`[Scheduler] Task "${task.name}" failed:`, error.message);

      // Log failure but don't stop scheduling
      await this.pool.query(`
        UPDATE scheduled_tasks
        SET last_run_at = NOW(),
            next_run_at = $1
        WHERE id = $2
      `, [this.getNextRunTime(task.cron_expression, task.timezone || this.timezone), task.id]);

      return { success: false, error: error.message };
    }
  }

  /**
   * Check for and execute missed tasks
   */
  async checkMissedTasks() {
    try {
      // Find tasks that should have run but didn't
      const missed = await this.pool.query(`
        SELECT st.*, w.name as workflow_name
        FROM scheduled_tasks st
        JOIN workflows w ON st.workflow_id = w.id
        WHERE st.is_active = true
          AND st.next_run_at < NOW() - INTERVAL '5 minutes'
          AND (st.last_run_at IS NULL OR st.last_run_at < st.next_run_at)
      `);

      for (const task of missed.rows) {
        console.log(`[Scheduler] Executing missed task: ${task.name}`);
        await this.executeScheduledTask(task);
      }

      if (missed.rows.length > 0) {
        console.log(`[Scheduler] Executed ${missed.rows.length} missed tasks`);
      }
    } catch (error) {
      console.error('[Scheduler] Error checking missed tasks:', error.message);
    }
  }

  /**
   * Create a new scheduled task
   */
  async createScheduledTask(userId, data) {
    const { name, workflowId, cronExpression, timezone = 'UTC' } = data;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      return { success: false, error: 'Invalid cron expression' };
    }

    // Verify workflow exists and belongs to user
    const workflow = await this.pool.query(
      'SELECT * FROM workflows WHERE id = $1 AND user_id = $2',
      [workflowId, userId]
    );

    if (!workflow.rows[0]) {
      return { success: false, error: 'Workflow not found' };
    }

    const nextRun = this.getNextRunTime(cronExpression, timezone);

    const result = await this.pool.query(`
      INSERT INTO scheduled_tasks (user_id, workflow_id, name, cron_expression, timezone, next_run_at)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [userId, workflowId, name, cronExpression, timezone, nextRun]);

    const task = result.rows[0];

    // Schedule the task immediately
    await this.scheduleTask({
      ...task,
      workflow_name: workflow.rows[0].name
    });

    return { success: true, task };
  }

  /**
   * Pause a scheduled task
   */
  async pauseTask(taskId, userId) {
    // Stop the cron job
    if (this.activeJobs.has(taskId)) {
      this.activeJobs.get(taskId).stop();
      this.activeJobs.delete(taskId);
    }

    await this.pool.query(
      'UPDATE scheduled_tasks SET is_active = false WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    return { success: true };
  }

  /**
   * Resume a paused task
   */
  async resumeTask(taskId, userId) {
    const result = await this.pool.query(`
      SELECT st.*, w.name as workflow_name
      FROM scheduled_tasks st
      JOIN workflows w ON st.workflow_id = w.id
      WHERE st.id = $1 AND st.user_id = $2
    `, [taskId, userId]);

    if (!result.rows[0]) {
      return { success: false, error: 'Task not found' };
    }

    await this.pool.query(
      'UPDATE scheduled_tasks SET is_active = true WHERE id = $1',
      [taskId]
    );

    await this.scheduleTask(result.rows[0]);

    return { success: true };
  }

  /**
   * Delete a scheduled task
   */
  async deleteTask(taskId, userId) {
    // Stop the cron job
    if (this.activeJobs.has(taskId)) {
      this.activeJobs.get(taskId).stop();
      this.activeJobs.delete(taskId);
    }

    await this.pool.query(
      'DELETE FROM scheduled_tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    return { success: true };
  }

  /**
   * Update task schedule
   */
  async updateTask(taskId, userId, data) {
    const { name, cronExpression, timezone } = data;

    if (cronExpression && !cron.validate(cronExpression)) {
      return { success: false, error: 'Invalid cron expression' };
    }

    const updates = ['updated_at = NOW()'];
    const params = [taskId, userId];
    let paramCount = 2;

    if (name) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(name);
    }

    if (cronExpression) {
      paramCount++;
      updates.push(`cron_expression = $${paramCount}`);
      params.push(cronExpression);

      const nextRun = this.getNextRunTime(cronExpression, timezone || 'UTC');
      paramCount++;
      updates.push(`next_run_at = $${paramCount}`);
      params.push(nextRun);
    }

    if (timezone) {
      paramCount++;
      updates.push(`timezone = $${paramCount}`);
      params.push(timezone);
    }

    await this.pool.query(`
      UPDATE scheduled_tasks SET ${updates.join(', ')}
      WHERE id = $1 AND user_id = $2
    `, params);

    // Reschedule if cron changed
    if (cronExpression) {
      const task = await this.pool.query(`
        SELECT st.*, w.name as workflow_name
        FROM scheduled_tasks st
        JOIN workflows w ON st.workflow_id = w.id
        WHERE st.id = $1
      `, [taskId]);

      if (task.rows[0]) {
        await this.scheduleTask(task.rows[0]);
      }
    }

    return { success: true };
  }

  /**
   * Get user's scheduled tasks
   */
  async getUserTasks(userId) {
    const result = await this.pool.query(`
      SELECT st.*, w.name as workflow_name
      FROM scheduled_tasks st
      JOIN workflows w ON st.workflow_id = w.id
      WHERE st.user_id = $1
      ORDER BY st.next_run_at ASC
    `, [userId]);

    return result.rows;
  }

  /**
   * Calculate next run time from cron expression
   */
  getNextRunTime(cronExpression, timezone = 'UTC') {
    try {
      // Use a simple calculation based on cron parts
      // This is a simplified version - in production, use a proper cron parser
      const now = new Date();
      const parts = cronExpression.split(' ');

      if (parts.length >= 5) {
        // Add 1 minute minimum for next run
        return new Date(now.getTime() + 60000);
      }

      return new Date(now.getTime() + 60000);
    } catch {
      return new Date(Date.now() + 60000);
    }
  }

  /**
   * Expire old attention gaps
   */
  async expireAttentionGaps() {
    try {
      await this.pool.query(`
        UPDATE attention_gaps
        SET status = 'expired'
        WHERE expires_at < NOW() AND status = 'active'
      `);
    } catch (error) {
      console.error('[Scheduler] Error expiring attention gaps:', error.message);
    }
  }

  /**
   * Reset rate limits
   */
  async resetRateLimits() {
    try {
      // Reset hourly counts
      await this.pool.query(`
        UPDATE rate_limits
        SET current_hour_count = 0
        WHERE last_reset < NOW() - INTERVAL '1 hour'
      `);

      // Reset daily counts
      await this.pool.query(`
        UPDATE rate_limits
        SET current_day_count = 0, last_reset = NOW()
        WHERE last_reset < NOW() - INTERVAL '1 day'
      `);
    } catch (error) {
      console.error('[Scheduler] Error resetting rate limits:', error.message);
    }
  }

  /**
   * Shutdown scheduler gracefully
   */
  async shutdown() {
    console.log('[Scheduler] Shutting down...');

    // Stop all cron jobs
    for (const [taskId, job] of this.activeJobs) {
      job.stop();
    }
    this.activeJobs.clear();

    // Clear intervals
    if (this.missedTaskChecker) clearInterval(this.missedTaskChecker);
    if (this.gapExpiryChecker) clearInterval(this.gapExpiryChecker);
    if (this.rateLimitResetter) clearInterval(this.rateLimitResetter);

    this.isRunning = false;
    console.log('[Scheduler] Shutdown complete');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTaskCount: this.activeJobs.size,
      tasks: Array.from(this.activeJobs.keys())
    };
  }
}

module.exports = SchedulerService;
