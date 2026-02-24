/**
 * Config Context
 *
 * Provider que carga la configuracion publica desde el backend.
 * Incluye feature flags, parametros de juegos, etc.
 *
 * MVP: Fuente de verdad para flags y config de Keno
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/index';

// Valores por defecto (fallback si el backend no responde)
const DEFAULT_CONFIG = {
  flags: {
    game_keno: true,
    game_bolita: true,
    game_fortuna: false,
    game_bingo: true,
    feature_history: true,
    feature_deposits: true,
    feature_withdrawals: true,
    maintenance_mode: false
  },
  keno: {
    betAmount: 1,
    feeBps: 1200,
    poolBps: 8800,
    maxPayout: 50,
    minSpots: 1,
    maxSpots: 10,
    totalNumbers: 80,
    drawnNumbers: 20
  },
  system: {
    rngMethod: 'sha256_server_seed',
    version: '1.0.0-mvp'
  },
  contract: null
};

// Cache TTL (60 segundos)
const CACHE_TTL_MS = 60 * 1000;

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);

  /**
   * Cargar configuracion desde el backend
   */
  const loadConfig = useCallback(async (force = false) => {
    const apiUrl = import.meta.env.VITE_API_URL;

    // MVP Staging: si no hay backend valido, usar defaults inmediatamente
    if (!apiUrl || !apiUrl.startsWith('http')) {
      console.log('[ConfigContext] Staging mode - using defaults (Keno only)');
      setConfig(DEFAULT_CONFIG);
      setLoading(false);
      return;
    }

    // Usar cache si no ha expirado
    if (!force && lastFetch > 0 && (Date.now() - lastFetch) < CACHE_TTL_MS) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/public-config');

      if (response.data.success && response.data.data) {
        setConfig({
          flags: response.data.data.flags || DEFAULT_CONFIG.flags,
          keno: response.data.data.keno || DEFAULT_CONFIG.keno,
          system: response.data.data.system || DEFAULT_CONFIG.system,
          contract: response.data.data.contract || null
        });
        setError(null);
        setLastFetch(Date.now());
      }
    } catch (err) {
      console.warn('[ConfigContext] Error loading config, using defaults:', err);
      setError(err.message);
      // Mantener config anterior o usar defaults
      if (!lastFetch) {
        setConfig(DEFAULT_CONFIG);
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetch]);

  // Cargar config al montar
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  /**
   * Verificar si un feature flag esta habilitado
   */
  const isFeatureEnabled = useCallback((flagKey) => {
    return config.flags[flagKey] === true;
  }, [config.flags]);

  /**
   * Verificar si un juego esta habilitado
   */
  const isGameEnabled = useCallback((gameKey) => {
    const flagKey = `game_${gameKey}`;
    return isFeatureEnabled(flagKey);
  }, [isFeatureEnabled]);

  /**
   * Verificar modo mantenimiento
   */
  const isMaintenanceMode = useCallback(() => {
    return config.flags.maintenance_mode === true;
  }, [config.flags]);

  /**
   * Obtener config de Keno
   */
  const getKenoConfig = useCallback(() => {
    return config.keno;
  }, [config.keno]);

  /**
   * Refrescar configuracion (forzar)
   */
  const refreshConfig = useCallback(() => {
    return loadConfig(true);
  }, [loadConfig]);

  const value = {
    // Estado
    config,
    loading,
    error,

    // Shortcuts
    flags: config.flags,
    keno: config.keno,
    system: config.system,
    contract: config.contract,

    // Funciones
    isFeatureEnabled,
    isGameEnabled,
    isMaintenanceMode,
    getKenoConfig,
    refreshConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook para usar el contexto de configuracion
 */
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider');
  }
  return context;
}

/**
 * Hook para verificar feature flags
 */
export function useFeatureFlag(flagKey) {
  const { isFeatureEnabled } = useConfig();
  return isFeatureEnabled(flagKey);
}

/**
 * Hook para verificar si un juego esta habilitado
 */
export function useGameEnabled(gameKey) {
  const { isGameEnabled } = useConfig();
  return isGameEnabled(gameKey);
}

export default ConfigContext;
