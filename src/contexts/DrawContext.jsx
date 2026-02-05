import React, { createContext, useContext, useState, useCallback } from 'react';
import * as drawApi from '../api/drawApi';

const DrawContext = createContext(null);

export function DrawProvider({ children }) {
  const [activeDraws, setActiveDraws] = useState([]);
  const [upcomingDraws, setUpcomingDraws] = useState([]);
  const [completedDraws, setCompletedDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchActiveDraws = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await drawApi.getActive();
      setActiveDraws(data.draws || []);
      return { success: true, draws: data.draws };
    } catch (err) {
      const message = err.message || 'Error al obtener sorteos activos';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUpcomingDraws = useCallback(async (limit = 5) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await drawApi.getUpcoming(limit);
      setUpcomingDraws(data.draws || []);
      return { success: true, draws: data.draws };
    } catch (err) {
      const message = err.message || 'Error al obtener sorteos proximos';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCompletedDraws = useCallback(async (page = 1, limit = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await drawApi.getCompleted(page, limit);
      setCompletedDraws(data.draws || []);
      setPagination({
        page: data.page || page,
        limit: data.limit || limit,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Error al obtener sorteos completados';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDrawById = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await drawApi.getById(id);
      setSelectedDraw(data.draw);
      return { success: true, draw: data.draw };
    } catch (err) {
      const message = err.message || 'Error al obtener sorteo';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDrawResults = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await drawApi.getResults(id);
      return { success: true, data };
    } catch (err) {
      const message = err.message || 'Error al obtener resultados';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectDraw = useCallback((draw) => {
    setSelectedDraw(draw);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    activeDraws,
    upcomingDraws,
    completedDraws,
    selectedDraw,
    pagination,
    isLoading,
    error,
    fetchActiveDraws,
    fetchUpcomingDraws,
    fetchCompletedDraws,
    fetchDrawById,
    fetchDrawResults,
    selectDraw,
    clearError
  };

  return (
    <DrawContext.Provider value={value}>
      {children}
    </DrawContext.Provider>
  );
}

export function useDraws() {
  const context = useContext(DrawContext);
  if (!context) {
    throw new Error('useDraws debe usarse dentro de DrawProvider');
  }
  return context;
}

export default DrawContext;
