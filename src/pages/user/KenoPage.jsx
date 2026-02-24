/**
 * Keno Game Page
 *
 * Página principal del juego Keno.
 * Incluye: Grid de números, panel de apuesta, resultado y historial.
 *
 * Sistema de sesiones:
 * - Inicia sesión al entrar a la página
 * - Liquida con el contrato al salir
 */

import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useKenoGame } from '../../hooks/useKenoGame';
import { useWeb3 } from '../../contexts/Web3Context';
import { useBalance } from '../../contexts/BalanceContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import Footer from '../../components/layout/Footer';
import { ConnectWallet } from '../../components/web3';
import kenoApi from '../../api/kenoApi';
import './KenoPage.css';

// =============================================================================
// COMPONENTE: Grid de Números (1-80)
// =============================================================================

function KenoNumberGrid({
  selectedNumbers,
  drawnNumbers,
  matchedNumbers,
  onToggle,
  disabled,
  maxSpots,
  onMaxReached
}) {
  const { t } = useTranslation('games');

  // Crear Set para búsqueda O(1)
  const selectedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);
  const drawnSet = useMemo(() => new Set(drawnNumbers || []), [drawnNumbers]);
  const matchedSet = useMemo(() => new Set(matchedNumbers || []), [matchedNumbers]);

  // Generar array del 1 al 80
  const numbers = useMemo(() => Array.from({ length: 80 }, (_, i) => i + 1), []);

  const getNumberClass = (num) => {
    const classes = ['keno-number'];

    if (selectedSet.has(num)) classes.push('selected');
    if (drawnSet.has(num)) classes.push('drawn');
    if (matchedSet.has(num)) classes.push('matched');

    return classes.join(' ');
  };

  const handleClick = (num) => {
    if (disabled) return;
    if (!selectedSet.has(num) && selectedNumbers.length >= maxSpots) {
      onMaxReached?.();
      return;
    }
    onToggle(num);
  };

  return (
    <div className="keno-grid-container">
      <div className="keno-grid">
        {numbers.map(num => (
          <button
            key={num}
            className={getNumberClass(num)}
            onClick={() => handleClick(num)}
            disabled={disabled}
            aria-label={t('keno.number_label', { num })}
            aria-pressed={selectedSet.has(num)}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Leyenda */}
      <div className="keno-legend">
        <div className="legend-item">
          <span className="legend-dot selected"></span>
          <span>{t('keno.legend.selected')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot drawn"></span>
          <span>{t('keno.legend.drawn')}</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot matched"></span>
          <span>{t('keno.legend.match')}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Panel de Apuesta
// =============================================================================

function KenoBetPanel({
  spots,
  maxSpots,
  betAmount,
  balance,
  maxPotentialPayout,
  maxPayoutInfo,
  canPlay,
  disabledReason,
  isLoading,
  gameState,
  config,
  onBetChange,
  onPlay,
  onQuickPick,
  onClear
}) {
  const { t } = useTranslation('games');

  // MVP: Apuesta fija - no se usa quickAmounts ni selector de monto

  return (
    <div className="keno-bet-panel">
      <div className="bet-panel-header">
        <h3>{t('keno.bet_panel.your_bet')}</h3>
        <div className="spots-counter">
          <span className="spots-count">{spots}</span>
          <span className="spots-max">/ {maxSpots}</span>
          <span className="spots-label">{t('keno.bet_panel.numbers')}</span>
        </div>
      </div>

      {/* Monto de apuesta FIJO */}
      <div className="bet-amount-section">
        <div className="fixed-bet-display">
          <span className="fixed-bet-label">{t('keno.bet_panel.fixed_bet')}</span>
          <span className="fixed-bet-value">1 USDT</span>
        </div>
      </div>

      {/* Balance */}
      <div className="balance-info">
        <span className="balance-label">Balance:</span>
        <span className="balance-value">${parseFloat(balance).toFixed(2)} USDT</span>
      </div>

      {/* Potencial máximo - Dinámico según números seleccionados */}
      {spots > 0 && (
        <div className="potential-win">
          <span className="potential-label">{t('keno.bet_panel.max_win', { spots })}:</span>
          <span className="potential-value">
            ${maxPotentialPayout} USDT
            {maxPayoutInfo?.capped && (
              <span className="payout-capped"> {t('keno.bet_panel.cap_applied')}</span>
            )}
          </span>
          {maxPayoutInfo?.multiplier > 0 && (
            <span className="potential-multiplier">
              {t('keno.bet_panel.multiplier', { value: maxPayoutInfo.multiplier })}
            </span>
          )}
        </div>
      )}
      {spots === 0 && (
        <div className="potential-win hint">
          <span className="potential-label">{t('keno.bet_panel.select_to_see_win')}</span>
        </div>
      )}

      {/* Botón de jugar */}
      <Button
        variant="primary"
        fullWidth
        onClick={onPlay}
        disabled={!canPlay}
        loading={isLoading}
        className="play-button"
      >
        {isLoading ? (gameState === 'waiting_vrf' ? t('keno.play_button.waiting_vrf') : t('keno.play_button.processing')) : t('keno.play_button.place_bet', { amount: config?.BET_AMOUNT || 1 })}
      </Button>

      {/* Razón de deshabilitado */}
      {disabledReason && !isLoading && (
        <p className="disabled-reason">{disabledReason}</p>
      )}
    </div>
  );
}

// =============================================================================
// COMPONENTE: Panel de Resultado
// =============================================================================

function KenoResultPanel({ result, gameState, requestId, STATES }) {
  const { t } = useTranslation('games');

  // Estado de carga (VRF pendiente — on-chain)
  if (gameState === STATES.WAITING_VRF) {
    return (
      <div className="keno-result-panel loading">
        <div className="result-loading">
          <Spinner size="lg" />
          <h3>{t('keno.result.waiting_vrf')}</h3>
          <p>{t('keno.result.vrf_description')}</p>
          {requestId && (
            <p className="request-id">Bet ID: {requestId}</p>
          )}
        </div>
      </div>
    );
  }

  // Estado de carga (TX pendiente)
  if (gameState === STATES.TX_PENDING) {
    return (
      <div className="keno-result-panel loading">
        <div className="result-loading">
          <Spinner size="lg" />
          <h3>{t('keno.result.tx_processing')}</h3>
          <p>{t('keno.result.tx_sending')}</p>
        </div>
      </div>
    );
  }

  // Sin resultado
  if (!result) {
    return null;
  }

  const isWin = result.payout > 0;

  return (
    <div className={`keno-result-panel ${isWin ? 'win' : 'lose'}`}>
      <div className="result-header">
        <h3>{isWin ? t('keno.result.you_won') : t('keno.result.no_prize')}</h3>
        {isWin && (
          <span className="result-payout">${result.payout.toFixed(2)} USDT</span>
        )}
      </div>

      {/* Números sorteados */}
      <div className="drawn-numbers-section">
        <h4>{t('keno.result.drawn_numbers')}</h4>
        <div className="drawn-numbers-grid">
          {result.drawnNumbers.map(num => (
            <span
              key={num}
              className={`drawn-number ${result.matchedNumbers.includes(num) ? 'matched' : ''}`}
            >
              {num}
            </span>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div className="result-summary">
        <div className="summary-row">
          <span>{t('keno.result.numbers_played')}</span>
          <span>{result.spots}</span>
        </div>
        <div className="summary-row">
          <span>{t('keno.result.hits')}</span>
          <span className="hits-value">{result.hits} / {result.spots}</span>
        </div>
        <div className="summary-row">
          <span>{t('keno.result.multiplier')}</span>
          <span>{result.multiplier}x</span>
        </div>
        <div className="summary-row">
          <span>{t('keno.result.bet')}</span>
          <span>${result.betAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>{t('keno.result.prize')}</span>
          <span className={isWin ? 'win-amount' : ''}>${result.payout.toFixed(2)}</span>
        </div>
      </div>

      {/* Request ID */}
      <div className="result-meta">
        <span className="meta-label">{t('keno.result.request_id')}</span>
        <span className="meta-value">{result.requestId}</span>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Historial de Partidas
// =============================================================================

function KenoHistoryPanel({ history, onClear }) {
  const { t } = useTranslation('games');

  if (history.length === 0) {
    return (
      <div className="keno-history-panel empty">
        <h3>{t('keno.history.title')}</h3>
        <p className="empty-message">{t('keno.history.no_games')}</p>
      </div>
    );
  }

  return (
    <div className="keno-history-panel">
      <div className="history-header">
        <h3>{t('keno.history.latest_games')}</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          {t('keno.history.clear')}
        </Button>
      </div>

      <div className="history-list">
        {history.map((game, index) => (
          <div key={game.id || index} className={`history-item ${game.isWin ? 'win' : 'lose'}`}>
            <div className="history-main">
              <span className="history-time">
                {new Date(game.timestamp).toLocaleTimeString()}
              </span>
              <span className={`history-status ${game.isWin ? 'win' : 'lose'}`}>
                {game.isWin ? t('keno.history.won') : t('keno.history.lost')}
              </span>
            </div>
            <div className="history-details">
              <span className="history-spots">{game.spots} {t('keno.history.numbers')}</span>
              <span className="history-hits">{game.hits} {t('keno.history.hits')}</span>
            </div>
            <div className="history-amounts">
              <span className="history-bet">-${game.betAmount.toFixed(2)}</span>
              <span className={`history-payout ${game.isWin ? 'win' : ''}`}>
                +${game.payout.toFixed(2)}
              </span>
            </div>
            <div className="history-request-id">
              {game.requestId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Tabla de Pagos
// =============================================================================

function KenoPayoutTable({ spots, payoutTable, poolTrend }) {
  const { t } = useTranslation('games');

  if (spots < 1 || spots > 10) {
    return (
      <div className="keno-payout-table">
        <h4>{t('keno.payout_table.title')}</h4>
        <p className="payout-hint">{t('keno.payout_table.select_hint')}</p>
      </div>
    );
  }

  const payouts = payoutTable[spots];
  const entries = Object.entries(payouts)
    .map(([hits, mult]) => ({ hits: parseInt(hits), mult }))
    .filter(item => item.mult > 0)
    .sort((a, b) => b.hits - a.hits);

  return (
    <div className="keno-payout-table">
      <h4>{t('keno.payout_table.prizes_for', { spots })}</h4>
      <table>
        <thead>
          <tr>
            <th>{t('keno.payout_table.hits')}</th>
            <th>{t('keno.payout_table.multiplier')}</th>
            <th>{t('keno.payout_table.trend')}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ hits, mult }) => (
            <tr key={hits}>
              <td>{hits}</td>
              <td className="multiplier">{mult}x</td>
              <td className={`trend ${poolTrend?.direction || 'stable'}`}>
                {poolTrend?.direction === 'up' && <span className="trend-up">▲</span>}
                {poolTrend?.direction === 'down' && <span className="trend-down">▼</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Info del Pool (Cap Dinamico)
// =============================================================================

function PoolStatusBanner({ poolInfo, poolTrend }) {
  const { t } = useTranslation('games');

  if (!poolInfo) return null;

  const { balance, maxPayoutRatio, currentMaxPayout, absoluteMaxPayout } = poolInfo;
  const percentOfMax = (currentMaxPayout / absoluteMaxPayout) * 100;

  return (
    <div className="pool-status-banner">
      <div className="pool-header">
        <span className="pool-icon">🏦</span>
        <h4>{t('keno.pool.title')}</h4>
      </div>
      <div className="pool-stats">
        <div className="pool-stat">
          <span className="stat-label">{t('keno.pool.balance')}</span>
          <span className="stat-value">
            ${balance.toLocaleString()} USDT
            {poolTrend && poolTrend.direction !== 'stable' && (
              <span className={`pool-trend ${poolTrend.direction}`}>
                {poolTrend.direction === 'up' ? ' ▲' : ' ▼'}
                {poolTrend.percent.toFixed(1)}%
              </span>
            )}
          </span>
        </div>
        <div className="pool-stat highlight">
          <span className="stat-label">{t('keno.pool.max_payout')}</span>
          <span className="stat-value">${currentMaxPayout.toLocaleString()} USDT</span>
        </div>
        <div className="pool-stat">
          <span className="stat-label">{t('keno.pool.ratio')}</span>
          <span className="stat-value">{t('keno.pool.of_pool', { percent: (maxPayoutRatio * 100).toFixed(0) })}</span>
        </div>
      </div>
      <div className="pool-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(percentOfMax, 100)}%` }}
          />
        </div>
        <span className="progress-label">
          {t('keno.pool.of_max', { percent: percentOfMax.toFixed(1) })}
        </span>
      </div>
      <p className="pool-note">
        {t('keno.pool.note')}
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Instrucciones
// =============================================================================

function KenoInstructions({ poolInfo }) {
  const { t } = useTranslation('games');
  const maxPayout = poolInfo?.currentMaxPayout || 50;

  return (
    <div className="keno-instructions">
      <h4>{t('keno.instructions.title')}</h4>
      <ol>
        <li dangerouslySetInnerHTML={{ __html: t('keno.instructions.step1') }} />
        <li dangerouslySetInnerHTML={{ __html: t('keno.instructions.step2') }} />
        <li dangerouslySetInnerHTML={{ __html: t('keno.instructions.step3') }} />
        <li dangerouslySetInnerHTML={{ __html: t('keno.instructions.step4') }} />
      </ol>
      <p className="instructions-note">
        {t('keno.instructions.note')}
      </p>
    </div>
  );
}

// =============================================================================
// MVP: Banners de juegos proximos
// =============================================================================

function ComingSoonBanners() {
  const { t } = useTranslation('games');

  return (
    <div className="coming-soon-banners">
      <h4>{t('upcoming_games.title')}</h4>
      <div className="banners-grid">
        {/* La Bolita */}
        <div className="coming-soon-banner bolita">
          <div className="banner-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor">42</text>
            </svg>
          </div>
          <div className="banner-content">
            <h5>{t('upcoming_games.bolita.name')}</h5>
            <p>{t('upcoming_games.bolita.description')}</p>
            <span className="coming-badge">{t('upcoming_games.coming_soon')}</span>
          </div>
        </div>

        {/* La Fortuna */}
        <div className="coming-soon-banner fortuna">
          <div className="banner-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="banner-content">
            <h5>{t('upcoming_games.fortuna.name')}</h5>
            <p>{t('upcoming_games.fortuna.description')}</p>
            <span className="coming-badge">{t('upcoming_games.coming_soon')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Modal de Confirmacion de Apuesta
// =============================================================================

function BetConfirmModal({ show, spots, betAmount, maxPotentialPayout, selectedNumbers, onConfirm, onCancel }) {
  const { t } = useTranslation('games');

  if (!show) return null;

  return (
    <div className="bet-confirm-overlay" onClick={onCancel}>
      <div className="bet-confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>{t('keno.confirm_modal.title')}</h3>
        <div className="confirm-details">
          <div className="confirm-row">
            <span>{t('keno.confirm_modal.numbers_selected')}</span>
            <span className="confirm-value">{spots}</span>
          </div>
          <div className="confirm-row">
            <span>{t('keno.confirm_modal.amount')}</span>
            <span className="confirm-value">{betAmount} USDT</span>
          </div>
          <div className="confirm-row">
            <span>{t('keno.confirm_modal.max_win')}</span>
            <span className="confirm-value">${maxPotentialPayout} USDT</span>
          </div>
          <div className="confirm-numbers">
            {selectedNumbers.map(n => (
              <span key={n} className="confirm-number">{n}</span>
            ))}
          </div>
        </div>
        <div className="confirm-actions">
          <Button variant="ghost" onClick={onCancel}>{t('keno.confirm_modal.cancel')}</Button>
          <Button variant="primary" onClick={onConfirm}>{t('keno.confirm_modal.confirm')}</Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Panel de Error con Recuperacion
// =============================================================================

function KenoErrorPanel({ error, onRetry, onClear }) {
  const { t } = useTranslation('games');

  if (!error) return null;

  return (
    <div className="keno-error-panel">
      <div className="error-header">
        <span className="error-icon">!</span>
        <h4>{t('keno.error_panel.title')}</h4>
      </div>
      <p className="error-message">{error}</p>
      <div className="error-actions">
        <Button variant="primary" size="sm" onClick={onRetry}>{t('keno.error_panel.retry')}</Button>
        <Button variant="ghost" size="sm" onClick={onClear}>{t('keno.error_panel.clear')}</Button>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Pending Bet Recovery Banner
// =============================================================================

function PendingBetBanner({ pendingBets, onCancel, isLoading }) {
  const { t } = useTranslation('games');

  if (!pendingBets || pendingBets.length === 0) return null;

  return (
    <div className="pending-bet-banner">
      <div className="pending-bet-header">
        <span className="pending-icon">!</span>
        <h4>{t('keno.pending_bets.title', { count: pendingBets.length })}</h4>
      </div>
      <p className="pending-description">
        {t('keno.pending_bets.description')}
      </p>
      {pendingBets.map(bet => (
        <div key={bet.betId} className="pending-bet-item">
          <span className="pending-bet-id">{t('keno.pending_bets.bet_id', { id: bet.betId })}</span>
          <span className="pending-bet-amount">{bet.amount} USDT</span>
          {bet.type === 'unpaid' ? (
            <span className="pending-bet-status unpaid">{t('keno.pending_bets.unpaid')}</span>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onCancel(bet.betId)}
              disabled={isLoading}
            >
              {t('keno.pending_bets.cancel_recover')}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// COMPONENTE: Loss Limits Info Bar
// =============================================================================

function LossLimitsBar({ lossLimits }) {
  if (!lossLimits) return null;

  const { daily, session, games } = lossLimits;

  // Only show if at least one limit is active (> 0)
  const hasActiveLimits = (daily?.limit > 0) || (session?.limit > 0) || (games?.limit > 0);
  if (!hasActiveLimits) return null;

  const getBarColor = (used, limit) => {
    if (limit <= 0) return '';
    const pct = (used / limit) * 100;
    if (pct >= 95) return 'limit-red';
    if (pct >= 80) return 'limit-warning';
    return '';
  };

  return (
    <div className="loss-limits-bar">
      {daily?.limit > 0 && (
        <div className={`limit-item ${getBarColor(daily.used, daily.limit)}`}>
          <span className="limit-label">Perdida diaria:</span>
          <span className="limit-value">${daily.used.toFixed(2)} / ${daily.limit}</span>
          <div className="limit-progress">
            <div
              className="limit-fill"
              style={{ width: `${Math.min(100, (daily.used / daily.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {session?.limit > 0 && (
        <div className={`limit-item ${getBarColor(session.used, session.limit)}`}>
          <span className="limit-label">Perdida sesion:</span>
          <span className="limit-value">${session.used.toFixed(2)} / ${session.limit}</span>
          <div className="limit-progress">
            <div
              className="limit-fill"
              style={{ width: `${Math.min(100, (session.used / session.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}
      {games?.limit > 0 && (
        <div className={`limit-item ${getBarColor(games.used, games.limit)}`}>
          <span className="limit-label">Juegos:</span>
          <span className="limit-value">{games.used} / {games.limit}</span>
          <div className="limit-progress">
            <div
              className="limit-fill"
              style={{ width: `${Math.min(100, (games.used / games.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// PÁGINA PRINCIPAL: KenoPage
// =============================================================================

function KenoPage() {
  const { t } = useTranslation('games');
  const { isConnected, account } = useWeb3();
  const {
    refreshBalance,
    isUsingDirectBalance,
    backendAvailable,
    directBalance,
    effectiveBalance: contextEffectiveBalance
  } = useBalance();
  const { info: showInfo, error: showError } = useToast();

  // Estado de sesión
  const [sessionData, setSessionData] = useState(null);
  const [localEffectiveBalance, setLocalEffectiveBalance] = useState(0);
  const [isSettling, setIsSettling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Balance a mostrar: usar directBalance cuando backend no está disponible
  const displayBalance = isUsingDirectBalance
    ? parseFloat(directBalance.usdt || '0')
    : (parseFloat(contextEffectiveBalance) || localEffectiveBalance || 0);

  const {
    // Estado
    gameState,
    selectedNumbers,
    betAmount,
    currentResult,
    gameHistory,
    requestId,
    error: gameError,
    isLoading,

    // Valores calculados
    spots,
    maxPotentialPayout,
    maxPayoutInfo,
    canPlay,
    disabledReason,

    // Info del pool (cap dinamico)
    poolInfo,

    // Pool trend
    poolTrend,

    // Loss limits
    lossLimits,
    lossLimitReached,

    // Pending bet recovery
    pendingBets,
    cancelStaleBet,

    // Configuración
    config,
    payoutTable,

    // Funciones
    toggleNumber,
    clearSelection,
    quickPick,
    updateBetAmount,
    playKeno,
    clearHistory,

    // On-chain
    isOnChain,
    waitingVrf,

    // Estados
    STATES
  } = useKenoGame();

  // Cargar sesión y balance efectivo
  const loadSession = useCallback(async () => {
    if (!isConnected) return;
    try {
      const data = await kenoApi.getSession();
      setSessionData(data);
      setLocalEffectiveBalance(data.balances?.effectiveBalance || 0);
    } catch (err) {
      console.error('[KenoPage] Error loading session:', err);
      // No actualizamos localEffectiveBalance aquí - usaremos directBalance
    }
  }, [isConnected]);

  // Iniciar sesión al entrar a la página
  useEffect(() => {
    if (isConnected) {
      kenoApi.startSession()
        .then(() => loadSession())
        .catch(err => console.error('[KenoPage] Error starting session:', err));
    }
  }, [isConnected, loadSession]);

  // Recargar sesión después de cada juego
  useEffect(() => {
    if (currentResult) {
      loadSession();
    }
  }, [currentResult, loadSession]);

  // Liquidar sesión al salir de la página
  const settleSession = useCallback(async () => {
    if (!isConnected || !sessionData?.hasActiveSession) return;
    if (sessionData?.session?.gamesPlayed === 0) return;

    setIsSettling(true);
    try {
      console.log('[KenoPage] Settling session on exit...');
      const result = await kenoApi.settleSession();
      console.log('[KenoPage] Session settled:', result);
      await refreshBalance();
    } catch (err) {
      console.error('[KenoPage] Error settling session:', err);
    } finally {
      setIsSettling(false);
    }
  }, [isConnected, sessionData, refreshBalance]);

  // Ref to hold latest settleSession without re-triggering the unmount effect
  const settleSessionRef = useRef(settleSession);
  useEffect(() => { settleSessionRef.current = settleSession; }, [settleSession]);

  // Liquidar al desmontar componente (navegacion interna) — runs ONLY on true unmount
  // Sessions are also auto-settled by server-side cron after 24h of inactivity.
  useEffect(() => {
    return () => {
      settleSessionRef.current();
    };
  }, []);

  // Confirmar y jugar
  const handlePlayClick = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmPlay = useCallback(() => {
    setShowConfirm(false);
    playKeno();
  }, [playKeno]);

  const handleCancelPlay = useCallback(() => {
    setShowConfirm(false);
  }, []);

  // Determinar números para mostrar en el grid
  const drawnNumbers = currentResult?.drawnNumbers || [];
  const matchedNumbers = currentResult?.matchedNumbers || [];

  // ¿Está jugando? (deshabilitar grid)
  const isPlaying = gameState === STATES.TX_PENDING || gameState === STATES.WAITING_VRF;

  // Balance formateado para mostrar
  const formattedDisplayBalance = `$${displayBalance.toFixed(2)} USDT`;

  return (
    <div className="keno-page">
      {/* Modal de confirmacion */}
      <BetConfirmModal
        show={showConfirm}
        spots={spots}
        betAmount={config.BET_AMOUNT || 1}
        maxPotentialPayout={maxPotentialPayout}
        selectedNumbers={selectedNumbers}
        onConfirm={handleConfirmPlay}
        onCancel={handleCancelPlay}
      />

      <MainNav />

      {/* Header */}
      <header className="keno-header">
        <div className="keno-header-content">
          <div className="header-left">
            <h1>
              Keno
              {isOnChain && <span className="chain-badge on-chain">{t('keno.on_chain')}</span>}
              {!isOnChain && <span className="chain-badge off-chain">{t('keno.off_chain')}</span>}
            </h1>
            <p className="keno-subtitle">{t('keno.subtitle')}</p>
          </div>
          {isConnected && (
            <div className="header-balance">
              <span className="balance-label">Balance:</span>
              <span className="balance-value">{formattedDisplayBalance}</span>
              {isUsingDirectBalance && (
                <span className="balance-source">{t('keno.balance_source', { network: directBalance.networkName })}</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Banner: Modo sin backend */}
      {isConnected && isUsingDirectBalance && (
        <div className="offline-banner">
          <span className="offline-icon">i</span>
          <span className="offline-text">
            {t('keno.offline_banner', { network: directBalance.networkName })}
          </span>
        </div>
      )}

      {/* Contenido principal */}
      <main className="keno-main">
        {!isConnected ? (
          // Prompt de conexión
          <div className="connect-prompt">
            <h3>{t('keno.connect_prompt.title')}</h3>
            <p>{t('keno.connect_prompt.description')}</p>
            <ConnectWallet />
          </div>
        ) : (
          // Contenido del juego
          <div className="keno-content">
            {/* Columna izquierda: Grid + Bet Panel */}
            <div className="keno-left-column">
              {/* Grid de números */}
              <section className="keno-grid-section">
                <div className="section-header">
                  <h2>{t('keno.select_numbers')}</h2>
                  <span className="selection-counter">
                    {t('keno.selected_counter', { count: spots, max: config.MAX_SPOTS })}
                  </span>
                </div>

                <KenoNumberGrid
                  selectedNumbers={selectedNumbers}
                  drawnNumbers={drawnNumbers}
                  matchedNumbers={matchedNumbers}
                  onToggle={toggleNumber}
                  disabled={isPlaying}
                  maxSpots={config.MAX_SPOTS}
                  onMaxReached={() => showInfo(t('keno.max_numbers_warning', { max: config.MAX_SPOTS }))}
                />

                {/* Barra de acciones del grid */}
                <div className="grid-actions">
                  <Button
                    variant="primary"
                    onClick={() => quickPick(5)}
                    disabled={isPlaying}
                    className="random-btn"
                  >
                    {t('keno.actions.random', { count: 5 })}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => quickPick(10)}
                    disabled={isPlaying}
                    className="random-btn"
                  >
                    {t('keno.actions.random', { count: 10 })}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearSelection}
                    disabled={isPlaying || spots === 0}
                    className="clear-btn"
                  >
                    {t('keno.actions.clear')}
                  </Button>
                </div>
              </section>

              {/* Loss limits info */}
              <LossLimitsBar lossLimits={lossLimits} />

              {/* Panel de apuesta */}
              <KenoBetPanel
                spots={spots}
                maxSpots={config.MAX_SPOTS}
                betAmount={betAmount}
                balance={displayBalance}
                maxPotentialPayout={maxPotentialPayout}
                maxPayoutInfo={maxPayoutInfo}
                canPlay={canPlay}
                disabledReason={disabledReason}
                isLoading={isLoading}
                gameState={gameState}
                config={config}
                onBetChange={updateBetAmount}
                onPlay={handlePlayClick}
                onQuickPick={quickPick}
                onClear={clearSelection}
              />
            </div>

            {/* Columna derecha: Resultado + Historial + Info */}
            <div className="keno-right-column">
              {/* Error panel */}
              <KenoErrorPanel
                error={gameError}
                onRetry={handlePlayClick}
                onClear={clearSelection}
              />

              {/* Panel de resultado */}
              <KenoResultPanel
                result={currentResult}
                gameState={gameState}
                requestId={requestId}
                STATES={STATES}
              />

              {/* Pending bet recovery banner */}
              <PendingBetBanner
                pendingBets={pendingBets}
                onCancel={cancelStaleBet}
                isLoading={isLoading}
              />

              {/* Tabla de pagos */}
              <KenoPayoutTable
                spots={spots}
                payoutTable={payoutTable}
                poolTrend={poolTrend}
              />

              {/* Info del Pool (Cap Dinamico) */}
              <PoolStatusBanner poolInfo={poolInfo} poolTrend={poolTrend} />

              {/* Historial */}
              <KenoHistoryPanel
                history={gameHistory}
                onClear={clearHistory}
              />

              {/* Instrucciones */}
              <KenoInstructions poolInfo={poolInfo} />

              {/* MVP: Banners de juegos proximos */}
              <ComingSoonBanners />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default KenoPage;
