import React, { useState, useEffect } from 'react';
import { getPoolStats, formatPoolBalance } from '../../api/jackpotApi';
import './JackpotPassSelector.css';

/**
 * JackpotPassSelector Component
 * Allows users to select the Jackpot Pass (+1 USDT) for lottery tickets
 *
 * Props:
 * - enabled: boolean - whether pass is selected
 * - onToggle: (enabled: boolean) => void - callback when toggled
 * - passPrice: number - price of pass (default 1 USDT)
 * - disabled: boolean - disable the toggle
 */
function JackpotPassSelector({
  enabled = false,
  onToggle,
  passPrice = 1,
  disabled = false
}) {
  const [poolStats, setPoolStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPoolStats = async () => {
      try {
        const response = await getPoolStats();
        setPoolStats(response.data);
      } catch (err) {
        console.error('Error loading pool stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPoolStats();

    // Refresh every 30 seconds
    const interval = setInterval(loadPoolStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!disabled && onToggle) {
      onToggle(!enabled);
    }
  };

  return (
    <div className={`jackpot-pass-selector ${enabled ? 'active' : ''} ${disabled ? 'disabled' : ''}`}>
      <div className="pass-header">
        <div className="pass-icon">
          <span className="pass-star">*</span>
        </div>
        <div className="pass-info">
          <h4 className="pass-title">Super Jackpot Pass</h4>
          <p className="pass-subtitle">+${passPrice} USDT por ticket</p>
        </div>
        <button
          type="button"
          className={`pass-toggle ${enabled ? 'enabled' : ''}`}
          onClick={handleToggle}
          disabled={disabled}
          aria-label={enabled ? 'Desactivar pass' : 'Activar pass'}
        >
          <span className="toggle-slider"></span>
        </button>
      </div>

      {enabled && (
        <div className="pass-details">
          <div className="pass-pool">
            <span className="pool-label">Pool Actual:</span>
            <span className="pool-amount">
              {isLoading ? '...' : formatPoolBalance(poolStats?.poolBalance || 0)}
            </span>
          </div>
          <div className="pass-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">+</span>
              <span>5% del pool diario si ganas</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">+</span>
              <span>Acumula con surplus de sorteos</span>
            </div>
          </div>
        </div>
      )}

      {!enabled && (
        <p className="pass-cta">
          Activa el pass para participar en el Super Jackpot
        </p>
      )}
    </div>
  );
}

export default JackpotPassSelector;
