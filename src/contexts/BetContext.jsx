import React, { createContext, useContext, useState, useCallback } from 'react';
import * as betApi from '../api/betApi';
import { useAuth } from './AuthContext';

const BetContext = createContext(null);

export function BetProvider({ children }) {
  const { updateBalance, refreshUser } = useAuth();
  const [myBets, setMyBets] = useState([]);
  const [betSlip, setBetSlip] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [error, setError] = useState(null);

  const addToBetSlip = useCallback((bet) => {
    setBetSlip(prev => [...prev, { ...bet, id: Date.now() + Math.random() }]);
  }, []);

  const removeFromBetSlip = useCallback((id) => {
    setBetSlip(prev => prev.filter(bet => bet.id !== id));
  }, []);

  const clearBetSlip = useCallback(() => {
    setBetSlip([]);
  }, []);

  const updateBetInSlip = useCallback((id, updates) => {
    setBetSlip(prev => prev.map(bet =>
      bet.id === id ? { ...bet, ...updates } : bet
    ));
  }, []);

  const placeBets = useCallback(async (drawId) => {
    if (betSlip.length === 0) {
      return { success: false, error: 'No hay apuestas en el carrito' };
    }

    setIsPlacingBet(true);
    setError(null);

    try {
      // Formatear apuestas para el backend
      const bets = betSlip.map(bet => ({
        game_type: bet.gameType,
        number: bet.number,
        amount: parseFloat(bet.amount)
      }));

      const data = await betApi.placeBets(drawId, bets);

      // Actualizar balance
      if (data.new_balance !== undefined) {
        updateBalance(data.new_balance);
      } else {
        await refreshUser();
      }

      // Limpiar carrito
      clearBetSlip();

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Error al realizar apuesta';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsPlacingBet(false);
    }
  }, [betSlip, updateBalance, refreshUser, clearBetSlip]);

  const fetchMyBets = useCallback(async (page = 1, limit = 10, status = null, drawId = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await betApi.getMyBets(page, limit, status, drawId);

      setMyBets(data.bets || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });

      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Error al obtener apuestas';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calcular total del carrito
  const betSlipTotal = betSlip.reduce((total, bet) => {
    const amount = parseFloat(bet.amount) || 0;
    const multiplier = bet.gameType === 'corrido' ? 2 : 1;
    return total + (amount * multiplier);
  }, 0);

  const value = {
    myBets,
    betSlip,
    betSlipTotal,
    pagination,
    isLoading,
    isPlacingBet,
    error,
    addToBetSlip,
    removeFromBetSlip,
    clearBetSlip,
    updateBetInSlip,
    placeBets,
    fetchMyBets,
    clearError
  };

  return (
    <BetContext.Provider value={value}>
      {children}
    </BetContext.Provider>
  );
}

export function useBets() {
  const context = useContext(BetContext);
  if (!context) {
    throw new Error('useBets debe usarse dentro de BetProvider');
  }
  return context;
}

export default BetContext;
