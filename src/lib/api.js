import axios from 'axios';

// Use environment variables with fallback for local development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/api/users/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  login: async (userData) => {
    const response = await api.post('/api/users/login', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getProfile: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await api.put('/api/users/profile', userData);
    return response.data;
  },
};

// Transaction API
export const transactionAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/api/transactions', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/api/transactions/${id}`);
    return response.data;
  },
  create: async (transactionData) => {
    const response = await api.post('/api/transactions', transactionData);
    return response.data;
  },
  update: async (id, transactionData) => {
    const response = await api.put(`/api/transactions/${id}`, transactionData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/transactions/${id}`);
    return response.data;
  },
  getSummary: async (params = {}) => {
    const response = await api.get('/api/transactions/summary', { params });
    return response.data;
  },
  getCategoryAnalysis: async (params = {}) => {
    const response = await api.get('/api/transactions/analysis', { params });
    return response.data;
  },
  getMonthlyTrends: async (params = {}) => {
    const response = await api.get('/api/transactions/trends', { params });
    return response.data;
  },
};

// Savings Goal API
export const savingsGoalAPI = {
  get: async () => {
    const response = await api.get('/api/savings-goal');
    return response.data;
  },
  update: async (amount) => {
    const response = await api.post('/api/savings-goal', { amount });
    return response.data;
  },
};

// Budget API
export const budgetAPI = {
  getAll: async () => {
    const response = await api.get('/api/budget');
    return response.data;
  },
  createOrUpdate: async (category, amount) => {
    const response = await api.post('/api/budget', { category, amount });
    return response.data;
  },
  updateBatch: async (budgets) => {
    const response = await api.put('/api/budget/batch', { budgets });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/budget/${id}`);
    return response.data;
  },
};

export default api;