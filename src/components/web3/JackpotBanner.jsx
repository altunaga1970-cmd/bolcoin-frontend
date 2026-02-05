import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { getPoolStats, formatPoolBalance } from '../../api/jackpotApi';
import './JackpotBanner.css';

function JackpotBanner({ variant = 'default' }) {
  const { isConnected } = useWeb3();
  const [jackpotInfo, setJackpotInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJackpot = async () => {
      try {
        const response = await getPoolStats();
        setJackpotInfo(response.data);
      } catch (err) {
        console.error('Error loading jackpot:', err);
        // Fallback: continuar sin datos
      } finally {
        setIsLoading(false);
      }
    };

    loadJackpot();

    // Actualizar cada 30 segundos
    const interval = setInterval(loadJackpot, 30000);
    return () => clearInterval(interval);
  }, []);

  // Formatear tiempo restante
  const getTimeRemaining = () => {
    if (!jackpotInfo?.nextDrawTime) return null;

    const now = new Date();
    const drawTime = new Date(jackpotInfo.nextDrawTime);
    const diff = drawTime - now;

    if (diff <= 0) return 'Sorteo en curso';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading || !jackpotInfo) return null;

  const jackpotAmount = parseFloat(jackpotInfo.superJackpotPool || 0);
  const timeRemaining = getTimeRemaining();

  if (variant === 'mini') {
    return (
      <Link to="/jackpot-claims" className="jackpot-mini">
        <span className="jackpot-mini-icon">🏆</span>
        <span className="jackpot-mini-amount">
          {formatPoolBalance(jackpotAmount)}
        </span>
        <span className="jackpot-mini-label">SUPER JACKPOT</span>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to="/jackpot-claims" className="jackpot-compact">
        <div className="jackpot-compact-left">
          <span className="jackpot-compact-label">SUPER JACKPOT</span>
          <span className="jackpot-compact-amount">
            {formatPoolBalance(jackpotAmount)}
          </span>
          <span className="jackpot-compact-desc">
            Pago diario • +1 USDT por ticket
          </span>
        </div>
        <div className="jackpot-compact-right">
          <span className="jackpot-compact-cta">Ver Claims</span>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link to="/jackpot-claims" className="jackpot-banner-link">
      <div className="jackpot-banner-component">
        <div className="jackpot-glow"></div>
        <div className="jackpot-info">
          <span className="jackpot-banner-label">🏆 SUPER JACKPOT LA BOLITA</span>
          <span className="jackpot-banner-amount">
            {formatPoolBalance(jackpotAmount)}
          </span>
          <span className="jackpot-banner-desc">
            Pago diario del 5% del pool a ganadores con Jackpot Pass
          </span>
        </div>
        <span className="jackpot-cta">Ver Mis Claims</span>
      </div>
    </Link>
  );
}

export default JackpotBanner;
