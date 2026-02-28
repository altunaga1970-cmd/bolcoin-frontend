/**
 * BingoRoom — Game view within a specific room
 *
 * Layout: Cards on the left, ball draw on the right (side by side).
 * Line/Bingo announcements as overlays.
 * Sound effects with mute toggle.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBingoGame } from '../../hooks/useBingoGame';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button, Spinner } from '../common';
import BingoCard from './BingoCard';
import BallDraw from './BallDraw';
import ResultsPanel from './ResultsPanel';
import './BingoRoom.css';

const ROOM_CONFIG = {
  1: { name: 'La Purpura', color: '#8b5cf6' },
  2: { name: 'La Esmeralda', color: '#10b981' },
  3: { name: 'La Royal', color: '#3b82f6' },
  4: { name: 'La Dorada', color: '#f59e0b' },
};

/**
 * Confetti — Canvas-based falling particles, no external dependencies.
 * Renders as a fixed overlay (pointerEvents: none) for 5 seconds then fades.
 */
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const frameRef  = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#ffd700','#ff6b6b','#4ecdc4','#45b7d1','#a78bfa','#fbbf24','#34d399','#f472b6'];
    const particles = Array.from({ length: 130 }, () => ({
      x:        Math.random() * canvas.width,
      y:        Math.random() * -canvas.height * 0.5,
      w:        Math.random() * 10 + 5,
      h:        Math.random() * 5  + 3,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      vx:       (Math.random() - 0.5) * 2.5,
      vy:       Math.random() * 3 + 2,
      rot:      Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 7,
      opacity:  1,
    }));

    const DURATION = 5500;
    let startTime = null;

    const draw = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x   += p.vx;
        p.y   += p.vy;
        p.rot += p.rotSpeed;
        // gentle swaying
        p.vx  += Math.sin(ts * 0.001 + p.y * 0.01) * 0.05;

        // fade out in last 1.5s
        if (elapsed > DURATION - 1500) {
          p.opacity = Math.max(0, (DURATION - elapsed) / 1500);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle   = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();

        // recycle off-screen particles while animation is still running
        if (p.y > canvas.height + 20 && elapsed < DURATION - 1500) {
          p.y       = Math.random() * -80;
          p.x       = Math.random() * canvas.width;
          p.opacity = 1;
        }
      });

      if (elapsed < DURATION) {
        frameRef.current = requestAnimationFrame(draw);
      }
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 400,
      }}
    />
  );
}

// Simple Web Audio beep generator (no external files needed)
function useGameSounds(soundEnabled) {
  const audioCtxRef = useRef(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch { return null; }
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((freq, duration, type = 'sine') => {
    if (!soundEnabled) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, [soundEnabled, getCtx]);

  const playBall = useCallback(() => playTone(660, 0.12, 'sine'), [playTone]);
  const playMark = useCallback(() => playTone(880, 0.08, 'triangle'), [playTone]);

  const playLine = useCallback(() => {
    if (!soundEnabled) return;
    [0, 100, 200].forEach(delay => {
      setTimeout(() => playTone(1047, 0.2, 'square'), delay);
    });
  }, [soundEnabled, playTone]);

  const playBingo = useCallback(() => {
    if (!soundEnabled) return;
    const notes = [523, 659, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'square'), i * 120);
    });
  }, [soundEnabled, playTone]);

  // Victory fanfare — longer, more celebratory sequence
  const playWin = useCallback(() => {
    if (!soundEnabled) return;
    const fanfare = [
      { f: 523, t: 0,    d: 0.15 },
      { f: 659, t: 150,  d: 0.15 },
      { f: 784, t: 300,  d: 0.15 },
      { f: 1047,t: 450,  d: 0.3  },
      { f: 784, t: 650,  d: 0.15 },
      { f: 1047,t: 800,  d: 0.5  },
      { f: 1319,t: 1050, d: 0.6  },
    ];
    fanfare.forEach(({ f, t, d }) => setTimeout(() => playTone(f, d, 'square'), t));
  }, [soundEnabled, playTone]);

  return { playBall, playMark, playLine, playBingo, playWin };
}

