import React from 'react';
import useCountdown, { formatCountdown } from '../../hooks/useCountdown';
import './Draws.css';

function DrawCountdown({ targetDate, size = 'md' }) {
  const { timeLeft, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return <span className="countdown-expired">Cerrado</span>;
  }

  if (!timeLeft) {
    return <span className="countdown-loading">...</span>;
  }

  const { days, hours, minutes, seconds } = timeLeft;

  if (size === 'sm') {
    return (
      <span className="countdown-simple">
        {formatCountdown(timeLeft)}
      </span>
    );
  }

  return (
    <div className="countdown-display">
      {days > 0 && (
        <div className="countdown-unit">
          <span className="countdown-value">{days}</span>
          <span className="countdown-label">dias</span>
        </div>
      )}
      <div className="countdown-unit">
        <span className="countdown-value">{String(hours).padStart(2, '0')}</span>
        <span className="countdown-label">horas</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-value">{String(minutes).padStart(2, '0')}</span>
        <span className="countdown-label">min</span>
      </div>
      <div className="countdown-unit">
        <span className="countdown-value">{String(seconds).padStart(2, '0')}</span>
        <span className="countdown-label">seg</span>
      </div>
    </div>
  );
}

export default DrawCountdown;
