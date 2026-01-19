# NEXUS OS → Self-Evolving Growth Protocol (SEGP)
## Implementation Plan - Backend Only (UI Preserved)

---

## Executive Summary

The NEXUS OS backend already has **~70% of SEGP infrastructure** built. This plan focuses on completing the remaining services to achieve full autonomy.

---

## Current State Analysis

### ✅ ALREADY IMPLEMENTED (No Changes Needed)

| Component | Status | Location |
|-----------|--------|----------|
| **Vector Memory** | ✅ Complete | `services/MemoryService.js` |
| - text-embedding-004 embeddings | ✅ | |
| - pgvector semantic search | ✅ | |
| - Episodic/Semantic/Procedural memory | ✅ | |
| - Memory consolidation | ✅ | |
| - Context building | ✅ | |
| **Self-Improvement** | ✅ Complete | `services/SelfImprovementService.js` |
| - Performance metrics | ✅ | |
| - Feedback learning | ✅ | |
| - A/B experiments | ✅ | |
| - Self-analysis | ✅ | |
| **Reasoning Engine** | ✅ Complete | `services/ReasoningService.js` |
| - Goal management | ✅ | |
| - Goal decomposition | ✅ | |
| - Chain-of-thought | ✅ | |
| - Decision making | ✅ | |
| **Workflow Engine** | ✅ Partial | `services/WorkflowService.js` |
| - Workflow CRUD | ✅ | |
| - Step execution | ✅ | |
| - Webhooks | ✅ | |
| **Database Schema** | ✅ Complete | `db/migrations/*.sql` |

### ❌ MISSING COMPONENTS (To Be Built)

| Component | Priority | Effort |
|-----------|----------|--------|
| **Evolver Loop** | HIGH | 2-3 days |
| **Scheduler Service** | HIGH | 1-2 days |
| **Event Bus Service** | MEDIUM | 1-2 days |
| **Real Agent Integration** | HIGH | 1 day |
| **Autonomous Goal Engine** | MEDIUM | 2-3 days |
| **Treasury Protocol** | LOW | 3-4 days |

---

## Phase 1: Evolver Loop (Self-Critique)
**Priority: HIGH | Effort: 2-3 days**

### Purpose
Before any agent output is delivered to the user, it passes through a self-critique loop that:
1. Evaluates output quality
2. Checks brand/voice consistency
3. Suggests improvements
4. Optionally regenerates with improvements

### New File: `services/EvolverService.js`

```javascript
/**
 * NEXUS OS - Evolver Service
 * Self-critique loop for output enhancement
 */

class EvolverService {
  constructor(pool, memoryService, config = {}) {
    this.pool = pool;
    this.memory = memoryService;
    this.genAI = new GoogleGenerativeAI(config.geminiKey || process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.maxIterations = config.maxIterations || 3;
  }

  async evolve(userId, agentId, output, context = {}) {
    // 1. Get user's Digital Soul for voice consistency
    const soul = await this.memory.getSoul(userId);

    // 2. Get active improvements for this agent
    const improvements = await this.getImprovements(userId, agentId);

    // 3. Self-critique loop
    let current = output;
    let iterations = 0;
    const evolutionLog = [];

    while (iterations < this.maxIterations) {
      const critique = await this.critique(current, soul, improvements, context);
      evolutionLog.push(critique);

      if (critique.score >= 0.85 || !critique.shouldImprove) {
        break;
      }

      current = await this.regenerate(current, critique.suggestions, context);
      iterations++;
    }

    // 4. Log evolution for learning
    await this.logEvolution(userId, agentId, output, current, evolutionLog);

    return {
      original: output,
      evolved: current,
      iterations,
      evolutionLog,
      finalScore: evolutionLog[evolutionLog.length - 1]?.score || 0
    };
  }

  async critique(output, soul, improvements, context) {
    const prompt = `Critique this AI output for quality and consistency.

OUTPUT:
${typeof output === 'string' ? output : JSON.stringify(output)}

CREATOR VOICE PROFILE:
${soul ? JSON.stringify(soul.semantic_fingerprint) : 'Not defined'}

LEARNED IMPROVEMENTS TO APPLY:
${improvements.map(i => `- ${i.improvement}`).join('\n') || 'None'}

CONTEXT:
${JSON.stringify(context)}

Return JSON only:
{
  "score": 0.0-1.0,
  "shouldImprove": boolean,
  "issues": ["..."],
  "suggestions": ["..."],
  "voiceConsistency": 0.0-1.0
}`;

    const result = await this.model.generateContent(prompt);
    return JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);
  }

  async regenerate(output, suggestions, context) {
    const prompt = `Improve this output based on the suggestions.

