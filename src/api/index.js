import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Interceptor de request - enviar token correcto segun contexto
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isAdminCall = url.includes('/admin/');

    // 1. Authorization header
    const adminToken = localStorage.getItem('admin_jwt');
    if (isAdminCall && adminToken) {
      // Admin API calls use admin JWT
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (!isAdminCall) {
      // User API calls use legacy JWT if available
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 2. Always send wallet address (backend authenticateWallet needs it)
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      config.headers['x-wallet-address'] = walletAddress;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de response - manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar error 401 (no autorizado)
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      if (url.includes('/admin/')) {
        // Only clear admin JWT for admin API 401s
        localStorage.removeItem('admin_jwt');
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // Extraer mensaje de error del servidor
    const message = error.response?.data?.error ||
                   error.response?.data?.message ||
                   error.message ||
                   'Error de conexion';

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data
    });
  }
);

export default api;
