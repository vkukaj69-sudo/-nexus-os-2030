/**
 * NEXUS OS - Base Agent Class
 * All agents inherit from this class
 * Implements state machine: idle → working → complete/error
 */

const EventEmitter = require('events');

class BaseAgent extends EventEmitter {
  constructor(config) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.specialty = config.specialty;
    this.status = 'idle';
    this.tasksCompleted = 0;
    this.lastActive = null;
    this.currentJob = null;
    this.capabilities = config.capabilities || [];
    this.dependencies = config.dependencies || [];
  }

  // State transitions
  async setStatus(newStatus) {
    const validTransitions = {
      'idle': ['working', 'error'],
      'working': ['idle', 'complete', 'error', 'waiting'],
      'waiting': ['working', 'idle', 'error'],
      'complete': ['idle'],
      'error': ['idle']
    };

    if (!validTransitions[this.status]?.includes(newStatus)) {
      console.warn(`Invalid transition: ${this.status} → ${newStatus}`);
      return false;
    }

    const oldStatus = this.status;
    this.status = newStatus;
    this.lastActive = new Date();
    this.emit('statusChange', { from: oldStatus, to: newStatus, agent: this.id });
    return true;
  }

  // Override in child classes
  async execute(task) {
    throw new Error(`Agent ${this.id} must implement execute()`);
  }

  // Standard task processing wrapper
  async processTask(task) {
