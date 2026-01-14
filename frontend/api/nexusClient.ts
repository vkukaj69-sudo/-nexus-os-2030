
const API_BASE = 'https://api.nexus-os.ai/api';

class NexusClient {
  private token: string | null = localStorage.getItem('nexus_vault_token');

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('nexus_vault_token', token);
  }

  getToken() {
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('nexus_vault_token');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_digital_soul');
  }

  async request(path: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...((options.headers as any) || {})
    };

    try {
      const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
      
      if (response.status === 401) {
        this.logout();
        window.location.reload();
        throw new Error('Node Session Expired: Re-authentication Required.');
      }

      const data = await response.json().catch(() => ({ success: false, error: 'Malformed Node Response' }));

      if (!response.ok || data.error || data.success === false) {
        const errorMsg = data.error || `Vault Node Deviation: ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (error: any) {
      console.error(`Nexus Network Deviation [${path}]:`, error);
      throw error; 
    }
  }

  /**
   * GET /api/status
   * Real system telemetry from GCP VM
   */
  async getSystemStatus() {
    return this.request('/status');
  }

  /**
   * GET /api/agents/list
   * Returns list of agents from PostgreSQL database
   */
  async getAgents() {
    return this.request('/agents/list');
  }

  async submitTask(agentId: string, taskType: string, payload: any) {
    return this.request('/agents/task', {
      method: 'POST',
      body: JSON.stringify({ agentId, taskType, payload })
    });
  }

  async getJobStatus(jobId: string) {
    return this.request(`/jobs/${jobId}`);
  }

  async provisionAgent(config: { name?: string, specialty: string }) {
    return this.request('/agents/provision', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  }

  async getUsage() {
    return this.request('/usage');
  }

  async analyzeHeatmap(content: string) {
    return this.request('/oracle/heatmap', {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  async createCheckoutSession(priceId: string) {
    return this.request('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ priceId })
    });
  }

  async storeKey(gemini_key: string) {
    return this.request('/keys/store', {
      method: 'POST',
      body: JSON.stringify({ gemini_key })
    });
  }

  async login(credentials: any) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data && data.token) {
      this.setToken(data.token);
      if (data.user) {
        localStorage.setItem('nexus_user', JSON.stringify(data.user));
      }
    }
    return data;
  }

  async register(credentials: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async synthesize(prompt: string, model: string = 'gemini-3-pro-preview', config: any = {}) {
    return this.request('/oracle/synthesize', {
      method: 'POST',
      body: JSON.stringify({ prompt, model, config })
    });
  }

  async saveSoul(dna: any) {
    return this.request('/soul/ingest', {
      method: 'POST',
      body: JSON.stringify({ dna })
    });
  }

  async retrieveSoul() {
    return this.request('/soul/retrieve');
  }
}

export const nexusApi = new NexusClient();
