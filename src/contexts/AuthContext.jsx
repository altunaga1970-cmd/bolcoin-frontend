import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useWeb3 } from './Web3Context';

/**
 * AuthContext - Web3 Only
 *
 * Este contexto ahora es un wrapper sobre Web3Context para mantener
 * compatibilidad con componentes que usen useAuth().
 *
 * En el modelo Web3-only:
 * - No hay login tradicional con email/password
 * - Usuario = wallet address
 * - isAuthenticated = wallet conectada
 * - isAdmin se verifica contra lista de wallets admin
 */

const AuthContext = createContext(null);

// Lista de wallets admin
const ADMIN_WALLETS = (import.meta.env.VITE_ADMIN_WALLETS || '')
  .toLowerCase()
  .split(',')
  .filter(Boolean);

export function AuthProvider({ children }) {
  const {
    account,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    formatAddress
  } = useWeb3();

  // El "usuario" es simplemente la wallet conectada (memoizado para evitar re-renders)
  const user = useMemo(() => {
    if (!account) return null;
    return {
      id: account,
      address: account,
      username: formatAddress(account),
      role: ADMIN_WALLETS.includes(account?.toLowerCase()) ? 'admin' : 'user'
    };
  }, [account, formatAddress]);

  // Verificar si es admin
  const isAdmin = ADMIN_WALLETS.length === 0 || // Dev mode: sin lista = todos admin
                  ADMIN_WALLETS.includes(account?.toLowerCase());

  // Login = conectar wallet
  const login = useCallback(async () => {
    await connectWallet();
    return { success: true };
  }, [connectWallet]);

  // Register no existe en Web3-only
  const register = useCallback(async () => {
    console.warn('register() no disponible en modo Web3-only. Usa connectWallet()');
    await connectWallet();
    return { success: true };
  }, [connectWallet]);

  // Logout = desconectar wallet
  const logout = useCallback(async () => {
    disconnectWallet();
  }, [disconnectWallet]);

  // Refresh user (no-op en Web3, el estado viene de la wallet)
  const refreshUser = useCallback(async () => {
    return user;
  }, [user]);

  // Update balance (no-op, balance viene del contrato)
  const updateBalance = useCallback(() => {
    console.warn('updateBalance() no disponible en modo Web3-only. El balance viene del contrato.');
  }, []);

  // Clear error (no-op)
  const clearError = useCallback(() => {}, []);

  const value = {
    // Estado
    user,
    token: account, // La "token" es la direccion de wallet
    isAuthenticated: isConnected,
    isAdmin,
    isLoading: isConnecting,
    error: null,

    // Funciones (compatibilidad)
    login,
    register,
    logout,
    refreshUser,
    updateBalance,
    clearError,

    // Funciones Web3 directas
    connectWallet,
    disconnectWallet
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

export default AuthContext;
