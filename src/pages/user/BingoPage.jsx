/**
 * Bingo Page — Lobby/Room Router
 *
 * Shows the 4-room lobby by default. When user selects a room,
 * shows the BingoRoom game view for that room.
 */

import React, { useState } from 'react';
import { MainNav } from '../../components/layout';
import Footer from '../../components/layout/Footer';
import BingoLobby from '../../components/bingo/BingoLobby';
import BingoRoom from '../../components/bingo/BingoRoom';
import './BingoPage.css';

function BingoPage() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [initialRoundId, setInitialRoundId] = useState(null);

  const handleSelectRoom = (roomNumber, roundId = null) => {
    setSelectedRoom(roomNumber);
    setInitialRoundId(roundId);
  };

  if (selectedRoom) {
    return (
      <div className="bingo-page">
        <MainNav />
        <BingoRoom
          roomNumber={selectedRoom}
          initialRoundId={initialRoundId}
          onBack={() => { setSelectedRoom(null); setInitialRoundId(null); }}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="bingo-page">
      <MainNav />
      <BingoLobby onSelectRoom={handleSelectRoom} />
      <Footer />
    </div>
  );
}

export default BingoPage;
