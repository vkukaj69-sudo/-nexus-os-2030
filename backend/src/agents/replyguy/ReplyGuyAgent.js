/**
 * NEXUS OS - Reply Guy Agent
 * Engagement Automation
 * Drafts strategic replies for human approval
 */

const BaseAgent = require('../BaseAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class ReplyGuyAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'replyguy_01',
      name: 'Engagement Specialist',
      specialty: 'Strategic Engagement - Reply Drafting',
      capabilities: ['reply_draft', 'engagement_plan', 'target_find', 'dm_draft']
    });

    this.defaultApiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    this.replyQueue = []; // Drafts awaiting approval
    this.approvedReplies = [];
    this.dailyLimit = 50;
    this.todayCount = 0;
  }

  getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey || this.defaultApiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async execute(task) {
    const { type, payload } = task;
    const apiKey = payload.apiKey || this.defaultApiKey;

    switch (type) {
      case 'reply_draft':
        return await this.draftReply(payload, apiKey);

      case 'engagement_plan':
        return await this.createEngagementPlan(payload, apiKey);

      case 'batch_replies':
        return await this.draftBatchReplies(payload, apiKey);

      case 'dm_draft':
        return await this.draftDM(payload, apiKey);

      case 'approve_reply':
        return this.approveReply(payload);

      case 'get_queue':
        return this.getReplyQueue();

      default:
        return await this.draftReply(payload, apiKey);
    }
  }

  async draftReply(payload, apiKey) {
    const { originalPost, author, platform, strategy = 'add_value', creatorContext } = payload;

    if (this.todayCount >= this.dailyLimit) {
      return {
        type: 'reply_draft',
        success: false,
        error: `Daily limit reached (${this.dailyLimit} replies)`,
        timestamp: new Date()
      };
    }

    const strategyPrompts = {
      add_value: 'Add genuine value with an insight, tip, or useful perspective',
      ask_question: 'Ask a thoughtful question that starts a conversation',
      share_experience: 'Share a brief relevant personal experience',
      gentle_disagree: 'Offer a respectful alternative viewpoint',
      celebrate: 'Genuinely celebrate or support their achievement/point',
      expand: 'Expand on their point with additional context'
    };

    const prompt = `Draft a reply to this ${platform || 'social media'} post.

ORIGINAL POST by @${author}:
"${originalPost}"

STRATEGY: ${strategyPrompts[strategy]}

${creatorContext ? `CREATOR CONTEXT (your voice/expertise): ${creatorContext}` : ''}

RULES:
- Be authentic, not salesy
- No generic phrases like "Great post!" or "Love this!"
- Add genuine value
- Match the platform's tone
- Keep it concise (1-3 sentences max)
- No hashtags in replies
- Sound human, not AI

Write ONLY the reply text, nothing else.`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const replyText = result.response.text().trim();

      const draft = {
        id: `reply_${Date.now()}`,
        type: 'reply_draft',
        originalPost,
        author,
        platform,
        strategy,
        reply: replyText,
        status: 'pending_approval',
        createdAt: new Date()
      };

      this.replyQueue.push(draft);

      return {
        ...draft,
        success: true,
        message: 'Reply drafted - awaiting approval'
      };

    } catch (error) {
      return {
        type: 'reply_draft',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async draftBatchReplies(payload, apiKey) {
    const { posts, strategy, creatorContext } = payload;
    const results = [];

    for (const post of posts.slice(0, 10)) { // Max 10 at a time
      const reply = await this.draftReply({
        originalPost: post.content,
        author: post.author,
        platform: post.platform,
        strategy,
        creatorContext
      }, apiKey);
      results.push(reply);
    }

    return {
      type: 'batch_replies',
      success: true,
      drafted: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
      timestamp: new Date()
    };
  }

  async createEngagementPlan(payload, apiKey) {
    const { niche, goals, timePerDay = 30, platforms } = payload;

    const prompt = `Create a strategic engagement plan for a creator.

NICHE: ${niche}
GOALS: ${goals}
TIME AVAILABLE: ${timePerDay} minutes per day
PLATFORMS: ${platforms?.join(', ') || 'Twitter, LinkedIn'}

Create a plan including:
1. Types of accounts to engage with (by follower count tier)
2. Best times to engage
3. Reply strategies to use
4. Content types to prioritize
5. Weekly engagement targets
6. Do's and Don'ts

Respond in JSON format:
{
  "targetAccounts": {
    "micro": {"followers": "1k-10k", "priority": "high", "reason": "..."},
    "macro": {"followers": "10k-100k", "priority": "medium", "reason": "..."},
    "mega": {"followers": "100k+", "priority": "low", "reason": "..."}
  },
  "bestTimes": ["9am", "12pm", "6pm"],
  "strategies": ["add_value", "ask_question"],
  "contentPriority": ["threads", "insights", "questions"],
  "weeklyTargets": {
    "replies": 35,
    "dms": 5,
    "newConnections": 10
  },
  "dos": ["do 1", "do 2"],
  "donts": ["dont 1", "dont 2"]
}`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' };

      return {
        type: 'engagement_plan',
        success: true,
        niche,
        plan,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        type: 'engagement_plan',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async draftDM(payload, apiKey) {
    const { recipient, purpose, context, creatorContext } = payload;

    const prompt = `Draft a direct message.

TO: @${recipient}
PURPOSE: ${purpose}
CONTEXT: ${context || 'Initial outreach'}

${creatorContext ? `YOUR CONTEXT: ${creatorContext}` : ''}

RULES:
- Be personal and genuine
- Reference something specific about them
- Clear but not pushy
- Keep it brief (2-4 sentences)
- Include soft CTA if appropriate
- Sound human, not templated

Write ONLY the DM text, nothing else.`;

    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const dmText = result.response.text().trim();

      const draft = {
        id: `dm_${Date.now()}`,
        type: 'dm_draft',
        recipient,
        purpose,
        message: dmText,
        status: 'pending_approval',
        createdAt: new Date()
      };

      this.replyQueue.push(draft);

      return {
        ...draft,
        success: true,
        message: 'DM drafted - awaiting approval'
      };

    } catch (error) {
      return {
        type: 'dm_draft',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  approveReply(payload) {
    const { replyId, approved, edited } = payload;
    const index = this.replyQueue.findIndex(r => r.id === replyId);

    if (index === -1) {
      return { success: false, error: 'Reply not found in queue' };
    }

    const reply = this.replyQueue[index];

    if (approved) {
      reply.status = 'approved';
      reply.approvedAt = new Date();
      if (edited) reply.reply = edited;
      this.approvedReplies.push(reply);
      this.todayCount++;
    } else {
      reply.status = 'rejected';
    }

    this.replyQueue.splice(index, 1);

    return {
      type: 'approve_reply',
      success: true,
      replyId,
      approved,
      newStatus: reply.status,
      timestamp: new Date()
    };
  }

  getReplyQueue() {
    return {
      type: 'get_queue',
      pending: this.replyQueue.filter(r => r.status === 'pending_approval'),
      todayCount: this.todayCount,
      dailyLimit: this.dailyLimit,
      remaining: this.dailyLimit - this.todayCount
    };
  }

  // Reset daily count (call from cron job)
  resetDailyCount() {
    this.todayCount = 0;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      pendingApproval: this.replyQueue.filter(r => r.status === 'pending_approval').length,
      todayCount: this.todayCount,
      dailyLimit: this.dailyLimit
    };
  }
}

module.exports = ReplyGuyAgent;
