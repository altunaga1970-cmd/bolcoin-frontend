/**
 * Formatea un numero como moneda USDT
 */
export function formatCurrency(amount, decimals = 2) {
  if (amount === null || amount === undefined) return '0.00 USDT';

  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00 USDT';

  return `${num.toFixed(decimals)} USDT`;
}

/**
 * Formatea un numero con separadores de miles
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('es-ES');
}

/**
 * Formatea una fecha en formato legible
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea solo la hora
 */
export function formatTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formatea un numero de apuesta con ceros iniciales
 */
export function formatBetNumber(number, digits) {
  if (number === null || number === undefined) return '';
  return number.toString().padStart(digits, '0');
}

/**
 * Calcula y formatea el tiempo restante
 */
export function formatTimeRemaining(targetDate) {
  if (!targetDate) return '';

  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) return 'Finalizado';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Trunca un texto largo
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Calcula la ganancia potencial
 */
export function calculatePotentialWin(amount, multiplier) {
  return amount * multiplier;
}

/**
 * Formatea el multiplicador
 */
export function formatMultiplier(multiplier) {
  return `${multiplier}x`;
}

// =================================
// BLOCKCHAIN / HASH FORMATTERS
// =================================

/**
 * Trunca una direccion de wallet o hash de transaccion
 * Formato: 0x1234...5678
 * @param {string} address - Direccion o hash completo
 * @param {number} startChars - Caracteres al inicio (default 6 = 0x + 4)
 * @param {number} endChars - Caracteres al final (default 4)
 * @returns {string} Direccion truncada
 */
export function truncateAddress(address, startChars = 6, endChars = 4) {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Alias para truncateAddress - para hashes de transaccion
 */
export function truncateHash(hash, startChars = 10, endChars = 8) {
  return truncateAddress(hash, startChars, endChars);
}

/**
 * Formatea una direccion de wallet con checksum display
 * @param {string} address - Direccion de wallet
 * @returns {string} Direccion formateada
 */
export function formatWalletAddress(address) {
  if (!address) return '';
  // Mostrar primeros 6 y ultimos 4 caracteres
  return truncateAddress(address, 6, 4);
}

/**
 * Formatea un hash de transaccion para display
 * @param {string} txHash - Hash de transaccion
 * @returns {string} Hash formateado
 */
export function formatTxHash(txHash) {
  if (!txHash) return '';
  return truncateHash(txHash, 10, 8);
}

/**
 * Genera URL de explorer para una direccion
 * @param {string} address - Direccion de wallet
 * @param {number} chainId - ID de la red (default Polygon Mainnet)
 * @returns {string} URL del explorer
 */
export function getAddressExplorerUrl(address, chainId = 137) {
  const explorers = {
    137: 'https://polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    1: 'https://etherscan.io'
  };
  const baseUrl = explorers[chainId] || explorers[137];
  return `${baseUrl}/address/${address}`;
}

/**
 * Genera URL de explorer para una transaccion
 * @param {string} txHash - Hash de transaccion
 * @param {number} chainId - ID de la red
 * @returns {string} URL del explorer
 */
export function getTxExplorerUrl(txHash, chainId = 137) {
  const explorers = {
    137: 'https://polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    1: 'https://etherscan.io'
  };
  const baseUrl = explorers[chainId] || explorers[137];
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Formatea un monto en wei a ETH/MATIC
 * @param {string|number} wei - Monto en wei
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Monto formateado
 */
export function formatFromWei(wei, decimals = 4) {
  if (!wei) return '0';
  const value = parseFloat(wei) / 1e18;
  return value.toFixed(decimals);
}

/**
 * Formatea un monto de token con decimales
 * @param {string|number} amount - Monto raw
 * @param {number} tokenDecimals - Decimales del token (USDT = 6)
 * @param {number} displayDecimals - Decimales a mostrar
 * @returns {string} Monto formateado
 */
export function formatTokenAmount(amount, tokenDecimals = 6, displayDecimals = 2) {
  if (!amount) return '0';
  const value = parseFloat(amount) / Math.pow(10, tokenDecimals);
  return value.toFixed(displayDecimals);
}

/**
 * Formatea un numero grande con abreviaciones (K, M, B)
 * @param {number} num - Numero a formatear
 * @param {number} digits - Digitos decimales
 * @returns {string} Numero formateado
 */
export function formatCompactNumber(num, digits = 1) {
  if (num === null || num === undefined) return '0';

  const lookup = [
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' }
  ];

  const item = lookup.find(item => Math.abs(num) >= item.value);
  if (item) {
    return (num / item.value).toFixed(digits) + item.symbol;
  }
  return num.toFixed(digits);
}

/**
 * Valida si un string es una direccion de Ethereum valida
 * @param {string} address - Direccion a validar
 * @returns {boolean} True si es valida
 */
export function isValidAddress(address) {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Valida si un string es un hash de transaccion valido
 * @param {string} hash - Hash a validar
 * @returns {boolean} True si es valido
 */
export function isValidTxHash(hash) {
  if (!hash) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Formatea el estado de una transaccion
 * @param {string} status - Estado (pending, confirmed, failed)
 * @returns {Object} { label, color, icon }
 */
export function formatTxStatus(status) {
  const statuses = {
    pending: { label: 'Pendiente', color: 'yellow', icon: 'clock' },
    confirmed: { label: 'Confirmada', color: 'green', icon: 'check' },
    failed: { label: 'Fallida', color: 'red', icon: 'x' }
  };
  return statuses[status] || statuses.pending;
}
