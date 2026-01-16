/**
 * NEXUS OS - Vulcan Agent
 * Media Generation - Images, Video, Thumbnails
 * Integrates with DALL-E, Google Veo 2 APIs
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
    this.googleProjectId = config.googleProjectId || process.env.GOOGLE_CLOUD_PROJECT || 'nexus-production-483901';
    this.googleLocation = config.googleLocation || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
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
    const { prompt, duration = 5, style = 'cinematic', aspectRatio = '16:9' } = payload;

    // Check if Google Cloud is configured
    if (!this.googleProjectId) {
      return {
        type: 'video_generate',
        success: false,
        error: 'Google Cloud not configured',
        suggestion: 'Add GOOGLE_CLOUD_PROJECT to environment variables for Veo 2 video generation',
        placeholder: {
          message: 'Video generation ready when Google Cloud configured',
          prompt,
          duration,
          style
        },
        timestamp: new Date()
      };
    }

    try {
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      // Veo 2 via Vertex AI Generative Media API
      // Model: veo-2.0-generate-001 (GA version)
      const endpoint = `https://${this.googleLocation}-aiplatform.googleapis.com/v1/projects/${this.googleProjectId}/locations/${this.googleLocation}/publishers/google/models/veo-2.0-generate-001:predictLongRunning`;

      // Enhance prompt with style
      const enhancedPrompt = `${prompt}. Style: ${style}, cinematic quality, 4K resolution`;

      console.log('[Vulcan] Veo 2 request:', { endpoint, prompt: enhancedPrompt, duration, aspectRatio });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instances: [{
            prompt: enhancedPrompt
          }],
          parameters: {
            aspectRatio: aspectRatio,
            durationSeconds: duration,
            sampleCount: 1
          }
        })
      });

      // Log raw response for debugging
      const responseText = await response.text();
      console.log('[Vulcan] Veo 2 response status:', response.status);
      console.log('[Vulcan] Veo 2 response:', responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Veo 2 returned invalid JSON: ${responseText.substring(0, 200)}`);
      }

      if (data.error) {
        throw new Error(data.error.message || 'Veo 2 generation failed');
      }

      // Veo 2 returns an operation for async generation
      if (data.name) {
        // Return operation ID for polling
        const result = {
          type: 'video_generate',
          success: true,
          status: 'processing',
          operationId: data.name,
          prompt: enhancedPrompt,
          duration,
          aspectRatio,
          timestamp: new Date()
        };
        this.mediaHistory.push(result);
        return result;
      }

      // If immediate result available
      const videoUrl = data.predictions?.[0]?.video?.uri || data.predictions?.[0]?.videoUri;

      const result = {
        type: 'video_generate',
        success: true,
        prompt: enhancedPrompt,
        videoUrl,
        duration,
        aspectRatio,
        resolution: '4K',
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

  // Check video generation operation status
  async checkVideoOperation(operationName) {
    try {
      const { GoogleAuth } = require('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();

      // Veo 2 requires fetchPredictOperation method to check status
      const url = `https://${this.googleLocation}-aiplatform.googleapis.com/v1/projects/${this.googleProjectId}/locations/${this.googleLocation}/publishers/google/models/veo-2.0-generate-001:fetchPredictOperation`;
      console.log('[Vulcan] Checking operation status:', url);
      console.log('[Vulcan] Operation name:', operationName);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operationName: operationName
        })
      });

      console.log('[Vulcan] Operation status response:', response.status);

      // Check if response is OK before parsing
      if (!response.ok) {
        const text = await response.text();
        console.error('[Vulcan] Operation status error:', response.status, text.substring(0, 500));
        return {
          success: false,
          error: `Google API error: ${response.status} - ${text.substring(0, 200)}`
        };
      }

      const data = await response.json();
      console.log('[Vulcan] Operation data:', JSON.stringify(data).substring(0, 500));

      if (data.done) {
        // Handle various response formats from Veo 2
        const videoUrl = data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
          || data.response?.predictions?.[0]?.video?.uri
          || data.response?.generatedSamples?.[0]?.video?.uri;

        // Check for errors in the response
        if (data.error) {
          return {
            success: false,
            status: 'failed',
            error: data.error.message || 'Video generation failed',
            operationId: operationName
          };
        }

        return {
          success: true,
          status: 'complete',
          videoUrl,
          operationId: operationName
        };
      }

      return {
        success: true,
        status: 'processing',
        operationId: operationName,
        progress: data.metadata?.progressPercent || 0
      };
    } catch (error) {
      console.error('[Vulcan] checkVideoOperation error:', error);
      return {
        success: false,
        error: error.message
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
      veo2Configured: !!this.googleProjectId
    };
  }
}

module.exports = VulcanAgent;
