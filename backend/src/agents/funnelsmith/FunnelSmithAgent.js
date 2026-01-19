const BaseAgent = require('../BaseAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class FunnelSmithAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'funnelsmith_01',
      name: 'Funnel Architect',
      specialty: 'Conversion Funnels - Landing Pages',
      capabilities: ['funnel_create', 'landing_page', 'opt_in', 'sales_page', 'email_sequence']
    });
    this.defaultApiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    this.funnelHistory = [];
  }

  getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey || this.defaultApiKey);
    return genAI.getGenerativeModel({ model: 'gemini-3-flash' });
  }

  async execute(task) {
    const { type, payload } = task;
    const apiKey = payload.apiKey || this.defaultApiKey;
    switch (type) {
      case 'funnel_create': return await this.createFunnel(payload, apiKey);
      case 'landing_page': return await this.createLandingPage(payload, apiKey);
      case 'opt_in': return await this.createOptIn(payload, apiKey);
      case 'sales_page': return await this.createSalesPage(payload, apiKey);
      case 'email_sequence': return await this.createEmailSequence(payload, apiKey);
      default: return await this.createLandingPage(payload, apiKey);
    }
  }

  async createFunnel(payload, apiKey) {
    const { product, audience, goal, steps = 3 } = payload;
    const prompt = `Create a ${steps}-step conversion funnel. PRODUCT: ${product}. AUDIENCE: ${audience}. GOAL: ${goal}. Return JSON with funnelName, steps array (each with step, type, headline, subheadline, copyPoints, cta, conversionGoal), expectedConversion, trafficSources.`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const funnel = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      this.funnelHistory.push({ type: 'funnel_create', product, funnel, timestamp: new Date() });
      return { type: 'funnel_create', product, audience, funnel, timestamp: new Date() };
    } catch (error) { return { type: 'funnel_create', success: false, error: error.message }; }
  }

  async createLandingPage(payload, apiKey) {
    const { product, audience, style = 'modern' } = payload;
    const prompt = `Create landing page for ${product} targeting ${audience}. Style: ${style}. Return JSON with headline, subheadline, heroCopy, benefits array, socialProof, cta, faq array, and html (complete Tailwind HTML).`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const page = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'landing_page', product, page, timestamp: new Date() };
    } catch (error) { return { type: 'landing_page', success: false, error: error.message }; }
  }

  async createOptIn(payload, apiKey) {
    const { leadMagnet, audience } = payload;
    const prompt = `Create opt-in page for lead magnet: ${leadMagnet}. Audience: ${audience}. Return JSON with headline, subheadline, bullets array, formFields, cta, trustElements, html.`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const optIn = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'opt_in', leadMagnet, optIn, timestamp: new Date() };
    } catch (error) { return { type: 'opt_in', success: false, error: error.message }; }
  }

  async createSalesPage(payload, apiKey) {
    const { product, price, audience } = payload;
    const prompt = `Create sales page for ${product} at ${price} targeting ${audience}. Return JSON with headline, hook, problemSection, solution, benefits, testimonials, offerStack, guarantee, faq, finalCta, html.`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const salesPage = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'sales_page', product, price, salesPage, timestamp: new Date() };
    } catch (error) { return { type: 'sales_page', success: false, error: error.message }; }
  }

  async createEmailSequence(payload, apiKey) {
    const { product, sequenceType = 'nurture', emails = 5 } = payload;
    const prompt = `Create ${emails}-email ${sequenceType} sequence for ${product}. Return JSON with sequenceName, emails array (each with day, subject, preview, body, cta).`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const sequence = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'email_sequence', product, sequence, timestamp: new Date() };
    } catch (error) { return { type: 'email_sequence', success: false, error: error.message }; }
  }

  toJSON() { return { ...super.toJSON(), funnelsCreated: this.funnelHistory.length }; }
}

module.exports = FunnelSmithAgent;
