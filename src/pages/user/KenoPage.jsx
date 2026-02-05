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

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { useKenoGame } from '../../hooks/useKenoGame';
import { useWeb3 } from '../../contexts/Web3Context';
import { useBalance } from '../../contexts/BalanceContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
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
  maxSpots
}) {
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
      return; // Máximo alcanzado
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
            aria-label={`Número ${num}`}
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
          <span>Seleccionado</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot drawn"></span>
          <span>Sorteado</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot matched"></span>
          <span>Acierto</span>
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
  // MVP: Apuesta fija - no se usa quickAmounts ni selector de monto

  return (
    <div className="keno-bet-panel">
      <div className="bet-panel-header">
        <h3>Tu Apuesta</h3>
        <div className="spots-counter">
          <span className="spots-count">{spots}</span>
          <span className="spots-max">/ {maxSpots}</span>
          <span className="spots-label">números</span>
        </div>
      </div>

      {/* MVP: Monto de apuesta FIJO */}
      <div className="bet-amount-section">
        <div className="fixed-bet-display">
          <span className="fixed-bet-label">Apuesta fija:</span>
          <span className="fixed-bet-value">1 USDT</span>
          <span className="fixed-bet-tag">(MVP)</span>
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
          <span className="potential-label">Ganancia máxima ({spots} números):</span>
          <span className="potential-value">
            ${maxPotentialPayout} USDT
            {maxPayoutInfo?.capped && (
              <span className="payout-capped"> (cap aplicado)</span>
            )}
          </span>
          {maxPayoutInfo?.multiplier > 0 && (
            <span className="potential-multiplier">
              Multiplicador: {maxPayoutInfo.multiplier}x
            </span>
          )}
        </div>
      )}
      {spots === 0 && (
        <div className="potential-win hint">
          <span className="potential-label">Selecciona números para ver ganancia máxima</span>
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
        {isLoading ? 'Procesando...' : 'Jugar Keno'}
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
  // Estado de carga (VRF pendiente)
  if (gameState === STATES.VRF_PENDING) {
    return (
      <div className="keno-result-panel loading">
        <div className="result-loading">
          <Spinner size="lg" />
          <h3>Sorteando...</h3>
          <p>Generando números aleatorios</p>
          {requestId && (
            <p className="request-id">Request ID: {requestId}</p>
          )}
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
        <h3>{isWin ? 'GANASTE!' : 'Sin Premio'}</h3>
        {isWin && (
          <span className="result-payout">${result.payout.toFixed(2)} USDT</span>
        )}
      </div>

      {/* Números sorteados */}
      <div className="drawn-numbers-section">
        <h4>Números Sorteados (20)</h4>
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
          <span>Números jugados:</span>
          <span>{result.spots}</span>
        </div>
        <div className="summary-row">
          <span>Aciertos:</span>
          <span className="hits-value">{result.hits} / {result.spots}</span>
        </div>
        <div className="summary-row">
          <span>Multiplicador:</span>
          <span>{result.multiplier}x</span>
        </div>
        <div className="summary-row">
          <span>Apuesta:</span>
          <span>${result.betAmount.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>Premio:</span>
          <span className={isWin ? 'win-amount' : ''}>${result.payout.toFixed(2)}</span>
        </div>
      </div>

      {/* Request ID */}
      <div className="result-meta">
        <span className="meta-label">Request ID:</span>
        <span className="meta-value">{result.requestId}</span>
      </div>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Historial de Partidas
// =============================================================================

function KenoHistoryPanel({ history, onClear }) {
  if (history.length === 0) {
    return (
      <div className="keno-history-panel empty">
        <h3>Historial</h3>
        <p className="empty-message">No hay partidas recientes</p>
      </div>
    );
  }

  return (
    <div className="keno-history-panel">
      <div className="history-header">
        <h3>Últimas Partidas</h3>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpiar
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
                {game.isWin ? 'GANÓ' : 'PERDIÓ'}
              </span>
            </div>
            <div className="history-details">
              <span className="history-spots">{game.spots} números</span>
              <span className="history-hits">{game.hits} aciertos</span>
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

function KenoPayoutTable({ spots, payoutTable }) {
  if (spots < 1 || spots > 10) {
    return (
      <div className="keno-payout-table">
        <h4>Tabla de Premios</h4>
        <p className="payout-hint">Selecciona números para ver los premios</p>
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
      <h4>Premios ({spots} números)</h4>
      <table>
        <thead>
          <tr>
            <th>Aciertos</th>
            <th>Multiplicador</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(({ hits, mult }) => (
            <tr key={hits}>
              <td>{hits}</td>
              <td className="multiplier">{mult}x</td>
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

function PoolStatusBanner({ poolInfo }) {
  if (!poolInfo) return null;

  const { balance, maxPayoutRatio, currentMaxPayout, absoluteMaxPayout } = poolInfo;
  const percentOfMax = (currentMaxPayout / absoluteMaxPayout) * 100;

  return (
    <div className="pool-status-banner">
      <div className="pool-header">
        <span className="pool-icon">🏦</span>
        <h4>Pool de Premios</h4>
      </div>
      <div className="pool-stats">
        <div className="pool-stat">
          <span className="stat-label">Balance del Pool</span>
          <span className="stat-value">${balance.toLocaleString()} USDT</span>
        </div>
        <div className="pool-stat highlight">
          <span className="stat-label">Pago Maximo Actual</span>
          <span className="stat-value">${currentMaxPayout.toLocaleString()} USDT</span>
        </div>
        <div className="pool-stat">
          <span className="stat-label">Ratio</span>
          <span className="stat-value">{(maxPayoutRatio * 100).toFixed(0)}% del pool</span>
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
          {percentOfMax.toFixed(1)}% del maximo ($10,000)
        </span>
      </div>
      <p className="pool-note">
        El pago maximo aumenta a medida que crece el pool
      </p>
    </div>
  );
}

// =============================================================================
// COMPONENTE: Instrucciones
// =============================================================================

function KenoInstructions({ poolInfo }) {
  const maxPayout = poolInfo?.currentMaxPayout || 50;

  return (
    <div className="keno-instructions">
      <h4>Como Jugar Keno?</h4>
      <ol>
        <li>
          <strong>Selecciona numeros:</strong> Elige de 1 a 10 numeros del tablero (1-80).
        </li>
        <li>
          <strong>Apuesta:</strong> $1 USDT por jugada (fijo en MVP).
        </li>
        <li>
          <strong>Juega:</strong> Se sortean 20 numeros aleatoriamente.
        </li>
        <li>
          <strong>Gana:</strong> Mientras mas aciertos, mayor el multiplicador (max ${maxPayout}).
        </li>
      </ol>
      <p className="instructions-note">
        Los resultados se generan usando Provably Fair (SHA-256) para garantizar
        aleatoriedad comprobable y transparente.
      </p>
    </div>
  );
}

// =============================================================================
// MVP: Banners de juegos proximos
// =============================================================================

function ComingSoonBanners() {
  return (
    <div className="coming-soon-banners">
      <h4>Proximos Juegos</h4>
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
            <h5>La Bolita</h5>
            <p>Juego clasico de numeros</p>
            <span className="coming-badge">Proximamente</span>
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
            <h5>La Fortuna</h5>
            <p>Loteria con jackpot progresivo</p>
            <span className="coming-badge">Proximamente</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PÁGINA PRINCIPAL: KenoPage
// =============================================================================

function KenoPage() {
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
    isLoading,

    // Valores calculados
    spots,
    maxPotentialPayout,
    maxPayoutInfo,
    canPlay,
    disabledReason,

    // Info del pool (cap dinamico)
    poolInfo,

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

  // Liquidar al salir (beforeunload + cleanup)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (sessionData?.hasActiveSession && sessionData?.session?.gamesPlayed > 0 && account) {
        // Liquidar via sendBeacon con wallet como query param
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const settleUrl = `${apiUrl}/keno/session/settle?wallet=${account}`;
        navigator.sendBeacon?.(settleUrl);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Liquidar al desmontar componente (navegación interna)
      settleSession();
    };
  }, [sessionData, settleSession, account]);

  // Determinar números para mostrar en el grid
  const drawnNumbers = currentResult?.drawnNumbers || [];
  const matchedNumbers = currentResult?.matchedNumbers || [];

  // ¿Está jugando? (deshabilitar grid)
  const isPlaying = gameState === STATES.TX_PENDING || gameState === STATES.VRF_PENDING;

  // Balance formateado para mostrar
  const formattedDisplayBalance = `$${displayBalance.toFixed(2)} USDT`;

  return (
    <div className="keno-page">
      <MainNav />

      {/* Header */}
      <header className="keno-header">
        <div className="keno-header-content">
          <div className="header-left">
            <h1>Keno</h1>
            <p className="keno-subtitle">Selecciona hasta 10 números y gana hasta 10,000x</p>
          </div>
          {isConnected && (
            <div className="header-balance">
              <span className="balance-label">Balance:</span>
              <span className="balance-value">{formattedDisplayBalance}</span>
              {isUsingDirectBalance && (
                <span className="balance-source">(wallet - {directBalance.networkName})</span>
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
            Mostrando balance de tu wallet en {directBalance.networkName}.
            El juego requiere conexión al servidor.
          </span>
        </div>
      )}

      {/* Contenido principal */}
      <main className="keno-main">
        {!isConnected ? (
          // Prompt de conexión
          <div className="connect-prompt">
            <h3>Conecta tu Wallet</h3>
            <p>Necesitas conectar tu wallet para jugar Keno</p>
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
                  <h2>Selecciona tus Números</h2>
                  <span className="selection-counter">
                    {spots} / {config.MAX_SPOTS} seleccionados
                  </span>
                </div>

                <KenoNumberGrid
                  selectedNumbers={selectedNumbers}
                  drawnNumbers={drawnNumbers}
                  matchedNumbers={matchedNumbers}
                  onToggle={toggleNumber}
                  disabled={isPlaying}
                  maxSpots={config.MAX_SPOTS}
                />

                {/* Barra de acciones del grid */}
                <div className="grid-actions">
                  <Button
                    variant="primary"
                    onClick={() => quickPick(5)}
                    disabled={isPlaying}
                    className="random-btn"
                  >
                    Aleatorio (5)
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => quickPick(10)}
                    disabled={isPlaying}
                    className="random-btn"
                  >
                    Aleatorio (10)
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={clearSelection}
                    disabled={isPlaying || spots === 0}
                    className="clear-btn"
                  >
                    Limpiar
                  </Button>
                </div>
              </section>

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
                onPlay={playKeno}
                onQuickPick={quickPick}
                onClear={clearSelection}
              />
            </div>

            {/* Columna derecha: Resultado + Historial + Info */}
            <div className="keno-right-column">
              {/* Panel de resultado */}
              <KenoResultPanel
                result={currentResult}
                gameState={gameState}
                requestId={requestId}
                STATES={STATES}
              />

              {/* Tabla de pagos */}
              <KenoPayoutTable
                spots={spots}
                payoutTable={payoutTable}
              />

              {/* Info del Pool (Cap Dinamico) */}
              <PoolStatusBanner poolInfo={poolInfo} />

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
    </div>
  );
}

export default KenoPage;
