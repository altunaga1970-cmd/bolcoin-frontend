import { GAME_RULES, LIMITS } from './constants';

/**
 * Valida un nombre de usuario
 */
export function validateUsername(username) {
  if (!username) {
    return { valid: false, error: 'El nombre de usuario es requerido' };
  }
  if (username.length < 3) {
    return { valid: false, error: 'El nombre de usuario debe tener al menos 3 caracteres' };
  }
  if (username.length > 30) {
    return { valid: false, error: 'El nombre de usuario no puede exceder 30 caracteres' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Solo se permiten letras, numeros y guion bajo' };
  }
  return { valid: true, error: null };
}

/**
 * Valida un email
 */
export function validateEmail(email) {
  if (!email) {
    return { valid: false, error: 'El email es requerido' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'El email no es valido' };
  }
  return { valid: true, error: null };
}

/**
 * Valida una contrasena
 */
export function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'La contrasena es requerida' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'La contrasena debe tener al menos 6 caracteres' };
  }
  return { valid: true, error: null };
}

/**
 * Valida que las contrasenas coincidan
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, error: 'Las contrasenas no coinciden' };
  }
  return { valid: true, error: null };
}

/**
 * Valida un numero de apuesta segun el tipo de juego
 */
export function validateBetNumber(gameType, number) {
  const rules = GAME_RULES[gameType];
  if (!rules) {
    return { valid: false, error: 'Tipo de juego invalido' };
  }

  if (number === '' || number === null || number === undefined) {
    return { valid: false, error: 'El numero es requerido' };
  }

  // Verificar que solo contenga digitos
  if (!/^\d+$/.test(number)) {
    return { valid: false, error: 'Solo se permiten numeros' };
  }

  const num = parseInt(number, 10);

  // Verificar rango
  if (num < rules.min || num > rules.max) {
    return {
      valid: false,
      error: `El numero debe estar entre ${rules.min.toString().padStart(rules.digits, '0')} y ${rules.max}`
    };
  }

  return { valid: true, error: null };
}

/**
 * Valida el monto de una apuesta
 */
export function validateBetAmount(amount, balance = null) {
  if (!amount || amount === '') {
    return { valid: false, error: 'El monto es requerido' };
  }

  const num = parseFloat(amount);

  if (isNaN(num)) {
    return { valid: false, error: 'Monto invalido' };
  }

  if (num < LIMITS.MIN_BET_AMOUNT) {
    return { valid: false, error: `El monto minimo es ${LIMITS.MIN_BET_AMOUNT} USDT` };
  }

  if (num > LIMITS.MAX_BET_AMOUNT) {
    return { valid: false, error: `El monto maximo es ${LIMITS.MAX_BET_AMOUNT} USDT` };
  }

  if (balance !== null && num > balance) {
    return { valid: false, error: 'Balance insuficiente' };
  }

  return { valid: true, error: null };
}

/**
 * Valida el monto de una recarga
 */
export function validateRechargeAmount(amount) {
  if (!amount || amount === '') {
    return { valid: false, error: 'El monto es requerido' };
  }

  const num = parseFloat(amount);

  if (isNaN(num)) {
    return { valid: false, error: 'Monto invalido' };
  }

  if (num < LIMITS.MIN_RECHARGE_AMOUNT) {
    return { valid: false, error: `El monto minimo es ${LIMITS.MIN_RECHARGE_AMOUNT} USDT` };
  }

  if (num > LIMITS.MAX_RECHARGE_AMOUNT) {
    return { valid: false, error: `El monto maximo es ${LIMITS.MAX_RECHARGE_AMOUNT} USDT` };
  }

  return { valid: true, error: null };
}

/**
 * Valida un formulario completo de login
 */
export function validateLoginForm(username, password) {
  const errors = {};

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Valida un formulario completo de registro
 */
export function validateRegisterForm(username, email, password, confirmPassword) {
  const errors = {};

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    errors.username = usernameValidation.error;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }

  const matchValidation = validatePasswordMatch(password, confirmPassword);
  if (!matchValidation.valid) {
    errors.confirmPassword = matchValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
