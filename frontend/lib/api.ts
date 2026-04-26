const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SignupData {
  email: string;
  password: string;
  full_name?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export const api = {
  // Auth endpoints
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    return response.json();
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  },

  async getCurrentUser(token: string) {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  },

  async logout(token: string) {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return response.json();
  },

  // Resume endpoints
  async uploadResume(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/resumes/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Resume upload failed');
    }

    return response.json();
  },

  async getResumes(token: string) {
    const response = await fetch(`${API_URL}/resumes/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch resumes');
    }

    return response.json();
  },

  async deleteResume(resumeId: number, token: string) {
    const response = await fetch(`${API_URL}/resumes/${resumeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete resume');
    }

    return response.json();
  },

  // Interview endpoints
  async createInterview(data: { resume_id: number; job_description: string; num_questions?: number; target_company?: string; target_role?: string }, token: string) {
    const response = await fetch(`${API_URL}/interviews/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      const detail = error.detail;
      if (typeof detail === 'object' && detail !== null) {
        const e = new Error(detail.message || 'Failed to create interview') as Error & { code?: string; upgrade_required?: boolean };
        e.code = detail.code;
        e.upgrade_required = detail.upgrade_required;
        throw e;
      }
      throw new Error(detail || 'Failed to create interview');
    }

    return response.json();
  },

  async getInterviews(token: string) {
    const response = await fetch(`${API_URL}/interviews/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interviews');
    }

    return response.json();
  },

  async getInterview(interviewId: number, token: string) {
    const response = await fetch(`${API_URL}/interviews/${interviewId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interview');
    }

    return response.json();
  },

  async deleteInterview(interviewId: number, token: string) {
    const response = await fetch(`${API_URL}/interviews/${interviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete interview');
    }

    return response.json();
  },

  // Evaluation endpoints
  async getInterviewResults(interviewId: number, token: string) {
    const response = await fetch(`${API_URL}/evaluation/interviews/${interviewId}/results`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch interview results');
    }

    return response.json();
  },

  async triggerEvaluation(interviewId: number, token: string) {
    const response = await fetch(`${API_URL}/evaluation/interviews/${interviewId}/evaluate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to trigger evaluation');
    }

    return response.json();
  },

  async getIdealAnswer(questionId: number, token: string) {
    const response = await fetch(`${API_URL}/evaluation/questions/${questionId}/ideal-answer`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ideal answer');
    }

    return response.json();
  },

  // Analytics endpoints
  async getDashboardStats(token: string) {
    const response = await fetch(`${API_URL}/analytics/dashboard-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
    }

    return response.json();
  },

  async getAnalytics(token: string) {
    const response = await fetch(`${API_URL}/analytics/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return response.json();
  },

  // Billing endpoints
  async getBillingStatus(token: string) {
    const response = await fetch(`${API_URL}/billing/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch billing status');
    return response.json();
  },

  async createCheckoutSession(priceId: 'monthly' | 'annual', token: string) {
    const response = await fetch(`${API_URL}/billing/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price_id: priceId }),
    });
    if (!response.ok) throw new Error('Failed to create checkout session');
    return response.json();
  },

  async createPortalSession(token: string) {
    const response = await fetch(`${API_URL}/billing/portal`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to create portal session');
    return response.json();
  },
};
