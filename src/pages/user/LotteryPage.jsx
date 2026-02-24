import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { useToast } from '../../contexts/ToastContext';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet } from '../../components/web3';
import { formatDateTime } from '../../utils/formatters';
import './LotteryPage.css';

// Constants matching backend LOTTERY_RULES
const MAX_BETS_PER_TICKET = 8;
const MAIN_NUMBERS_COUNT = 6;
const MAIN_NUMBERS_MAX = 49;
const KEY_NUMBER_MAX = 9;
const TICKET_PRICE = 1; // $1 USDT per bet

// Crypto-safe random number generation
function secureRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

function LotteryPage() {
  const { t } = useTranslation('games');
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
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Ticket state
  const [ticketBets, setTicketBets] = useState([]);

  // Current bet being edited
  const [currentBet, setCurrentBet] = useState({
    numbers: [],
    keyNumber: null
  });

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Purchase receipt
  const [ticketReceipt, setTicketReceipt] = useState(null);

  // Countdown
  const [countdown, setCountdown] = useState('');
  const countdownRef = useRef(null);

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

  // Countdown timer
  useEffect(() => {
    const getNextDrawTime = () => {
      const now = new Date();
      const day = now.getUTCDay();
      let nextDraw = new Date(now);
      nextDraw.setUTCHours(21, 0, 0, 0);

      if (day === 3 && now < nextDraw) {
        // Wednesday before 21:00 UTC
      } else if (day === 6 && now < nextDraw) {
        // Saturday before 21:00 UTC
      } else if (day < 3) {
        nextDraw.setUTCDate(now.getUTCDate() + (3 - day));
      } else if (day === 3) {
        // Wednesday after 21:00 → next Saturday
        nextDraw.setUTCDate(now.getUTCDate() + 3);
      } else if (day < 6) {
        nextDraw.setUTCDate(now.getUTCDate() + (6 - day));
      } else if (day === 6) {
        // Saturday after 21:00 → next Wednesday
        nextDraw.setUTCDate(now.getUTCDate() + 4);
      } else {
        // Sunday → next Wednesday
        nextDraw.setUTCDate(now.getUTCDate() + (3 + 7 - day));
      }

      return nextDraw;
    };

    const updateCountdown = () => {
      const nextDraw = getNextDrawTime();
      const now = new Date();
      const diff = nextDraw - now;

      if (diff <= 0) {
        setCountdown('--:--:--');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const pad = (n) => String(n).padStart(2, '0');

      if (days > 0) {
        setCountdown(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

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

  // Crypto-safe Quick Pick
  const generateQuickPick = () => {
    const nums = [];
    while (nums.length < MAIN_NUMBERS_COUNT) {
      const num = secureRandomInt(MAIN_NUMBERS_MAX) + 1;
      if (!nums.includes(num)) nums.push(num);
    }
    setCurrentBet({
      numbers: nums.sort((a, b) => a - b),
      keyNumber: secureRandomInt(KEY_NUMBER_MAX + 1)
    });
  };

  // Clear current bet
  const clearCurrentBet = () => {
    setCurrentBet({ numbers: [], keyNumber: null });
  };

  // Add current bet to ticket
  const addBetToTicket = () => {
    if (currentBet.numbers.length !== MAIN_NUMBERS_COUNT) {
      showError(t('lottery.choose_6_numbers'));
      return;
    }
    if (currentBet.keyNumber === null) {
      showError(t('lottery.select_key'));
      return;
    }
    if (ticketBets.length >= MAX_BETS_PER_TICKET) {
      showError(t('lottery.max_bets_hint', { max: MAX_BETS_PER_TICKET }));
      return;
    }

    // Check for duplicate bet
    const isDuplicate = ticketBets.some(bet =>
      JSON.stringify(bet.numbers) === JSON.stringify(currentBet.numbers) &&
      bet.keyNumber === currentBet.keyNumber
    );

    if (isDuplicate) {
      showError(t('lottery.duplicate_bet'));
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

  // Show confirmation before purchase
  const handleBuyClick = () => {
    if (!selectedDraw) {
      showError(t('lottery.select_draw'));
      return;
    }
    if (ticketBets.length === 0) {
      showError(t('lottery.empty_ticket'));
      return;
    }

    // Check balance
    const totalCostValue = ticketBets.length * TICKET_PRICE;
    const userBalance = parseFloat(balance) || 0;
    if (userBalance < totalCostValue) {
      showError(t('lottery.insufficient_balance'));
      return;
    }

    setShowConfirmModal(true);
  };

  // Confirm purchase
  const handleConfirmPurchase = async () => {
    setShowConfirmModal(false);
    setIsPurchasing(true);

    try {
      let successCount = 0;
      let lastError = null;

      for (const bet of ticketBets) {
        try {
          const success = await buyLotteryTicket(
            selectedDraw.id,
            bet.numbers,
            bet.keyNumber
          );
          if (success) successCount++;
        } catch (err) {
          lastError = err;
          console.error('Error buying ticket:', err);
        }
      }

      if (successCount > 0) {
        const receipt = {
          draw: selectedDraw,
          betsCount: successCount,
          totalCost: successCount * TICKET_PRICE,
          timestamp: new Date().toISOString(),
          bets: ticketBets.slice(0, successCount)
        };

        setTicketReceipt(receipt);
        showSuccess(t('lottery.ticket_purchased_count', { count: successCount }));
        setTicketBets([]);
        loadData();
      }

      if (lastError && successCount < ticketBets.length) {
        showError(t('lottery.partial_purchase', {
          success: successCount,
          total: ticketBets.length
        }));
      }
    } catch (err) {
      showError(t('lottery.buy_error'));
      console.error(err);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Calculate total cost
  const totalCost = ticketBets.length * TICKET_PRICE;

  // Get formatted next draw date
  const getNextDrawDate = () => {
    const now = new Date();
    const day = now.getUTCDay();
    let nextDraw = new Date(now);
    nextDraw.setUTCHours(21, 0, 0, 0);

    if (day === 3 && now < nextDraw) {
      // Wednesday before 21:00 UTC
    } else if (day === 6 && now < nextDraw) {
      // Saturday before 21:00 UTC
    } else if (day < 3) {
      nextDraw.setUTCDate(now.getUTCDate() + (3 - day));
    } else if (day === 3) {
      nextDraw.setUTCDate(now.getUTCDate() + 3);
    } else if (day < 6) {
      nextDraw.setUTCDate(now.getUTCDate() + (6 - day));
    } else if (day === 6) {
      nextDraw.setUTCDate(now.getUTCDate() + 4);
    } else {
      nextDraw.setUTCDate(now.getUTCDate() + (3 + 7 - day));
    }

    return nextDraw.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'
    }) + ' UTC';
  };

  return (
    <div className="lottery-page">
      <MainNav />

      <main className="lottery-main">
        {/* Jackpot Banner */}
        <div className="jackpot-banner">
          <div className="jackpot-content">
            <span className="jackpot-label">{t('lottery.jackpot_banner')}</span>
            <span className="jackpot-amount">
              ${jackpotInfo ? parseFloat(jackpotInfo.jackpot).toLocaleString() : '---'} USDT
            </span>
            <span className="jackpot-next">
              {t('lottery.next_draw', { date: getNextDrawDate() })}
            </span>
            {countdown && (
              <span className="jackpot-countdown">{countdown}</span>
            )}
          </div>
        </div>

        {/* Schedule info - no dangerouslySetInnerHTML */}
        <div className="schedule-info">
          <div className="schedule-item">
            <span className="schedule-icon">📅</span>
            <Trans i18nKey="lottery.schedule_draws" ns="games"
              components={{ 1: <strong /> }}
            />
          </div>
          <div className="schedule-item">
            <span className="schedule-icon">⏰</span>
            <Trans i18nKey="lottery.schedule_close" ns="games"
              components={{ 1: <strong /> }}
            />
          </div>
        </div>

        {!isConnected ? (
          <div className="connect-prompt">
            <h3>{t('lottery.connect_title')}</h3>
            <p>{t('lottery.connect_prompt')}</p>
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
                <span className="label">{t('lottery.balance')}</span>
                <span className="amount">${parseFloat(balance).toFixed(2)} USDT</span>
              </div>

              {/* Draw selector */}
              {draws.length > 0 && (
                <div className="form-group">
                  <label>{t('lottery.draw')}</label>
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
                <label>
                  {t('lottery.choose_6_numbers')}
                  <span className="selection-count">
                    ({currentBet.numbers.length}/{MAIN_NUMBERS_COUNT})
                  </span>
                </label>
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
                <label>{t('lottery.key_number')}</label>
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
                  {t('lottery.random')}
                </Button>
                <Button variant="secondary" size="sm" onClick={clearCurrentBet}>
                  {t('lottery.clear')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={addBetToTicket}
                  disabled={currentBet.numbers.length !== MAIN_NUMBERS_COUNT || currentBet.keyNumber === null || ticketBets.length >= MAX_BETS_PER_TICKET}
                >
                  {t('lottery.add_to_ticket', { count: ticketBets.length, max: MAX_BETS_PER_TICKET })}
                </Button>
              </div>
            </div>

            {/* Right Panel - Ticket and Info */}
            <div className="lottery-info-section">
              {/* Current Ticket */}
              <div className="ticket-card">
                <div className="ticket-header">
                  <h3>{t('lottery.your_ticket')}</h3>
                  {ticketBets.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearTicket}>
                      {t('lottery.empty')}
                    </Button>
                  )}
                </div>

                {ticketBets.length === 0 ? (
                  <div className="ticket-empty">
                    <p>{t('lottery.empty_ticket')}</p>
                    <p className="hint">{t('lottery.max_bets_hint', { max: MAX_BETS_PER_TICKET })}</p>
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
                          aria-label="Remove"
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
                    onClick={handleBuyClick}
                    loading={isLoading || isPurchasing}
                    disabled={ticketBets.length === 0 || isPurchasing}
                    fullWidth
                  >
                    {t('lottery.buy_ticket')} (${totalCost})
                  </Button>
                </div>
              </div>

              {/* Ticket Receipt */}
              {ticketReceipt && (
                <div className="ticket-receipt">
                  <div className="receipt-header">
                    <span className="receipt-icon">✓</span>
                    <h4>{t('lottery.ticket_purchased')}</h4>
                  </div>
                  <div className="receipt-body">
                    <p className="receipt-draw">
                      {t('lottery.draw')}: {ticketReceipt.draw.drawName}
                    </p>
                    <p className="receipt-bets">
                      {t('lottery.bets_count', { count: ticketReceipt.betsCount, cost: ticketReceipt.totalCost })}
                    </p>
                    <div className="receipt-numbers">
                      {ticketReceipt.bets.map((bet, i) => (
                        <div key={i} className="receipt-bet-line">
                          <span className="receipt-bet-index">#{i + 1}</span>
                          {bet.numbers.join(', ')} + {bet.keyNumber}
                        </div>
                      ))}
                    </div>
                    <p className="receipt-date">
                      {new Date(ticketReceipt.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTicketReceipt(null)}
                  >
                    {t('lottery.close')}
                  </Button>
                </div>
              )}

              {/* Prize Categories - 5 categories matching backend constants */}
              <div className="info-card prizes-card">
                <h3>{t('lottery.prize_table')}</h3>
                <div className="prizes-table">
                  <div className="prize-row jackpot">
                    <span className="prize-category">{t('lottery.cat1')}</span>
                    <span className="prize-amount">{t('lottery.jackpot')}</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">{t('lottery.cat2')}</span>
                    <span className="prize-amount">{t('lottery.pool_percent', { percent: 40 })}</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">{t('lottery.cat3')}</span>
                    <span className="prize-amount">{t('lottery.pool_percent', { percent: 5 })}</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">{t('lottery.cat4')}</span>
                    <span className="prize-amount">{t('lottery.pool_percent', { percent: 3 })}</span>
                  </div>
                  <div className="prize-row">
                    <span className="prize-category">{t('lottery.cat5')}</span>
                    <span className="prize-amount">{t('lottery.pool_percent', { percent: 6 })}</span>
                  </div>
                </div>
              </div>

              {/* How to Play */}
              <div className="info-card">
                <h3>{t('lottery.how_to_play')}</h3>
                <ol className="how-to-play">
                  <li>{t('lottery.step1')}</li>
                  <li>{t('lottery.step2')}</li>
                  <li>{t('lottery.step3')}</li>
                  <li>{t('lottery.step4')}</li>
                  <li>{t('lottery.step5')}</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('lottery.confirm_title')}</h3>
            <div className="confirm-summary">
              <p className="confirm-draw">
                {t('lottery.draw')}: {selectedDraw?.drawName}
              </p>
              <div className="confirm-bets">
                {ticketBets.map((bet, i) => (
                  <div key={i} className="confirm-bet-row">
                    <span>#{i + 1}:</span>
                    <span>{bet.numbers.join(', ')} + {bet.keyNumber}</span>
                  </div>
                ))}
              </div>
              <div className="confirm-total">
                <span>{t('lottery.total_cost')}:</span>
                <span className="confirm-amount">${totalCost.toFixed(2)} USDT</span>
              </div>
            </div>
            <div className="confirm-actions">
              <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                {t('lottery.cancel')}
              </Button>
              <Button onClick={handleConfirmPurchase} loading={isPurchasing}>
                {t('lottery.confirm_buy')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LotteryPage;
