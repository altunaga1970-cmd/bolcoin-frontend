import React from 'react';
import { Spinner } from '../common';
import { formatCurrency, formatBetNumber } from '../../utils/formatters';
import { GAME_RULES, BET_STATUS_LABELS, BET_STATUS_COLORS } from '../../utils/constants';
import './Bets.css';

function BetList({ bets, isLoading, emptyMessage = 'No hay apuestas' }) {
  if (isLoading && bets.length === 0) {
    return (
      <div className="bets-loading">
        <Spinner />
        <p>Cargando apuestas...</p>
      </div>
    );
  }

  if (bets.length === 0) {
    return (
      <div className="bets-empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bets-list">
      <div className="bets-table">
        <div className="bets-header">
          <span>Sorteo</span>
          <span>Tipo</span>
          <span>Numero</span>
          <span>Monto</span>
          <span>Estado</span>
          <span>Ganancia</span>
        </div>

        {bets.map(bet => (
          <BetRow key={bet.id} bet={bet} />
        ))}
      </div>
    </div>
  );
}

function BetRow({ bet }) {
  const {
    draw_number,
    game_type,
    bet_number,
    amount,
    status,
    payout
  } = bet;

  const rules = GAME_RULES[game_type];
  const statusLabel = BET_STATUS_LABELS[status] || status;
  const statusColor = BET_STATUS_COLORS[status] || 'default';

  return (
    <div className="bet-row">
      <span className="bet-draw">#{draw_number}</span>
      <span className="bet-type">{rules?.name || game_type}</span>
      <span className="bet-number">{formatBetNumber(bet_number, rules?.digits || 2)}</span>
      <span className="bet-amount">{formatCurrency(amount)}</span>
      <span className={`bet-status status-${statusColor}`}>{statusLabel}</span>
      <span className={`bet-payout ${payout > 0 ? 'won' : ''}`}>
        {payout > 0 ? formatCurrency(payout) : '-'}
      </span>
    </div>
  );
}

export default BetList;
