/**
 * NEXUS OS - Scryer Agent
 * Competitive Intelligence & Trend Analysis
 * Uses Perplexity API for real-time research
 * Uses Google Trends for search trend data
 */

const BaseAgent = require('../BaseAgent');
const OpenAI = require('openai');
const googleTrends = require('google-trends-api');

class ScryerAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'scryer_01',
      name: 'Intelligence Agent',
      specialty: 'Competitive Intelligence - Trend Analysis',
      capabilities: ['research', 'trend_analysis', 'competitor_intel', 'market_research', 'google_trends']
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
      case 'google_trends':
        return await this.getGoogleTrends(payload);
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

  // Google Trends Integration
  async getGoogleTrends(payload) {
    const { keyword, keywords, geo = 'US', timeframe = 'today 12-m' } = payload;
    const results = {};

    try {
      // Interest over time for single keyword
      if (keyword) {
        console.log('[Scryer] Fetching Google Trends for:', keyword);

        const interestData = await googleTrends.interestOverTime({
          keyword,
          geo,
          startTime: this.getStartTime(timeframe)
        });
        const parsed = JSON.parse(interestData);
        results.interestOverTime = parsed.default?.timelineData?.map(d => ({
          date: d.formattedTime,
          value: d.value[0]
        })) || [];

        // Related queries
        const relatedData = await googleTrends.relatedQueries({ keyword, geo });
        const relatedParsed = JSON.parse(relatedData);
        results.relatedQueries = {
          top: relatedParsed.default?.rankedList?.[0]?.rankedKeyword?.slice(0, 10) || [],
          rising: relatedParsed.default?.rankedList?.[1]?.rankedKeyword?.slice(0, 10) || []
        };

        // Regional interest
        const regionalData = await googleTrends.interestByRegion({ keyword, geo });
        const regionalParsed = JSON.parse(regionalData);
        results.regionalInterest = regionalParsed.default?.geoMapData?.slice(0, 10) || [];
      }

      // Compare multiple keywords
      if (keywords && Array.isArray(keywords)) {
        console.log('[Scryer] Comparing Google Trends for:', keywords);

        const compareData = await googleTrends.interestOverTime({
          keyword: keywords,
          geo,
          startTime: this.getStartTime(timeframe)
        });
        const compareParsed = JSON.parse(compareData);
        results.comparison = compareParsed.default?.timelineData?.map(d => ({
          date: d.formattedTime,
          values: d.value
        })) || [];
        results.comparedKeywords = keywords;
      }

      // Daily trends (what's trending now)
      if (!keyword && !keywords) {
        console.log('[Scryer] Fetching daily trends for:', geo);

        const dailyData = await googleTrends.dailyTrends({ geo });
        const dailyParsed = JSON.parse(dailyData);
        results.dailyTrends = dailyParsed.default?.trendingSearchesDays?.[0]?.trendingSearches?.slice(0, 20).map(t => ({
          title: t.title.query,
          traffic: t.formattedTraffic,
          articles: t.articles?.slice(0, 2).map(a => ({ title: a.title, source: a.source }))
        })) || [];
      }

      const result = {
        type: 'google_trends',
        keyword: keyword || keywords || 'daily',
        geo,
        timeframe,
        data: results,
        timestamp: new Date()
      };

      this.researchHistory.push(result);
      return result;

    } catch (error) {
      console.error('[Scryer] Google Trends error:', error.message);
      return {
        type: 'google_trends',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  getStartTime(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case 'now 1-H': return new Date(now - 60 * 60 * 1000);
      case 'now 4-H': return new Date(now - 4 * 60 * 60 * 1000);
      case 'now 1-d': return new Date(now - 24 * 60 * 60 * 1000);
      case 'now 7-d': return new Date(now - 7 * 24 * 60 * 60 * 1000);
      case 'today 1-m': return new Date(now - 30 * 24 * 60 * 60 * 1000);
      case 'today 3-m': return new Date(now - 90 * 24 * 60 * 60 * 1000);
      case 'today 12-m': return new Date(now - 365 * 24 * 60 * 60 * 1000);
      case 'today 5-y': return new Date(now - 5 * 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now - 365 * 24 * 60 * 60 * 1000);
    }
  }

  getHistory(limit = 10) {
    return this.researchHistory.slice(-limit);
  }

  toJSON() {
    return { ...super.toJSON(), researchCount: this.researchHistory.length };
  }
}

module.exports = ScryerAgent;