function BingoRoom({ roomNumber, initialRoundId, onBack }) {
  const { t } = useTranslation('games');
  const { isConnected, account } = useWeb3();
  const config = ROOM_CONFIG[roomNumber] || ROOM_CONFIG[1];

  const {
    gameState,
    error,
    isLoading,
    txStep,
    config: gameConfig,
    cardPrice,
    jackpot,
    selectedRound,
    roundDetail,
    cardCount,
    setCardCount,
    myCards,
    buyCards,
    drawnBalls,
    animatedBalls,
    currentBall,
    currentBallIndex,
    progress,
    skipToResults,
    autoMark,
    toggleAutoMark,
    toggleManualMark,
    isMarked,
    checkLine,
    checkBingo,
    hasAnyLine,
    lineAnnounced,
    results,
    resetGame,
    resumeAfterLine,
    finalizeResults,
    soundEnabled,
    toggleSound,
    isOnChain,
    STATES,
  } = useBingoGame(roomNumber, initialRoundId);

  const sounds = useGameSounds(soundEnabled);
  const prevBallIndexRef = useRef(-1);
  const [showConfetti, setShowConfetti] = useState(false);

  // Play sound on new ball
  useEffect(() => {
    if (currentBallIndex > prevBallIndexRef.current && currentBallIndex >= 0) {
      sounds.playBall();
    }
    prevBallIndexRef.current = currentBallIndex;
  }, [currentBallIndex, sounds]);

  // Detect if the current user won line or bingo
  // (declared before any useEffect that references iWon to avoid TDZ)
  const iWon = useMemo(() => {
    if (!results || !account) return false;
    const addr = account.toLowerCase();
    const parse = (w) => {
      if (!w) return [];
      if (Array.isArray(w)) return w.filter(Boolean).map(a => a.toLowerCase());
      if (typeof w === 'string' && w.startsWith('[')) {
        try { return JSON.parse(w).filter(Boolean).map(a => a.toLowerCase()); } catch { return []; }
      }
      return [w.toLowerCase()];
    };
    return parse(results.lineWinner).includes(addr) || parse(results.bingoWinner).includes(addr);
  }, [results, account]);

  // Detect if current user specifically won the LINE prize
  const iWonLine = useMemo(() => {
    if (!results || !account) return false;
    const addr = account.toLowerCase();
    const parse = (w) => {
      if (!w) return [];
      if (Array.isArray(w)) return w.filter(Boolean).map(a => a.toLowerCase());
      if (typeof w === 'string' && w.startsWith('[')) {
        try { return JSON.parse(w).filter(Boolean).map(a => a.toLowerCase()); } catch { return []; }
      }
      return [w.toLowerCase()];
    };
    return parse(results.lineWinner).includes(addr);
  }, [results, account]);

  // Play sound on line/bingo announcements
  useEffect(() => {
    if (gameState === STATES.LINE_ANNOUNCED) sounds.playLine();
    if (gameState === STATES.BINGO_ANNOUNCED) sounds.playBingo();
  }, [gameState, STATES, sounds]);

  // Fire confetti + victory fanfare when user wins at RESOLVED
  useEffect(() => {
    if (gameState !== STATES.RESOLVED || !iWon) return;
    setShowConfetti(true);
    sounds.playWin();
    const off = setTimeout(() => setShowConfetti(false), 6000);
    return () => clearTimeout(off);
  }, [gameState, STATES.RESOLVED, iWon]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = [STATES.DRAWING, STATES.LINE_ANNOUNCED, STATES.BINGO_ANNOUNCED, STATES.RESOLVED].includes(gameState);
  const canBuy = isConnected && selectedRound && gameState === STATES.BROWSING && !isLoading;

  // Purchase confirmation modal state
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBuyClick = () => setShowConfirm(true);
  const handleConfirm = () => { setShowConfirm(false); buyCards(); };
  const handleCancel = () => setShowConfirm(false);

  // Auto-return countdown: only for losers (5s). Winners stay until manual dismiss.
  const AUTO_RETURN_SECONDS = 5;
  const [lobbyCountdown, setLobbyCountdown] = useState(AUTO_RETURN_SECONDS);

  useEffect(() => {
    if (gameState !== STATES.RESOLVED) return;
    if (iWon) return; // Winners stay — no auto-return

    setLobbyCountdown(AUTO_RETURN_SECONDS);
    const ticker = setInterval(() => {
      setLobbyCountdown(prev => {
        if (prev <= 1) {
          clearInterval(ticker);
          if (onBack) onBack();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [gameState, STATES, iWon, onBack]);

  // Countdown to round close
  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    const closeTime = selectedRound?.scheduled_close || selectedRound?.scheduledClose;
    if (!closeTime) { setCountdown(0); return; }
    const update = () => {
      const diff = Math.max(0, Math.floor((new Date(closeTime).getTime() - Date.now()) / 1000));
      setCountdown(diff);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [selectedRound]);

  const countdownStr = `${String(Math.floor(countdown / 60)).padStart(2, '0')}:${String(countdown % 60).padStart(2, '0')}`;

  // Short address helper
  const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

  // Parse winner field (can be single address, JSON array string, or array)
  const parseWinnerList = (winner) => {
    if (!winner) return [];
    if (Array.isArray(winner)) return winner.filter(Boolean);
    if (typeof winner === 'string' && winner.startsWith('[')) {
      try { return JSON.parse(winner).filter(Boolean); } catch { return []; }
    }
    return winner ? [winner] : [];
  };

  const formatWinnerDisplay = (winner) => {
    const list = parseWinnerList(winner);
    if (list.length === 0) return '';
    if (list.length === 1) return shortAddr(list[0]);
    return t('bingo.room.n_winners', { count: list.length });
  };

  // Estimate prizes from round revenue + config
  const prizeInfo = useMemo(() => {
    const round = roundDetail?.round || roundDetail || selectedRound;
    const totalCards = round?.total_cards || round?.totalCards || myCards.length;
    const revenue = parseFloat(round?.total_revenue || round?.totalRevenue || 0) || totalCards * parseFloat(cardPrice);
    const feeBps = gameConfig?.feeBps || 1000;
    const reserveBps = gameConfig?.reserveBps || 1000;
    const linePrizeBps = gameConfig?.linePrizeBps || 1500;
    const bingoPrizeBps = gameConfig?.bingoPrizeBps || 8500;

    const winnerPot = revenue * (10000 - feeBps - reserveBps) / 10000;
    const linePrize = (winnerPot * linePrizeBps) / 10000;
    const bingoPrize = (winnerPot * bingoPrizeBps) / 10000;
    return { totalCards, revenue, linePrize, bingoPrize };
  }, [roundDetail, selectedRound, myCards.length, cardPrice, gameConfig]);

  return (
    <div className="bingo-room" style={{ '--room-color': config.color }}>
      <Confetti active={showConfetti} />

      {/* Room Header */}
      <div className="room-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('bingo.room.back_lobby')}
        </button>
        <div className="room-title-bar">
          <span className="room-indicator" style={{ background: config.color }}></span>
          <h2>{t('bingo.room.room_label', { number: roomNumber })} — {config.name}</h2>
          {[STATES.DRAWING, STATES.LINE_ANNOUNCED, STATES.BINGO_ANNOUNCED].includes(gameState) && (
            <span className="live-badge">
              <span className="live-dot" />
              {t('bingo.room.live_indicator')}
            </span>
          )}
        </div>
        {countdown > 0 && [STATES.BROWSING, STATES.BUYING, STATES.WAITING_CLOSE].includes(gameState) && (
          <div className="room-countdown-mini">
            <span className="cd-label">{t('bingo.room.closes_in')}</span>
            <span className="cd-value">{countdownStr}</span>
          </div>
        )}
        <div className="room-header-right">
          <button className={`sound-toggle ${soundEnabled ? '' : 'muted'}`} onClick={toggleSound} title={soundEnabled ? t('bingo.room.mute') : t('bingo.room.unmute')}>
            {soundEnabled ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.08"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            )}
          </button>
          <div className="room-jackpot-mini">
            <span className="jp-label">{t('bingo.jackpot_label')}</span>
            <span className="jp-value">${jackpot} USDT</span>
          </div>
        </div>
      </div>

      {/* Room Stats Bar */}
      <div className="room-stats-bar">
        <div className="stats-bar-item">
          <span className="sbi-label">{t('bingo.room.stats_cards')}</span>
          <span className="sbi-value">{prizeInfo.totalCards}</span>
        </div>
        <div className="stats-bar-item">
          <span className="sbi-label">{t('bingo.room.stats_collected')}</span>
          <span className="sbi-value">${prizeInfo.revenue.toFixed(2)}</span>
        </div>
        <div className="stats-bar-item stats-bar-line">
          <span className="sbi-label">{t('bingo.room.stats_line_prize')}</span>
          <span className="sbi-value">${prizeInfo.linePrize.toFixed(2)}</span>
        </div>
        <div className="stats-bar-item stats-bar-bingo">
          <span className="sbi-label">{t('bingo.room.stats_bingo_prize')}</span>
          <span className="sbi-value">${prizeInfo.bingoPrize.toFixed(2)}</span>
        </div>
        <div className="stats-bar-item stats-bar-jackpot">
          <span className="sbi-label">{t('bingo.jackpot_label')}</span>
          <span className="sbi-value">${parseFloat(jackpot).toFixed(2)}</span>
        </div>
      </div>

      {/* PURCHASE CONFIRMATION MODAL */}
      {showConfirm && (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-modal-title">{t('bingo.room.confirm_title')}</h3>
            <div className="confirm-modal-room">
              <span className="confirm-room-dot" style={{ background: config.color }}></span>
              {config.name}
            </div>
            <div className="confirm-modal-details">
              <div className="confirm-detail-row">
                <span>{t('bingo.room.confirm_cards', { count: cardCount })}</span>
                <span>{t('bingo.room.confirm_price_each', { price: cardPrice })}</span>
              </div>
              <div className="confirm-detail-row confirm-total-row">
                <span>{t('bingo.room.confirm_total')}</span>
                <span className="confirm-total-value">
                  {t('bingo.room.confirm_total_value', { total: (parseFloat(cardPrice) * cardCount).toFixed(2) })}
                </span>
              </div>
            </div>
            {isOnChain && (
              <p className="confirm-modal-note">
                {t('bingo.room.confirm_onchain_note', 'Tu wallet pedirá confirmar hasta 2 transacciones: autorización de USDT y compra.')}
              </p>
            )}
            <div className="confirm-modal-actions">
              <Button variant="ghost" size="md" onClick={handleCancel} disabled={isLoading} className="confirm-cancel-btn">
                {t('bingo.room.confirm_cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={isLoading}
                className="confirm-pay-btn"
                style={{ background: config.color }}
              >
                {t('bingo.room.confirm_btn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LINE ANNOUNCEMENT OVERLAY */}
      {gameState === STATES.LINE_ANNOUNCED && results && (
        <div className="announcement-overlay line-overlay" onClick={resumeAfterLine}>
          <div className="announcement-card">
            <div className="announcement-icon">{iWonLine ? '🏆' : '🎖️'}</div>
            <h2>{t('bingo.room.line_announced')}</h2>
            {iWonLine ? (
              <>
                <p className="announcement-winner announcement-winner-you">
                  {t('bingo.room.line_winner_you')}
                </p>
                <p className="announcement-prize">
                  ${(parseFloat(results.linePrize) / Math.max(1, parseWinnerList(results.lineWinner).length)).toFixed(2)} USDT
                </p>
              </>
            ) : (
              <>
                <p className="announcement-winner">{formatWinnerDisplay(results.lineWinner)}</p>
                <p className="announcement-prize">${parseFloat(results.linePrize).toFixed(2)} USDT</p>
              </>
            )}
            {(results.lineWinnerBall || results.lineWinnerBallPos) > 0 && (
              <p className="announcement-ball-num">
                {t('bingo.room.line_at_ball', { ball: results.lineWinnerBall || results.lineWinnerBallPos })}
              </p>
            )}
            <p className={`announcement-hint ${iWonLine ? 'announcement-bingo-chance' : ''}`}>
              {t('bingo.room.line_bingo_chance')}
            </p>
          </div>
        </div>
      )}

      {/* BINGO ANNOUNCEMENT OVERLAY */}
      {gameState === STATES.BINGO_ANNOUNCED && results && (
        <div className="announcement-overlay bingo-overlay" onClick={finalizeResults}>
          <div className="announcement-card bingo-card-announce">
            <div className="announcement-icon">&#127881;</div>
            <h2>{t('bingo.room.bingo_announced')}</h2>
            <p className="announcement-winner">{formatWinnerDisplay(results.bingoWinner)}</p>
            <p className="announcement-prize">${parseFloat(results.bingoPrize).toFixed(2)} USDT</p>
            {results.jackpotWon && (
              <p className="announcement-jackpot">+ JACKPOT ${parseFloat(results.jackpotPaid).toFixed(2)} USDT</p>
            )}
            <p className="announcement-hint">{t('bingo.room.tap_results')}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="room-content">
        {!isConnected ? (
          <div className="room-connect-prompt">
            <h3>{t('bingo.connect_prompt.title')}</h3>
            <p>{t('bingo.connect_prompt.description')}</p>
          </div>
        ) : (
          <>
            {/* Purchase panel (browsing, no cards yet) */}
            {selectedRound && gameState === STATES.BROWSING && myCards.length === 0 && (
              <div className="room-purchase-panel">
                <h3>{t('bingo.room.buy_title')}</h3>
                <div className="room-card-selector">
                  {[1, 2, 3, 4].map(n => (
                    <button
                      key={n}
                      className={`room-count-btn ${cardCount === n ? 'active' : ''}`}
                      onClick={() => setCardCount(n)}
                      disabled={isLoading}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="room-purchase-summary">
                  <span>{t('bingo.room.cards_summary', { count: cardCount, price: cardPrice })}</span>
                  <span className="purchase-total">${(parseFloat(cardPrice) * cardCount).toFixed(2)} USDT</span>
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBuyClick}
                  disabled={!canBuy || isLoading}
                  className="room-buy-btn"
                  style={{ width: '100%', background: config.color }}
                >
                  {isLoading
                    ? <><Spinner size="sm" /> {
                        txStep === 'approving' ? t('bingo.room.approving', 'Aprobando USDT…') :
                        txStep === 'buying'    ? t('bingo.room.confirming', `Comprando ${cardCount} carta(s)…`) :
                                                t('bingo.room.buying')
                      }</>
                    : t('bingo.room.buy_button')}
                </Button>
              </div>
            )}

            {/* Game area: cards + ball draw SIDE BY SIDE */}
            {(myCards.length > 0 || isActive) && (
              <div className="room-game-layout">
                {/* Left: User's bingo cards */}
                <div className="room-game-left">
                  {myCards.length > 0 && (
                    <div className="room-cards-grid">
                      {myCards.map(card => (
                        <BingoCard
                          key={card.cardId || card.card_id}
                          card={card}
                          isMarked={isMarked}
                          checkLine={checkLine}
                          checkBingo={checkBingo}
                          hasAnyLine={hasAnyLine}
                          autoMark={autoMark}
                          onToggleMark={toggleManualMark}
                          isDrawing={isActive}
                          roomColor={config.color}
                          lineAnnounced={lineAnnounced}
                          animatedBalls={animatedBalls}
                        />
                      ))}
                    </div>
                  )}

                  {/* Results panel below cards */}
                  {gameState === STATES.RESOLVED && results && (
                    <div className="room-results-section">
                      {/* Win celebration banner */}
                      {iWon && (
                        <div className="win-banner" style={{ '--room-color': config.color }}>
                          <div className="win-banner-icon">{results.bingoWinner && parseWinnerList(results.bingoWinner).map(a => a.toLowerCase()).includes(account?.toLowerCase()) ? '🎉' : '🏆'}</div>
                          <div className="win-banner-text">
                            <strong>
                              {results.bingoWinner && parseWinnerList(results.bingoWinner).map(a => a.toLowerCase()).includes(account?.toLowerCase())
                                ? t('bingo.room.you_won_bingo')
                                : t('bingo.room.you_won_line')}
                            </strong>
                            {(() => {
                              const addr = account?.toLowerCase();
                              const lineWinners = parseWinnerList(results.lineWinner).map(a => a.toLowerCase());
                              const bingoWinners = parseWinnerList(results.bingoWinner).map(a => a.toLowerCase());
                              const myLinePrize = lineWinners.includes(addr) ? parseFloat(results.linePrize) / lineWinners.length : 0;
                              const myBingoPrize = bingoWinners.includes(addr) ? parseFloat(results.bingoPrize) / bingoWinners.length : 0;
                              const total = (myLinePrize + myBingoPrize + (results.jackpotWon && bingoWinners.includes(addr) ? parseFloat(results.jackpotPaid) / bingoWinners.length : 0)).toFixed(2);
                              return <span>{t('bingo.room.you_won_prize', { amount: total })}</span>;
                            })()}
                          </div>
                        </div>
                      )}

                      <ResultsPanel results={results} roomColor={config.color} myCards={myCards} account={isConnected} />

                      <Button
                        variant="primary"
                        size="md"
                        onClick={onBack}
                        style={{ width: '100%', marginTop: '1rem', background: config.color }}
                      >
                        {t('bingo.room.back_to_lobby')}
                      </Button>

                      {/* Countdown for losers */}
                      {!iWon && lobbyCountdown > 0 && (
                        <p className="lobby-countdown-hint">
                          {t('bingo.room.returning_lobby', { seconds: lobbyCountdown })}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Ball draw (compact, always visible during draw) */}
                <div className="room-game-right">
                  {isActive && drawnBalls.length > 0 && (
                    <BallDraw
                      currentBall={currentBall}
                      currentBallIndex={currentBallIndex}
                      drawnBalls={drawnBalls}
                      animatedBalls={animatedBalls}
                      progress={progress}
                      onSkip={skipToResults}
                      autoMark={autoMark}
                      onToggleAutoMark={toggleAutoMark}
                      isDrawing={gameState === STATES.DRAWING}
                      totalBalls={75}
                    />
                  )}

                  {/* VRF wait panel — shown when round has closed and random number is being fetched */}
                  {!isActive && gameState === STATES.WAITING_VRF && (
                    <div className="room-vrf-wait-panel">
                      <Spinner />
                      <strong>{t('bingo.room.vrf_wait_title')}</strong>
                      <p>{t('bingo.room.vrf_wait_desc')}</p>
                    </div>
                  )}

                  {/* Room info when not drawing and not waiting for VRF */}
                  {!isActive && gameState !== STATES.WAITING_VRF && (
                    <div className="room-info-panel">
                      <h4>{t('bingo.room.room_label', { number: roomNumber })}</h4>
                      <div className="info-row"><span>{t('bingo.room.info_card_price')}</span><span>${cardPrice} USDT</span></div>
                      <div className="info-row"><span>{t('bingo.room.info_max_cards')}</span><span>{t('bingo.room.info_max_cards_value')}</span></div>
                      <div className="info-row"><span>{t('bingo.room.info_total_balls')}</span><span>75</span></div>
                      <div className="info-row"><span>{t('bingo.room.info_speed')}</span><span>{t('bingo.room.info_speed_value')}</span></div>
                      <div className="info-row"><span>{t('bingo.room.info_prizes')}</span><span>{t('bingo.room.info_prizes_value')}</span></div>
                      <div className="info-row"><span>{t('bingo.room.info_jackpot_if')}</span><span>{t('bingo.room.info_jackpot_threshold')}</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Waiting states (no cards yet — centered) */}
            {gameState === STATES.WAITING_CLOSE && myCards.length > 0 && !isActive && (
              <div className="room-waiting">
                <Spinner />
                <p>{t('bingo.room.waiting_close')}</p>
              </div>
            )}
            {/* WAITING_VRF with no user cards — centered draw-about-to-start panel */}
            {gameState === STATES.WAITING_VRF && myCards.length === 0 && (
              <div className="room-waiting room-vrf-centered">
                <Spinner />
                <strong>{t('bingo.room.vrf_wait_title')}</strong>
                <p>{t('bingo.room.vrf_wait_desc')}</p>
              </div>
            )}

            {/* Error */}
            {gameState === STATES.ERROR && error && (
              <div className="room-waiting">
                <p style={{ color: '#ef4444' }}>{error}</p>
                <Button variant="ghost" size="sm" onClick={resetGame}>{t('bingo.room.retry')}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BingoRoom;
