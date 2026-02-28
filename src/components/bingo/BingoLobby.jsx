/**
 * BingoLobby — Grid 2x2 of 4 bingo rooms (Codere-style)
 *
 * Dark theme, color-coded rooms, live countdowns, glow animations.
 * Shows badges on rooms where user has active cards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBingoRooms } from '../../hooks/useBingoRooms';
import { useWeb3 } from '../../contexts/Web3Context';
import { Spinner } from '../common';
import RoomCard from './RoomCard';
import bingoApi from '../../api/bingoApi';
import './BingoLobby.css';

function BingoLobby({ onSelectRoom }) {
  const { t } = useTranslation('games');
  const { rooms, isLoading, jackpot, error } = useBingoRooms();
  const { isConnected } = useWeb3();
  const [myRooms, setMyRooms] = useState([]);

  // Fetch user's active rooms
  const fetchMyRooms = useCallback(async () => {
    if (!isConnected) { setMyRooms([]); return; }
    // Skip if auth headers are not available — avoids a 401 spam loop
    if (!localStorage.getItem('walletSignature')) return;
    try {
      const data = await bingoApi.getMyRooms();
      setMyRooms(data || []);
    } catch (err) {
      // Silently fail — user just won't see badges
      console.warn('[BingoLobby] Error fetching my rooms:', err);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchMyRooms();
    const id = setInterval(fetchMyRooms, 5000);
    return () => clearInterval(id);
  }, [fetchMyRooms]);

  // Build a map: roomNumber → { cardCount, roundStatus }
  const myRoomMap = {};
  myRooms.forEach(r => {
    const rn = r.room_number;
    if (!myRoomMap[rn] || r.round_id > myRoomMap[rn].roundId) {
      myRoomMap[rn] = {
        roundId: r.round_id,
        status: r.status,
        cardCount: parseInt(r.card_count) || 0,
      };
    }
  });

  // Rooms where user has active cards (for the "Mis Salas" section)
  const activeUserRooms = rooms.filter(r => myRoomMap[r.roomNumber]);

  if (isLoading && rooms.length === 0) {
    return (
      <div className="bingo-lobby">
        <div className="lobby-loading">
          <Spinner />
          <p>{t('bingo.lobby.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && rooms.length === 0) {
    const isGeoBlocked = error?.status === 403 || error?.data?.code === 'GEO_BLOCKED';
    return (
      <div className="bingo-lobby">
        <div className="lobby-loading">
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>
            {isGeoBlocked
              ? 'El servicio de Bingo no está disponible en tu región.'
              : 'No se pudieron cargar las salas. Verifica tu conexión e intenta de nuevo.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bingo-lobby">
      {/* Lobby Header */}
      <div className="lobby-header">
        <div className="lobby-title-section">
          <h1 className="lobby-title">{t('bingo.title').toUpperCase()}</h1>
          <p className="lobby-subtitle">{t('bingo.lobby.subtitle')}</p>
        </div>
        <div className="lobby-jackpot">
          <span className="jackpot-label">{t('bingo.jackpot_label').toUpperCase()}</span>
          <span className="jackpot-amount">${parseFloat(jackpot || 0).toFixed(2)} USDT</span>
        </div>
      </div>

      {/* User's active rooms banner */}
      {activeUserRooms.length > 0 && (
        <div className="my-rooms-banner">
          <span className="my-rooms-label">{t('bingo.lobby.my_active_rooms')}</span>
          <div className="my-rooms-list">
            {activeUserRooms.map(room => {
              const info = myRoomMap[room.roomNumber];
              const statusLabel = info.status === 'open' ? t('bingo.lobby.status_buying')
                : info.status === 'closed' ? t('bingo.lobby.status_drawing')
                : info.status === 'resolved' ? t('bingo.lobby.status_results')
                : info.status;
              return (
                <button
                  key={room.roomNumber}
                  className="my-room-chip"
                  style={{ '--room-color': room.phase === 'buying' ? undefined : undefined, borderColor: getRoomColor(room.roomNumber) }}
                  onClick={() => onSelectRoom(room.roomNumber, info.roundId)}
                >
                  <span className="chip-dot" style={{ background: getRoomColor(room.roomNumber) }}></span>
                  {t('bingo.lobby.room_label', { number: room.roomNumber })}
                  <span className="chip-info">{t('bingo.lobby.cards_info', { count: info.cardCount, status: statusLabel })}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Room Grid */}
      <div className="lobby-grid">
        {rooms.map(room => (
          <RoomCard
            key={room.roomNumber}
            room={room}
            onSelect={onSelectRoom}
            hasMyCards={!!myRoomMap[room.roomNumber]}
            myCardCount={myRoomMap[room.roomNumber]?.cardCount || 0}
          />
        ))}
        {/* If no rooms yet, show 4 placeholder cards */}
        {rooms.length === 0 && [1, 2, 3, 4].map(n => (
          <div key={n} className="room-card room-placeholder">
            <div className="room-card-header">
              <span className="room-name">{t('bingo.lobby.room_label', { number: n })}</span>
              <span className="room-phase-badge phase-waiting">{t('bingo.lobby.starting')}</span>
            </div>
            <div className="room-countdown">
              <span className="countdown-value">--:--</span>
            </div>
          </div>
        ))}
      </div>

      {/* Info bar */}
      <div className="lobby-info">
        <span>{t('bingo.lobby.info_rounds')}</span>
        <span>{t('bingo.lobby.info_speed')}</span>
        <span>{t('bingo.lobby.info_verifiable')}</span>
      </div>
    </div>
  );
}

function getRoomColor(roomNumber) {
  const colors = { 1: '#8b5cf6', 2: '#10b981', 3: '#3b82f6', 4: '#f59e0b' };
  return colors[roomNumber] || '#8b5cf6';
}

export default BingoLobby;
