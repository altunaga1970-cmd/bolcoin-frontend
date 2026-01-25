import React, { useState, useEffect } from 'react';
import {
  BLOCKED_COUNTRY_CODES,
  getBlockedMessage,
  GEO_API_URL,
  GEO_API_URL_ALT,
  GEO_CACHE_KEY,
  GEO_CACHE_DURATION
} from '../../config/geoblocking';
import './GeoBlock.css';

function GeoBlock({ children }) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockInfo, setBlockInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkGeoLocation();
  }, []);

  const checkGeoLocation = async () => {
    // Verificar cache primero
    const cached = getCachedGeoData();
    if (cached) {
      processGeoData(cached);
      return;
    }

    try {
      // Intentar con API principal
      let response = await fetch(GEO_API_URL);
      let data = await response.json();

      if (data.status === 'success') {
        const geoData = {
          countryCode: data.countryCode,
          country: data.country,
          timestamp: Date.now()
        };
        cacheGeoData(geoData);
        processGeoData(geoData);
        return;
      }

      // Fallback a API alternativa
      response = await fetch(GEO_API_URL_ALT);
      data = await response.json();

      if (data.country_code) {
        const geoData = {
          countryCode: data.country_code,
          country: data.country_name,
          timestamp: Date.now()
        };
        cacheGeoData(geoData);
        processGeoData(geoData);
        return;
      }

      // Si ambas APIs fallan, permitir acceso
      setIsChecking(false);
    } catch (error) {
      console.error('Geo check failed:', error);
      // En caso de error, permitir acceso (fail-open para mejor UX)
      setIsChecking(false);
    }
  };

  const processGeoData = (geoData) => {
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
