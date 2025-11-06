import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Daily Updates APIs
export const dailyUpdateAPI = {
  create: (data) => api.post('/daily-updates', data),
  getAll: (params) => api.get('/daily-updates', { params }),
  getById: (id) => api.get(`/daily-updates/${id}`),
  update: (id, data) => api.put(`/daily-updates/${id}`, data),
  delete: (id) => api.delete(`/daily-updates/${id}`),
};

// Weekly Updates APIs
export const weeklyUpdateAPI = {
  generate: (data) => api.post('/weekly-updates/generate', data),
  create: (data) => api.post('/weekly-updates', data),
  getAll: (params) => api.get('/weekly-updates', { params }),
  getById: (id) => api.get(`/weekly-updates/${id}`),
  update: (id, data) => api.put(`/weekly-updates/${id}`, data),
  delete: (id) => api.delete(`/weekly-updates/${id}`),
};

// Company APIs
export const companyAPI = {
  create: (data) => api.post('/companies', data),
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/companies/${id}`, {
    params: { permanent }
  }),
  getStats: (id) => api.get(`/companies/${id}/stats`),
};

// Export APIs
export const exportAPI = {
  getMetadata: (params) => api.get('/export/metadata', { params }),
  exportCSV: (params) => api.get('/export/csv', {
    params,
    responseType: 'blob'
  }),
  exportJSON: (params) => api.get('/export/json', {
    params,
    responseType: 'blob'
  }),
  exportMarkdown: (params) => api.get('/export/markdown', {
    params,
    responseType: 'blob'
  }),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};

export default api;
