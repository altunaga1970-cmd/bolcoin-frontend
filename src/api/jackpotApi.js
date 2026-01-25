import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// =================================
// JACKPOT API CLIENT
// =================================

const jackpotApi = axios.create({
    baseURL: `${API_URL}/jackpot`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir wallet address
jackpotApi.interceptors.request.use((config) => {
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
// PUBLIC ENDPOINTS
// =================================

/**
 * Get current jackpot pool stats
 */
export const getPoolStats = async () => {
    const response = await jackpotApi.get('/status');
    return response.data;
};

/**
 * Get specific round by ID
 */
export const getRound = async (roundId) => {
    const response = await jackpotApi.get(`/rounds/${roundId}`);
    return response.data;
};

/**
 * Get jackpot statistics
 */
export const getJackpotStats = async () => {
    const response = await jackpotApi.get('/stats');
    return response.data;
};

// =================================
// USER ENDPOINTS
// =================================

/**
 * Get pending claims for user
 */
export const getPendingClaims = async () => {
    const response = await jackpotApi.get('/claims/pending');
    return response.data;
};

/**
 * Get claim proof for a specific round and ticket
 */
export const getClaimProof = async (roundId, ticketId) => {
    const response = await jackpotApi.get(`/claims/proof/${roundId}`, {
        params: { ticketId }
    });
    return response.data;
};

/**
 * Process jackpot claim (on-chain transaction)
 */
export const processJackpotClaim = async (roundId, ticketId, proof) => {
    const response = await jackpotApi.post(`/claims/process/${roundId}/${ticketId}`, { proof });
    return response.data;
};

// =================================
// ADMIN ENDPOINTS
// =================================

/**
 * Close jackpot round (admin)
 */
export const closeJackpotRound = async (roundId, result4d, result3d, result2d) => {
    const response = await jackpotApi.post(`/admin/rounds/${roundId}/close`, {
        result4d,
        result3d,
        result2d
    });
    return response.data;
};

/**
 * Transfer surplus to jackpot (admin)
 */
export const transferSurplus = async (roundId, reason, surplusAmount) => {
    const response = await jackpotApi.post('/admin/surplus/transfer', {
        roundId,
        reason,
        surplusAmount
    });
    return response.data;
};

// =================================
// HELPER FUNCTIONS
// =================================

/**
 * Format pool balance
 */
export const formatPoolBalance = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
};

/**
 * Get round status info
 */
export const getRoundStatusInfo = (status) => {
    const statuses = {
        active: {
            label: 'Activo',
            color: 'green',
            description: 'Round en progreso'
        },
        settled: {
            label: 'Liquidado',
            color: 'blue',
            description: 'Round liquidado, sin ganadores'
        },
        claims_open: {
            label: 'Claims Abiertos',
            color: 'yellow',
            description: 'Puedes reclamar tus premios'
        },
        closed: {
            label: 'Cerrado',
            color: 'gray',
            description: 'Round finalizado'
        }
    };
    return statuses[status] || { label: status, color: 'gray', description: '' };
};

export default jackpotApi;
