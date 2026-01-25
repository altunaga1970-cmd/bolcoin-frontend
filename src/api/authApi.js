import api from './index';

/**
 * API de Autenticación Web3
 *
 * En el modelo Web3-only, la autenticación se basa en wallet:
 * - No hay login/register tradicional
 * - La identidad es la dirección de wallet
 * - Las operaciones sensibles requieren firma
 */

/**
 * Obtener nonce para firmar (preparación para verificación)
 */
export async function getNonce() {
  const response = await api.get('/auth/nonce');
  return response.data;
}

/**
 * Verificar firma de wallet
 * @param {string} address - Dirección de wallet
 * @param {string} message - Mensaje firmado
 * @param {string} signature - Firma
 */
export async function verifyWallet(address, message, signature) {
  const response = await api.post('/auth/verify', {}, {
    headers: {
      'x-wallet-address': address,
      'x-wallet-message': message,
      'x-wallet-signature': signature
    }
  });
  return response.data;
}

/**
 * Obtener usuario actual por wallet
 * @param {string} address - Dirección de wallet
 */
export async function getMe(address) {
  const response = await api.get('/auth/me', {
    headers: {
      'x-wallet-address': address
    }
  });
  return response.data;
}

/**
 * Verificar estado de autenticación
 * @param {string} address - Dirección de wallet (opcional)
 */
export async function getStatus(address) {
  const headers = address ? { 'x-wallet-address': address } : {};
  const response = await api.get('/auth/status', { headers });
  return response.data;
}

/**
 * @deprecated - Web3-only mode
 * Registrar usuario (deshabilitado)
 */
export async function register() {
  console.warn('register() no disponible en modo Web3-only');
  throw new Error('Registro tradicional deshabilitado. Por favor conecta tu wallet.');
}

/**
 * @deprecated - Web3-only mode
 * Login tradicional (deshabilitado)
 */
export async function login() {
  console.warn('login() no disponible en modo Web3-only');
  throw new Error('Login tradicional deshabilitado. Por favor conecta tu wallet.');
}

/**
 * Logout (en Web3 es solo limpiar estado local)
 */
export async function logout() {
  // En Web3, el logout es del lado del cliente
  return { success: true, message: 'Desconecta tu wallet para cerrar sesión' };
}

const authApi = {
  getNonce,
  verifyWallet,
  getMe,
  getStatus,
  register,
  login,
  logout
};

export default authApi;
