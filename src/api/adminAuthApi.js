import api from './index';

/**
 * API de Autenticación Admin (SIWE)
 */

/**
 * Verificar si una wallet es admin
 */
export async function checkAdminWallet(address) {
    const response = await api.get('/admin/auth/check', {
        params: { address }
    });
    return response.data;
}

/**
 * Obtener nonce para SIWE
 */
export async function getNonce(address) {
    const response = await api.get('/admin/auth/nonce', {
        params: { address }
    });
    return response.data;
}

/**
 * Verificar firma SIWE y crear sesión
 */
export async function verifySiwe(address, signature, message) {
    const response = await api.post('/admin/auth/verify', {
        address,
        signature,
        message
    });
    return response.data;
}

/**
 * Obtener información de la sesión actual
 */
export async function getSession(token) {
    const response = await api.get('/admin/auth/session', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
}

/**
 * Cerrar sesión admin
 */
export async function logout(token) {
    const response = await api.post('/admin/auth/logout', {}, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
}

/**
 * Obtener roles y permisos
 */
export async function getRoles(token) {
    const response = await api.get('/admin/auth/roles', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
}

const adminAuthApi = {
    checkAdminWallet,
    getNonce,
    verifySiwe,
    getSession,
    logout,
    getRoles
};

export default adminAuthApi;
