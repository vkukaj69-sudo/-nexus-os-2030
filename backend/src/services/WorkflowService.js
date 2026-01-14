/**
 * NEXUS OS - Workflow Engine Service
 * Autonomous multi-agent pipelines
 */

const crypto = require('crypto');

class WorkflowService {
  constructor(pool, agents, config = {}) {
    this.pool = pool;
    this.agents = agents; // Map of agent instances
    this.runningWorkflows = new Map();
  }

  // ═══════════════════════════════════════════
  // WORKFLOW CRUD
  // ═══════════════════════════════════════════

  async createWorkflow(userId, data) {
    const { name, description = '', triggerType = 'manual', triggerConfig = {}, steps = [], orgId = null } = data;

    const result = await this.pool.query(`
      INSERT INTO workflows (user_id, org_id, name, description, trigger_type, trigger_config, steps)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [userId, orgId, name, description, triggerType, triggerConfig, JSON.stringify(steps)]);

    return { success: true, workflow: result.rows[0] };
  }

  async getWorkflow(workflowId) {
    const result = await this.pool.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
    return result.rows[0];
  }

  async getUserWorkflows(userId) {
    const result = await this.pool.query(
      'SELECT * FROM workflows WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  }

  async updateWorkflow(workflowId, userId, data) {
    const { name, description, steps, triggerType, triggerConfig, isActive } = data;
    const updates = ['updated_at = NOW()'];
    const params = [workflowId, userId];
    let paramCount = 2;

    if (name) { paramCount++; updates.push(`name = $${paramCount}`); params.push(name); }
    if (description !== undefined) { paramCount++; updates.push(`description = $${paramCount}`); params.push(description); }
    if (steps) { paramCount++; updates.push(`steps = $${paramCount}`); params.push(JSON.stringify(steps)); }
    if (triggerType) { paramCount++; updates.push(`trigger_type = $${paramCount}`); params.push(triggerType); }
    if (triggerConfig) { paramCount++; updates.push(`trigger_config = $${paramCount}`); params.push(triggerConfig); }
    if (isActive !== undefined) { paramCount++; updates.push(`is_active = $${paramCount}`); params.push(isActive); }

    await this.pool.query(
      `UPDATE workflows SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2`,
      params
    );

    return { success: true };
  }

  // ═══════════════════════════════════════════
  // WORKFLOW EXECUTION
  // ═══════════════════════════════════════════

  async executeWorkflow(workflowId, userId, inputData = {}, triggerSource = 'manual') {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return { success: false, error: 'Workflow not found' };
    if (!workflow.is_active) return { success: false, error: 'Workflow is inactive' };

    // Create run record
    const runResult = await this.pool.query(`
      INSERT INTO workflow_runs (workflow_id, user_id, status, trigger_source, input_data, started_at)
      VALUES ($1, $2, 'running', $3, $4, NOW()) RETURNING id
    `, [workflowId, userId, triggerSource, inputData]);

    const runId = runResult.rows[0].id;
    const steps = workflow.steps || [];
    const stepResults = [];
    let currentData = { ...inputData };

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Update current step
        await this.pool.query(
          'UPDATE workflow_runs SET current_step = $1 WHERE id = $2',
          [i + 1, runId]
        );

        const stepResult = await this.executeStep(step, currentData, userId);
        stepResults.push({ step: i + 1, ...step, result: stepResult });

        if (!stepResult.success) {
          throw new Error(`Step ${i + 1} failed: ${stepResult.error}`);
        }

        // Pass output to next step
        currentData = { ...currentData, ...stepResult.output };
      }

      // Mark completed
      await this.pool.query(`
        UPDATE workflow_runs SET status = 'completed', output_data = $1, step_results = $2, completed_at = NOW()
        WHERE id = $3
      `, [currentData, JSON.stringify(stepResults), runId]);

      // Update workflow stats
      await this.pool.query(`
        UPDATE workflows SET run_count = run_count + 1, last_run_at = NOW() WHERE id = $1
      `, [workflowId]);

      return { success: true, runId, output: currentData, stepResults };

    } catch (error) {
      await this.pool.query(`
        UPDATE workflow_runs SET status = 'failed', error_message = $1, step_results = $2, completed_at = NOW()
        WHERE id = $3
      `, [error.message, JSON.stringify(stepResults), runId]);

      return { success: false, runId, error: error.message, stepResults };
    }
  }

  async executeStep(step, inputData, userId) {
    const { type, agent, action, config = {} } = step;

    try {
      switch (type) {
        case 'agent':
          return await this.executeAgentStep(agent, action, inputData, config, userId);
        case 'condition':
          return this.evaluateCondition(config.condition, inputData);
        case 'transform':
          return this.transformData(config.transform, inputData);
        case 'delay':
          await new Promise(resolve => setTimeout(resolve, (config.seconds || 1) * 1000));
          return { success: true, output: inputData };
        case 'webhook':
          return await this.callWebhook(config.url, config.method || 'POST', inputData);
        default:
          return { success: false, error: `Unknown step type: ${type}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async executeAgentStep(agentId, action, inputData, config, userId) {
    // This would call the actual agent
    // For now, simulate agent execution
    return {
      success: true,
      output: {
        agentResult: `Agent ${agentId} executed ${action}`,
        processedAt: new Date().toISOString(),
        ...inputData
      }
    };
  }

  evaluateCondition(condition, data) {
    try {
      const { field, operator, value } = condition;
      const fieldValue = data[field];

      let result = false;
      switch (operator) {
        case 'equals': result = fieldValue === value; break;
        case 'not_equals': result = fieldValue !== value; break;
        case 'contains': result = String(fieldValue).includes(value); break;
        case 'greater_than': result = fieldValue > value; break;
        case 'less_than': result = fieldValue < value; break;
        default: result = false;
      }

      return { success: true, output: { conditionMet: result, ...data } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  transformData(transform, data) {
    try {
      const output = { ...data };
      for (const [key, expression] of Object.entries(transform)) {
        if (expression.startsWith('$')) {
          output[key] = data[expression.substring(1)];
        } else {
          output[key] = expression;
        }
      }
      return { success: true, output };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async callWebhook(url, method, data) {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      return { success: true, output: { webhookResponse: result } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════
  // WORKFLOW RUNS
  // ═══════════════════════════════════════════

  async getWorkflowRuns(workflowId, limit = 20) {
    const result = await this.pool.query(
      'SELECT * FROM workflow_runs WHERE workflow_id = $1 ORDER BY created_at DESC LIMIT $2',
      [workflowId, limit]
    );
    return result.rows;
  }

  async getRunDetails(runId) {
    const result = await this.pool.query('SELECT * FROM workflow_runs WHERE id = $1', [runId]);
    return result.rows[0];
  }

  // ═══════════════════════════════════════════
  // WEBHOOKS
  // ═══════════════════════════════════════════

  async createWebhook(userId, workflowId, name) {
    const endpointKey = crypto.randomBytes(32).toString('hex');
    const secret = crypto.randomBytes(16).toString('hex');
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const result = await this.pool.query(`
      INSERT INTO webhooks (user_id, workflow_id, name, endpoint_key, secret_hash)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, endpoint_key
    `, [userId, workflowId, name, endpointKey, secretHash]);

    return {
      success: true,
      webhookId: result.rows[0].id,
      endpoint: `/api/webhook/${endpointKey}`,
      secret
    };
  }

  async triggerWebhook(endpointKey, payload) {
    const result = await this.pool.query(`
      SELECT w.*, wf.id as workflow_id FROM webhooks w
      JOIN workflows wf ON w.workflow_id = wf.id
      WHERE w.endpoint_key = $1 AND w.is_active = true
    `, [endpointKey]);

    if (!result.rows[0]) return { success: false, error: 'Webhook not found' };

    const webhook = result.rows[0];

    // Update webhook stats
    await this.pool.query(
      'UPDATE webhooks SET call_count = call_count + 1, last_called_at = NOW() WHERE id = $1',
      [webhook.id]
    );

    // Execute workflow
    return this.executeWorkflow(webhook.workflow_id, webhook.user_id, payload, 'webhook');
  }
}

module.exports = WorkflowService;
