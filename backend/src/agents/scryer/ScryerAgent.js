/**
 * NEXUS OS - Scryer Agent
 * Competitive Intelligence & Trend Analysis
 * Uses Perplexity API for real-time research
 */

const BaseAgent = require('../BaseAgent');
const OpenAI = require('openai');

class ScryerAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'scryer_01',
      name: 'Intelligence Agent',
      specialty: 'Competitive Intelligence - Trend Analysis',
      capabilities: ['research', 'trend_analysis', 'competitor_intel', 'market_research']
    });

    this.perplexity = new OpenAI({
      apiKey: config.perplexityKey || process.env.PERPLEXITY_API_KEY,
      baseURL: 'https://api.perplexity.ai'
    });

    this.researchHistory = [];
  }

  async execute(task) {
    const { type, payload } = task;

    switch (type) {
      case 'research':
        return await this.research(payload.query);
      case 'trend_analysis':
        return await this.analyzeTrends(payload.topic);
      case 'competitor_intel':
        return await this.competitorAnalysis(payload.query);
      case 'market_research':
        return await this.marketResearch(payload.query);
      default:
        return await this.research(payload.query || payload.topic);
    }
  }

  async research(query) {
    const response = await this.perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        { role: 'system', content: 'You are an expert research analyst. Provide comprehensive, factual analysis with specific data points.' },
        { role: 'user', content: query }
      ],
      max_tokens: 1500
    });

    const result = { type: 'research', query, analysis: response.choices[0].message.content, timestamp: new Date() };
    this.researchHistory.push(result);
    return result;
  }

  async analyzeTrends(topic) {
    const response = await this.perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        { role: 'system', content: 'You are a trend analyst. Provide: 1) Trend direction, 2) Key drivers, 3) Timeline, 4) Opportunities. Be specific.' },
        { role: 'user', content: `Analyze trends for: ${topic}` }
      ],
      max_tokens: 1500
    });

    const result = { type: 'trend_analysis', topic, analysis: response.choices[0].message.content, timestamp: new Date() };
    this.researchHistory.push(result);
    return result;
  }

  async competitorAnalysis(query) {
    const response = await this.perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        { role: 'system', content: 'You are a competitive intelligence analyst. Provide: 1) Key players, 2) Strengths/weaknesses, 3) Pricing, 4) Gaps to exploit.' },
        { role: 'user', content: query }
      ],
      max_tokens: 2000
    });

    const result = { type: 'competitor_intel', query, analysis: response.choices[0].message.content, timestamp: new Date() };
    this.researchHistory.push(result);
    return result;
  }

  async marketResearch(query) {
    const response = await this.perplexity.chat.completions.create({
      model: 'sonar',
      messages: [
        { role: 'system', content: 'You are a market research analyst. Provide: 1) Market size, 2) Growth rate, 3) Key segments, 4) Future projections.' },
        { role: 'user', content: query }
      ],
      max_tokens: 2000
    });

    const result = { type: 'market_research', query, analysis: response.choices[0].message.content, timestamp: new Date() };
    this.researchHistory.push(result);
    return result;
  }

  getHistory(limit = 10) {
    return this.researchHistory.slice(-limit);
  }

  toJSON() {
    return { ...super.toJSON(), researchCount: this.researchHistory.length };
  }
}

module.exports = ScryerAgent;
