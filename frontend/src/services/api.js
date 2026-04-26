import axios from 'axios';

const ADMIN_ENTRY_PATH = '/rk-secure-admin-portal-2026';
const resolvedHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const resolvedProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const defaultApiBaseUrl = `${resolvedProtocol}//${resolvedHost}:5000/api`;

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || defaultApiBaseUrl
});

export const getBackendBaseUrl = () =>
  (process.env.REACT_APP_API_URL || defaultApiBaseUrl).replace(/\/api\/?$/, '');

// Add token to requests
API.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('adminToken');

      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        window.location.href = ADMIN_ENTRY_PATH;
      }
    }

    return Promise.reject(error);
  }
);

// Properties
export const getProperties = (filters = {}) => 
  API.get('/properties', { params: filters });

export const getProperty = (id) => 
  API.get(`/properties/${id}`);

export const createProperty = (formData) => 
  API.post('/properties', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateProperty = (id, formData) => 
  API.put(`/properties/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const deleteProperty = (id) => 
  API.delete(`/properties/${id}`);

export const deletePropertyImage = (id, filename) => 
  API.delete(`/properties/${id}/image/${encodeURIComponent(filename)}`);

// Bookings
export const getBookings = (filters = {}) => 
  API.get('/bookings', { params: filters });

export const getBooking = (id) => 
  API.get(`/bookings/${id}`);

export const createBooking = (data) => 
  API.post('/bookings', data);

export const updateBooking = (id, data) => 
  API.put(`/bookings/${id}`, data);

export const deleteBooking = (id) => 
  API.delete(`/bookings/${id}`);

export const getBookingStats = () => 
  API.get('/bookings/stats/summary');

// Auth
export const loginAdmin = (username, password) => 
  API.post('/auth/login', { username, password });

export const verifyToken = () => 
  API.get('/auth/verify');

export default API;
