import api from './index';

/**
 * Obtener sorteos activos (abiertos para apuestas)
 */
export async function getActive() {
  const response = await api.get('/draws/active');
  return response.data.data;
}

/**
 * Obtener sorteos proximos (programados)
 */
export async function getUpcoming(limit = 5) {
  const response = await api.get('/draws/upcoming', { params: { limit } });
  return response.data.data;
}

/**
 * Obtener sorteos completados
 */
export async function getCompleted(page = 1, limit = 10) {
  const response = await api.get('/draws/completed', { params: { page, limit } });
  return response.data.data;
}

/**
 * Obtener un sorteo por ID
 */
export async function getById(id) {
  const response = await api.get(`/draws/${id}`);
  return response.data.data;
}

/**
 * Obtener resultados de un sorteo
 */
export async function getResults(id) {
  const response = await api.get(`/draws/${id}/results`);
  return response.data.data;
}

const drawApi = {
  getActive,
  getUpcoming,
  getCompleted,
  getById,
  getResults
};

export default drawApi;
