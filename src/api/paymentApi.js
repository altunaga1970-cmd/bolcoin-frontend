import api from './index';

/**
 * Obtener criptomonedas disponibles
 */
export async function getCurrencies() {
  const response = await api.get('/payments/currencies');
  return response.data.data;
}

/**
 * Obtener monto minimo para una crypto
 */
export async function getMinAmount(currency) {
  const response = await api.get(`/payments/min-amount/${currency}`);
  return response.data.data;
}

/**
 * Crear deposito
 */
export async function createDeposit(amount, currency) {
  const response = await api.post('/payments/deposit', { amount, currency });
  return response.data.data;
}

/**
 * Obtener estado de un deposito
 */
export async function getDepositStatus(depositId) {
  const response = await api.get(`/payments/deposit/${depositId}`);
  return response.data.data;
}

/**
 * Obtener historial de depositos
 */
export async function getDeposits(page = 1, limit = 10) {
  const response = await api.get('/payments/deposits', { params: { page, limit } });
  return response.data.data;
}

/**
 * Obtener limites de retiro
 */
export async function getWithdrawalLimits() {
  const response = await api.get('/payments/withdrawal-limits');
  return response.data.data;
}

/**
 * Solicitar retiro
 */
export async function requestWithdrawal(amount, currency, walletAddress) {
  const response = await api.post('/payments/withdraw', {
    amount,
    currency,
    wallet_address: walletAddress
  });
  return response.data.data;
}

/**
 * Obtener historial de retiros
 */
export async function getWithdrawals(page = 1, limit = 10, status = null) {
  const params = { page, limit };
  if (status) params.status = status;
  const response = await api.get('/payments/withdrawals', { params });
  return response.data.data;
}

const paymentApi = {
  getCurrencies,
  getMinAmount,
  createDeposit,
  getDepositStatus,
  getDeposits,
  getWithdrawalLimits,
  requestWithdrawal,
  getWithdrawals
};

export default paymentApi;
