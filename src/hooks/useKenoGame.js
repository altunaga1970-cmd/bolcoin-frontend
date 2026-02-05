/**
 * useKenoGame Hook (MVP)
 *
 * Hook central para gestionar el estado y la logica del juego Keno.
 * Conecta con el backend API para procesar las jugadas.
 *
 * MVP:
 * - Apuesta fija: 1 USDT (no editable)
 * - Max payout: 50 USDT (cap)
 * - Fee: 12% sobre perdidas
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from '../contexts/ToastContext';
import { useBalance } from '../contexts/BalanceContext';
import kenoApi from '../api/kenoApi';

// MVP: Configuracion local - FALLBACK si el backend no responde
// La fuente de verdad es el backend (gameConfigService.js)
const DEFAULT_CONFIG = {
  TOTAL_NUMBERS: 80,
  DRAWN_NUMBERS: 20,
  MIN_SPOTS: 1,
  MAX_SPOTS: 10,
  // MVP: Apuesta fija
  BET_AMOUNT: 1,
  MAX_PAYOUT: 50,
  FEE_BPS: 1200,
  // Cap dinamico basado en pool
  MAX_PAYOUT_RATIO: 0.10,       // 10% del pool
  ABSOLUTE_MAX_PAYOUT: 10000,   // Maximo absoluto $10,000
  POOL_BALANCE: 500,            // Pool inicial
  MIN_POOL_BALANCE: 500,
  // Legacy (ignorados en MVP)
  MIN_BET: 1,
  MAX_BET: 1,
  DEFAULT_BET: 1
};

// Tabla de pagos - FALLBACK si el backend no responde
// La fuente de verdad es el backend (kenoService.js)
const DEFAULT_PAYOUT_TABLE = {
  1: { 0: 0, 1: 3 },
  2: { 0: 0, 1: 1, 2: 9 },
  3: { 0: 0, 1: 0, 2: 2, 3: 27 },
  4: { 0: 0, 1: 0, 2: 1, 3: 5, 4: 75 },
  5: { 0: 0, 1: 0, 2: 0, 3: 3, 4: 12, 5: 300 },
  6: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 5, 5: 50, 6: 1000 },
  7: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 3, 5: 20, 6: 100, 7: 2000 },
  8: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 2, 5: 10, 6: 50, 7: 500, 8: 5000 },
  9: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 5, 6: 25, 7: 200, 8: 2000, 9: 7500 },
  10: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 3, 6: 15, 7: 100, 8: 1000, 9: 5000, 10: 10000 }
};

// Estados del juego
const KENO_STATES = {
  IDLE: 'idle',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  TX_PENDING: 'tx_pending',
  RESOLVED: 'resolved',
  ERROR: 'error'
};

// Clave para localStorage del historial
const KENO_HISTORY_KEY = 'keno_game_history';
const MAX_HISTORY_ITEMS = 20;

/**
 * Obtener multiplicador de la tabla
 */
function getMultiplier(spots, hits, payoutTable = DEFAULT_PAYOUT_TABLE) {
  return payoutTable[spots]?.[hits] || 0;
}

/**
 * Calcular pago potencial (con cap MVP)
 */
function calculatePayout(betAmount, spots, hits, payoutTable = DEFAULT_PAYOUT_TABLE, maxPayout = 50) {
  const multiplier = getMultiplier(spots, hits, payoutTable);
  const theoretical = betAmount * multiplier;
  const actual = Math.min(theoretical, maxPayout);
  return actual.toFixed(2);
}

/**
 * MVP: Calcular pago con info de cap
 */
function calculatePayoutWithCap(betAmount, spots, hits, payoutTable = DEFAULT_PAYOUT_TABLE, maxPayout = 50) {
  const multiplier = getMultiplier(spots, hits, payoutTable);
  const theoretical = betAmount * multiplier;
  const actual = Math.min(theoretical, maxPayout);
  return {
    theoretical: theoretical.toFixed(2),
    actual: actual.toFixed(2),
    capped: theoretical > maxPayout,
    multiplier
  };
}

/**
 * Hook principal del juego Keno
 */
