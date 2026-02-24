/**
 * BalanceContext - Sistema de Balance Unificado
 *
 * Proporciona una única fuente de verdad para el balance del usuario
 * en toda la aplicación. Sincroniza automáticamente y se actualiza
 * después de cualquier transacción.
 *
 * Sistema de Balance Efectivo:
 * - Cuando hay sesión activa de Keno: effectiveBalance = contractBalance + sessionNetResult
 * - Sin sesión activa: effectiveBalance = contractBalance
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useWeb3 } from './Web3Context';
import { useContract } from '../hooks/useContract';
import { useDirectBalance } from '../hooks/useDirectBalance';
import { useKenoContract } from '../hooks/useKenoContract';
import api from '../api';
import kenoApi from '../api/kenoApi';

// Intervalo de auto-refresh (30 segundos)
const AUTO_REFRESH_INTERVAL = 30000;

// Timeout para detectar backend no disponible (5 segundos)
const BACKEND_TIMEOUT = 5000;

// Contexto
const BalanceContext = createContext(null);

/**
 * BalanceProvider - Wrapper que proporciona el estado del balance
 *
 * Sistema dual de balances:
 * - onChainBalance: Balance en el smart contract (para La Fortuna/Lottery)
 * - offChainBalance: Balance en base de datos (para Keno)
 * - contractBalance: Balance combinado para mostrar en UI
 */
