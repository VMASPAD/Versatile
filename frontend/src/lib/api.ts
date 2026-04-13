const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3514';

type FetchOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

async function request<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const token = localStorage.getItem('versatile_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('versatile_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string } }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  register: (username: string, password: string) =>
    request<{ token: string; user: { username: string } }>('/auth/register', {
      method: 'POST',
      body: { username, password },
    }),

  me: () => request('/auth/me'),

  // Ads
  getAds: () => request<any[]>('/ads'),
  getAd: (id: string) => request<any>(`/ads/${id}`),
  createAd: (data: any) => request('/ads', { method: 'POST', body: data }),
  updateAd: (id: string, data: any) => request(`/ads/${id}`, { method: 'PUT', body: data }),
  deleteAd: (id: string) => request(`/ads/${id}`, { method: 'DELETE' }),

  // Analytics
  getOverview: () => request('/analytics/overview'),
  getAdAnalytics: (adId: string) => request(`/analytics/${adId}`),

  // Bio
  getBio: () => request('/api/bio'),
  updateBio: (data: any) => request('/api/bio', { method: 'POST', body: data }),
  deleteBio: () => request('/api/bio', { method: 'DELETE' }),

  // Fly
  getFlies: () => request<any[]>('/api/fly'),
  createFly: (data: any) => request('/api/fly', { method: 'POST', body: data }),
  deleteFly: (id: string) => request(`/api/fly/${id}`, { method: 'DELETE' }),
};
