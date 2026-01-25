import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common';
import DrawCountdown from './DrawCountdown';
import { formatDateTime } from '../../utils/formatters';
import { DRAW_STATUS_LABELS, DRAW_STATUS_COLORS } from '../../utils/constants';
import './Draws.css';

function DrawCard({ draw, showBetButton = true }) {
  const { id, draw_number, status, scheduled_time, winning_number } = draw;
  const statusLabel = DRAW_STATUS_LABELS[status] || status;
  const statusColor = DRAW_STATUS_COLORS[status] || 'default';

  const isOpen = status === 'open';
  const isCompleted = status === 'completed';

  return (
    <div className={`draw-card draw-${status}`}>
      <div className="draw-card-header">
        <span className="draw-number">Sorteo #{draw_number}</span>
        <span className={`draw-status status-${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="draw-card-body">
        {isOpen && (
          <div className="draw-countdown-wrapper">
            <span className="countdown-label">Cierra en:</span>
            <DrawCountdown targetDate={scheduled_time} />
          </div>
        )}

        {isCompleted && winning_number && (
          <div className="draw-winning">
            <span className="winning-label">Numero Ganador</span>
            <span className="winning-number">{winning_number}</span>
          </div>
        )}

        {!isOpen && !isCompleted && (
          <div className="draw-scheduled">
            <span className="scheduled-label">Programado para:</span>
            <span className="scheduled-time">{formatDateTime(scheduled_time)}</span>
          </div>
        )}
      </div>

      {showBetButton && isOpen && (
        <div className="draw-card-footer">
          <Link to={`/bet/${id}`}>
            <Button fullWidth>Apostar Ahora</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default DrawCard;
