import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// =================================
// CLAIMS API CLIENT
// =================================

const claimsApi = axios.create({
    baseURL: `${API_URL}/claims`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir wallet address
claimsApi.interceptors.request.use((config) => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress) {
        config.headers['x-wallet-address'] = walletAddress;
    }

    const signature = localStorage.getItem('walletSignature');
    if (signature) {
        config.headers['x-wallet-signature'] = signature;
    }

    const message = localStorage.getItem('signedMessage');
    if (message) {
        config.headers['x-signed-message'] = message;
    }

    return config;
});

// =================================
// USER ENDPOINTS
// =================================

/**
 * Obtener resumen de claims del usuario
 */
export const getClaimsSummary = async () => {
    const response = await claimsApi.get('/summary');
    return response.data;
};

/**
 * Obtener lista de claims del usuario con paginación
 */
export const getUserClaims = async (page = 1, limit = 20) => {
    const response = await claimsApi.get('/', {
        params: { page, limit }
    });
    return response.data;
};

/**
 * Obtener datos de claim para un sorteo específico
 */
export const getClaimDataForDraw = async (drawId) => {
    const response = await claimsApi.get(`/draw/${drawId}`);
    return response.data;
};

/**
 * Procesar un claim (después de la transacción on-chain)
 */
export const processClaim = async (claimId, txHash) => {
    const response = await claimsApi.post(`/${claimId}/process`, { txHash });
    return response.data;
};

/**
 * Verificar un proof off-chain
 */
export const verifyProof = async (leafHash, proof, root) => {
    const response = await claimsApi.post('/verify-proof', {
        leafHash,
        proof,
        root
    });
    return response.data;
};

// =================================
// HELPER FUNCTIONS
// =================================

/**
 * Formatear cantidad de premio
 */
export const formatPrizeAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

/**
 * Obtener nombre de categoría de La Fortuna
 */
export const getCategoryName = (category) => {
    const categories = {
        1: '6 + Clave (Jackpot)',
        2: '6 aciertos',
        3: '5 + Clave',
        4: '5 aciertos',
        5: '4 + Clave',
        6: '4 aciertos',
        7: '3 + Clave',
        8: '3 aciertos'
    };
    return categories[category] || `Categoría ${category}`;
};

/**
 * Obtener color de categoría para UI
 */
export const getCategoryColor = (category) => {
    const colors = {
        1: 'gold',      // Jackpot
        2: 'purple',    // 6 aciertos
        3: 'blue',      // 5 + clave
        4: 'teal',      // 5 aciertos
        5: 'green',     // 4 + clave
        6: 'lime',      // 4 aciertos
        7: 'orange',    // 3 + clave
        8: 'yellow'     // 3 aciertos
    };
    return colors[category] || 'gray';
};

/**
 * Obtener estado de claim formateado
 */
export const getClaimStatusInfo = (status) => {
    const statuses = {
        pending: {
            label: 'Pendiente',
            color: 'yellow',
            description: 'Puedes reclamar este premio'
        },
        claimed: {
            label: 'Reclamado',
            color: 'green',
            description: 'Premio ya reclamado'
        },
        expired: {
            label: 'Expirado',
            color: 'red',
            description: 'El período de reclamo ha expirado'
        }
    };
    return statuses[status] || { label: status, color: 'gray', description: '' };
};

export default claimsApi;
