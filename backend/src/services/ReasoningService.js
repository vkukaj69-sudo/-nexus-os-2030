/**
 * NEXUS OS - Reasoning Engine Service
 * Multi-step reasoning, goal decomposition, decision-making
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ReasoningService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-3-flash' });
  }

  cleanJson(text) {
    // Remove control characters and clean JSON
    return text.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, ' ');
  }

  async createGoal(userId, data) {
    const { title, description = '', goalType = 'task', priority = 5, parentGoalId = null, deadline = null, context = {} } = data;
    const result = await this.pool.query(`
      INSERT INTO goals (user_id, parent_goal_id, title, description, goal_type, priority, deadline, context)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [userId, parentGoalId, title, description, goalType, priority, deadline, context]);
    return { success: true, goalId: result.rows[0].id };
  }

  async decomposeGoal(userId, goalId) {
    const goal = await this.pool.query('SELECT * FROM goals WHERE id = $1 AND user_id = $2', [goalId, userId]);
    if (!goal.rows[0]) return { success: false, error: 'Goal not found' };

    const prompt = `Decompose this goal into 3-7 actionable sub-tasks. Return JSON only:
{"subtasks": [{"title": "...", "description": "...", "priority": 1-10, "estimatedHours": number}]}

Goal: ${goal.rows[0].title}
Description: ${goal.rows[0].description || 'None'}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = this.cleanJson(result.response.text());
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, error: 'Failed to parse response' };

      const { subtasks } = JSON.parse(jsonMatch[0]);
      const createdSubtasks = [];

      for (const task of subtasks) {
        const subResult = await this.createGoal(userId, {
          title: task.title, description: task.description, goalType: 'task',
          priority: task.priority, parentGoalId: goalId, context: { estimatedHours: task.estimatedHours }
        });
        createdSubtasks.push({ ...task, id: subResult.goalId });
      }
      return { success: true, subtasks: createdSubtasks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getGoals(userId, status = null) {
    let query = 'SELECT * FROM goals WHERE user_id = $1';
    const params = [userId];
    if (status) { query += ' AND status = $2'; params.push(status); }
    query += ' ORDER BY priority DESC, created_at DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async reason(userId, input, chainType = 'analysis', goalId = null) {
    const startTime = Date.now();
    const systemPrompt = this.getReasoningPrompt(chainType);
    
    const prompt = `${systemPrompt}

Input: ${input}

Respond with valid JSON only (no markdown, no code blocks):
{"steps": [{"thought": "...", "action": "...", "result": "..."}], "conclusion": "...", "confidence": 0.8, "nextActions": ["..."]}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = this.cleanJson(result.response.text());
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) return { success: false, error: 'Failed to parse reasoning' };

      const reasoning = JSON.parse(jsonMatch[0]);
      const executionTime = Date.now() - startTime;

      const chainResult = await this.pool.query(`
        INSERT INTO reasoning_chains (user_id, goal_id, trigger_input, chain_type, steps, conclusion, confidence, execution_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [userId, goalId, input, chainType, JSON.stringify(reasoning.steps), reasoning.conclusion, reasoning.confidence, executionTime]);

      return { success: true, chainId: chainResult.rows[0].id, ...reasoning, executionTimeMs: executionTime };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getReasoningPrompt(chainType) {
    const prompts = {
      analysis: 'You are an analytical reasoning engine. Break down problems systematically.',
      planning: 'You are a strategic planning engine. Create actionable plans with clear steps.',
      decision: 'You are a decision-making engine. Evaluate options and recommend optimal choices.',
      evaluation: 'You are an evaluation engine. Assess performance and suggest improvements.',
      creative: 'You are a creative reasoning engine. Generate innovative ideas and solutions.'
    };
    return prompts[chainType] || prompts.analysis;
  }

  async makeDecision(userId, decisionType, options, context = {}) {
    const input = `Decision: ${decisionType}. Options: ${JSON.stringify(options)}. Context: ${JSON.stringify(context)}`;
    return this.reason(userId, input, 'decision');
  }

  async chainOfThought(userId, problem, maxSteps = 5) {
    const input = `Solve step by step (max ${maxSteps} steps): ${problem}`;
    return this.reason(userId, input, 'analysis');
  }
}

module.exports = ReasoningService;