ORIGINAL:
${typeof output === 'string' ? output : JSON.stringify(output)}

SUGGESTIONS:
${suggestions.join('\n')}

Return the improved output only, maintaining the same format.`;

    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async logEvolution(userId, agentId, original, evolved, log) {
    // Store evolution for learning patterns
    await this.pool.query(`
      INSERT INTO episodic_memories
      (user_id, agent_id, interaction_type, input_summary, output_summary, outcome, context)
      VALUES ($1, $2, 'evolution', $3, $4, 'success', $5)
    `, [userId, agentId, original.substring(0, 500), evolved.substring(0, 500), { evolutionLog: log }]);
  }
}
```

### Integration Points
- Wrap all agent `execute()` outputs through `EvolverService.evolve()`
- Add API endpoint: `POST /api/oracle/evolve`
- Configure per-agent evolution settings

---

## Phase 2: Scheduler Service (Zero-Prompt Automation)
**Priority: HIGH | Effort: 1-2 days**

### Purpose
Execute scheduled_tasks from the database using cron expressions.

### New File: `services/SchedulerService.js`

```javascript
/**
 * NEXUS OS - Scheduler Service
 * Cron-based autonomous task execution
 */

const cron = require('node-cron');
const { CronJob } = require('cron');

class SchedulerService {
  constructor(pool, workflowService, config = {}) {
    this.pool = pool;
    this.workflows = workflowService;
    this.activeJobs = new Map();
    this.timezone = config.timezone || 'UTC';
  }

  async initialize() {
    // Load all active scheduled tasks
    const tasks = await this.pool.query(`
      SELECT * FROM scheduled_tasks WHERE is_active = true
    `);

    for (const task of tasks.rows) {
      await this.scheduleTask(task);
    }

    // Check for missed tasks every minute
    setInterval(() => this.checkMissedTasks(), 60000);

    console.log(`[Scheduler] Initialized with ${tasks.rows.length} active tasks`);
  }

  async scheduleTask(task) {
    if (this.activeJobs.has(task.id)) {
      this.activeJobs.get(task.id).stop();
    }

    const job = new CronJob(
      task.cron_expression,
      async () => {
        await this.executeScheduledTask(task);
      },
      null,
      true,
      task.timezone || this.timezone
    );

    this.activeJobs.set(task.id, job);

    // Update next_run_at
    await this.pool.query(
      'UPDATE scheduled_tasks SET next_run_at = $1 WHERE id = $2',
      [job.nextDate().toJSDate(), task.id]
    );
  }

  async executeScheduledTask(task) {
    try {
      const result = await this.workflows.executeWorkflow(
        task.workflow_id,
        task.user_id,
        { triggeredBy: 'scheduler', taskId: task.id },
        'scheduled'
      );

      // Update stats
      await this.pool.query(`
        UPDATE scheduled_tasks
        SET run_count = run_count + 1,
            last_run_at = NOW(),
            next_run_at = $1
        WHERE id = $2
      `, [this.activeJobs.get(task.id)?.nextDate()?.toJSDate(), task.id]);

      return result;
    } catch (error) {
      console.error(`[Scheduler] Task ${task.id} failed:`, error.message);
    }
  }

  async checkMissedTasks() {
    // Find tasks that should have run but didn't
    const missed = await this.pool.query(`
      SELECT * FROM scheduled_tasks
      WHERE is_active = true
        AND next_run_at < NOW() - INTERVAL '5 minutes'
    `);

    for (const task of missed.rows) {
      console.log(`[Scheduler] Executing missed task: ${task.name}`);
      await this.executeScheduledTask(task);
    }
  }

  async createScheduledTask(userId, data) {
    const { name, workflowId, cronExpression, timezone = 'UTC' } = data;

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      return { success: false, error: 'Invalid cron expression' };
    }

    const result = await this.pool.query(`
      INSERT INTO scheduled_tasks (user_id, workflow_id, name, cron_expression, timezone)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [userId, workflowId, name, cronExpression, timezone]);

    const task = result.rows[0];
    await this.scheduleTask(task);

    return { success: true, task };
  }

  async pauseTask(taskId) {
    if (this.activeJobs.has(taskId)) {
      this.activeJobs.get(taskId).stop();
      this.activeJobs.delete(taskId);
    }
    await this.pool.query('UPDATE scheduled_tasks SET is_active = false WHERE id = $1', [taskId]);
  }

  async resumeTask(taskId) {
    const result = await this.pool.query('SELECT * FROM scheduled_tasks WHERE id = $1', [taskId]);
    if (result.rows[0]) {
      await this.pool.query('UPDATE scheduled_tasks SET is_active = true WHERE id = $1', [taskId]);
      await this.scheduleTask(result.rows[0]);
    }
  }
}
```

### Integration Points
- Initialize on server startup: `scheduler.initialize()`
- Add API endpoints:
  - `POST /api/scheduler/create`
  - `POST /api/scheduler/:id/pause`
  - `POST /api/scheduler/:id/resume`
  - `GET /api/scheduler/tasks`

---

## Phase 3: Event Bus Service (Event-Driven Automation)
**Priority: MEDIUM | Effort: 1-2 days**

### Purpose
Trigger workflows based on events (content published, goal completed, feedback received, etc.)

### New File: `services/EventBusService.js`

```javascript
/**
 * NEXUS OS - Event Bus Service
 * Event-driven workflow triggers
 */

