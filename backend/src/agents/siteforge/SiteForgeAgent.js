const BaseAgent = require('../BaseAgent');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class SiteForgeAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'siteforge_01',
      name: 'Site Builder',
      specialty: 'Micro-Websites - One-Page Sites',
      capabilities: ['microsite_create', 'portfolio', 'product_page', 'link_in_bio', 'coming_soon']
    });
    this.defaultApiKey = config.geminiKey || process.env.GEMINI_API_KEY;
    this.siteHistory = [];
  }

  getModel(apiKey) {
    const genAI = new GoogleGenerativeAI(apiKey || this.defaultApiKey);
    return genAI.getGenerativeModel({ model: 'gemini-3-flash' });
  }

  async execute(task) {
    const { type, payload } = task;
    const apiKey = payload.apiKey || this.defaultApiKey;
    switch (type) {
      case 'microsite_create': return await this.createMicrosite(payload, apiKey);
      case 'portfolio': return await this.createPortfolio(payload, apiKey);
      case 'product_page': return await this.createProductPage(payload, apiKey);
      case 'link_in_bio': return await this.createLinkInBio(payload, apiKey);
      case 'coming_soon': return await this.createComingSoon(payload, apiKey);
      default: return await this.createMicrosite(payload, apiKey);
    }
  }

  async createMicrosite(payload, apiKey) {
    const { purpose, brand, sections = ['hero', 'about', 'contact'], style = 'modern' } = payload;
    const prompt = `Create a one-page microsite. PURPOSE: ${purpose}. BRAND: ${brand}. SECTIONS: ${sections.join(', ')}. STYLE: ${style}. Return JSON with siteName, sections array (each with id, title, content), colorScheme, and complete html (Tailwind CSS, fully responsive).`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const site = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      this.siteHistory.push({ type: 'microsite', purpose, site, timestamp: new Date() });
      return { type: 'microsite_create', purpose, site, timestamp: new Date() };
    } catch (error) { return { type: 'microsite_create', success: false, error: error.message }; }
  }

  async createPortfolio(payload, apiKey) {
    const { name, profession, projects = [], style = 'minimal' } = payload;
    const prompt = `Create a portfolio site for ${name}, a ${profession}. Projects: ${JSON.stringify(projects)}. Style: ${style}. Return JSON with name, tagline, aboutSection, projectsSection (with placeholders if none provided), skillsSection, contactSection, and complete html.`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const portfolio = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'portfolio', name, portfolio, timestamp: new Date() };
    } catch (error) { return { type: 'portfolio', success: false, error: error.message }; }
  }

  async createProductPage(payload, apiKey) {
    const { productName, description, price, features = [] } = payload;
    const prompt = `Create a product page for ${productName}. Description: ${description}. Price: ${price}. Features: ${features.join(', ')}. Return JSON with productName, headline, description, features array, pricing, testimonialSection, ctaSection, and complete html.`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const productPage = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'product_page', productName, productPage, timestamp: new Date() };
    } catch (error) { return { type: 'product_page', success: false, error: error.message }; }
  }

  async createLinkInBio(payload, apiKey) {
    const { name, bio, links = [], style = 'modern' } = payload;
    const prompt = `Create a link-in-bio page for ${name}. Bio: ${bio}. Links: ${JSON.stringify(links)}. Style: ${style}. Return JSON with name, bio, avatarPlaceholder, links array (each with title, url, icon), socialLinks, and complete html (mobile-first).`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const linkBio = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'link_in_bio', name, linkBio, timestamp: new Date() };
    } catch (error) { return { type: 'link_in_bio', success: false, error: error.message }; }
  }

  async createComingSoon(payload, apiKey) {
    const { productName, launchDate, teaser, collectEmail = true } = payload;
    const prompt = `Create a coming soon page for ${productName}. Launch: ${launchDate}. Teaser: ${teaser}. Collect emails: ${collectEmail}. Return JSON with productName, headline, teaser, countdownTarget, emailForm (if collecting), and complete html with countdown timer JavaScript.`;
    try {
      const model = this.getModel(apiKey);
      const result = await model.generateContent(prompt);
      const jsonMatch = result.response.text().match(/\{[\s\S]*\}/);
      const comingSoon = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: result.response.text() };
      return { type: 'coming_soon', productName, comingSoon, timestamp: new Date() };
    } catch (error) { return { type: 'coming_soon', success: false, error: error.message }; }
  }

  toJSON() { return { ...super.toJSON(), sitesCreated: this.siteHistory.length }; }
}

module.exports = SiteForgeAgent;