export function useKenoGame() {
  const { isConnected } = useWeb3();
  const { error: showError, success: showSuccess, info: showInfo } = useToast();
  const { refreshBalance, effectiveBalance: contextBalance, isUsingDirectBalance } = useBalance();

  // Config desde backend
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [payoutTable, setPayoutTable] = useState(DEFAULT_PAYOUT_TABLE);

  // Balance efectivo (desde sesión o contexto)
  const [sessionBalance, setSessionBalance] = useState(0);

  // MVP: Usar balance del contexto cuando backend no disponible
  const effectiveBalance = isUsingDirectBalance ? parseFloat(contextBalance) : sessionBalance;

  // Estado del juego
  const [gameState, setGameState] = useState(KENO_STATES.IDLE);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betAmount, setBetAmount] = useState(DEFAULT_CONFIG.DEFAULT_BET.toString());
  const [currentResult, setCurrentResult] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [requestId, setRequestId] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================================================
  // EFECTOS
  // ==========================================================================

  // MVP: Cargar configuracion desde el backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const serverConfig = await kenoApi.getConfig();
        if (serverConfig) {
          setConfig({
            TOTAL_NUMBERS: serverConfig.totalNumbers || 80,
            DRAWN_NUMBERS: serverConfig.drawnNumbers || 20,
            MIN_SPOTS: serverConfig.minSpots || 1,
            MAX_SPOTS: serverConfig.maxSpots || 10,
            // MVP: Apuesta fija
            BET_AMOUNT: serverConfig.betAmount || 1,
            MAX_PAYOUT: serverConfig.maxPayout || 50,
            FEE_BPS: serverConfig.feeBps || 1200,
            // Cap dinamico basado en pool
            MAX_PAYOUT_RATIO: serverConfig.pool?.maxPayoutRatio || 0.10,
            ABSOLUTE_MAX_PAYOUT: serverConfig.pool?.absoluteMaxPayout || 10000,
            POOL_BALANCE: serverConfig.pool?.balance || 500,
            MIN_POOL_BALANCE: serverConfig.pool?.minPoolBalance || 500,
            // Legacy (para compatibilidad)
            MIN_BET: serverConfig.betAmount || 1,
            MAX_BET: serverConfig.betAmount || 1,
            DEFAULT_BET: serverConfig.betAmount || 1
          });
          if (serverConfig.payoutTable) {
            setPayoutTable(serverConfig.payoutTable);
          }
          // MVP: Establecer apuesta fija
          setBetAmount((serverConfig.betAmount || 1).toString());
        }
      } catch (err) {
        console.warn('[useKenoGame] Error loading config, using defaults:', err);
      }
    }
    loadConfig();
  }, []);

  // Cargar balance efectivo desde sesión (solo cuando backend disponible)
  const loadEffectiveBalance = useCallback(async () => {
    if (!isConnected) {
      setSessionBalance(0);
      return;
    }
    try {
      const session = await kenoApi.getSession();
      setSessionBalance(session.balances?.effectiveBalance || 0);
    } catch (err) {
      // Si backend no disponible, sessionBalance queda en 0
      // pero effectiveBalance usará contextBalance via isUsingDirectBalance
      console.warn('[useKenoGame] Error loading effective balance:', err);
    }
  }, [isConnected]);

  useEffect(() => {
    loadEffectiveBalance();
  }, [loadEffectiveBalance]);

  // Cargar historial desde backend cuando se conecta
  useEffect(() => {
    async function loadHistory() {
      if (!isConnected) return;
      try {
        console.log('[Keno] Loading history from server...');
        const history = await kenoApi.getHistory(MAX_HISTORY_ITEMS);
        console.log('[Keno] History loaded:', history);
        if (history && history.length > 0) {
          // Mapear campos para compatibilidad con componente
          const mappedHistory = history.map(game => ({
            ...game,
            id: game.gameId,
            requestId: game.gameId
          }));
          setGameHistory(mappedHistory);
        }
      } catch (err) {
        // Si falla, cargar desde localStorage
        console.warn('[useKenoGame] Error loading history from server:', err);
        try {
          const savedHistory = localStorage.getItem(KENO_HISTORY_KEY);
          if (savedHistory) {
            setGameHistory(JSON.parse(savedHistory));
          }
        } catch (localErr) {
          console.error('Error loading local history:', localErr);
        }
      }
    }
    loadHistory();
  }, [isConnected]);

  // Guardar historial en localStorage como backup
  useEffect(() => {
    try {
      localStorage.setItem(KENO_HISTORY_KEY, JSON.stringify(gameHistory));
    } catch (err) {
      console.error('Error saving keno history:', err);
    }
  }, [gameHistory]);

  // Actualizar estado cuando cambia la conexión
  useEffect(() => {
    if (!isConnected) {
      setGameState(KENO_STATES.WALLET_DISCONNECTED);
    } else if (gameState === KENO_STATES.WALLET_DISCONNECTED) {
      setGameState(KENO_STATES.IDLE);
    }
  }, [isConnected, gameState]);

  // ==========================================================================
  // FUNCIONES DE SELECCIÓN
  // ==========================================================================

  const toggleNumber = useCallback((num) => {
    if (gameState !== KENO_STATES.IDLE && gameState !== KENO_STATES.RESOLVED) {
      return;
    }

    setSelectedNumbers(prev => {
      if (prev.includes(num)) {
        return prev.filter(n => n !== num);
      } else if (prev.length < config.MAX_SPOTS) {
        return [...prev, num].sort((a, b) => a - b);
      }
      return prev;
    });

    if (currentResult) {
      setCurrentResult(null);
    }

    if (gameState === KENO_STATES.RESOLVED) {
      setGameState(KENO_STATES.IDLE);
    }
  }, [gameState, currentResult, config.MAX_SPOTS]);

  const clearSelection = useCallback(() => {
    setSelectedNumbers([]);
    setCurrentResult(null);
    setRequestId(null);
    setError(null);
    setGameState(isConnected ? KENO_STATES.IDLE : KENO_STATES.WALLET_DISCONNECTED);
  }, [isConnected]);

  const quickPick = useCallback((count = 5) => {
    const validCount = Math.min(
      Math.max(count, config.MIN_SPOTS),
      config.MAX_SPOTS
    );

    const numbers = new Set();
    while (numbers.size < validCount) {
      numbers.add(Math.floor(Math.random() * config.TOTAL_NUMBERS) + 1);
    }

    setSelectedNumbers(Array.from(numbers).sort((a, b) => a - b));
    setCurrentResult(null);

    if (gameState === KENO_STATES.RESOLVED) {
      setGameState(KENO_STATES.IDLE);
    }
  }, [gameState, config]);

  // ==========================================================================
  // FUNCIONES DE APUESTA
  // ==========================================================================

  const updateBetAmount = useCallback((amount) => {
    setBetAmount(amount);
    setError(null);
  }, []);

  // ==========================================================================
  // FUNCIÓN PRINCIPAL: JUGAR KENO (via Backend API)
  // ==========================================================================

  const playKeno = useCallback(async () => {
    console.log('[Keno] playKeno called', { isConnected, selectedNumbers, betAmount, effectiveBalance });

    if (!isConnected) {
      showError('Conecta tu wallet para jugar');
      setGameState(KENO_STATES.WALLET_DISCONNECTED);
      return;
    }

    // Validar selección
    if (selectedNumbers.length < config.MIN_SPOTS) {
      showError(`Selecciona al menos ${config.MIN_SPOTS} número`);
      return;
    }

    if (selectedNumbers.length > config.MAX_SPOTS) {
      showError(`Máximo ${config.MAX_SPOTS} números`);
      return;
    }

    // Validar apuesta
    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet < config.MIN_BET) {
      showError(`Apuesta mínima: ${config.MIN_BET} USDT`);
      return;
    }

    if (bet > config.MAX_BET) {
      showError(`Apuesta máxima: ${config.MAX_BET} USDT`);
      return;
    }

    // Validar balance
    const userBalance = parseFloat(effectiveBalance);
    if (bet > userBalance) {
      showError('Balance insuficiente');
      setError('Balance insuficiente');
      return;
    }

    // Iniciar juego
    setIsLoading(true);
    setError(null);
    setCurrentResult(null);
    setGameState(KENO_STATES.TX_PENDING);

    try {
      showInfo('Procesando jugada...');
      console.log('[Keno] Calling API with', { selectedNumbers, bet });

      // Llamar al backend API - MVP: Siempre enviar apuesta fija
      const fixedBet = config.BET_AMOUNT || 1;
      const result = await kenoApi.playKeno(selectedNumbers, fixedBet);
      console.log('[Keno] API result:', result);

      setRequestId(result.gameId);

      // Formatear resultado
      const gameResult = {
        id: result.gameId,
        gameId: result.gameId,
        timestamp: result.timestamp || new Date().toISOString(),
        selectedNumbers: result.selectedNumbers,
        drawnNumbers: result.drawnNumbers,
        matchedNumbers: result.matchedNumbers,
        hits: result.hits,
        spots: result.spots,
        betAmount: result.betAmount,
        multiplier: result.multiplier,
        payout: result.payout,
        netResult: result.netResult,
        requestId: result.gameId,
        isWin: result.isWin
      };

      setCurrentResult(gameResult);
      setGameState(KENO_STATES.RESOLVED);

      // Agregar al historial
      setGameHistory(prev => [gameResult, ...prev].slice(0, MAX_HISTORY_ITEMS));

      // Mostrar resultado
      if (gameResult.isWin) {
        showSuccess(`¡Ganaste $${result.payout.toFixed(2)} USDT! (${result.hits} aciertos)`);
      } else {
        showInfo(`${result.hits} aciertos. ¡Intenta de nuevo!`);
      }

      // Actualizar balance efectivo de sesión
      await loadEffectiveBalance();
      await refreshBalance();

    } catch (err) {
      console.error('Error playing keno:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error al procesar la jugada';
      setError(errorMessage);
      showError(errorMessage);
      setGameState(KENO_STATES.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    selectedNumbers,
    betAmount,
    effectiveBalance,
    config,
    showError,
    showSuccess,
    showInfo,
    refreshBalance,
    loadEffectiveBalance
  ]);

  // ==========================================================================
  // FUNCIONES DE HISTORIAL
  // ==========================================================================

  const clearHistory = useCallback(() => {
    setGameHistory([]);
    localStorage.removeItem(KENO_HISTORY_KEY);
  }, []);

  // ==========================================================================
  // VALORES CALCULADOS
  // ==========================================================================

  const spots = selectedNumbers.length;

  const maxMultiplier = useMemo(() => {
    if (spots === 0) return 0;
    return getMultiplier(spots, spots, payoutTable);
  }, [spots, payoutTable]);

  // MVP: Pago potencial maximo con cap aplicado
  const maxPotentialPayout = useMemo(() => {
    if (spots === 0) return '0.00';
    const maxPayout = config.MAX_PAYOUT || 50;
    return calculatePayout(parseFloat(betAmount) || 0, spots, spots, payoutTable, maxPayout);
  }, [spots, betAmount, payoutTable, config.MAX_PAYOUT]);

  // MVP: Info detallada del payout con cap
  const maxPayoutInfo = useMemo(() => {
    if (spots === 0) return { theoretical: '0.00', actual: '0.00', capped: false, multiplier: 0 };
    const maxPayout = config.MAX_PAYOUT || 50;
    return calculatePayoutWithCap(parseFloat(betAmount) || 0, spots, spots, payoutTable, maxPayout);
  }, [spots, betAmount, payoutTable, config.MAX_PAYOUT]);

  const canPlay = useMemo(() => {
    const bet = parseFloat(betAmount);
    const userBalance = parseFloat(effectiveBalance);

    console.log('[Keno] canPlay check:', {
      isConnected,
      gameState,
      spots,
      minSpots: config.MIN_SPOTS,
      maxSpots: config.MAX_SPOTS,
      bet,
      minBet: config.MIN_BET,
      maxBet: config.MAX_BET,
      userBalance
    });

    if (!isConnected) return false;
    if (gameState === KENO_STATES.TX_PENDING) return false;
    if (spots < config.MIN_SPOTS || spots > config.MAX_SPOTS) return false;
    if (isNaN(bet) || bet < config.MIN_BET || bet > config.MAX_BET) return false;
    if (bet > userBalance) return false;

    return true;
  }, [isConnected, gameState, spots, betAmount, effectiveBalance, config]);

  const disabledReason = useMemo(() => {
    if (!isConnected) return 'Conecta tu wallet';
    if (gameState === KENO_STATES.TX_PENDING) return 'Procesando...';
    if (spots < config.MIN_SPOTS) return `Selecciona al menos ${config.MIN_SPOTS} número`;
    if (spots > config.MAX_SPOTS) return `Máximo ${config.MAX_SPOTS} números`;

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) return 'Ingresa un monto válido';
    if (bet < config.MIN_BET) return `Mínimo ${config.MIN_BET} USDT`;
    if (bet > config.MAX_BET) return `Máximo ${config.MAX_BET} USDT`;

    const userBalance = parseFloat(effectiveBalance);
    if (bet > userBalance) return 'Balance insuficiente';

    return null;
  }, [isConnected, gameState, spots, betAmount, effectiveBalance, config]);

  // ==========================================================================
  // RETORNO
  // ==========================================================================

  return {
    // Estado
    gameState,
    selectedNumbers,
    betAmount,
    currentResult,
    gameHistory,
    requestId,
    error,
    isLoading,

    // Valores calculados
    spots,
    maxMultiplier,
    maxPotentialPayout,
    maxPayoutInfo,
    canPlay,
    disabledReason,

    // MVP: Info adicional
    isFixedBet: true,  // MVP: Apuesta siempre fija
    fixedBetAmount: config.BET_AMOUNT || 1,
    maxPayoutCap: config.MAX_PAYOUT || 50,
    feeBps: config.FEE_BPS || 1200,

    // Info del pool (cap dinamico)
    poolInfo: {
      balance: config.POOL_BALANCE || 500,
      maxPayoutRatio: config.MAX_PAYOUT_RATIO || 0.10,
      absoluteMaxPayout: config.ABSOLUTE_MAX_PAYOUT || 10000,
      minPoolBalance: config.MIN_POOL_BALANCE || 500,
      currentMaxPayout: config.MAX_PAYOUT || 50
    },

    // Configuracion
    config,
    payoutTable,

    // Funciones de seleccion
    toggleNumber,
    clearSelection,
    quickPick,

    // Funciones de apuesta
    updateBetAmount,
    playKeno,

    // Funciones de historial
    clearHistory,

    // Estados exportados
    STATES: KENO_STATES
  };
}

export default useKenoGame;
