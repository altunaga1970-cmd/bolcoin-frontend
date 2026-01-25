import api from './index';

/**
 * Obtener lista de sorteos (admin)
 */
export async function getDraws(page = 1, limit = 20, status = null) {
  const params = { page, limit };
  if (status) params.status = status;
  const response = await api.get('/admin/draws', { params });
  return response.data.data;
}

/**
 * Crear nuevo sorteo
 */
export async function createDraw(drawNumber, scheduledTime) {
  const response = await api.post('/admin/draws', {
    draw_number: drawNumber,
    scheduled_time: scheduledTime
  });
  return response.data.data;
}

/**
 * Abrir sorteo para apuestas
 */
export async function openDraw(drawId) {
  const response = await api.put(`/admin/draws/${drawId}/open`);
  return response.data.data;
}

/**
 * Cerrar sorteo
 */
export async function closeDraw(drawId) {
  const response = await api.put(`/admin/draws/${drawId}/close`);
  return response.data.data;
}

/**
 * Ingresar resultados del sorteo
 */
export async function enterResults(drawId, fijos, centenas, parles) {
  const response = await api.put(`/admin/draws/${drawId}/results`, {
    fijos,
    centenas,
    parles
  });
  return response.data.data;
}

/**
 * Obtener estadisticas de un sorteo
 */
export async function getDrawStats(drawId) {
  const response = await api.get(`/admin/draws/${drawId}/stats`);
  return response.data.data;
}

/**
 * Obtener lista de usuarios
 */
export async function getUsers(page = 1, limit = 20, search = '') {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await api.get('/admin/users', { params });
  return response.data.data;
}

/**
 * Obtener usuario por ID
 */
export async function getUserById(userId) {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data.data;
}

/**
 * Ajustar balance de usuario
 */
export async function adjustBalance(userId, amount, reason) {
  const response = await api.put(`/admin/users/${userId}/balance`, {
    amount,
    reason
  });
  return response.data.data;
}

/**
 * Obtener estadisticas del sistema
 */
export async function getStatistics() {
  const response = await api.get('/admin/statistics');
  return response.data.data;
}

/**
 * Obtener lista de apuestas
 */
export async function getBets(page = 1, limit = 20, userId = null, drawId = null, status = null) {
  const params = { page, limit };
  if (userId) params.userId = userId;
  if (drawId) params.drawId = drawId;
  if (status) params.status = status;
  const response = await api.get('/admin/bets', { params });
  return response.data.data;
}

/**
 * Obtener lista de retiros (admin)
 */
export async function getWithdrawals(page = 1, limit = 20, status = null) {
  const params = { page, limit };
  if (status) params.status = status;
  const response = await api.get('/admin/withdrawals', { params });
  return response.data.data;
}

/**
 * Aprobar retiro
 */
export async function approveWithdrawal(withdrawalId) {
  const response = await api.put(`/admin/withdrawals/${withdrawalId}/approve`);
  return response.data.data;
}

/**
 * Rechazar retiro
 */
export async function rejectWithdrawal(withdrawalId, reason) {
  const response = await api.put(`/admin/withdrawals/${withdrawalId}/reject`, { reason });
  return response.data.data;
}

const adminApi = {
  getDraws,
  createDraw,
  openDraw,
  closeDraw,
  enterResults,
  getDrawStats,
  getUsers,
  getUserById,
  adjustBalance,
  getStatistics,
  getBets,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};

export default adminApi;
