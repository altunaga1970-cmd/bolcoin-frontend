import api from './index';

/**
 * Realizar apuestas
 */
export async function placeBets(drawId, bets) {
  const response = await api.post('/bets/place', { draw_id: drawId, bets });
  return response.data.data;
}

/**
 * Obtener apuestas del usuario
 */
export async function getMyBets(page = 1, limit = 10, status = null, drawId = null) {
  const params = { page, limit };
  if (status) params.status = status;
  if (drawId) params.draw_id = drawId;

  const response = await api.get('/bets/my-bets', { params });
  return response.data.data;
}

/**
 * Obtener estadisticas de apuestas del usuario
 */
export async function getBetStats() {
  const response = await api.get('/bets/stats');
  return response.data.data;
}

/**
 * Obtener una apuesta por ID
 */
export async function getBetById(id) {
  const response = await api.get(`/bets/${id}`);
  return response.data.data;
}

const betApi = {
  placeBets,
  getMyBets,
  getBetStats,
  getBetById
};

export default betApi;
