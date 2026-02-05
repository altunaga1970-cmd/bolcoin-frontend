import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { useToast } from '../../contexts/ToastContext';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet } from '../../components/web3';
import { formatDateTime } from '../../utils/formatters';
import './LotteryPage.css';

// Maximum bets per ticket
const MAX_BETS_PER_TICKET = 8;
const MAIN_NUMBERS_COUNT = 6;
const MAIN_NUMBERS_MAX = 49;
const KEY_NUMBER_MAX = 9;

function LotteryPage() {
  const { isConnected } = useWeb3();
  const {
    getContractBalance,
    getJackpotInfo,
    getOpenLotteryDraws,
    buyLotteryTicket,
    isLoading
  } = useContract();
  const { error: showError, success: showSuccess } = useToast();

  const [balance, setBalance] = useState('0');
  const [jackpotInfo, setJackpotInfo] = useState(null);
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Ticket state - array of bets (each bet has 6 numbers + 1 key)
  const [ticketBets, setTicketBets] = useState([]);

  // Current bet being edited
  const [currentBet, setCurrentBet] = useState({
    numbers: [],
    keyNumber: null
  });

  // Generated ticket receipt
  const [ticketReceipt, setTicketReceipt] = useState(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingData(true);
    try {
      const [bal, jpInfo, openDraws] = await Promise.all([
        getContractBalance(),
        getJackpotInfo(),
        getOpenLotteryDraws()
      ]);

      setBalance(bal);
      setJackpotInfo(jpInfo);
      setDraws(openDraws);

      if (openDraws.length > 0 && !selectedDraw) {
        setSelectedDraw(openDraws[0]);
      }
    } catch (err) {
      console.error('Error loading lottery data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [isConnected, getContractBalance, getJackpotInfo, getOpenLotteryDraws, selectedDraw]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle main number selection
  const toggleNumber = (num) => {
    if (currentBet.numbers.includes(num)) {
      setCurrentBet({
        ...currentBet,
        numbers: currentBet.numbers.filter(n => n !== num)
      });
    } else if (currentBet.numbers.length < MAIN_NUMBERS_COUNT) {
      setCurrentBet({
        ...currentBet,
        numbers: [...currentBet.numbers, num].sort((a, b) => a - b)
      });
    }
  };

  // Set key number
  const selectKeyNumber = (num) => {
    setCurrentBet({
      ...currentBet,
      keyNumber: num
    });
  };

  // Generate random numbers for current bet
  const generateQuickPick = () => {
    const nums = [];
    while (nums.length < MAIN_NUMBERS_COUNT) {
      const num = Math.floor(Math.random() * MAIN_NUMBERS_MAX) + 1;
      if (!nums.includes(num)) nums.push(num);
    }
    setCurrentBet({
      numbers: nums.sort((a, b) => a - b),
      keyNumber: Math.floor(Math.random() * (KEY_NUMBER_MAX + 1))
    });
  };

  // Clear current bet
  const clearCurrentBet = () => {
    setCurrentBet({ numbers: [], keyNumber: null });
  };

  // Add current bet to ticket
  const addBetToTicket = () => {
    if (currentBet.numbers.length !== MAIN_NUMBERS_COUNT) {
      showError(`Selecciona ${MAIN_NUMBERS_COUNT} numeros`);
      return;
    }
    if (currentBet.keyNumber === null) {
      showError('Selecciona el numero clave');
      return;
    }
    if (ticketBets.length >= MAX_BETS_PER_TICKET) {
      showError(`Maximo ${MAX_BETS_PER_TICKET} apuestas por boleto`);
      return;
    }

    // Check for duplicate bet
    const isDuplicate = ticketBets.some(bet =>
      JSON.stringify(bet.numbers) === JSON.stringify(currentBet.numbers) &&
      bet.keyNumber === currentBet.keyNumber
    );

    if (isDuplicate) {
      showError('Esta combinacion ya esta en tu boleto');
      return;
    }

    setTicketBets([...ticketBets, { ...currentBet }]);
    clearCurrentBet();
  };

  // Remove bet from ticket
  const removeBetFromTicket = (index) => {
    setTicketBets(ticketBets.filter((_, i) => i !== index));
  };

  // Clear entire ticket
  const clearTicket = () => {
    setTicketBets([]);
    clearCurrentBet();
    setTicketReceipt(null);
  };

  // Buy ticket
  const handleBuyTicket = async () => {
    if (!selectedDraw) {
      showError('Selecciona un sorteo');
      return;
    }
    if (ticketBets.length === 0) {
      showError('Agrega al menos una apuesta a tu boleto');
      return;
    }

    try {
      // Buy all bets in the ticket
      const results = [];
      for (const bet of ticketBets) {
        const success = await buyLotteryTicket(
          selectedDraw.id,
          bet.numbers,
          bet.keyNumber
        );
        results.push({ bet, success });
      }

      const successCount = results.filter(r => r.success).length;

      if (successCount > 0) {
        // Generate receipt
        const receipt = {
          id: `TKT-${Date.now()}`,
          draw: selectedDraw,
          bets: ticketBets,
          totalCost: ticketBets.length * 1, // $1 per bet
          timestamp: new Date().toISOString(),
          txHash: '0x...' // In real implementation, get from contract
        };

        setTicketReceipt(receipt);
        showSuccess(`Boleto comprado con ${successCount} apuesta(s)!`);
        setTicketBets([]);
        loadData();
      }
    } catch (err) {
      showError('Error al comprar el boleto');
      console.error(err);
    }
  };

  // Calculate total cost
  const ticketPrice = 1; // $1 USDT per bet
  const totalCost = ticketBets.length * ticketPrice;

  // Get next draw info
  const getNextDrawInfo = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 3=Wed, 6=Sat

    let nextDraw = new Date(now);
    nextDraw.setHours(21, 0, 0, 0);

    // Find next Wed (3) or Sat (6)
    if (day === 3 && now.getHours() < 21) {
      // It's Wednesday before 21:00
    } else if (day === 6 && now.getHours() < 21) {
      // It's Saturday before 21:00
    } else if (day < 3) {
      // Before Wednesday
      nextDraw.setDate(now.getDate() + (3 - day));
    } else if (day < 6) {
      // Between Wed and Sat
      nextDraw.setDate(now.getDate() + (6 - day));
    } else {
      // After Saturday, go to next Wednesday
      nextDraw.setDate(now.getDate() + (3 + 7 - day));
    }

    return nextDraw;
  };

  return (
    <div className="lottery-page">
      <MainNav />

      <main className="lottery-main">
        {/* Jackpot Banner */}
        <div className="jackpot-banner">
          <div className="jackpot-content">
            <span className="jackpot-label">JACKPOT LA FORTUNA</span>
            <span className="jackpot-amount">
              ${jackpotInfo ? parseFloat(jackpotInfo.jackpot).toLocaleString() : '50,000'} USDT
            </span>
            <span className="jackpot-next">
              Proximo sorteo: {getNextDrawInfo().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Schedule info */}
        <div className="schedule-info">
          <div className="schedule-item">
            <span className="schedule-icon">📅</span>
            <span>Sorteos: <strong>Miercoles y Sabados a las 21:00</strong></span>
          </div>
          <div className="schedule-item">
            <span className="schedule-icon">⏰</span>
            <span>Cierre de apuestas: <strong>15 minutos antes del sorteo</strong></span>
          </div>
        </div>

        {!isConnected ? (
          <div className="connect-prompt">
            <h3>Conecta tu Wallet</h3>
            <p>Necesitas conectar MetaMask para jugar La Fortuna</p>
            <ConnectWallet />
          </div>
        ) : isLoadingData ? (
          <div className="loading-container">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="lottery-layout">
            {/* Left Panel - Number Selection */}
            <div className="lottery-form-section">
              <div className="balance-display-inline">
                <span className="label">Balance:</span>
                <span className="amount">${parseFloat(balance).toFixed(2)} USDT</span>
              </div>

              {/* Draw selector */}
              {draws.length > 0 && (
                <div className="form-group">
                  <label>Sorteo</label>
                  <select
                    className="select-input"
                    value={selectedDraw?.id || ''}
                    onChange={(e) => {
                      const draw = draws.find(d => d.id === parseInt(e.target.value));
                      setSelectedDraw(draw);
                    }}
                  >
                    {draws.map(draw => (
                      <option key={draw.id} value={draw.id}>
                        {draw.drawName} - {formatDateTime(draw.scheduledTime)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Main numbers grid (1-49) */}
              <div className="form-group">
                <label>Elige 6 numeros (1-49)</label>
                <div className="number-grid main-grid">
                  {Array.from({ length: MAIN_NUMBERS_MAX }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      className={`number-btn ${currentBet.numbers.includes(num) ? 'selected' : ''}`}
                      onClick={() => toggleNumber(num)}
                      disabled={!currentBet.numbers.includes(num) && currentBet.numbers.length >= MAIN_NUMBERS_COUNT}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key number grid (0-9) */}
              <div className="form-group">
                <label>Numero Clave (0-9)</label>
                <div className="number-grid key-grid">
                  {Array.from({ length: KEY_NUMBER_MAX + 1 }, (_, i) => i).map(num => (
                    <button
                      key={num}
                      className={`number-btn key-btn ${currentBet.keyNumber === num ? 'selected' : ''}`}
                      onClick={() => selectKeyNumber(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current selection preview */}
              <div className="current-selection">
                <div className="selection-numbers">
                  {[...Array(MAIN_NUMBERS_COUNT)].map((_, i) => (
                    <span
                      key={i}
                      className={`selection-ball ${currentBet.numbers[i] ? 'filled' : 'empty'}`}
                    >
                      {currentBet.numbers[i] || '?'}
                    </span>
                  ))}
                  <span className="selection-divider">+</span>
                  <span className={`selection-ball key ${currentBet.keyNumber !== null ? 'filled' : 'empty'}`}>
                    {currentBet.keyNumber !== null ? currentBet.keyNumber : '?'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="selection-actions">
                <Button variant="secondary" size="sm" onClick={generateQuickPick}>
                  Aleatorio
                </Button>
                <Button variant="secondary" size="sm" onClick={clearCurrentBet}>
                  Limpiar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addBetToTicket}
                  disabled={currentBet.numbers.length !== MAIN_NUMBERS_COUNT || currentBet.keyNumber === null || ticketBets.length >= MAX_BETS_PER_TICKET}
                >
                  Agregar al Boleto ({ticketBets.length}/{MAX_BETS_PER_TICKET})
                </Button>
              </div>
            </div>

            {/* Right Panel - Ticket and Info */}
            <div className="lottery-info-section">
              {/* Current Ticket */}
              <div className="ticket-card">
                <div className="ticket-header">
                  <h3>Tu Boleto</h3>
                  {ticketBets.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearTicket}>
                      Vaciar
                    </Button>
                  )}
                </div>

                {ticketBets.length === 0 ? (
                  <div className="ticket-empty">
                    <p>Agrega apuestas a tu boleto</p>
                    <p className="hint">Maximo {MAX_BETS_PER_TICKET} apuestas por boleto</p>
                  </div>
                ) : (
                  <div className="ticket-bets">
                    {ticketBets.map((bet, index) => (
                      <div key={index} className="ticket-bet-row">
                        <span className="bet-index">#{index + 1}</span>
                        <div className="bet-numbers">
                          {bet.numbers.map(n => (
                            <span key={n} className="mini-ball">{n}</span>
                          ))}
                          <span className="mini-plus">+</span>
                          <span className="mini-ball key">{bet.keyNumber}</span>
                        </div>
                        <button
                          className="remove-bet-btn"
                          onClick={() => removeBetFromTicket(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="ticket-footer">
                  <div className="ticket-total">
                    <span>Total:</span>
                    <span className="total-amount">${totalCost.toFixed(2)} USDT</span>
                  </div>
                  <Button
                    onClick={handleBuyTicket}
                    loading={isLoading}
                    disabled={ticketBets.length === 0}
                    fullWidth
                  >
                    Comprar Boleto
                  </Button>
                </div>
              </div>

              {/* Ticket Receipt (if just purchased) */}
              {ticketReceipt && (
                <div className="ticket-receipt">
                  <div className="receipt-header">
                    <span className="receipt-icon">✓</span>
                    <h4>Boleto Comprado</h4>
                  </div>
                  <div className="receipt-body">
                    <p className="receipt-id">{ticketReceipt.id}</p>
                    <p className="receipt-draw">
                      Sorteo: {ticketReceipt.draw.drawName}
                    </p>
                    <p className="receipt-bets">
                      {ticketReceipt.bets.length} apuesta(s) - ${ticketReceipt.totalCost} USDT
                    </p>
                    <p className="receipt-date">
                      {new Date(ticketReceipt.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTicketReceipt(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              )}

              {/* Prize Categories */}
              <div className="info-card prizes-card">
                <h3>Tabla de Premios</h3>
                <div className="prizes-table">
                  <div className="prize-row jackpot">
                    <span className="prize-category">6 + Clave</span>
                    <span className="prize-amount">JACKPOT</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">6 Numeros</span>
                    <span className="prize-amount">20% del pozo</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">5 + Clave</span>
                    <span className="prize-amount">10% del pozo</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">5 Numeros</span>
                    <span className="prize-amount">8% del pozo</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">4 + Clave</span>
                    <span className="prize-amount">5% del pozo</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">3 + Clave</span>
                    <span className="prize-amount">2% del pozo</span>
                  </div>
                </div>
              </div>

              {/* How to Play */}
              <div className="info-card">
                <h3>Como Jugar</h3>
                <ol className="how-to-play">
                  <li>Elige 6 numeros del 1 al 49</li>
                  <li>Elige 1 numero clave del 0 al 9</li>
                  <li>Agrega hasta 8 apuestas a tu boleto</li>
                  <li>Compra tu boleto ($1 por apuesta)</li>
                  <li>Espera el sorteo (Mie/Sab 21:00)</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LotteryPage;