export function BalanceProvider({ children }) {
  const { isConnected, account } = useWeb3();
  const { getContractBalance, getTokenBalance } = useContract();
  const directBalance = useDirectBalance();
  const { isOnChain: isKenoOnChain, getAvailablePool } = useKenoContract();

  // Estado del balance - Sistema dual
  const [onChainBalance, setOnChainBalance] = useState('0');    // Smart contract userBalances
  const [offChainBalance, setOffChainBalance] = useState('0');  // Database users.balance
  const [contractBalance, setContractBalance] = useState('0');  // Balance combinado para display
  const [walletBalance, setWalletBalance] = useState('0');
  const [effectiveBalance, setEffectiveBalance] = useState('0'); // Balance efectivo (con sesión Keno)
  const [sessionNetResult, setSessionNetResult] = useState(0);   // Resultado neto de sesión Keno
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Keno on-chain pool balance
  const [kenoPoolBalance, setKenoPoolBalance] = useState('0');

  // Estado de fallback - indica si estamos usando balance directo de blockchain
  const [isUsingDirectBalance, setIsUsingDirectBalance] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Ref para el intervalo
  const intervalRef = useRef(null);

  /**
   * Cargar balance efectivo desde la sesión de Keno
   * Incluye el resultado neto de la sesión activa
   * FALLBACK: Si backend no responde, usa balance directo de blockchain
   */
  const loadEffectiveBalance = useCallback(async () => {
    if (!isConnected) {
      setEffectiveBalance('0');
      setSessionNetResult(0);
      setIsUsingDirectBalance(false);
      return '0';
    }

    try {
      // Intentar backend con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT);

      const session = await kenoApi.getSession();
      clearTimeout(timeoutId);

      const eff = parseFloat(session.balances?.effectiveBalance || 0).toFixed(2);
      const netResult = parseFloat(session.balances?.sessionNetResult || 0);

      setEffectiveBalance(eff);
      setSessionNetResult(netResult);
      setBackendAvailable(true);
      setIsUsingDirectBalance(false);

      console.log('[BalanceContext] Effective balance from backend:', { effectiveBalance: eff, sessionNetResult: netResult });
      return eff;
    } catch (err) {
      console.warn('[BalanceContext] Backend no disponible:', err.message);
      setBackendAvailable(false);

      // Keep last known good balance — don't overwrite with 0 from blockchain on Hardhat
      const currentEff = parseFloat(effectiveBalance);
      if (currentEff > 0) {
        console.log('[BalanceContext] Keeping last known effective balance:', effectiveBalance);
        return effectiveBalance;
      }

      // No previous value — try direct blockchain as last resort
      setIsUsingDirectBalance(true);
      try {
        const { usdt: directUsdtBalance } = await directBalance.refreshDirectBalance();
        setEffectiveBalance(directUsdtBalance);
        return directUsdtBalance;
      } catch {
        return '0';
      }
    }
  }, [isConnected, directBalance]);

  /**
   * Cargar balance de la base de datos (para Keno y juegos off-chain)
   */
  const loadDatabaseBalance = useCallback(async () => {
    if (!isConnected || !account) return '0';

    try {
      // Use public endpoint (no auth required) to read DB balance
      const response = await api.get('/wallet/balance-by-address', {
        params: { address: account }
      });
      const dbBalance = response.data?.data?.balance || '0';
      const formatted = parseFloat(dbBalance).toFixed(2);
      setOffChainBalance(formatted);

      // Also update effectiveBalance if DB balance is higher
      // This ensures bingo/game winnings written directly to users.balance are visible immediately
      setEffectiveBalance(prev => {
        const prevVal = parseFloat(prev) || 0;
        const dbVal = parseFloat(formatted) || 0;
        return dbVal > prevVal ? formatted : prev;
      });

      return formatted;
    } catch (err) {
      console.error('[BalanceContext] Error loading database balance:', err);
      return '0';
    }
  }, [isConnected, account]);

  /**
   * Cargar balance del smart contract (para La Fortuna/Lottery)
   */
  const loadSmartContractBalance = useCallback(async () => {
    if (!isConnected) {
      setOnChainBalance('0');
      return '0';
    }

    try {
      const balance = await getContractBalance();
      const formatted = parseFloat(balance || '0').toFixed(2);
      setOnChainBalance(formatted);
      return formatted;
    } catch (err) {
      console.error('[BalanceContext] Error loading smart contract balance:', err);
      return onChainBalance;
    }
  }, [isConnected, getContractBalance, onChainBalance]);

  /**
   * Cargar balance combinado y balance efectivo (con sesión Keno)
   */
  const loadContractBalance = useCallback(async () => {
    if (!isConnected) {
      setContractBalance('0');
      setEffectiveBalance('0');
      return '0';
    }

    try {
      // Cargar todos los balances en paralelo
      const balancePromises = [
        loadDatabaseBalance(),
        loadSmartContractBalance(),
        loadEffectiveBalance()
      ];
      // If Keno contract is on-chain, also read its pool balance
      if (isKenoOnChain) {
        balancePromises.push(
          getAvailablePool().then((pool) => {
            setKenoPoolBalance(pool);
            return pool;
          }).catch(() => '0')
        );
      }
      const [dbBalance, scBalance, effBalance] = await Promise.all(balancePromises);

      // El balance on-chain es la base
      const sc = parseFloat(scBalance) || 0;

      // El balance efectivo ya incluye la sesión de Keno
      setContractBalance(sc.toFixed(2));

      // If keno session endpoint failed, use DB balance as effective balance
      // This ensures bingo winnings (written directly to users.balance) are reflected
      const dbVal = parseFloat(dbBalance) || 0;
      const effVal = parseFloat(effBalance) || 0;
      if (dbVal > effVal) {
        const corrected = dbVal.toFixed(2);
        setEffectiveBalance(corrected);
        console.log('[BalanceContext] Using DB balance as effective (higher):', corrected);
        return corrected;
      }

      console.log('[BalanceContext] Balances:', {
        onChain: sc,
        effective: effBalance,
        database: dbBalance,
        sessionNet: sessionNetResult
      });

      return effBalance; // Retornar effective para display
    } catch (err) {
      console.error('[BalanceContext] Error loading contract balance:', err);
      setError('Error al cargar balance del contrato');
      return contractBalance;
    }
  }, [isConnected, loadDatabaseBalance, loadSmartContractBalance, loadEffectiveBalance, contractBalance, sessionNetResult]);

  /**
   * Cargar balance de wallet (USDT en MetaMask)
   */
  const loadWalletBalance = useCallback(async () => {
    if (!isConnected) {
      setWalletBalance('0');
      return '0';
    }

    try {
      const balance = await getTokenBalance();
      setWalletBalance(balance || '0');
      return balance || '0';
    } catch (err) {
      console.error('[BalanceContext] Error loading wallet balance:', err);
      // No es crítico, no setear error
      return walletBalance;
    }
  }, [isConnected, getTokenBalance, walletBalance]);

  /**
   * Refrescar todos los balances
   * Llamar después de cualquier transacción (apuesta, depósito, retiro)
   */
  const refreshBalance = useCallback(async () => {
    if (!isConnected) {
      setContractBalance('0');
      setWalletBalance('0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Cargar ambos balances en paralelo
      const [contract, wallet] = await Promise.all([
        loadContractBalance(),
        loadWalletBalance()
      ]);

      setLastUpdated(new Date());
      console.log('[BalanceContext] Balances actualizados:', { contract, wallet });

      return { contractBalance: contract, walletBalance: wallet };
    } catch (err) {
      console.error('[BalanceContext] Error refreshing balances:', err);
      setError('Error al actualizar balances');
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, loadContractBalance, loadWalletBalance]);

  /**
   * Actualización optimista del balance
   * Usar cuando se conoce el cambio exacto (ej: después de apuesta)
   */
  const updateBalanceOptimistic = useCallback((change) => {
    setContractBalance(prev => {
      const newBalance = parseFloat(prev) + change;
      return Math.max(0, newBalance).toFixed(2);
    });
    setEffectiveBalance(prev => {
      const newBalance = parseFloat(prev) + change;
      return Math.max(0, newBalance).toFixed(2);
    });
    setOffChainBalance(prev => {
      const newBalance = parseFloat(prev) + change;
      return Math.max(0, newBalance).toFixed(2);
    });
  }, []);

  /**
   * Helper: detectar si estamos en ruta admin (no necesitamos balances de usuario)
   */
  const isAdminRoute = () =>
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

  /**
   * Efecto: Cargar balance inicial cuando se conecta
   */
  useEffect(() => {
    if (isAdminRoute()) return; // No cargar balances en admin

    if (isConnected && account) {
      console.log('[BalanceContext] Wallet conectada, cargando balance inicial...');
      refreshBalance();
    } else {
      // Limpiar cuando se desconecta
      setContractBalance('0');
      setWalletBalance('0');
      setEffectiveBalance('0');
      setSessionNetResult(0);
      setLastUpdated(null);
    }
  }, [isConnected, account]); // No incluir refreshBalance para evitar loop

  /**
   * Efecto: Auto-refresh periódico
   */
  useEffect(() => {
    if (isAdminRoute()) return; // No auto-refresh en admin

    if (isConnected) {
      // Iniciar intervalo
      intervalRef.current = setInterval(() => {
        if (isAdminRoute()) return; // Check again in case of navigation
        console.log('[BalanceContext] Auto-refresh de balance...');
        refreshBalance();
      }, AUTO_REFRESH_INTERVAL);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isConnected]); // No incluir refreshBalance

  /**
   * Valor del contexto
   *
   * Balance principal: blockchain es la fuente de verdad.
   * directBalance lee USDT directamente del contrato ERC20 via RPC público.
   * El backend DB puede tener datos de prueba; NO usarlo como display principal.
   */

  // Calcular balance real: blockchain > backend
  const hasDirectBalance = directBalance.isSupported && parseFloat(directBalance.usdtBalance) > 0;
  const realBalance = hasDirectBalance
    ? parseFloat(directBalance.usdtBalance).toFixed(2)
    : effectiveBalance;

  const value = {
    // Balances - Sistema dual
    contractBalance,          // Balance en smart contract (base)
    onChainBalance,           // Balance en smart contract (para La Fortuna)
    offChainBalance,          // Balance en database (para Keno)
    walletBalance,            // USDT en MetaMask
    effectiveBalance: realBalance, // Balance real: blockchain cuando disponible
    sessionNetResult,         // Resultado neto de sesión Keno actual

    // Balance principal para display
    balance: realBalance,

    // Alias para compatibilidad
    smartContractBalance: onChainBalance,  // Alias para lottery
    databaseBalance: offChainBalance,       // Alias para keno

    // Estado
    isLoading,
    lastUpdated,
    error,

    // Keno on-chain pool
    kenoPoolBalance,          // Pool disponible en contrato KenoGame (on-chain)
    isKenoOnChain,            // true = Keno contract configured and in onchain mode

    // Estado de fallback (balance directo de blockchain)
    isUsingDirectBalance: hasDirectBalance || isUsingDirectBalance,
    backendAvailable,         // false = backend no responde

    // Balance directo de blockchain (siempre disponible)
    directBalance: {
      usdt: directBalance.usdtBalance,
      native: directBalance.nativeBalance,
      networkName: directBalance.networkName,
      isSupported: directBalance.isSupported,
      formattedUsdt: directBalance.formattedUsdtBalance,
      formattedNative: directBalance.formattedNativeBalance,
    },

    // Funciones
    refreshBalance,
    updateBalanceOptimistic,
    loadDatabaseBalance,
    loadSmartContractBalance,
    loadEffectiveBalance,

    // Helpers formateados
    formattedContractBalance: `$${parseFloat(realBalance).toFixed(2)}`,
    formattedWalletBalance: `$${parseFloat(walletBalance).toFixed(2)}`,
    formattedOnChainBalance: `$${parseFloat(onChainBalance).toFixed(2)}`,
    formattedOffChainBalance: `$${parseFloat(offChainBalance).toFixed(2)}`,
    formattedEffectiveBalance: `$${parseFloat(realBalance).toFixed(2)}`,
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
}

/**
 * Hook para usar el balance en cualquier componente
 */
export function useBalance() {
  const context = useContext(BalanceContext);

  if (!context) {
    throw new Error('useBalance debe usarse dentro de BalanceProvider');
  }

  return context;
}

export default BalanceContext;
