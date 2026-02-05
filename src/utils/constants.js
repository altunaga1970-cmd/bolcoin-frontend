// =================================
// REGLAS DEL JUEGO
// =================================

export const GAME_RULES = {
  fijos: {
    name: 'Fijos',
    description: 'Apuesta de 2 digitos (00-99)',
    digits: 2,
    min: 0,
    max: 99,
    multiplier: 80,
    maxBet: 1000,
    minBet: 1,
    placeholder: '00'
  },
  centenas: {
    name: 'Centenas',
    description: 'Apuesta de 3 digitos (000-999)',
    digits: 3,
    min: 0,
    max: 999,
    multiplier: 500,
    maxBet: 1000,
    minBet: 1,
    placeholder: '000'
  },
  parles: {
    name: 'Parlé',
    description: 'Apuesta de 4 digitos (0000-9999)',
    digits: 4,
    min: 0,
    max: 9999,
    multiplier: 900,
    maxBet: 1000,
    minBet: 1,
    placeholder: '0000'
  },
  corrido: {
    name: 'Corrido',
    description: 'Crea 2 apuestas Fijos (primeros y ultimos 2 digitos)',
    digits: 4,
    min: 0,
    max: 9999,
    multiplier: 30,
    maxBet: 1000,
    minBet: 1,
    costMultiplier: 2,
    placeholder: '0000'
  }
};

// =================================
// ESTADOS DE SORTEO
// =================================

export const DRAW_STATUS = {
  SCHEDULED: 'scheduled',
  OPEN: 'open',
  CLOSED: 'closed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const DRAW_STATUS_LABELS = {
  scheduled: 'Programado',
  open: 'Abierto',
  closed: 'Cerrado',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

export const DRAW_STATUS_COLORS = {
  scheduled: 'info',
  open: 'success',
  closed: 'warning',
  completed: 'default',
  cancelled: 'error'
};

// =================================
// ESTADOS DE APUESTA
// =================================

export const BET_STATUS = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

export const BET_STATUS_LABELS = {
  pending: 'Pendiente',
  won: 'Ganada',
  lost: 'Perdida',
  cancelled: 'Cancelada',
  refunded: 'Reembolsada'
};

export const BET_STATUS_COLORS = {
  pending: 'warning',
  won: 'success',
  lost: 'error',
  cancelled: 'default',
  refunded: 'info'
};

// =================================
// TIPOS DE TRANSACCION
// =================================

export const TRANSACTION_TYPE = {
  RECHARGE: 'recharge',
  BET: 'bet',
  WIN: 'win',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment'
};

export const TRANSACTION_TYPE_LABELS = {
  recharge: 'Recarga',
  bet: 'Apuesta',
  win: 'Ganancia',
  refund: 'Reembolso',
  adjustment: 'Ajuste'
};

export const TRANSACTION_TYPE_COLORS = {
  recharge: 'success',
  bet: 'warning',
  win: 'success',
  refund: 'info',
  adjustment: 'default'
};

// =================================
// ROLES DE USUARIO
// =================================

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// =================================
// LIMITES Y CONFIGURACIONES
// =================================

export const LIMITS = {
  MAX_BET_AMOUNT: 1000,
  MIN_BET_AMOUNT: 1,
  MAX_BETS_PER_REQUEST: 50,
  MIN_RECHARGE_AMOUNT: 1,
  MAX_RECHARGE_AMOUNT: 100000
};

// =================================
// OPCIONES RAPIDAS
// =================================

export const QUICK_RECHARGE_OPTIONS = [1, 5, 10, 50, 100, 1000];
export const QUICK_BET_AMOUNTS = [1, 5, 10, 25, 50, 100];

// =================================
// MENSAJES
// =================================

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Usuario o contrasena incorrectos',
  INSUFFICIENT_BALANCE: 'Balance insuficiente',
  INVALID_BET_AMOUNT: 'Monto de apuesta invalido',
  DRAW_NOT_OPEN: 'El sorteo no esta abierto para apuestas',
  SERVER_ERROR: 'Error del servidor',
  CONNECTION_ERROR: 'Error de conexion'
};

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Inicio de sesion exitoso',
  REGISTER_SUCCESS: 'Registro exitoso',
  BET_PLACED: 'Apuesta realizada exitosamente',
  RECHARGE_SUCCESS: 'Recarga realizada exitosamente'
};
