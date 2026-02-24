/**
 * Bolita Pool Admin API Client
 *
 * Client for La Bolita admin pool endpoints.
 * Follows same pattern as kenoApi.js admin methods.
 */

import api from './index';

/**
 * Get pool status (admin)
 */
export async function getPoolStatus() {
  const response = await api.get('/admin/bolita/pool');
  return response.data.data;
}

/**
 * Get draws list (admin)
 */
export async function getDraws(status = 'all', limit = 20) {
  const response = await api.get('/admin/bolita/draws', {
    params: { status, limit }
  });
  return response.data.data;
}

/**
 * Get current exposures (admin)
 */
export async function getExposures() {
  const response = await api.get('/admin/bolita/exposures');
  return response.data.data;
}

/**
 * Get daily history (admin)
 */
export async function getHistory(days = 7) {
  const response = await api.get('/admin/bolita/history', {
    params: { days }
  });
  return response.data.data;
}

const bolitaPoolApi = {
  getPoolStatus,
  getDraws,
  getExposures,
  getHistory
};

export default bolitaPoolApi;
