import React from 'react';
import { Button } from '../common';
import { GAME_RULES } from '../../utils/constants';
import { formatCurrency, calculatePotentialWin } from '../../utils/formatters';
import './Bets.css';

function BetSlip({ bets, total, onRemove, onClear, onPlaceBets, isLoading, balance }) {
  const canPlaceBets = bets.length > 0 && total <= balance;

  // Calcular ganancia potencial maxima por tipo de juego
  // Solo un numero por tipo puede ganar, asi que tomamos el maximo de cada tipo
  const calculateMaxPotentialWin = () => {
    const maxByType = {};

    bets.forEach(bet => {
      const potentialWin = calculatePotentialWin(bet.amount, bet.multiplier);
      const type = bet.gameType === 'corrido' ? 'fijos' : bet.gameType;

      if (!maxByType[type] || potentialWin > maxByType[type]) {
        maxByType[type] = potentialWin;
      }
    });

    return Object.values(maxByType).reduce((sum, val) => sum + val, 0);
  };

  const totalPotentialWin = calculateMaxPotentialWin();

  return (
    <div className="bet-slip">
      <div className="bet-slip-header">
        <h3>Carrito de Apuestas</h3>
        {bets.length > 0 && (
          <button className="clear-btn" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>

      <div className="bet-slip-body">
        {bets.length === 0 ? (
          <div className="bet-slip-empty">
            <p>No hay apuestas en el carrito</p>
            <p className="empty-hint">Selecciona un tipo de juego y agrega tus numeros</p>
          </div>
        ) : (
          <div className="bet-slip-items">
            {bets.map(bet => (
              <BetSlipItem
                key={bet.id}
                bet={bet}
                onRemove={() => onRemove(bet.id)}
              />
            ))}
          </div>
        )}
      </div>

      {bets.length > 0 && (
        <div className="bet-slip-footer">
          <div className="slip-summary">
            <div className="summary-row">
              <span>Apuestas:</span>
              <span>{bets.length}</span>
            </div>
            <div className="summary-row">
              <span>Total a pagar:</span>
              <span className={total > balance ? 'insufficient' : ''}>{formatCurrency(total)}</span>
            </div>
            <div className="summary-row potential">
              <span>Ganancia potencial:</span>
              <span>{formatCurrency(totalPotentialWin)}</span>
            </div>
          </div>

          {total > balance && (
            <div className="insufficient-warning">
              Balance insuficiente. Necesitas {formatCurrency(total - balance)} mas.
            </div>
          )}

          <Button
            fullWidth
            onClick={onPlaceBets}
            disabled={!canPlaceBets}
            loading={isLoading}
          >
            Realizar Apuestas
          </Button>
        </div>
      )}
    </div>
  );
}

function BetSlipItem({ bet, onRemove }) {
  const { gameType, number, amount, multiplier } = bet;
  const rules = GAME_RULES[gameType];
  const cost = amount * (gameType === 'corrido' ? 2 : 1);

  return (
    <div className="bet-slip-item">
      <div className="item-info">
        <span className="item-type">{rules.name}</span>
        <span className="item-number">{number}</span>
      </div>
      <div className="item-details">
        <span className="item-amount">{formatCurrency(cost)}</span>
        <span className="item-multiplier">{multiplier}x</span>
      </div>
      <button className="item-remove" onClick={onRemove}>
        ×
      </button>
    </div>
  );
}

export default BetSlip;
