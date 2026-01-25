import React from 'react';
import './Spinner.css';

function Spinner({ size = 'md', color = 'primary', className = '' }) {
  const classNames = [
    'spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className="spinner-circle"></div>
    </div>
  );
}

// Componente para pantalla completa de carga
export function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <div className="loading-screen">
      <Spinner size="lg" />
      <p className="loading-message">{message}</p>
    </div>
  );
}

export default Spinner;
