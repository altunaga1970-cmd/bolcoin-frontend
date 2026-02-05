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

// Interceptor de request - agregar wallet address para autenticación Web3
api.interceptors.request.use(
  (config) => {
    // Web3 auth: enviar dirección de wallet
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
      config.headers['x-wallet-address'] = walletAddress;
      console.log(`[Frontend] Sending wallet address: ${walletAddress}`);
    } else {
      console.warn('[Frontend] No wallet address in localStorage');
    }

    // Legacy auth: token JWT (por compatibilidad)
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

// Interceptor de response - manejar errores globalmente
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar error 401 (no autorizado)
    // En Web3-only mode, no redirigimos a login - el usuario debe conectar wallet
    if (error.response?.status === 401) {
      // Limpiar tokens legacy si existen
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // NO redirigir - dejar que el componente maneje el estado de no-autenticado
    }

    // Extraer mensaje de error del servidor
    const message = error.response?.data?.error ||
                   error.response?.data?.message ||
                   error.message ||
                   'Error de conexión';

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data
    });
  }
);

export default api;
