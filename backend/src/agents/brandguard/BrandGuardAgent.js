/**
 * NEXUS OS - Brand Guardian Agent
 * Brand Consistency & Voice Alignment
 * Ensures all content matches creator's identity
 */

const BaseAgent = require('../BaseAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class BrandGuardAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'brandguard_01',
      name: 'Brand Guardian',
      specialty: 'Brand Consistency - Voice Alignment',
      capabilities: ['brand_check', 'voice_analysis', 'risk_assessment', 'content_audit']
    });

    this.defaultApiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    this.brandRules = new Map(); // userId -> rules
    this.auditHistory = [];
  }

  getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey || this.defaultApiKey);
    return genAI.getGenerativeModel({ model: 'gemini-3-flash' });
  }

  async execute(task) {
    const { type, payload } = task;
    const apiKey = payload.apiKey || this.defaultApiKey;

    switch (type) {
      case 'brand_check':
        return await this.checkBrandAlignment(payload, apiKey);

      case 'voice_analysis':
        return await this.analyzeVoice(payload, apiKey);

      case 'risk_assessment':
        return await this.assessRisk(payload, apiKey);

      case 'content_audit':
        return await this.auditContent(payload, apiKey);

      case 'set_rules':
        return this.setBrandRules(payload);

      default:
        return await this.checkBrandAlignment(payload, apiKey);
    }
  }

  setBrandRules(payload) {
    const { userId, rules } = payload;
    this.brandRules.set(userId, {
      tone: rules.tone || 'professional',
      values: rules.values || [],
      neverSay: rules.neverSay || [],
      alwaysInclude: rules.alwaysInclude || [],
      targetAudience: rules.targetAudience || 'general',
      contentTypes: rules.contentTypes || ['all']
    });

    return {
      type: 'set_rules',
      success: true,
      userId,
      rulesSet: Object.keys(rules).length,
      timestamp: new Date()
    };
  }

  async checkBrandAlignment(payload, apiKey) {
    const { userId, content, contentType = 'post' } = payload;
    const rules = this.brandRules.get(userId) || {};

    const prompt = `You are a brand consistency analyzer. Evaluate this content against brand guidelines.

CONTENT TO CHECK:
${content}

BRAND GUIDELINES:
- Tone: ${rules.tone || 'professional'}
- Values: ${rules.values?.join(', ') || 'authenticity, value-driven'}
- Never say: ${rules.neverSay?.join(', ') || 'none specified'}
- Target audience: ${rules.targetAudience || 'general'}

EVALUATE:
1. Voice Consistency (1-10): Does it match the tone?
2. Value Alignment (1-10): Does it reflect the values?
3. Audience Fit (1-10): Will target audience connect?
4. Risk Level (low/medium/high): Any reputation risks?

Respond in JSON format:
{
  "voiceScore": 8,
  "valueScore": 7,
  "audienceScore": 9,
  "riskLevel": "low",
  "issues": ["issue 1", "issue 2"],
  "suggestions": ["suggestion 1"],
  "approved": true,
  "summary": "Brief overall assessment"
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      const auditResult = {
        type: 'brand_check',
        userId,
        contentType,
        analysis,
        overallScore: analysis.voiceScore && analysis.valueScore && analysis.audienceScore
          ? Math.round((analysis.voiceScore + analysis.valueScore + analysis.audienceScore) / 3)
          : null,
        timestamp: new Date()
      };

      this.auditHistory.push(auditResult);
      return auditResult;

    } catch (error) {
      return {
        type: 'brand_check',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async analyzeVoice(payload, apiKey) {
    const { content, referenceContent } = payload;

    const prompt = `Compare the voice/style of these two pieces of content:

NEW CONTENT:
${content}

REFERENCE CONTENT (established voice):
${referenceContent}

Analyze:
1. Tone similarity (1-10)
2. Vocabulary match (1-10)
3. Sentence structure similarity (1-10)
4. Overall voice consistency (1-10)
5. Specific differences found

Respond in JSON format:
{
  "toneSimilarity": 8,
  "vocabularyMatch": 7,
  "structureSimilarity": 6,
  "overallConsistency": 7,
  "differences": ["difference 1", "difference 2"],
  "recommendation": "adjust X to better match voice"
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      return {
        type: 'voice_analysis',
        analysis,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        type: 'voice_analysis',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async assessRisk(payload, apiKey) {
    const { content, platform } = payload;

    const prompt = `Assess reputation risks for posting this content on ${platform || 'social media'}:

CONTENT:
${content}

Check for:
1. Controversial statements
2. Potential misinterpretations
3. Legal concerns
4. Platform policy violations
5. Cultural sensitivity issues
6. Factual claims that need verification

Respond in JSON format:
{
  "riskLevel": "low|medium|high|critical",
  "risks": [
    {"type": "controversy", "severity": "medium", "description": "..."}
  ],
  "recommendations": ["recommendation 1"],
  "safeToPost": true,
  "requiredChanges": []
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      return {
        type: 'risk_assessment',
        platform,
        analysis,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        type: 'risk_assessment',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async auditContent(payload, apiKey) {
    const { userId, contents } = payload;

    const results = [];
    for (const content of contents) {
      const check = await this.checkBrandAlignment({ userId, content }, apiKey);
      results.push(check);
    }

    const avgScore = results.reduce((sum, r) => sum + (r.overallScore || 0), 0) / results.length;

    return {
      type: 'content_audit',
      userId,
      contentCount: contents.length,
      averageScore: Math.round(avgScore),
      results,
      timestamp: new Date()
    };
  }

  getAuditHistory(userId, limit = 10) {
    return this.auditHistory
      .filter(a => !userId || a.userId === userId)
      .slice(-limit);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      brandsConfigured: this.brandRules.size,
      auditsPerformed: this.auditHistory.length
    };
  }
}

module.exports = BrandGuardAgent;
