/**
 * NEXUS OS - Scribe Agent
 * Content Generation & Transformation
 * Uses Gemini API for content creation
 */

const BaseAgent = require('../BaseAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ScribeAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'scribe_01',
      name: 'Content Composer',
      specialty: 'Content Synthesis - Platform Optimization',
      capabilities: ['content_generate', 'content_transform', 'content_enhance', 'hooks', 'threads']
    });

    this.defaultApiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    this.contentHistory = [];
  }

  getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey || this.defaultApiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async execute(task) {
    const { type, payload } = task;
    const apiKey = payload.apiKey || this.defaultApiKey;

    switch (type) {
      case 'content_generate':
        return await this.generateContent(payload, apiKey);

      case 'content_transform':
        return await this.transformContent(payload, apiKey);

      case 'content_enhance':
        return await this.enhanceContent(payload, apiKey);

      case 'hooks':
        return await this.generateHooks(payload, apiKey);

      case 'threads':
        return await this.generateThread(payload, apiKey);

      default:
        return await this.generateContent(payload, apiKey);
    }
  }

  async generateContent(payload, apiKey) {
    const { topic, platform = 'linkedin', tone = 'professional', length = 'medium' } = payload;

    const lengthGuide = {
      short: '50-100 words',
      medium: '150-250 words',
      long: '300-500 words'
    };

    const prompt = `Create a ${platform} post about: ${topic}

Requirements:
- Tone: ${tone}
- Length: ${lengthGuide[length]}
- Platform-optimized formatting
- Include a strong hook
- End with engagement prompt or CTA
- No hashtags unless requested

Write only the post content, nothing else.`;

    const model = this.getModel(apiKey);
    const result = await model.generateContent(prompt);

    const content = {
      type: 'content_generate',
      topic,
      platform,
      content: result.response.text(),
      timestamp: new Date()
    };

    this.contentHistory.push(content);
    return content;
  }

  async transformContent(payload, apiKey) {
    const { content, fromPlatform, toPlatform } = payload;

    const platformRules = {
      twitter: 'Max 280 characters, punchy, use line breaks, can include 1-2 hashtags',
      linkedin: 'Professional tone, storytelling, 150-300 words, line breaks for readability',
      instagram: 'Casual, emoji-friendly, 100-200 words, end with CTA',
      facebook: 'Conversational, 100-250 words, question at end',
      reddit: 'Authentic, no marketing speak, add value, 100-300 words',
      threads: 'Casual, concise, 50-150 words, conversational'
    };

    const prompt = `Transform this ${fromPlatform} content for ${toPlatform}:

Original:
${content}

${toPlatform} rules: ${platformRules[toPlatform]}

Write only the transformed content, nothing else.`;

    const model = this.getModel(apiKey);
    const result = await model.generateContent(prompt);

    return {
      type: 'content_transform',
      original: content,
      transformed: result.response.text(),
      fromPlatform,
      toPlatform,
      timestamp: new Date()
    };
  }

  async enhanceContent(payload, apiKey) {
    const { content, enhancementType = 'engagement' } = payload;

    const enhancementPrompts = {
      engagement: 'Make this more engaging with better hooks, emotional triggers, and a compelling CTA',
      clarity: 'Improve clarity and readability while keeping the core message',
      storytelling: 'Add storytelling elements - setup, conflict, resolution',
      authority: 'Add credibility markers, data points, and expert positioning',
      viral: 'Optimize for shareability - controversial take, relatable insight, or surprising fact'
    };

    const prompt = `Enhance this content for ${enhancementType}:

Original:
${content}

Goal: ${enhancementPrompts[enhancementType]}

Write only the enhanced content, nothing else.`;

    const model = this.getModel(apiKey);
    const result = await model.generateContent(prompt);

    return {
      type: 'content_enhance',
      original: content,
      enhanced: result.response.text(),
      enhancementType,
      timestamp: new Date()
    };
  }

  async generateHooks(payload, apiKey) {
    const { topic, count = 5, style = 'mixed' } = payload;

    const prompt = `Generate ${count} attention-grabbing hooks for content about: ${topic}

Hook styles to include:
- Controversial/contrarian take
- Surprising statistic or fact
- Personal story opener
- Question that provokes thought
- Bold claim or prediction

Format: Number each hook, one per line. Write only the hooks.`;

    const model = this.getModel(apiKey);
    const result = await model.generateContent(prompt);

    return {
      type: 'hooks',
      topic,
      hooks: result.response.text().split('\n').filter(h => h.trim()),
      timestamp: new Date()
    };
  }

  async generateThread(payload, apiKey) {
    const { topic, tweetCount = 7, platform = 'twitter' } = payload;

    const prompt = `Create a ${tweetCount}-tweet thread about: ${topic}

Structure:
1. Hook tweet (attention-grabbing opener)
2-${tweetCount - 1}. Value tweets (insights, tips, examples)
${tweetCount}. Summary + CTA

Rules:
- Each tweet max 280 characters
- Number each tweet (1/, 2/, etc.)
- Make each tweet standalone but connected
- End with engagement prompt

Write the full thread:`;

    const model = this.getModel(apiKey);
    const result = await model.generateContent(prompt);

    return {
      type: 'thread',
      topic,
      thread: result.response.text(),
      tweetCount,
      timestamp: new Date()
    };
  }

  getHistory(limit = 10) {
    return this.contentHistory.slice(-limit);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      contentGenerated: this.contentHistory.length
    };
  }
}

module.exports = ScribeAgent;