const EventEmitter = require('events');

class EventBusService extends EventEmitter {
  constructor(pool, workflowService) {
    super();
    this.pool = pool;
    this.workflows = workflowService;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Listen to all events and check for triggers
    this.on('*', async (eventType, payload) => {
      await this.processTriggers(eventType, payload);
    });
  }

  async emit(eventType, payload) {
    super.emit('*', eventType, payload);
    super.emit(eventType, payload);

    // Log event
    await this.pool.query(`
      INSERT INTO usage_events (user_id, event_type, event_data)
      VALUES ($1, $2, $3)
    `, [payload.userId, eventType, payload]);
  }

  async processTriggers(eventType, payload) {
    const triggers = await this.pool.query(`
      SELECT et.*, w.id as workflow_id, w.user_id
      FROM event_triggers et
      JOIN workflows w ON et.workflow_id = w.id
      WHERE et.event_type = $1 AND et.is_active = true
    `, [eventType]);

    for (const trigger of triggers.rows) {
      if (this.evaluateConditions(trigger.conditions, payload)) {
        await this.workflows.executeWorkflow(
          trigger.workflow_id,
          trigger.user_id,
          { ...payload, triggeredBy: 'event', eventType },
          'event'
        );

        // Update trigger stats
        await this.pool.query(
          'UPDATE event_triggers SET triggered_count = triggered_count + 1 WHERE id = $1',
          [trigger.id]
        );
      }
    }
  }

  evaluateConditions(conditions, payload) {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    for (const [field, expected] of Object.entries(conditions)) {
      if (payload[field] !== expected) return false;
    }
    return true;
  }

  // Pre-defined NEXUS events
  static Events = {
    CONTENT_GENERATED: 'content.generated',
    CONTENT_PUBLISHED: 'content.published',
    VIDEO_COMPLETED: 'video.completed',
    GOAL_CREATED: 'goal.created',
    GOAL_COMPLETED: 'goal.completed',
    FEEDBACK_RECEIVED: 'feedback.received',
    MEMORY_STORED: 'memory.stored',
    AGENT_ERROR: 'agent.error',
    SOUL_UPDATED: 'soul.updated'
  };
}
```

### Integration Points
- Emit events from all agents after task completion
- Add API endpoints:
  - `POST /api/events/trigger/create`
  - `GET /api/events/triggers`
  - `GET /api/events/log`

---

## Phase 4: Autonomous Goal Engine
**Priority: MEDIUM | Effort: 2-3 days**

### Purpose
Automatically generate goals based on:
- User activity patterns
- Performance gaps
- Scheduled reviews
- Content calendar needs

### Enhancement to: `services/ReasoningService.js`

```javascript
// Add to ReasoningService class

async analyzeForGoals(userId) {
  // 1. Get recent activity
  const activity = await this.pool.query(`
    SELECT agent_id, interaction_type, COUNT(*) as count,
           AVG(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) as success_rate
    FROM episodic_memories
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
    GROUP BY agent_id, interaction_type
  `, [userId]);

  // 2. Get current goals
  const currentGoals = await this.getGoals(userId, 'active');

  // 3. AI analysis for new goals
  const prompt = `Analyze user activity and suggest 1-3 new goals.

RECENT ACTIVITY:
${JSON.stringify(activity.rows)}

CURRENT ACTIVE GOALS:
${currentGoals.map(g => g.title).join(', ') || 'None'}

Return JSON:
{
  "suggestedGoals": [
    {"title": "...", "description": "...", "priority": 1-10, "rationale": "..."}
  ],
  "insights": ["..."]
}`;

  const result = await this.model.generateContent(prompt);
  const analysis = JSON.parse(result.response.text().match(/\{[\s\S]*\}/)[0]);

  return analysis;
}

