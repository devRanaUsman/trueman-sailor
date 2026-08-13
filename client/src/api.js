import axios from 'axios';

// Use environment variable for API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trueman_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || fallback;

export default api;
