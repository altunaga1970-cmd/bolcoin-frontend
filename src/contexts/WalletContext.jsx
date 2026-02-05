import React, { createContext, useContext, useState, useCallback } from 'react';
import * as walletApi from '../api/walletApi';
import { useAuth } from './AuthContext';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { updateBalance } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const recharge = useCallback(async (amount) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await walletApi.recharge(amount);

      // Actualizar balance en AuthContext
      if (data.balance !== undefined) {
        updateBalance(data.balance);
      }

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Error al recargar';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, [updateBalance]);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await walletApi.getBalance();
      if (data.balance !== undefined) {
        updateBalance(data.balance);
      }
      return data.balance;
    } catch (err) {
      return null;
    }
  }, [updateBalance]);

  const fetchTransactions = useCallback(async (page = 1, limit = 10, type = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await walletApi.getTransactions(page, limit, type);

      setTransactions(data.transactions || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Error al obtener transacciones';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    transactions,
    pagination,
    isLoading,
    error,
    recharge,
    fetchBalance,
    fetchTransactions,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet debe usarse dentro de WalletProvider');
  }
  return context;
}

export default WalletContext;
