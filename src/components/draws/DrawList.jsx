import React from 'react';
import DrawCard from './DrawCard';
import { Spinner } from '../common';
import './Draws.css';

function DrawList({ draws, isLoading, emptyMessage = 'No hay sorteos disponibles', showBetButton = true }) {
  if (isLoading && draws.length === 0) {
    return (
      <div className="draws-loading">
        <Spinner />
        <p>Cargando sorteos...</p>
      </div>
    );
  }

  if (draws.length === 0) {
    return (
      <div className="draws-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="draws-grid">
      {draws.map(draw => (
        <DrawCard
          key={draw.id}
          draw={draw}
          showBetButton={showBetButton}
        />
      ))}
    </div>
  );
}

export default DrawList;
