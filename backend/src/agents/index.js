/**
 * NEXUS OS - Agent System
 * Exports all agents and registry
 */

const BaseAgent = require('./BaseAgent');
const { AgentRegistry, registry } = require('./AgentRegistry');

// Import all agents
const OracleAgent = require('./oracle/OracleAgent');
const ScryerAgent = require('./scryer/ScryerAgent');
const ScribeAgent = require('./scribe/ScribeAgent');
const SentinelAgent = require('./sentinel/SentinelAgent');
const MnemosyneAgent = require('./mnemosyne/MnemosyneAgent');
const VulcanAgent = require('./vulcan/VulcanAgent');
const BrandGuardAgent = require('./brandguard/BrandGuardAgent');
const ReplyGuyAgent = require('./replyguy/ReplyGuyAgent');
const CollabFinderAgent = require('./collabfinder/CollabFinderAgent');

// Initialize all agents
function initializeAgents(config = {}) {
  const agents = {
    oracle: new OracleAgent(),
    scryer: new ScryerAgent(config),
    scribe: new ScribeAgent(config),
    sentinel: new SentinelAgent(config),
    mnemosyne: new MnemosyneAgent(config),
    vulcan: new VulcanAgent(config),
    brandguard: new BrandGuardAgent(config),
    replyguy: new ReplyGuyAgent(config),
    collabfinder: new CollabFinderAgent(config)
  };

  // Register all agents
  Object.values(agents).forEach(agent => {
    registry.register(agent);
  });

  console.log('═══════════════════════════════════════════');
  console.log('  NEXUS OS - Agent System Initialized');
  console.log('═══════════════════════════════════════════');
  console.log(`  Agents Online: ${registry.getAll().length}`);
  console.log('  Status: All systems nominal');
  console.log('═══════════════════════════════════════════');

  return agents;
}

// Get system status
function getSystemStatus() {
  return {
    agents: registry.healthCheck(),
    timestamp: new Date()
  };
}

module.exports = {
  // Base classes
  BaseAgent,
  AgentRegistry,
  registry,

  // Individual agents
  OracleAgent,
  ScryerAgent,
  ScribeAgent,
  SentinelAgent,
  MnemosyneAgent,
  VulcanAgent,
  BrandGuardAgent,
  ReplyGuyAgent,
  CollabFinderAgent,

  // Utilities
  initializeAgents,
  getSystemStatus
};
