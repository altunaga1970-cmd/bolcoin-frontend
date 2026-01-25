import React from 'react';
import { GAME_RULES } from '../../utils/constants';
import { formatMultiplier } from '../../utils/formatters';
import './Bets.css';

function GameTypeSelector({ selectedType, onSelect }) {
  const gameTypes = Object.entries(GAME_RULES);

  return (
    <div className="game-type-selector">
      <h3 className="selector-title">Tipo de Juego</h3>
      <div className="game-types-grid">
        {gameTypes.map(([key, game]) => (
          <button
            key={key}
            type="button"
            className={`game-type-btn ${selectedType === key ? 'active' : ''}`}
            onClick={() => onSelect(key)}
          >
            <span className="game-type-name">{game.name}</span>
            <span className="game-type-multiplier">{formatMultiplier(game.multiplier)}</span>
            <span className="game-type-desc">{game.description}</span>
            {key === 'corrido' && (
              <span className="game-type-note">Costo: 2x</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GameTypeSelector;
