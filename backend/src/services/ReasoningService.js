/**
 * NEXUS OS - Reasoning Engine Service
 * Multi-step reasoning, goal decomposition, decision-making
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ReasoningService {
  constructor(pool, config = {}) {
    this.pool = pool;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  // ═══════════════════════════════════════════
  // GOAL MANAGEMENT
  // ═══════════════════════════════════════════

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
{
  "subtasks": [{"title": "...", "description": "...", "priority": 1-10, "estimatedHours": number}]
}

Goal: ${goal.rows[0].title}
Description: ${goal.rows[0].description || 'None'}`;

    try {
      const result = await this.model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { success: false, error: 'Failed to parse response' };

      const { subtasks } = JSON.parse(jsonMatch[0]);
      const createdSubtasks = [];

      for (const task of subtasks) {
        const subResult = await this.createGoal(userId, {
          title: task.title,
          description: task.description,
          goalType: 'task',
          priority: task.priority,
          parentGoalId: goalId,
          context: { estimatedHours: task.estimatedHours }
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

  async updateGoalProgress(userId, goalId, progress, status = null) {
    let query = 'UPDATE goals SET progress = $1, updated_at = NOW()';
    const params = [progress, goalId, userId];
    if (status) { query += ', status = $4'; params.push(status); }
    query += ' WHERE id = $2 AND user_id = $3 RETURNING *';

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  // ═══════════════════════════════════════════
  // REASONING CHAINS
  // ═══════════════════════════════════════════

  async reason(userId, input, chainType = 'analysis', goalId = null) {
    const startTime = Date.now();
    const steps = [];

    const systemPrompt = this.getReasoningPrompt(chainType);
    const prompt = `${systemPrompt}\n\nInput: ${input}\n\nProvide your reasoning as JSON:
{
  "steps": [{"thought": "...", "action": "...", "result": "..."}],
  "conclusion": "...",
  "confidence": 0.0-1.0,
  "nextActions": ["..."]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return { success: false, error: 'Failed to parse reasoning' };
      }

      const reasoning = JSON.parse(jsonMatch[0]);
      const executionTime = Date.now() - startTime;

      // Store reasoning chain
      const chainResult = await this.pool.query(`
        INSERT INTO reasoning_chains (user_id, goal_id, trigger_input, chain_type, steps, conclusion, confidence, execution_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [userId, goalId, input, chainType, JSON.stringify(reasoning.steps), reasoning.conclusion, reasoning.confidence, executionTime]);

      return {
        success: true,
        chainId: chainResult.rows[0].id,
        ...reasoning,
        executionTimeMs: executionTime
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getReasoningPrompt(chainType) {
    const prompts = {
      analysis: 'You are an analytical reasoning engine. Break down the problem systematically, identify key factors, and provide evidence-based conclusions.',
      planning: 'You are a strategic planning engine. Create actionable plans with clear steps, dependencies, and success criteria.',
      decision: 'You are a decision-making engine. Evaluate options objectively, weigh pros and cons, and recommend the optimal choice with rationale.',
      evaluation: 'You are an evaluation engine. Assess performance, identify strengths and weaknesses, and suggest improvements.',
      creative: 'You are a creative reasoning engine. Generate innovative ideas, explore unconventional approaches, and find unique solutions.'
    };
    return prompts[chainType] || prompts.analysis;
  }

  // ═══════════════════════════════════════════
  // DECISION MAKING
  // ═══════════════════════════════════════════

  async makeDecision(userId, decisionType, options, context = {}) {
    const prompt = `You are a decision engine. Analyze these options and recommend the best choice.

Decision Type: ${decisionType}
Context: ${JSON.stringify(context)}
Options: ${JSON.stringify(options)}

Return JSON:
{
  "analysis": [{"option": "...", "pros": [...], "cons": [...], "score": 0-10}],
  "recommendation": {"option": "...", "rationale": "...", "confidence": 0.0-1.0},
  "risks": ["..."],
  "alternatives": ["..."]
}`;

    try {
      const reasoningResult = await this.reason(userId, prompt, 'decision');
      if (!reasoningResult.success) return reasoningResult;

      // Parse the conclusion for structured decision
      const decisionResult = await this.pool.query(`
        INSERT INTO decisions (user_id, reasoning_chain_id, decision_type, options, chosen_option, rationale)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, [userId, reasoningResult.chainId, decisionType, JSON.stringify(options), 
          JSON.stringify(reasoningResult.nextActions?.[0] || {}), reasoningResult.conclusion]);

      return {
        success: true,
        decisionId: decisionResult.rows[0].id,
        ...reasoningResult
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ═══════════════════════════════════════════
  // MULTI-STEP REASONING (Chain of Thought)
  // ═══════════════════════════════════════════

  async chainOfThought(userId, problem, maxSteps = 5) {
    const steps = [];
    let currentContext = problem;
    let solved = false;

    for (let i = 0; i < maxSteps && !solved; i++) {
      const stepPrompt = `Step ${i + 1} of reasoning about: "${problem}"
      
Previous context: ${currentContext}

Think step by step. Return JSON:
{
  "thought": "What I'm thinking about...",
  "action": "What I'll do next...",
  "observation": "What I found...",
  "isSolved": boolean,
  "nextQuestion": "If not solved, what to explore next..."
}`;

      try {
        const result = await this.model.generateContent(stepPrompt);
        const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
        if (!jsonMatch) break;

        const step = JSON.parse(jsonMatch[0]);
        steps.push({ step: i + 1, ...step });
        
        solved = step.isSolved;
        currentContext = step.observation;
      } catch (error) {
        steps.push({ step: i + 1, error: error.message });
        break;
      }
    }

    // Store the chain
    const chainResult = await this.pool.query(`
      INSERT INTO reasoning_chains (user_id, trigger_input, chain_type, steps, conclusion, confidence)
      VALUES ($1, $2, 'analysis', $3, $4, $5) RETURNING id
    `, [userId, problem, JSON.stringify(steps), 
        steps[steps.length - 1]?.observation || 'Incomplete', 
        solved ? 0.9 : 0.5]);

    return {
      success: true,
      chainId: chainResult.rows[0].id,
      steps,
      solved,
      finalAnswer: steps[steps.length - 1]?.observation
    };
  }
}

module.exports = ReasoningService;
