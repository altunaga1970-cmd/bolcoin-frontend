/**
 * ComingSoon Component
 *
 * Banner para juegos/features deshabilitados en el MVP.
 * Muestra mensaje "Proximamente" sin enlaces ni fechas.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './ComingSoon.css';

function ComingSoon({
  title = 'Proximamente',
  subtitle = 'Esta funcion estara disponible pronto.',
  showBackButton = true,
  backTo = '/',
  backLabel = 'Volver al Inicio',
  icon = null
}) {
  return (
    <div className="coming-soon-container">
      <div className="coming-soon-content">
        {/* Icono decorativo */}
        <div className="coming-soon-icon">
          {icon || (
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>

        {/* Titulo */}
        <h1 className="coming-soon-title">{title}</h1>

        {/* Subtitulo */}
        <p className="coming-soon-subtitle">{subtitle}</p>

        {/* Mensaje adicional */}
        <p className="coming-soon-message">
          Mientras tanto, prueba nuestro juego de <strong>Keno</strong> disponible ahora.
        </p>

        {/* Botones de accion */}
        <div className="coming-soon-actions">
          <Link to="/keno" className="coming-soon-btn coming-soon-btn-primary">
            Jugar Keno
          </Link>

          {showBackButton && (
            <Link to={backTo} className="coming-soon-btn coming-soon-btn-secondary">
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Variante para La Bolita
 */
export function BolitaComingSoon() {
  return (
    <ComingSoon
      title="La Bolita - Proximamente"
      subtitle="Nuestro juego clasico de numeros estara disponible pronto."
      icon={
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">42</text>
        </svg>
      }
    />
  );
}

/**
 * Variante para La Fortuna (Loteria)
 */
export function FortunaComingSoon() {
  return (
    <ComingSoon
      title="La Fortuna - Proximamente"
      subtitle="La loteria con jackpot progresivo estara disponible pronto."
      icon={
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      }
    />
  );
}

/**
 * Variante para modo mantenimiento
 */
export function MaintenanceMode() {
  return (
    <div className="coming-soon-container maintenance-mode">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <h1 className="coming-soon-title">Mantenimiento</h1>
        <p className="coming-soon-subtitle">
          Estamos realizando mejoras en el sistema.
        </p>
        <p className="coming-soon-message">
          Por favor, vuelve a intentarlo en unos minutos.
        </p>
      </div>
    </div>
  );
}

export default ComingSoon;
