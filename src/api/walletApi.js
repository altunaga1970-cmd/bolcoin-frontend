import api from './index';

/**
 * Recargar balance
 */
export async function recharge(amount) {
  const response = await api.post('/wallet/recharge', { amount });
  return response.data.data;
}

/**
 * Obtener balance actual
 */
export async function getBalance() {
  const response = await api.get('/wallet/balance');
  return response.data.data;
}

/**
 * Obtener historial de transacciones
 */
export async function getTransactions(page = 1, limit = 10, type = null) {
  const params = { page, limit };
  if (type) {
    params.type = type;
  }
  const response = await api.get('/wallet/transactions', { params });
  return response.data.data;
}

const walletApi = {
  recharge,
  getBalance,
  getTransactions
};

export default walletApi;
