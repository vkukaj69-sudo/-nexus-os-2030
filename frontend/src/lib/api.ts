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
}

export const api = new NexusAPI();
