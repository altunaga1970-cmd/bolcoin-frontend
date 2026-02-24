// src/pages/user/Web3BettingPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

import { useWeb3 } from '../../contexts/Web3Context';
import { useToast } from '../../contexts/ToastContext';
import { useBalance } from '../../contexts/BalanceContext';
import api from '../../api/index';

import { useBolitaContract } from '../../hooks/useBolitaContract';

import { Button, Input, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet } from '../../components/web3';

import { BOLITA_CONFIG } from '../../utils/prizeCalculations';
import drawApi from '../../api/drawApi';
import betApi from '../../api/betApi';

import '../user/UserPages.css';
import './Web3BettingPage.css';

// Sistema de apuestas con límites progresivos
const MIN_STAKE = 0.01;         // Mínimo 0.01 USDT
const INITIAL_MAX_STAKE = 2.0;  // Máximo inicial por número

// Map frontend bet type IDs to backend game_type values
const BACKEND_GAME_TYPE = {
  'FIJO': 'fijos',
  'CENTENA': 'centenas',
  'PARLE': 'parles'
};

const BET_TYPES = [
  {
    id: 'FIJO',
    label: 'Fijo',
    digits: 2,
    multiplierLabel: '65x',
    multiplierNum: BOLITA_CONFIG.MULTIPLIERS.fijos.multiplier,
    placeholder: '00'
  },
  {
    id: 'CENTENA',
    label: 'Centena',
    digits: 3,
    multiplierLabel: '300x',
    multiplierNum: BOLITA_CONFIG.MULTIPLIERS.centenas.multiplier,
    placeholder: '000'
  },
  {
    id: 'PARLE',
    label: 'Parle',
    digits: 4,
    multiplierLabel: '1000x',
    multiplierNum: BOLITA_CONFIG.MULTIPLIERS.parles.multiplier,
    placeholder: '0000'
  }
];

