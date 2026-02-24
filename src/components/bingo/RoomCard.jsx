/**
 * RoomCard — Individual room card for the Bingo Lobby
 *
 * Shows: room name, phase badge, countdown, players, pot, estimated prizes, CTA button.
 * Color-coded per room with glow animation during buying phase.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

const ROOM_CONFIG = {
  1: { name: 'La Purpura', color: '#8b5cf6', emoji: '' },
  2: { name: 'La Esmeralda', color: '#10b981', emoji: '' },
  3: { name: 'La Royal', color: '#3b82f6', emoji: '' },
  4: { name: 'La Dorada', color: '#f59e0b', emoji: '' },
};

// Phase labels moved to translation function inside component

function formatCountdown(seconds) {
  if (!seconds || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Estimate prizes from revenue and basis points config
 */
function estimatePrizes(room) {
  const revenue = room.totalRevenue || (room.totalCards || 0) * (room.cardPrice || 1);
  const feeBps = room.feeBps || 1000;
  const reserveBps = room.reserveBps || 1000;
  const linePrizeBps = room.linePrizeBps || 1500;
  const bingoPrizeBps = room.bingoPrizeBps || 8500;

  const winnerPot = revenue * (10000 - feeBps - reserveBps) / 10000;
  const linePrize = (winnerPot * linePrizeBps) / 10000;
  const bingoPrize = (winnerPot * bingoPrizeBps) / 10000;
  return { revenue, winnerPot, linePrize, bingoPrize };
}

function RoomCard({ room, onSelect, hasMyCards, myCardCount }) {
  const { t } = useTranslation('games');
  const config = ROOM_CONFIG[room.roomNumber] || ROOM_CONFIG[1];
  const phase = room.phase || 'waiting';
  const PHASE_LABELS = {
    buying: t('bingo.room_card.phase_buying'),
    drawing: t('bingo.room_card.phase_drawing'),
    results: t('bingo.room_card.phase_results'),
    waiting: t('bingo.room_card.phase_waiting'),
    starting: t('bingo.room_card.phase_starting'),
    error: t('bingo.room_card.phase_error'),
  };
  const isBuying = phase === 'buying';
  const isDrawing = phase === 'drawing';
  const isResults = phase === 'results';
  const canPlay = isBuying && room.countdown > 0;

  const { linePrize, bingoPrize } = estimatePrizes(room);

  const handleClick = () => {
    if (onSelect) onSelect(room.roomNumber);
  };

  return (
    <div
      className={`room-card room-${room.roomNumber} ${isBuying ? 'phase-buying' : ''} ${isDrawing ? 'phase-drawing' : ''} ${isResults ? 'phase-results' : ''}`}
      style={{ '--room-color': config.color }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="room-card-header">
        <span className="room-name">{t('bingo.room_card.room_name', { number: room.roomNumber, name: config.name })}</span>
        <div className="room-badges">
          {hasMyCards && (
            <span className="my-cards-badge">{t('bingo.room_card.cards_badge', { count: myCardCount })}</span>
          )}
          <span className={`room-phase-badge phase-${phase}`}>
            {PHASE_LABELS[phase] || phase.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Countdown */}
      <div className="room-countdown">
        <span className="countdown-label">
          {isBuying ? t('bingo.room_card.closes_in') : isDrawing ? t('bingo.room_card.resolving') : isResults ? t('bingo.room_card.next_in') : t('bingo.room_card.opens_in')}
        </span>
        <span className={`countdown-value ${isBuying ? 'countdown-active' : ''}`}>
          {formatCountdown(room.countdown)}
        </span>
      </div>

      {/* Stats */}
      <div className="room-stats">
        <div className="room-stat">
          <span className="stat-value">{room.playerCount || 0}</span>
          <span className="stat-label">{t('bingo.room_card.players')}</span>
        </div>
        <div className="room-stat">
          <span className="stat-value">{room.totalCards || 0}</span>
          <span className="stat-label">{t('bingo.room_card.cards')}</span>
        </div>
        <div className="room-stat">
          <span className="stat-value">${room.cardPrice || 1}</span>
          <span className="stat-label">{t('bingo.room_card.price')}</span>
        </div>
      </div>

      {/* Prize breakdown */}
      <div className="room-prizes">
        <div className="room-prize-item">
          <span className="prize-label">{t('bingo.room_card.line')}</span>
          <span className="prize-value prize-line">${linePrize.toFixed(2)}</span>
        </div>
        <div className="room-prize-item">
          <span className="prize-label">{t('bingo.room_card.bingo')}</span>
          <span className="prize-value prize-bingo">${bingoPrize.toFixed(2)}</span>
        </div>
        <div className="room-prize-item">
          <span className="prize-label">{t('bingo.jackpot_label')}</span>
          <span className="prize-value prize-jackpot">${parseFloat(room.jackpot || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        className={`room-cta ${canPlay ? 'cta-play' : isDrawing ? 'cta-watch' : 'cta-disabled'}`}
        onClick={(e) => { e.stopPropagation(); handleClick(); }}
      >
        {canPlay ? t('bingo.room_card.play_now') : isDrawing ? t('bingo.room_card.watch_draw') : isResults ? t('bingo.room_card.view_results') : t('bingo.room_card.next_round')}
      </button>
    </div>
  );
}

export default RoomCard;
