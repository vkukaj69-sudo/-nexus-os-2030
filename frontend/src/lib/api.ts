const API_URL = 'https://api.nexus-os.ai';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImVtYWlsIjoidmlubnlrNzJAeWFob28uY29tIiwicm9sZSI6InNvdmVyZWlnbiIsImlhdCI6MTc2ODQwODQzNSwiZXhwIjoxNzY5MDEzMjM1fQ.mPE80sDA6hJSU4sNEWS8M6gwO2U8Erw2RH7IaE1Z_ZM';

class NexusAPI {
  private token: string = AUTH_TOKEN;

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.token
    };
    try {
      const res = await fetch(API_URL + endpoint, { ...options, headers });
      return res.json();
    } catch (err) {
      console.error('API Error:', err);
      return { error: 'Request failed' };
    }
  }

  getAgents() { return this.request('/api/agents/list'); }
  callAgent(agentId: string, input: any) {
    return this.request('/api/agent/' + agentId, { method: 'POST', body: JSON.stringify(input) });
  }
  getInsights() { return this.request('/api/analytics/insights'); }
  getNotifications() { return this.request('/api/notifications'); }
  getWorkflows() { return this.request('/api/workflows'); }

  // Video Studio
  generateVideo(prompt: string, duration: number = 6, aspectRatio: string = '16:9') {
    return this.request('/api/video/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, duration, aspectRatio })
    });
  }

  checkVideoStatus(operationId: string) {
    return this.request('/api/video/status?op=' + encodeURIComponent(operationId));
  }

  // Content Studio
  generateContent(content: string, platform: string, type: string = 'content_generate') {
    return this.request('/api/scribe/generate', {
      method: 'POST',
      body: JSON.stringify({ content, platform, type })
    });
  }

  transformContent(content: string, fromPlatform: string, toPlatform: string) {
    return this.request('/api/scribe/transform', {
      method: 'POST',
      body: JSON.stringify({ content, fromPlatform, toPlatform })
    });
  }

  // Research
  getTrends(keyword?: string, keywords?: string[], geo: string = 'US') {
    return this.request('/api/scryer/trends', {
      method: 'POST',
      body: JSON.stringify({ keyword, keywords, geo })
    });
  }

  research(query: string, analysisType: string = 'research') {
    return this.request('/api/scryer/analyze', {
      method: 'POST',
      body: JSON.stringify({ query, analysisType })
    });
  }
}

export const api = new NexusAPI();