function Web3BettingPage() {
  const { t } = useTranslation('games');
  const { drawId: paramDrawId } = useParams();

  const { isConnected, account } = useWeb3();
  const { error: showError, success: showSuccess } = useToast();
  const { directBalance, refreshBalance } = useBalance();

  const {
    isOnChain,
    getOpenDraws,
    getResolvedDraws,
    getDrawInfo,
    getTokenBalance,
    getAvailablePool,
    getNumberExposure,
    getMaxExposure,
    getBetLimits,
    placeBetsBatch,
    onDrawResolved,
    onWinningNumberSet,
    bolitaContractAddress,
    BET_TYPE_MAP
  } = useBolitaContract();

  const [balance, setBalance] = useState('0');
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedBetType, setSelectedBetType] = useState(BET_TYPES[0]);

  const [numbers, setNumbers] = useState('');
  const [amount, setAmount] = useState('');

  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sistema de límites y disponibilidad
  const [maxPerNumber, setMaxPerNumber] = useState(INITIAL_MAX_STAKE); // Exposure limit per number
  const [maxBetAmount, setMaxBetAmount] = useState(INITIAL_MAX_STAKE); // Max single bet amount
  const [poolBalance, setPoolBalance] = useState(0);

  // Resultados del sorteo anterior
  const [lastDrawResults, setLastDrawResults] = useState(null);

  // Últimos 3 resultados resueltos
  const [resolvedDraws, setResolvedDraws] = useState([]);

  // Carrito
  const [betCart, setBetCart] = useState([]);

  const loadData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingDraws(true);
    try {
      let openDraws = [];

      // Balance: prioritize real on-chain USDT balance
      const directUsdt = parseFloat(directBalance?.usdt || '0');
      if (directUsdt > 0) {
        setBalance(directUsdt.toFixed(2));
      } else if (isOnChain) {
        const tokenBal = await getTokenBalance();
        setBalance(tokenBal);
      } else {
        // Off-chain fallback: fetch DB balance
        try {
          const resp = await api.get('/wallet/balance-by-address', { params: { address: account } });
          const dbBal = resp.data?.data?.balance || '0';
          setBalance(dbBal);
        } catch {
          setBalance('0');
        }
      }

      if (isOnChain) {
        // On-chain mode: read draws from smart contract
        openDraws = await getOpenDraws();

        // Read all limits from contract in a single call
        const limits = await getBetLimits();
        setPoolBalance(parseFloat(limits.pool));
        setMaxPerNumber(parseFloat(limits.maxPerNumber));
        setMaxBetAmount(parseFloat(limits.max));

        // Load last 3 resolved draws for results banner
        const resolved = await getResolvedDraws(3);
        setResolvedDraws(resolved);
      } else {
        // Off-chain mode: read draws from backend API
        try {
          const data = await drawApi.getActive();
          const apiDraws = (data?.draws || []).map(d => ({
            ...d,
            is_open: d.status === 'open',
          }));
          openDraws = apiDraws;
        } catch (apiErr) {
          console.error('Error loading draws from API:', apiErr);
        }
        setPoolBalance(1000);
        setMaxPerNumber(INITIAL_MAX_STAKE);
        setMaxBetAmount(INITIAL_MAX_STAKE);
      }

      setDraws(openDraws);

      // Select initial draw
      const openDraw = openDraws.find(d => d.is_open) || openDraws[0] || null;

      if (paramDrawId) {
        const found = openDraws.find(d => d.id === parseInt(paramDrawId, 10));
        setSelectedDraw(found || openDraw);
      } else {
        setSelectedDraw(openDraw);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      showError(t('betting.error_loading'));
    } finally {
      setIsLoadingDraws(false);
    }
  }, [isConnected, isOnChain, account, getTokenBalance, getOpenDraws, getResolvedDraws, getBetLimits, paramDrawId, showError, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh draws periodically
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(async () => {
      try {
        let openDraws = [];
        if (isOnChain) {
          openDraws = await getOpenDraws();
        } else {
          const data = await drawApi.getActive();
          openDraws = (data?.draws || []).map(d => ({
            ...d,
            is_open: d.status === 'open',
          }));
        }
        setDraws(openDraws);

        if (selectedDraw) {
          const updated = openDraws.find(d => d.id === selectedDraw.id);
          if (!updated || !updated.is_open) {
            const nextOpen = openDraws.find(d => d.is_open) || openDraws[0] || null;
            setSelectedDraw(nextOpen);
          } else {
            setSelectedDraw(updated);
          }
        } else {
          setSelectedDraw(openDraws.find(d => d.is_open) || openDraws[0] || null);
        }
      } catch (err) {
        console.error('Error refreshing draws:', err);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isConnected, isOnChain, selectedDraw, getOpenDraws]);

  const handleNumbersChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= selectedBetType.digits) setNumbers(value);
  };

  const calculateCartTotal = () => betCart.reduce((t, b) => t + b.amount, 0);

  const potentialWin = () => {
    const betAmount = parseFloat(amount) || 0;
    return betAmount * selectedBetType.multiplierNum;
  };

  const addBetToCart = async () => {
    if (!selectedDraw) {
      showError(t('betting.error_select_draw'));
      return;
    }

    if (numbers.length !== selectedBetType.digits) {
      showError(t('betting.error_digits', { digits: selectedBetType.digits }));
      return;
    }

    const betAmount = parseFloat(amount);
    if (!betAmount || betAmount <= 0) {
      showError(t('betting.error_invalid_amount'));
      return;
    }

    if (betAmount < MIN_STAKE) {
      showError(t('betting.error_min_amount', { min: MIN_STAKE }));
      return;
    }

    // Check on-chain exposure for this number
    if (isOnChain) {
      try {
        const betNumber = parseInt(numbers, 10);
        const exposure = parseFloat(await getNumberExposure(selectedDraw.id, selectedBetType.id, betNumber));
        const availableAmount = Math.max(0, maxPerNumber - exposure);

        if (availableAmount <= 0) {
          showError(t('betting.error_number_sold'));
          return;
        }

        if (betAmount > availableAmount) {
          showError(t('betting.error_max_for_number', { max: availableAmount.toFixed(2) }));
          return;
        }
      } catch (err) {
        console.error('Error checking exposure:', err);
      }
    }

    const formattedNumber = numbers.padStart(selectedBetType.digits, '0');
    const betNumber = parseInt(formattedNumber, 10);

    const betItem = {
      id: Date.now(),
      drawId: selectedDraw.id,
      drawNumber: selectedDraw.draw_number,
      game_type: selectedBetType.id,
      betType: BET_TYPE_MAP[selectedBetType.id],
      betNumber: betNumber,
      number: formattedNumber,
      amount: betAmount,
      multiplier: selectedBetType.multiplierNum,
      potential_win: betAmount * selectedBetType.multiplierNum
    };

    setBetCart(prev => [...prev, betItem]);

    setNumbers('');
    setAmount('');

    showSuccess(t('betting.success_added'));
  };

  const processCartPurchase = async () => {
    const totalCost = calculateCartTotal();

    if (betCart.length === 0) {
      showError(t('betting.error_empty_cart'));
      return;
    }

    if (totalCost > parseFloat(balance)) {
      showError(t('betting.error_insufficient_balance', { balance }));
      return;
    }

    setIsLoading(true);
    try {
      if (isOnChain) {
        // On-chain: group by draw and send batch tx
        const betsByDraw = betCart.reduce((acc, bet) => {
          if (!acc[bet.drawId]) acc[bet.drawId] = [];
          acc[bet.drawId].push({
            betType: bet.betType,
            betNumber: bet.betNumber,
            amount: bet.amount
          });
          return acc;
        }, {});

        for (const [drawId, bets] of Object.entries(betsByDraw)) {
          await placeBetsBatch(parseInt(drawId, 10), bets);
        }
      } else {
        // Off-chain: use backend API
        const betsByDraw = betCart.reduce((acc, bet) => {
          if (!acc[bet.drawId]) acc[bet.drawId] = [];
          acc[bet.drawId].push({
            game_type: BACKEND_GAME_TYPE[bet.game_type] || bet.game_type.toLowerCase(),
            number: bet.number,
            amount: bet.amount
          });
          return acc;
        }, {});

        let lastResult = null;
        for (const [drawId, bets] of Object.entries(betsByDraw)) {
          lastResult = await betApi.placeBets(parseInt(drawId, 10), bets);
        }
        // Update balance immediately from API response
        if (lastResult?.new_balance !== undefined) {
          setBalance(parseFloat(lastResult.new_balance).toFixed(2));
        }
      }

      showSuccess(t('betting.success_purchase', { count: betCart.length }));

      setBetCart([]);
      // Refresh balance from backend
      await refreshBalance();
      await loadData();
    } catch (err) {
      console.error('Error processing cart:', err);
      const message = err?.reason || err?.message || t('betting.error_processing');
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract fijo/centena/parle from a 4-digit winning number
  const extractWinningParts = (num) => {
    const padded = String(num).padStart(4, '0');
    return {
      fijo: padded.slice(-2),
      centena: padded.slice(-3),
      parle: padded
    };
  };

  // Polygonscan base URL (Polygon mainnet or Amoy testnet)
  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '137');
  const scanBaseUrl = chainId === 80002
    ? 'https://amoy.polygonscan.com'
    : chainId === 31337
    ? null // local hardhat, no explorer
    : 'https://polygonscan.com';

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        <div className="page-header">
          <h1>{t('betting.title')}</h1>
          <p className="page-subtitle">{t('betting.subtitle')}</p>
        </div>

        {/* ── Banner: Últimos 3 Resultados ── */}
        {resolvedDraws.length > 0 && (
          <div className="results-banner">
            <h3 className="results-banner-title">{t('betting.recent_results.title')}</h3>
            <div className="results-banner-grid">
              {resolvedDraws.map(draw => {
                const parts = extractWinningParts(draw.winningNumber);
                const paidOut = parseFloat(draw.totalPaidOut);
                return (
                  <div key={draw.id} className="result-card">
                    <div className="result-card-header">
                      <span className="result-draw-label">{t('betting.recent_results.draw_label')} #{draw.draw_number}</span>
                      <span className="result-bets-count">{t('betting.recent_results.total_bets', { count: draw.betCount })}</span>
                    </div>
                    <div className="result-winning-number">
                      {String(draw.winningNumber).padStart(4, '0')}
                    </div>
                    <div className="result-breakdown">
                      <span className="result-part"><em>{t('betting.recent_results.fijo')}</em> {parts.fijo}</span>
                      <span className="result-part"><em>{t('betting.recent_results.centena')}</em> {parts.centena}</span>
                      <span className="result-part"><em>{t('betting.recent_results.parle')}</em> {parts.parle}</span>
                    </div>
                    <div className="result-payout">
                      {paidOut > 0
                        ? t('betting.recent_results.total_paid', { amount: paidOut.toFixed(2) })
                        : t('betting.recent_results.no_winners')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isConnected ? (
          <div className="connect-prompt">
            <h3>{t('betting.connect_prompt')}</h3>
            <p>{t('betting.connect_prompt_desc')}</p>
            <ConnectWallet />
          </div>
        ) : isLoadingDraws ? (
          <div className="loading-container">
            <Spinner size="lg" />
          </div>
        ) : draws.length === 0 ? (
          <div className="empty-state">
            <p>{t('betting.no_draws')}</p>
            <p className="hint">{t('betting.draws_hint')}</p>
          </div>
        ) : (
          <div className="betting-layout">
            {/* Panel izquierdo */}
            <div className="betting-form-section">
              <div className="balance-section">
                <div className="balance-display-inline">
                  <span className="label">{t('betting.available_balance')}</span>
                  <span className="amount">${parseFloat(balance).toFixed(2)} USDT</span>
                </div>
                <small className="balance-hint">{t('betting.balance_hint')}</small>
              </div>

              {/* Sorteos */}
              <div className="form-group">
                <label>{t('betting.available_draws')}</label>

                <div className="draws-selector">
                  {draws.map(draw => (
                    <div
                      key={draw.id}
                      className={`draw-option ${selectedDraw?.id === draw.id ? 'selected' : ''} ${!draw.is_open ? 'closed' : 'open'}`}
                      onClick={() => setSelectedDraw(draw)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="draw-header">
                        <span className="draw-number">{draw.draw_number}</span>
                        <span className={`draw-status ${draw.status}`}>
                          {draw.status === 'open' ? t('betting.draw_status.open') : draw.status === 'closed' ? t('betting.draw_status.closed') : t('betting.draw_status.completed')}
                        </span>
                      </div>

                      <div className="draw-details">
                        <div className="draw-info">
                          <span className="draw-time">
                            {new Date(draw.scheduled_time).toLocaleString(undefined, {
                              timeZone: 'UTC',
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: 'short'
                            })}{' '}
                            UTC
                          </span>
                        </div>

                        {draw.is_open ? (
                          <div className="countdown-info">
                            <span className="time-label">{t('betting.closes_in')}</span>
                            <span className="time-remaining">
                              {t('betting.draw_status.open')}
                            </span>
                          </div>
                        ) : (
                          <div className="closed-info">
                            <span className="closed-label">
                              {draw.status === 'closed' ? t('betting.bets_closed') : draw.status === 'resolved' ? t('betting.draw_completed') : draw.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div className="form-group">
                <label>{t('betting.bet_type')}</label>
                <div className="bet-type-selector">
                  {BET_TYPES.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      className={`bet-type-btn ${selectedBetType.id === type.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedBetType(type);
                        setNumbers('');
                      }}
                    >
                      <span className="type-name">{type.label}</span>
                      <span className="type-multiplier">{type.multiplierLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Número */}
              <div className="form-group">
                <label>{t('betting.number_label', { digits: selectedBetType.digits })}</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={selectedBetType.placeholder}
                  value={numbers}
                  onChange={handleNumbersChange}
                  maxLength={selectedBetType.digits}
                  className="number-input"
                />
              </div>

              {/* Monto */}
              <div className="form-group">
                <label>{t('betting.amount_label', { max: maxBetAmount.toFixed(2) })}</label>
                <Input
                  type="number"
                  step="0.01"
                  min={MIN_STAKE}
                  max={maxBetAmount}
                  placeholder={`0.01 - ${maxBetAmount.toFixed(2)}`}
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return setAmount('');
                    const num = parseFloat(val);
                    if (!Number.isNaN(num) && num >= 0 && num <= maxBetAmount) setAmount(val);
                  }}
                />

                <div className="amount-quick-select">
                  {[0.5, 1.0, 2.0, 5.0, 10.0].filter(v => v <= maxBetAmount).map(v => (
                    <button
                      key={v}
                      type="button"
                      className={`quick-amount-btn ${amount === String(v) ? 'active' : ''}`}
                      onClick={() => setAmount(String(v))}
                    >
                      ${v.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bet-summary">
                  <div className="summary-row">
                    <span>{t('betting.summary.type')}</span>
                    <span>{selectedBetType.label} ({selectedBetType.multiplierLabel})</span>
                  </div>
                  <div className="summary-row">
                    <span>{t('betting.summary.number')}</span>
                    <span>{numbers || '---'}</span>
                  </div>
                  <div className="summary-row">
                    <span>{t('betting.summary.bet')}</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-cost">
                    <span>{t('betting.summary.total_debit')}</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span>{t('betting.summary.potential_win')}</span>
                    <span>${potentialWin().toFixed(2)}</span>
                  </div>
                  <div className="summary-row fee-info">
                    <span>{t('betting.summary.fee')}</span>
                    <span>${(parseFloat(amount) * 0.05).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={addBetToCart}
                disabled={!numbers || !amount || numbers.length !== selectedBetType.digits}
                fullWidth
              >
                {t('betting.add_to_cart')}
              </Button>

              <p className="blockchain-notice">
                {t('betting.blockchain_notice')}
              </p>

              {/* Resultados anteriores (opcional) */}
              {lastDrawResults && (
                <div className={`last-draw-results ${lastDrawResults.winners ? 'has-winners' : 'no-winners'}`}>
                  <h4>{t('betting.previous_results')}</h4>
                  {lastDrawResults.winners ? (
                    <div className="winners-info">
                      <span className="result-icon">&#x1F3C6;</span>
                      <span className="result-text">
                        <Trans
                          i18nKey="games:betting.winners"
                          values={{ count: lastDrawResults.winnerCount, amount: lastDrawResults.totalPaidOut.toFixed(2) }}
                          components={{ strong: <strong /> }}
                        />
                      </span>
                    </div>
                  ) : (
                    <div className="no-winners-info">
                      <span className="result-icon">&#x1F3B0;</span>
                      <span className="result-text">
                        <Trans
                          i18nKey="games:betting.no_winners"
                          values={{ amount: lastDrawResults.poolIncrease.toFixed(2) }}
                          components={{ strong: <strong /> }}
                        />
                      </span>
                      {lastDrawResults.businessFee > 0 && (
                        <span className="fee-info">
                          <Trans
                            i18nKey="games:betting.business_fee"
                            values={{ amount: lastDrawResults.businessFee.toFixed(2) }}
                            components={{ strong: <strong /> }}
                          />
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Límites */}
              <div className="limits-info">
                <h4>{t('betting.limits_info')}</h4>
                <p>
                  <Trans
                    i18nKey="games:betting.current_limit"
                    values={{ amount: maxPerNumber.toFixed(2) }}
                    components={{ strong: <strong /> }}
                  />
                </p>
                <p>
                  <Trans
                    i18nKey="games:betting.system_fee"
                    components={{ strong: <strong /> }}
                  />
                </p>
                <p>{t('betting.expansion')}</p>

                {poolBalance > 0 && (
                  <div className="pool-status">
                    <p>
                      <Trans
                        i18nKey="games:betting.pool_current"
                        values={{ amount: poolBalance.toFixed(2) }}
                        components={{ strong: <strong /> }}
                      />
                    </p>
                  </div>
                )}
              </div>

              {/* ── Seccion de Probabilidades ── */}
              <div className="odds-section">
                <h4 className="odds-title">{t('betting.odds.title')}</h4>
                <p className="odds-subtitle">{t('betting.odds.subtitle')}</p>

                <div className="odds-grid">
                  <div className="odds-card odds-fijo">
                    <div className="odds-card-header">
                      <span className="odds-type">Fijo</span>
                      <span className="odds-multiplier">65x</span>
                    </div>
                    <span className="odds-probability">{t('betting.odds.fijo_odds')}</span>
                    <p className="odds-desc">
                      <Trans i18nKey="games:betting.odds.fijo_desc" components={{ strong: <strong /> }} />
                    </p>
                  </div>

                  <div className="odds-card odds-centena">
                    <div className="odds-card-header">
                      <span className="odds-type">Centena</span>
                      <span className="odds-multiplier">300x</span>
                    </div>
                    <span className="odds-probability">{t('betting.odds.centena_odds')}</span>
                    <p className="odds-desc">
                      <Trans i18nKey="games:betting.odds.centena_desc" components={{ strong: <strong /> }} />
                    </p>
                  </div>

                  <div className="odds-card odds-parle">
                    <div className="odds-card-header">
                      <span className="odds-type">Parle</span>
                      <span className="odds-multiplier">1000x</span>
                    </div>
                    <span className="odds-probability">{t('betting.odds.parle_odds')}</span>
                    <p className="odds-desc">
                      <Trans i18nKey="games:betting.odds.parle_desc" components={{ strong: <strong /> }} />
                    </p>
                  </div>
                </div>

                <div className="odds-comparison">
                  <h5>{t('betting.odds.comparison_title')}</h5>
                  <div className="odds-vs-list">
                    <div className="odds-vs-item bad">{t('betting.odds.vs_powerball')}</div>
                    <div className="odds-vs-item bad">{t('betting.odds.vs_euromillions')}</div>
                    <div className="odds-vs-item bad">{t('betting.odds.vs_mega')}</div>
                  </div>
                  <p className="odds-comparison-note">{t('betting.odds.comparison_note')}</p>
                </div>

                <div className="odds-features">
                  <span className="odds-feature">{t('betting.odds.transparent')}</span>
                  <span className="odds-feature">{t('betting.odds.instant_payout')}</span>
                  <span className="odds-feature">{t('betting.odds.no_middleman')}</span>
                </div>
              </div>
            </div>

            {/* Panel derecho */}
            {selectedDraw && (
              <div className="draw-info-section">
                <h3>{t('betting.draw_label', { label: selectedDraw.draw_number })}</h3>

                <div className={`draw-card ${selectedDraw.status}`}>
                  <div className="draw-header">
                    <span className="draw-number">{selectedDraw.draw_number}</span>
                    <span className={`draw-status ${selectedDraw.status}`}>
                      {selectedDraw.status === 'open' ? t('betting.draw_status.open') : selectedDraw.status === 'closed' ? t('betting.draw_status.closed') : t('betting.draw_status.completed')}
                    </span>
                  </div>

                  <div className="draw-details">
                    <div className="detail-row">
                      <span className="label">{t('betting.date_time')}</span>
                      <span className="value">
                        {new Date(selectedDraw.scheduled_time).toLocaleString(undefined, {
                          timeZone: 'UTC',
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}{' '}
                        UTC
                      </span>
                    </div>

                    <div className="detail-row">
                      <span className="label">{t('betting.type')}</span>
                      <span className="value">{t('betting.auto_draw')}</span>
                    </div>

                    {selectedDraw.is_open ? (
                      <>
                        <div className="detail-row highlight">
                          <span className="label">{t('betting.status')}</span>
                          <span className="value open-status">{t('betting.bets_open')}</span>
                        </div>
                      </>
                    ) : (
                      <div className="detail-row">
                        <span className="label">{t('betting.status')}</span>
                        <span className="value closed-status">
                          {selectedDraw.status === 'closed' ? t('betting.bets_closed') : t('betting.draw_completed')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="multipliers-info">
                  <h4>{t('betting.multipliers')}</h4>
                  <div className="multiplier-row">
                    <span>{t('betting.fijo_digits')}</span>
                    <span className="mult">65x</span>
                  </div>
                  <div className="multiplier-row">
                    <span>{t('betting.centena_digits')}</span>
                    <span className="mult">300x</span>
                  </div>
                  <div className="multiplier-row">
                    <span>{t('betting.parle_digits')}</span>
                    <span className="mult">1000x</span>
                  </div>

                  <div className="stake-limits-info">
                    <h4>{t('betting.limits_info')}</h4>
                    <p>
                      <Trans
                        i18nKey="games:betting.current_limit"
                        values={{ amount: maxBetAmount.toFixed(2) }}
                        components={{ strong: <strong /> }}
                      />
                    </p>
                    <p>
                      <Trans
                        i18nKey="games:betting.system_fee"
                        components={{ strong: <strong /> }}
                      />
                    </p>
                    <p>{t('betting.expansion')}</p>
                  </div>

                  <div className="schedule-info">
                    <h4>{t('betting.schedule')}</h4>
                    <div className="schedule-row">
                      <span className="time-slot">{t('betting.morning')}</span>
                      <span>10:00 UTC</span>
                    </div>
                    <div className="schedule-row">
                      <span className="time-slot">{t('betting.afternoon')}</span>
                      <span>15:00 UTC</span>
                    </div>
                    <div className="schedule-row">
                      <span className="time-slot">{t('betting.evening')}</span>
                      <span>21:00 UTC</span>
                    </div>
                    <p className="schedule-note">{t('betting.schedule_note')}</p>
                  </div>

                  {/* ── Verificacion On-Chain ── */}
                  {scanBaseUrl && bolitaContractAddress && (
                    <div className="verify-section">
                      <h4>{t('betting.verify.title')}</h4>
                      <p className="verify-desc">{t('betting.verify.desc')}</p>
                      <div className="verify-links">
                        <a
                          href={`${scanBaseUrl}/address/${bolitaContractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="verify-link"
                        >
                          {t('betting.verify.view_contract')}
                        </a>
                        <a
                          href={`${scanBaseUrl}/address/${bolitaContractAddress}#internaltx`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="verify-link"
                        >
                          {t('betting.verify.view_txs')}
                        </a>
                        <a
                          href={`${scanBaseUrl}/address/${bolitaContractAddress}#events`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="verify-link"
                        >
                          {t('betting.verify.view_events')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carrito de apuestas */}
        {betCart.length > 0 && (
          <div className="bet-cart-panel">
            <div className="cart-panel-header">
              <span className="cart-title">{t('betting.cart_header', { count: betCart.length })}</span>
              <button className="cart-clear-btn" onClick={() => setBetCart([])}>
                {t('common.common.clear')}
              </button>
            </div>

            <div className="cart-items-list">
              {betCart.map((bet, idx) => (
                <div key={bet.id} className="cart-item">
                  <div className="cart-item-info">
                    <span className="cart-item-type">{bet.game_type}</span>
                    <span className="cart-item-number">#{bet.number}</span>
                  </div>
                  <div className="cart-item-right">
                    <span className="cart-item-amount">${bet.amount.toFixed(2)}</span>
                    <button
                      className="cart-item-remove"
                      onClick={() => setBetCart(prev => prev.filter((_, i) => i !== idx))}
                    >
                      x
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-panel-footer">
              <div className="cart-total-row">
                <span>{t('betting.cart_total', { amount: calculateCartTotal().toFixed(2) })}</span>
              </div>
              <Button
                onClick={processCartPurchase}
                loading={isLoading}
                disabled={calculateCartTotal() > parseFloat(balance)}
                variant="primary"
                className="cart-buy-btn"
              >
                {t('betting.buy')} — ${calculateCartTotal().toFixed(2)} USDT
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Web3BettingPage;
