/**
 * NEXUS OS - Agent Registry
 * Central management for all agents
 * Handles registration, discovery, routing
 */

const EventEmitter = require('events');

class AgentRegistry extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.messageQueue = [];
  }

  // Register an agent
  register(agent) {
    if (this.agents.has(agent.id)) {
      console.warn(`Agent ${agent.id} already registered`);
      return false;
    }

    this.agents.set(agent.id, agent);
    
    // Listen to agent events
    agent.on('statusChange', (data) => {
      this.emit('agentStatusChange', data);
    });

    agent.on('agentRequest', (data) => {
      this.routeRequest(data);
    });

    console.log(`✓ Agent registered: ${agent.id} (${agent.name})`);
    return true;
  }

  // Unregister an agent
  unregister(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.removeAllListeners();
      this.agents.delete(agentId);
      return true;
    }
    return false;
  }

  // Get agent by ID
  get(agentId) {
    return this.agents.get(agentId);
  }

  // Get all agents
  getAll() {
    return Array.from(this.agents.values());
  }

  // Get agents by status
  getByStatus(status) {
    return this.getAll().filter(a => a.status === status);
  }

  // Get agents by capability
  getByCapability(capability) {
    return this.getAll().filter(a => a.capabilities.includes(capability));
  }

  // Find best agent for a task
  findBestAgent(taskType) {
    const capabilityMap = {
      'research': ['scryer_01'],
      'trend_analysis': ['scryer_01'],
      'competitor_intel': ['scryer_01'],
      'content_generation': ['scribe_01'],
      'content_transform': ['scribe_01'],
      'video_generation': ['vulcan_01'],
      'image_generation': ['vulcan_01'],
      'memory_store': ['mnemosyne_01'],
      'memory_retrieve': ['mnemosyne_01'],
      'security_check': ['sentinel_01'],
      'brand_check': ['brandguard_01'],
      'engagement': ['replyguy_01'],
      'collaboration': ['collabfinder_01'],
      'orchestrate': ['oracle_core']
    };

    const candidates = capabilityMap[taskType] || ['oracle_core'];
    
    for (const agentId of candidates) {
      const agent = this.get(agentId);
      if (agent && agent.status === 'idle') {
        return agent;
      }
    }

    // Return first idle agent from candidates, or null
    return null;
  }

  // Route inter-agent requests
  async routeRequest(request) {
    const { from, to, task } = request;
    const targetAgent = this.get(to);
    
    if (!targetAgent) {
      console.error(`Agent ${to} not found for request from ${from}`);
      return null;
    }

    if (targetAgent.status !== 'idle') {
      // Queue the request
      this.messageQueue.push(request);
      console.log(`Queued request for ${to} (currently ${targetAgent.status})`);
      return null;
    }

    const result = await targetAgent.processTask(task);
    
    // Send response back to requesting agent
    const sourceAgent = this.get(from);
    if (sourceAgent) {
      await sourceAgent.receiveResponse(result);
    }

    return result;
  }

  // Process queued messages
  async processQueue() {
    const pending = [...this.messageQueue];
    this.messageQueue = [];

    for (const request of pending) {
      await this.routeRequest(request);
    }
  }

  // Health check all agents
  healthCheck() {
    const report = {
      timestamp: new Date(),
      total: this.agents.size,
      idle: 0,
      working: 0,
      error: 0,
      agents: []
    };

    for (const agent of this.agents.values()) {
      report[agent.status]++;
      report.agents.push({
        id: agent.id,
        status: agent.status,
        tasksCompleted: agent.tasksCompleted,
        lastActive: agent.lastActive
      });
    }

    return report;
  }
}

// Singleton instance
const registry = new AgentRegistry();

module.exports = { AgentRegistry, registry };
