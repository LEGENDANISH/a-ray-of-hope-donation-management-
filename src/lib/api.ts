const API_BASE = 'http://localhost:3001/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(username: string, accessKey: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, accessKey }),
    });
    this.setToken(response.token);
    return response;
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getMonthlyAnalytics() {
    return this.request('/analytics/monthly');
  }

  // Expenses
  async getExpenses() {
    return this.request('/expenses');
  }

  async createExpense(data: any) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: any) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Donations
  async getDonations() {
    return this.request('/donations');
  }

  async createDonation(data: any) {
    return this.request('/donations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Campaigns
  async getCampaigns() {
    return this.request('/campaigns');
  }

  async createCampaign(data: any) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Donors
  async getDonors() {
    return this.request('/donors');
  }

  async createDonor(data: any) {
    return this.request('/donors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Beneficiaries
  async getBeneficiaries() {
    return this.request('/beneficiaries');
  }

  async createBeneficiary(data: any) {
    return this.request('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Export
  async exportExpenses() {
    const response = await fetch(`${API_BASE}/export/expenses`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient();