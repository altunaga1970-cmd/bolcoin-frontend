/**
 * Keno API Client
 *
 * Cliente para comunicarse con el backend de Keno
 */

import api from './index';

/**
 * Obtener configuracion del juego (tabla de pagos, limites)
 */
export async function getConfig() {
  const response = await api.get('/keno/config');
  return response.data.data;
}

/**
 * Obtener balance total (contrato + virtual keno)
 */
export async function getBalance() {
  const response = await api.get('/keno/balance');
  return response.data.data;
}

/**
 * Create a seed commit for commit-reveal fairness
 * @returns {{ commitId: string, seedHash: string }}
 */
export async function commitSeed() {
  const response = await api.post('/keno/commit');
  return response.data.data;
}

/**
 * Jugar Keno
 * @param {number[]} numbers - Numeros seleccionados (1-80)
 * @param {number} amount - Monto de apuesta en USDT
 * @param {string} [commitId] - Optional commit ID for commit-reveal
 */
export async function playKeno(numbers, amount, commitId = null, clientSeed = null) {
  const body = { numbers, amount };
  if (commitId) body.commitId = commitId;
  if (clientSeed) body.clientSeed = clientSeed;
  const response = await api.post('/keno/play', body);
  return response.data.data;
}

/**
 * Obtener historial de partidas
 * @param {number} limit - Cantidad maxima de resultados
 */
export async function getHistory(limit = 20) {
  const response = await api.get('/keno/history', { params: { limit } });
  return response.data.data;
}

/**
 * Obtener estadisticas (admin)
 */
export async function getStats(dateFrom = null, dateTo = null) {
  const params = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const response = await api.get('/keno/admin/stats', { params });
  return response.data.data;
}

// =================================
// LOSS LIMITS
// =================================

/**
 * Get loss limits config + current usage
 */
export async function getLimits() {
  const response = await api.get('/keno/limits');
  return response.data.data;
}

// =================================
// SESSION MANAGEMENT
// =================================

/**
 * Obtener información de sesión activa
 */
export async function getSession() {
  const response = await api.get('/keno/session');
  return response.data.data;
}

/**
 * Iniciar o reanudar sesión de Keno
 */
export async function startSession() {
  const response = await api.post('/keno/session/start');
  return response.data.data;
}

/**
 * Liquidar sesión activa con el contrato
 */
export async function settleSession() {
  const response = await api.post('/keno/session/settle');
  return response.data.data;
}

// =================================
// POOL ADMIN
// =================================

/**
 * Obtener estado del pool (admin)
 */
export async function getPoolStatus() {
  const response = await api.get('/keno/admin/pool');
  return response.data.data;
}

/**
 * Obtener sesiones activas (admin)
 */
export async function getActiveSessions(status = 'active', limit = 50) {
  const response = await api.get('/keno/admin/sessions', {
    params: { status, limit }
  });
  return response.data.data;
}

/**
 * Obtener historial del pool (admin)
 */
export async function getPoolHistory(days = 7) {
  const response = await api.get('/keno/admin/pool-history', {
    params: { days }
  });
  return response.data.data;
}

// =================================
// VRF VERIFICATION
// =================================

/**
 * Verificar un juego (Provably Fair)
 */
export async function verifyGame(gameId) {
  const response = await api.get(`/keno/verify/${gameId}`);
  return response.data.data;
}

/**
 * Obtener estadisticas VRF (admin)
 */
export async function getVrfStats() {
  const response = await api.get('/keno/admin/vrf/stats');
  return response.data.data;
}

/**
 * Forzar creación de batch VRF (admin)
 */
export async function createVrfBatch() {
  const response = await api.post('/keno/admin/vrf/batch');
  return response.data.data;
}

const kenoApi = {
  getConfig,
  getBalance,
  commitSeed,
  playKeno,
  getHistory,
  getStats,
  // Loss limits
  getLimits,
  // Session management
  getSession,
  startSession,
  settleSession,
  // Pool admin
  getPoolStatus,
  getActiveSessions,
  getPoolHistory,
  // VRF
  verifyGame,
  getVrfStats,
  createVrfBatch
};

export default kenoApi;