async autoGenerateGoals(userId) {
  const analysis = await this.analyzeForGoals(userId);
  const createdGoals = [];

  for (const suggestion of analysis.suggestedGoals) {
    // Check if similar goal exists
    const existing = await this.pool.query(`
      SELECT id FROM goals
      WHERE user_id = $1 AND title ILIKE $2 AND status IN ('pending', 'active')
    `, [userId, `%${suggestion.title.split(' ').slice(0, 3).join('%')}%`]);

    if (existing.rows.length === 0) {
      const goal = await this.createGoal(userId, {
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        context: { autoGenerated: true, rationale: suggestion.rationale }
      });
      createdGoals.push(goal);
    }
  }

  return { createdGoals, insights: analysis.insights };
}
```

---

## Phase 5: Real Agent Integration in WorkflowService
**Priority: HIGH | Effort: 1 day**

### Purpose
Connect WorkflowService.executeAgentStep() to actual agents.

### Enhancement to: `services/WorkflowService.js`

```javascript
// Replace the simulated executeAgentStep

async executeAgentStep(agentId, action, inputData, config, userId) {
  const agent = this.agents.get(agentId);
  if (!agent) {
    return { success: false, error: `Agent ${agentId} not found` };
  }

  try {
    // Build context from memory
    const context = await this.memoryService?.buildContext(userId, action) || {};

    // Execute agent task
    const result = await agent.execute({
      type: action,
      payload: {
        ...inputData,
        ...config,
        userId,
        context
      }
    });

    // Store execution in memory
    if (this.memoryService) {
      await this.memoryService.storeEpisodic(userId, {
        agentId,
        interactionType: action,
        input: JSON.stringify(inputData),
        output: JSON.stringify(result),
        outcome: result.success ? 'success' : 'failure'
      });
    }

    return {
      success: result.success !== false,
      output: result
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Implementation Order

```
Week 1:
├── Day 1-2: Evolver Loop Service
│   └── Self-critique for all agent outputs
├── Day 3-4: Scheduler Service
│   └── Cron-based task execution
└── Day 5: Real Agent Integration
    └── Connect workflows to actual agents

Week 2:
├── Day 1-2: Event Bus Service
│   └── Event-driven triggers
├── Day 3-4: Autonomous Goal Engine
│   └── Auto-generated goals from patterns
└── Day 5: Integration Testing
    └── Full SEGP workflow test
```

---

## API Endpoints to Add

```javascript
// New routes for SEGP features

// Evolver
app.post('/api/oracle/evolve', auth, async (req, res) => {
  const result = await evolver.evolve(req.user.id, req.body.agentId, req.body.output, req.body.context);
  res.json(result);
});

// Scheduler
app.post('/api/scheduler/tasks', auth, async (req, res) => {
  const result = await scheduler.createScheduledTask(req.user.id, req.body);
  res.json(result);
});

app.get('/api/scheduler/tasks', auth, async (req, res) => {
  const tasks = await scheduler.getUserTasks(req.user.id);
  res.json(tasks);
});

// Events
app.post('/api/events/triggers', auth, async (req, res) => {
  const result = await eventBus.createTrigger(req.user.id, req.body);
  res.json(result);
});

// Goals
app.post('/api/goals/auto-generate', auth, async (req, res) => {
  const result = await reasoning.autoGenerateGoals(req.user.id);
  res.json(result);
});
```

---

## Dependencies to Add

```json
{
  "cron": "^3.1.6",
  "node-cron": "^3.0.3"
}
```

---

## Notes

1. **UI NOT TOUCHED** - All changes are backend-only
2. **Database Schema Complete** - All tables already exist
3. **Existing Services Preserved** - Only adding new services/enhancements
4. **Backward Compatible** - Existing API endpoints unchanged

---

## Post-SEGP Phases (Future)

### Treasury Protocol
- Stripe webhook integration for revenue tracking
- Auto-payment threshold triggers
- Revenue-to-action automation

### Swarm Orchestrator
- Multi-instance agent coordination
- Load balancing across agent pools
- Consensus-based decision making

---

*Generated: 2026-01-19*
*Constraint: UI Preserved*
