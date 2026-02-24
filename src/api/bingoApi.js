/**
 * Bingo API Client
 *
 * Cliente para comunicarse con el backend de Bingo
 */

import api from './index';

// =================================
// PUBLIC
// =================================

/**
 * Get game config + jackpot balance
 */
export async function getConfig() {
  const response = await api.get('/bingo/config');
  return response.data.data;
}

/**
 * Get 4 rooms with current state, phase, countdown
 */
export async function getRooms() {
  const response = await api.get('/bingo/rooms');
  return response.data.data;
}

/**
 * Get rounds list
 * @param {string} [status] - 'open' | 'resolved' | 'recent'
 * @param {number} [limit]
 * @param {number} [room] - filter by room number (1-4)
 */
export async function getRounds(status, limit, room) {
  const params = {};
  if (status) params.status = status;
  if (limit) params.limit = limit;
  if (room) params.room = room;
  const response = await api.get('/bingo/rounds', { params });
  return response.data.data;
}

/**
 * Get round detail
 * @param {number} roundId
 */
export async function getRoundDetail(roundId) {
  const response = await api.get(`/bingo/rounds/${roundId}`);
  return response.data.data;
}

/**
 * Get verification data for a round
 * @param {number} roundId
 */
export async function getVerificationData(roundId) {
  const response = await api.get(`/bingo/verify/${roundId}`);
  return response.data.data;
}

// =================================
// PROTECTED (wallet auth)
// =================================

/**
 * Get rooms where user has active cards
 */
export async function getMyRooms() {
  const response = await api.get('/bingo/my-rooms');
  return response.data.data;
}

/**
 * Get user's cards
 * @param {number} [roundId] - optional filter by round
 */
export async function getMyCards(roundId) {
  const params = {};
  if (roundId) params.roundId = roundId;
  const response = await api.get('/bingo/my-cards', { params });
  return response.data.data;
}

/**
 * Get user's history
 * @param {number} [limit]
 */
export async function getHistory(limit = 20) {
  const response = await api.get('/bingo/history', { params: { limit } });
  return response.data.data;
}

/**
 * Buy cards off-chain
 * @param {number} roundId
 * @param {number} count - 1 to 4
 */
export async function buyCardsOffChain(roundId, count = 1) {
  const response = await api.post('/bingo/buy-cards', { roundId, count });
  return response.data.data;
}

// =================================
// ADMIN
// =================================

/**
 * Create a new round (admin)
 * @param {number} scheduledClose - unix timestamp
 */
export async function createRound(scheduledClose) {
  const response = await api.post('/bingo/admin/create-round', { scheduledClose });
  return response.data.data;
}

/**
 * Close a round and request VRF (admin)
 * @param {number} roundId
 */
export async function closeRound(roundId) {
  const response = await api.post('/bingo/admin/close-round', { roundId });
  return response.data.data;
}

/**
 * Cancel a round (admin)
 * @param {number} roundId
 */
export async function cancelRound(roundId) {
  const response = await api.post('/bingo/admin/cancel-round', { roundId });
  return response.data.data;
}

/**
 * Get admin stats
 * @param {string} [dateFrom]
 * @param {string} [dateTo]
 */
export async function getAdminStats(dateFrom, dateTo) {
  const params = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  const response = await api.get('/bingo/admin/stats', { params });
  return response.data.data;
}

const bingoApi = {
  getConfig,
  getRooms,
  getRounds,
  getRoundDetail,
  getVerificationData,
  getMyRooms,
  getMyCards,
  getHistory,
  buyCardsOffChain,
  createRound,
  closeRound,
  cancelRound,
  getAdminStats
};

export default bingoApi;
