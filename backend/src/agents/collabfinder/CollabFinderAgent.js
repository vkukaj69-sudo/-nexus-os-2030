/**
 * NEXUS OS - Collab Finder Agent
 * Partnership Discovery & Outreach
 * Finds collaboration opportunities
 */

const BaseAgent = require('../BaseAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class CollabFinderAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'collabfinder_01',
      name: 'Partnership Scout',
      specialty: 'Collaboration Discovery - Outreach',
      capabilities: ['collab_find', 'outreach_draft', 'partner_score', 'opportunity_match']
    });

    this.defaultApiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    this.opportunities = [];
    this.outreachHistory = [];
  }

  getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey || this.defaultApiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async execute(task) {
    const { type, payload } = task;
    const apiKey = payload.apiKey || this.defaultApiKey;

    switch (type) {
      case 'collab_find':
        return await this.findCollaborators(payload, apiKey);

      case 'outreach_draft':
        return await this.draftOutreach(payload, apiKey);

      case 'partner_score':
        return await this.scorePartner(payload, apiKey);

      case 'opportunity_match':
        return await this.matchOpportunities(payload, apiKey);

      case 'collab_ideas':
        return await this.generateCollabIdeas(payload, apiKey);

      default:
        return await this.findCollaborators(payload, apiKey);
    }
  }

  async findCollaborators(payload, apiKey) {
    const { niche, creatorProfile, targetSize = 'similar', collabType = 'content' } = payload;

    const prompt = `Find ideal collaboration partners for a creator.

CREATOR PROFILE:
- Niche: ${niche}
- Profile: ${creatorProfile || 'Content creator looking for growth'}

TARGET SIZE: ${targetSize} (similar/larger/smaller)
COLLAB TYPE: ${collabType} (content/product/event/podcast)

Identify 5 types of ideal collaboration partners:
1. What kind of creators/businesses would be perfect matches
2. What value exchange would work
3. Where to find them
4. How to approach them

Respond in JSON format:
{
  "idealPartners": [
    {
      "type": "Description of partner type",
      "whyMatch": "Why this is a good match",
      "valueExchange": "What each party offers",
      "whereToFind": ["platform1", "platform2"],
      "approachStrategy": "How to reach out",
      "exampleAccounts": ["@example1", "@example2"]
    }
  ],
  "collabFormats": ["format1", "format2"],
  "redFlags": ["red flag 1", "red flag 2"],
  "timeline": "Suggested outreach timeline"
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      const findResult = {
        type: 'collab_find',
        niche,
        targetSize,
        collabType,
        analysis,
        timestamp: new Date()
      };

      this.opportunities.push(findResult);
      return findResult;

    } catch (error) {
      return {
        type: 'collab_find',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async scorePartner(payload, apiKey) {
    const { partnerProfile, creatorProfile } = payload;

    const prompt = `Score this potential collaboration partner.

YOUR PROFILE:
${creatorProfile}

POTENTIAL PARTNER:
${partnerProfile}

Score on these criteria (1-10 each):
1. Audience Overlap - Do audiences complement?
2. Content Synergy - Would content work together?
3. Value Alignment - Similar values/brand?
4. Growth Potential - Can both benefit?
5. Engagement Quality - Active, engaged audience?
6. Professionalism - Reliable partner?

Respond in JSON format:
{
  "scores": {
    "audienceOverlap": 8,
    "contentSynergy": 7,
    "valueAlignment": 9,
    "growthPotential": 8,
    "engagementQuality": 7,
    "professionalism": 8
  },
  "overallScore": 78,
  "recommendation": "strong_yes|yes|maybe|no|strong_no",
  "strengths": ["strength 1", "strength 2"],
  "concerns": ["concern 1"],
  "collabSuggestions": ["idea 1", "idea 2"],
  "summary": "Brief assessment"
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      return {
        type: 'partner_score',
        analysis,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        type: 'partner_score',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async draftOutreach(payload, apiKey) {
    const { partner, collabIdea, channel = 'dm', creatorContext } = payload;

    const channelGuidelines = {
      dm: 'Keep it brief (3-4 sentences), personal, low-pressure',
      email: 'Professional but warm, include clear value prop, 150-200 words',
      comment: 'Ultra brief, reference their content, plant seed for DM'
    };

    const prompt = `Draft a collaboration outreach message.

TO: ${partner.name || partner}
CHANNEL: ${channel}
COLLAB IDEA: ${collabIdea}

${creatorContext ? `YOUR CONTEXT: ${creatorContext}` : ''}

GUIDELINES: ${channelGuidelines[channel]}

RULES:
- Be genuine, not salesy
- Reference something specific about their work
- Clear value proposition for THEM
- Soft CTA, not pushy
- Sound human, build relationship first

Write ONLY the message, nothing else.`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const messageText = result.response.text().trim();

      const outreach = {
        id: `outreach_${Date.now()}`,
        type: 'outreach_draft',
        partner,
        channel,
        collabIdea,
        message: messageText,
        status: 'draft',
        createdAt: new Date()
      };

      this.outreachHistory.push(outreach);

      return {
        ...outreach,
        success: true
      };

    } catch (error) {
      return {
        type: 'outreach_draft',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async generateCollabIdeas(payload, apiKey) {
    const { creatorA, creatorB, sharedInterests } = payload;

    const prompt = `Generate creative collaboration ideas for two creators.

CREATOR A: ${creatorA}
CREATOR B: ${creatorB}
SHARED INTERESTS: ${sharedInterests?.join(', ') || 'Unknown'}

Generate 5 unique collaboration ideas that:
1. Play to both creators' strengths
2. Provide value to both audiences
3. Are feasible to execute
4. Have viral potential

Respond in JSON format:
{
  "ideas": [
    {
      "title": "Collaboration title",
      "format": "video/podcast/thread/live/product",
      "description": "What they would create",
      "creatorARole": "What A does",
      "creatorBRole": "What B does",
      "audienceValue": "Why audiences will love it",
      "viralPotential": "high/medium/low",
      "effort": "high/medium/low",
      "timeline": "How long to execute"
    }
  ],
  "bestIdea": 0,
  "quickWin": 1
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      return {
        type: 'collab_ideas',
        creatorA,
        creatorB,
        ideas,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        type: 'collab_ideas',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async matchOpportunities(payload, apiKey) {
    const { creatorProfile, opportunities } = payload;

    const results = [];
    for (const opp of opportunities) {
      const score = await this.scorePartner({
        partnerProfile: opp.description,
        creatorProfile
      }, apiKey);
      results.push({
        opportunity: opp,
        score: score.analysis
      });
    }

    // Sort by score
    results.sort((a, b) => (b.score?.overallScore || 0) - (a.score?.overallScore || 0));

    return {
      type: 'opportunity_match',
      matched: results.length,
      results,
      topPick: results[0],
      timestamp: new Date()
    };
  }

  getOutreachHistory(limit = 10) {
    return this.outreachHistory.slice(-limit);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      opportunitiesFound: this.opportunities.length,
      outreachDrafted: this.outreachHistory.length
    };
  }
}

module.exports = CollabFinderAgent;
