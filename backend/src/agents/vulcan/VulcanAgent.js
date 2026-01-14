/**
 * NEXUS OS - Vulcan Agent
 * Media Generation - Images, Video, Thumbnails
 * Integrates with DALL-E, Runway, Canva APIs
 */

const BaseAgent = require('../BaseAgent');

class VulcanAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      id: 'vulcan_01',
      name: 'Cinematic Forge',
      specialty: 'Motion Synthesis - Video Generation',
      capabilities: ['video_generate', 'image_generate', 'thumbnail_create', 'carousel_design']
    });

    this.openaiKey = config.openaiKey || process.env.OPENAI_API_KEY;
    this.runwayKey = config.runwayKey || process.env.RUNWAY_API_KEY;
    this.mediaHistory = [];
  }

  async execute(task) {
    const { type, payload } = task;

    switch (type) {
      case 'image_generate':
        return await this.generateImage(payload);

      case 'thumbnail_create':
        return await this.createThumbnail(payload);

      case 'video_generate':
        return await this.generateVideo(payload);

      case 'carousel_design':
        return await this.designCarousel(payload);

      default:
        return await this.generateImage(payload);
    }
  }

  async generateImage(payload) {
    const { prompt, style = 'modern', size = '1024x1024' } = payload;

    // Enhance prompt with style
    const stylePrompts = {
      modern: 'modern, clean, minimalist design, professional',
      bold: 'bold colors, high contrast, eye-catching, dynamic',
      elegant: 'elegant, sophisticated, subtle gradients, premium feel',
      playful: 'playful, colorful, fun, engaging, friendly',
      tech: 'futuristic, tech-inspired, digital, cyber aesthetic'
    };

    const enhancedPrompt = `${prompt}. Style: ${stylePrompts[style] || stylePrompts.modern}`;

    // Check if OpenAI API is available
    if (!this.openaiKey) {
      return {
        type: 'image_generate',
        success: false,
        error: 'OpenAI API key not configured',
        suggestion: 'Add OPENAI_API_KEY to environment variables',
        timestamp: new Date()
      };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: enhancedPrompt,
          n: 1,
          size: size
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const result = {
        type: 'image_generate',
        success: true,
        prompt: enhancedPrompt,
        imageUrl: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
        timestamp: new Date()
      };

      this.mediaHistory.push(result);
      return result;

    } catch (error) {
      return {
        type: 'image_generate',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async createThumbnail(payload) {
    const { title, subtitle, style = 'bold', platform = 'youtube' } = payload;

    const platformSpecs = {
      youtube: { size: '1280x720', emphasis: 'large text, face if possible' },
      linkedin: { size: '1200x627', emphasis: 'professional, clean' },
      twitter: { size: '1200x675', emphasis: 'eye-catching, simple' },
      instagram: { size: '1080x1080', emphasis: 'visual-first, minimal text' }
    };

    const spec = platformSpecs[platform] || platformSpecs.youtube;

    const prompt = `Create a ${platform} thumbnail: "${title}". ${subtitle ? `Subtitle: ${subtitle}.` : ''} ${spec.emphasis}. No text in image, just compelling visuals.`;

    return await this.generateImage({
      prompt,
      style,
      size: spec.size === '1080x1080' ? '1024x1024' : '1792x1024'
    });
  }

  async generateVideo(payload) {
    const { prompt, duration = 4, style = 'cinematic' } = payload;

    // Check if Runway API is available
    if (!this.runwayKey) {
      return {
        type: 'video_generate',
        success: false,
        error: 'Runway API key not configured',
        suggestion: 'Add RUNWAY_API_KEY to environment variables for video generation',
        placeholder: {
          message: 'Video generation ready when API configured',
          prompt,
          duration,
          style
        },
        timestamp: new Date()
      };
    }

    try {
      // Runway ML Gen-3 API integration
      const response = await fetch('https://api.runwayml.com/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.runwayKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          duration: duration,
          style: style
        })
      });

      const data = await response.json();

      const result = {
        type: 'video_generate',
        success: true,
        prompt,
        videoUrl: data.url,
        duration,
        timestamp: new Date()
      };

      this.mediaHistory.push(result);
      return result;

    } catch (error) {
      return {
        type: 'video_generate',
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async designCarousel(payload) {
    const { slides, platform = 'linkedin', style = 'modern' } = payload;

    const results = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slidePrompt = `Carousel slide ${i + 1}/${slides.length}: ${slide.title}. ${slide.description || ''}`;

      const image = await this.generateImage({
        prompt: slidePrompt,
        style,
        size: platform === 'instagram' ? '1024x1024' : '1792x1024'
      });

      results.push({
        slideNumber: i + 1,
        ...image
      });
    }

    return {
      type: 'carousel_design',
      success: true,
      slideCount: slides.length,
      slides: results,
      timestamp: new Date()
    };
  }

  getHistory(limit = 10) {
    return this.mediaHistory.slice(-limit);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      mediaGenerated: this.mediaHistory.length,
      openaiConfigured: !!this.openaiKey,
      runwayConfigured: !!this.runwayKey
    };
  }
}

module.exports = VulcanAgent;
