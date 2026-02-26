import React, { useState, useEffect, useRef } from 'react';
import {
  BLOCKED_COUNTRY_CODES,
  getBlockedMessage,
  GEO_API_URL,
  GEO_API_URL_ALT,
  GEO_CACHE_KEY,
  GEO_CACHE_DURATION
} from '../../config/geoblocking';
import './GeoBlock.css';

// Fetch con timeout via AbortController — evita que un fetch colgado bloquee la UI
function fetchWithTimeout(url, ms = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(id));
}

function GeoBlock({ children }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    // Timeout de seguridad: si el check tarda más de 5s, mostrar la app
    const safetyTimer = setTimeout(() => {
      if (!cancelledRef.current) setIsChecking(false);
    }, 5000);

    checkGeoLocation().finally(() => {
      clearTimeout(safetyTimer);
    });

    return () => { cancelledRef.current = true; clearTimeout(safetyTimer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const checkGeoLocation = async () => {
    // Verificar cache primero
    const cached = getCachedGeoData();
    if (cached) {
      if (!cancelledRef.current) processGeoData(cached);
      return;
    }

    try {
      // Intentar con API principal (4s timeout)
      let response = await fetchWithTimeout(GEO_API_URL, 4000);
      let data = await response.json();

      if (data.status === 'success') {
        const geoData = {
          countryCode: data.countryCode,
          country: data.country,
          timestamp: Date.now()
        };
        cacheGeoData(geoData);
        if (!cancelledRef.current) processGeoData(geoData);
        return;
      }

      // Fallback a API alternativa (4s timeout)
      response = await fetchWithTimeout(GEO_API_URL_ALT, 4000);
      data = await response.json();

      if (data.country_code) {
        const geoData = {
          countryCode: data.country_code,
          country: data.country_name,
          timestamp: Date.now()
        };
        cacheGeoData(geoData);
        if (!cancelledRef.current) processGeoData(geoData);
        return;
      }

      // Si ambas APIs fallan, permitir acceso
      if (!cancelledRef.current) setIsChecking(false);
    } catch (error) {
      console.error('Geo check failed:', error);
      // En caso de error o timeout, permitir acceso (fail-open para mejor UX)
      if (!cancelledRef.current) setIsChecking(false);
    }
  };

  const processGeoData = (geoData) => {
    if (cancelledRef.current) return;
    const { countryCode } = geoData;

    if (BLOCKED_COUNTRY_CODES.includes(countryCode)) {
      const message = getBlockedMessage(countryCode);
      setBlockInfo(message);
      setIsBlocked(true);
    }
    setIsChecking(false);
  };

  const getCachedGeoData = () => {
    try {
      const cached = localStorage.getItem(GEO_CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const now = Date.now();

      // Verificar si el cache ha expirado
      if (now - data.timestamp > GEO_CACHE_DURATION) {
        localStorage.removeItem(GEO_CACHE_KEY);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  };

  const cacheGeoData = (data) => {
    try {
      localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(data));
    } catch {
      // Ignorar errores de localStorage
    }
  };

  // Mostrar pantalla de carga mientras verifica
  if (isChecking) {
    return (
      <div className="geo-checking">
        <div className="geo-checking-content">
          <div className="geo-spinner"></div>
          <p>Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de bloqueo si el pais esta restringido
  if (isBlocked && blockInfo) {
    return (
      <div className="geo-blocked">
        <div className="geo-blocked-content">
          <div className="geo-blocked-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <h1>{blockInfo.title}</h1>
          <p className="geo-blocked-message">{blockInfo.message}</p>
          <div className="geo-blocked-info">
            <p>Esta restriccion se aplica de acuerdo con las leyes de juegos de azar de su jurisdiccion.</p>
            <p className="geo-blocked-country">
              Pais detectado: <strong>{blockInfo.country}</strong>
            </p>
          </div>
          <div className="geo-blocked-footer">
            <p>Si cree que esto es un error, por favor contactenos.</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no esta bloqueado, renderizar children normalmente
  return children;
}

export default GeoBlock;
