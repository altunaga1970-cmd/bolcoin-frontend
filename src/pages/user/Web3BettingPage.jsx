// src/pages/web3/Web3BettingPage.jsx (o donde lo tengas)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useWeb3 } from '../../contexts/Web3Context';
import { useToast } from '../../contexts/ToastContext';

// OJO: si useContract en tu proyecto es default export, usa:
// import useContract from '../../hooks/useContract';
import { useContract } from '../../hooks/useContract';

// ✅ FALTA EN TU CÓDIGO ORIGINAL: betApi
// Ajusta la ruta según tu estructura real:
// - Si existe: src/api/betApi.js  -> '../../api/betApi'
// - Si existe: src/api/betApi.js y estás en pages/user -> '../../api/betApi'
import betApi from '../../api/betApi';

import { Button, Input, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet } from '../../components/web3';

import { drawScheduler } from '../../utils/drawScheduler';
import { BOLITA_CONFIG } from '../../utils/prizeCalculations';
import { limitManager } from '../../utils/limitManager';
import { poolStatistics } from '../../utils/poolStatistics';

import '../user/UserPages.css';
import './Web3BettingPage.css';

// Sistema de apuestas con límites progresivos
const MIN_STAKE = 0.01;         // Mínimo 0.01 USDT
const INITIAL_MAX_STAKE = 2.0;  // Máximo inicial por número

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
  const { drawId: paramDrawId } = useParams();

  const { isConnected } = useWeb3();
  const { error: showError, success: showSuccess } = useToast();

  const { getContractBalance } = useContract();

  const [balance, setBalance] = useState('0');
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedBetType, setSelectedBetType] = useState(BET_TYPES[0]);

  const [numbers, setNumbers] = useState('');
  const [amount, setAmount] = useState('');

  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sistema de límites y disponibilidad
  const [maxPerNumber, setMaxPerNumber] = useState(INITIAL_MAX_STAKE);
  const [numberBets, setNumberBets] = useState({});
  const [poolBalance, setPoolBalance] = useState(0);

  // Resultados del sorteo anterior (si los alimentas desde backend, aquí queda listo)
  const [lastDrawResults, setLastDrawResults] = useState(null);

  // Carrito
  const [betCart, setBetCart] = useState([]);

  const gameTypeMap = useMemo(() => ({
    FIJO: 'fijos',
    CENTENA: 'centenas',
    PARLE: 'parles'
  }), []);

  const loadData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingDraws(true);
    try {
      // Balance del contrato
      const contractBal = await getContractBalance();
      setBalance(contractBal);

      // Generar 3 sorteos
      const autoDraws = drawScheduler.generateNextDraws();
      setDraws(autoDraws);

      // Seleccionar sorteo inicial
      const openDraw = drawScheduler.getCurrentOpenDraw(autoDraws);

      if (paramDrawId) {
        const found = autoDraws.find(d => d.id === parseInt(paramDrawId, 10));
        setSelectedDraw(found || openDraw);
      } else {
        setSelectedDraw(openDraw);
      }

      // Si tú manejas poolBalance/maxPerNumber desde backend, este es el sitio:
      // const stats = await someApi.getStats(); setPoolBalance(stats.pool); setMaxPerNumber(stats.maxPerNumber);

      // console.log(`[Auto Draws] ${autoDraws.length} draws, selected: ${openDraw?.draw_number}`);
    } catch (err) {
      console.error('Error loading data:', err);
      showError('Error cargando datos');
    } finally {
      setIsLoadingDraws(false);
    }
  }, [isConnected, getContractBalance, paramDrawId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refrescar sorteos cada minuto y ajustar selectedDraw si se cerró
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      const autoDraws = drawScheduler.generateNextDraws();
      setDraws(autoDraws);

      if (selectedDraw) {
        const updated = autoDraws.find(d => d.id === selectedDraw.id);
        if (updated && !updated.is_open) {
          const nextOpen = drawScheduler.getCurrentOpenDraw(autoDraws);
          setSelectedDraw(nextOpen);
        } else if (updated) {
          setSelectedDraw(updated);
        }
      } else {
        const openDraw = drawScheduler.getCurrentOpenDraw(autoDraws);
        setSelectedDraw(openDraw);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isConnected, selectedDraw]);

  const handleNumbersChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= selectedBetType.digits) setNumbers(value);
  };

  const checkNumberAvailability = (number) => {
    if (!number || !selectedDraw) return { available: true, maxAmount: maxPerNumber };
    return limitManager.checkNumberAvailability(number, numberBets, maxPerNumber);
  };

  const getAvailabilityMessage = () => {
    if (!numbers || numbers.length !== selectedBetType.digits) return null;
    const availability = checkNumberAvailability(numbers);
    return limitManager.formatAvailabilityMessage(availability);
  };

  const calculateCartTotal = () => betCart.reduce((t, b) => t + b.amount, 0);

  const potentialWin = () => {
    const betAmount = parseFloat(amount) || 0;
    return betAmount * selectedBetType.multiplierNum;
  };

  const addBetToCart = () => {
    if (!selectedDraw) {
      showError('Selecciona un sorteo');
      return;
    }

    if (numbers.length !== selectedBetType.digits) {
      showError(`Ingresa ${selectedBetType.digits} dígitos`);
      return;
    }

    const betAmount = parseFloat(amount);
    if (!betAmount || betAmount <= 0) {
      showError('Ingresa un monto válido');
      return;
    }

    if (betAmount < MIN_STAKE) {
      showError(`Monto mínimo: ${MIN_STAKE} USDT`);
      return;
    }

    const availability = checkNumberAvailability(numbers);
    if (!availability.available) {
      if (availability.isSold) showError('Número vendido - No disponible para este sorteo');
      else showError(`Monto máximo disponible: $${availability.maxAmount.toFixed(2)} USDT`);
      return;
    }

    if (betAmount > availability.maxAmount) {
      showError(`Monto máximo para este número: $${availability.maxAmount.toFixed(2)} USDT`);
      return;
    }

    const formattedNumber = numbers.padStart(selectedBetType.digits, '0');

    // Procesar con limitManager
    const betProcess = limitManager.processBet(numbers, betAmount, numberBets, maxPerNumber);
    if (!betProcess.success) {
      showError(betProcess.message);
      return;
    }

    // Actualizar estado
    setNumberBets(betProcess.updatedBets);

    // Si tu lógica de expansión actualiza maxPerNumber/poolBalance, aplica aquí:
    // setPoolBalance(prev => prev + betProcess.poolContribution);
    // setMaxPerNumber(betProcess.newMaxPerNumber ?? maxPerNumber);

    const betItem = {
      id: Date.now(),
      drawId: selectedDraw.id,
      drawNumber: selectedDraw.draw_number,
      game_type: selectedBetType.id,
      number: formattedNumber,
      amount: betAmount,
      multiplier: selectedBetType.multiplierNum,
      potential_win: betAmount * selectedBetType.multiplierNum
    };

    setBetCart(prev => [...prev, betItem]);

    setNumbers('');
    setAmount('');

    showSuccess('Apuesta agregada al carrito');
  };

  const processCartPurchase = async () => {
    const totalCost = calculateCartTotal();

    if (betCart.length === 0) {
      showError('No hay apuestas en el carrito');
      return;
    }

    if (totalCost > parseFloat(balance)) {
      showError(`Balance insuficiente en contrato. Tienes ${balance} USDT. Deposita más fondos primero.`);
      return;
    }

    setIsLoading(true);
    try {
      // Agrupar por sorteo
      const betsByDraw = betCart.reduce((acc, bet) => {
        if (!acc[bet.drawId]) acc[bet.drawId] = [];
        acc[bet.drawId].push({
          game_type: gameTypeMap[bet.game_type],
          number: bet.number,
          amount: bet.amount
        });
        return acc;
      }, {});

      for (const [drawId, bets] of Object.entries(betsByDraw)) {
        await betApi.placeBets(parseInt(drawId, 10), bets);
      }

      showSuccess(`¡Compra exitosa! ${betCart.length} apuesta(s) registrada(s).`);

      setBetCart([]);
      await loadData();
    } catch (err) {
      console.error('Error processing cart:', err);
      showError(err?.response?.data?.message || 'Error al procesar las apuestas');
    } finally {
      setIsLoading(false);
    }
  };

  const availabilityMsg = getAvailabilityMessage();

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        <div className="page-header">
          <h1>Realizar Apuesta</h1>
          <p className="page-subtitle">Apuestas descentralizadas en Polygon</p>
        </div>

        {!isConnected ? (
          <div className="connect-prompt">
            <h3>Conecta tu Wallet</h3>
            <p>Necesitas conectar MetaMask para realizar apuestas</p>
            <ConnectWallet />
          </div>
        ) : isLoadingDraws ? (
          <div className="loading-container">
            <Spinner size="lg" />
          </div>
        ) : draws.length === 0 ? (
          <div className="empty-state">
            <p>No hay sorteos abiertos en este momento</p>
            <p className="hint">Los sorteos se abren periódicamente</p>
          </div>
        ) : (
          <div className="betting-layout">
            {/* Panel izquierdo */}
            <div className="betting-form-section">
              <div className="balance-section">
                <div className="balance-display-inline">
                  <span className="label">Balance disponible:</span>
                  <span className="amount">${parseFloat(balance).toFixed(2)} USDT</span>
                </div>
                <small className="balance-hint">Balance en el contrato inteligente para apostar</small>
              </div>

              {/* Sorteos */}
              <div className="form-group">
                <label>Sorteos Disponibles</label>

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
                          {draw.status === 'open' ? 'ABIERTO' : draw.status === 'closed' ? 'CIERRADO' : 'FINALIZADO'}
                        </span>
                      </div>

                      <div className="draw-details">
                        <div className="draw-info">
                          <span className="draw-label">{draw.draw_label}</span>
                          <span className="draw-time">
                            {new Date(draw.scheduled_time).toLocaleString('es-ES', {
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
                            <span className="time-label">Cierra en:</span>
                            <span className={`time-remaining ${drawScheduler.needsToCloseSoon(draw) ? 'urgent' : ''}`}>
                              {draw.time_remaining}
                            </span>
                          </div>
                        ) : (
                          <div className="closed-info">
                            <span className="closed-label">
                              {draw.status === 'closed' ? 'Apuestas cerradas' : 'Sorteo finalizado'}
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
                <label>Tipo de Apuesta</label>
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
                <label>Número ({selectedBetType.digits} dígitos)</label>
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
                <label>Monto (USDT) - Máx: ${maxPerNumber.toFixed(2)} por número</label>
                <Input
                  type="number"
                  step="0.01"
                  min={MIN_STAKE}
                  max={maxPerNumber}
                  placeholder={`0.01 - ${maxPerNumber.toFixed(2)}`}
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return setAmount('');
                    const num = parseFloat(val);
                    if (!Number.isNaN(num) && num >= 0 && num <= maxPerNumber) setAmount(val);
                  }}
                />

                <div className="amount-quick-select">
                  {[0.5, 1.0, 1.5, 2.0].filter(v => v <= maxPerNumber).map(v => (
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

              {/* Disponibilidad */}
              {availabilityMsg && (
                <div className="form-group">
                  <div className="number-availability-section">
                    <div className={`availability-message ${availabilityMsg.type}`}>
                      <span className="availability-icon">
                        {availabilityMsg.type === 'error' ? '❌' : availabilityMsg.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span className="availability-text">{availabilityMsg.message}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bet-summary">
                  <div className="summary-row">
                    <span>Tipo:</span>
                    <span>{selectedBetType.label} ({selectedBetType.multiplierLabel})</span>
                  </div>
                  <div className="summary-row">
                    <span>Número:</span>
                    <span>{numbers || '---'}</span>
                  </div>
                  <div className="summary-row">
                    <span>Apuesta:</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="summary-row total-cost">
                    <span>Total a debitar:</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="summary-row highlight">
                    <span>Ganancia potencial:</span>
                    <span>${potentialWin().toFixed(2)}</span>
                  </div>
                  <div className="summary-row fee-info">
                    <span>Fee (5%):</span>
                    <span>${(parseFloat(amount) * 0.05).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={addBetToCart}
                disabled={!numbers || !amount || numbers.length !== selectedBetType.digits}
                fullWidth
              >
                Agregar al Carrito
              </Button>

              <p className="blockchain-notice">
                Las apuestas se agregan a tu carrito. Al comprar, se registran en el contrato (según tu backend).
                Sistema híbrido: tú controlas tu wallet.
              </p>

              {/* Resultados anteriores (opcional) */}
              {lastDrawResults && (
                <div className={`last-draw-results ${lastDrawResults.winners ? 'has-winners' : 'no-winners'}`}>
                  <h4>Resultados del Sorteo Anterior</h4>
                  {lastDrawResults.winners ? (
                    <div className="winners-info">
                      <span className="result-icon">🏆</span>
                      <span className="result-text">
                        <strong>{lastDrawResults.winnerCount}</strong> ganador(es) - Se pagó{' '}
                        <strong>${lastDrawResults.totalPaidOut.toFixed(2)}</strong> USDT
                      </span>
                    </div>
                  ) : (
                    <div className="no-winners-info">
                      <span className="result-icon">🎰</span>
                      <span className="result-text">
                        Sin ganadores - Pool aumentado en <strong>${lastDrawResults.poolIncrease.toFixed(2)}</strong> USDT
                      </span>
                      {lastDrawResults.businessFee > 0 && (
                        <span className="fee-info">
                          Fee empresarial: <strong>${lastDrawResults.businessFee.toFixed(2)}</strong> USDT
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Límites */}
              <div className="limits-info">
                <h4>Información de Límites</h4>
                <p>Límite actual por número: <strong>${maxPerNumber.toFixed(2)} USDT</strong></p>
                <p>Límite máximo soportado: <strong>${limitManager.MAX_LIMIT_PER_NUMBER} USDT</strong></p>
                <p>Fee del sistema: <strong>5%</strong></p>
                <p>Expansión automática con el 30% del pool</p>

                {poolBalance > 0 && (
                  <div className="pool-status">
                    <p>Pool actual: <strong>${poolBalance.toFixed(2)} USDT</strong></p>
                    {(() => {
                      const statusMessage = poolStatistics.generateStatusMessage(poolBalance, maxPerNumber);
                      return (
                        <div className={`pool-status-message ${statusMessage.type}`}>
                          <span className="status-icon">{statusMessage.icon}</span>
                          <span className="status-text">{statusMessage.message}</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Panel derecho */}
            {selectedDraw && (
              <div className="draw-info-section">
                <h3>Sorteo {selectedDraw.draw_label}</h3>

                <div className={`draw-card ${selectedDraw.status}`}>
                  <div className="draw-header">
                    <span className="draw-number">{selectedDraw.draw_number}</span>
                    <span className={`draw-status ${selectedDraw.status}`}>
                      {selectedDraw.status === 'open' ? 'ABIERTO' : selectedDraw.status === 'closed' ? 'CIERRADO' : 'FINALIZADO'}
                    </span>
                  </div>

                  <div className="draw-details">
                    <div className="detail-row">
                      <span className="label">Fecha/Hora:</span>
                      <span className="value">
                        {new Date(selectedDraw.scheduled_time).toLocaleString('es-ES', {
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
                      <span className="label">Tipo:</span>
                      <span className="value">Sorteo Automático</span>
                    </div>

                    {selectedDraw.is_open ? (
                      <>
                        <div className="detail-row highlight">
                          <span className="label">Estado:</span>
                          <span className="value open-status">Apuestas ABIERTAS</span>
                        </div>

                        <div className="countdown-section">
                          <span className="countdown-label">Cierra en:</span>
                          <span className={`countdown-timer ${drawScheduler.needsToCloseSoon(selectedDraw) ? 'urgent' : ''}`}>
                            {selectedDraw.time_remaining}
                          </span>
                          {drawScheduler.needsToCloseSoon(selectedDraw) && (
                            <div className="urgent-warning">Cerrando pronto</div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="detail-row">
                        <span className="label">Estado:</span>
                        <span className="value closed-status">
                          {selectedDraw.status === 'closed' ? 'Apuestas CERRADAS' : 'Sorteo FINALIZADO'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="multipliers-info">
                  <h4>Multiplicadores</h4>
                  <div className="multiplier-row">
                    <span>Fijo (2 dígitos)</span>
                    <span className="mult">65x</span>
                  </div>
                  <div className="multiplier-row">
                    <span>Centena (3 dígitos)</span>
                    <span className="mult">300x</span>
                  </div>
                  <div className="multiplier-row">
                    <span>Parle (4 dígitos)</span>
                    <span className="mult">1000x</span>
                  </div>

                  <div className="stake-limits-info">
                    <h4>Sistema de Límites</h4>
                    <p>Límite actual: <strong>${maxPerNumber.toFixed(2)} USDT</strong> por número</p>
                    <p>Fee: <strong>5%</strong></p>
                    <p>Expansión: <strong>30%</strong> del pool</p>
                  </div>

                  <div className="schedule-info">
                    <h4>Horarios Automáticos</h4>
                    <div className="schedule-row">
                      <span className="time-slot">Mañana:</span>
                      <span>10:00 UTC</span>
                    </div>
                    <div className="schedule-row">
                      <span className="time-slot">Tarde:</span>
                      <span>15:00 UTC</span>
                    </div>
                    <div className="schedule-row">
                      <span className="time-slot">Noche:</span>
                      <span>21:00 UTC</span>
                    </div>
                    <p className="schedule-note">Cierre 5 min antes del sorteo</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carrito simple */}
        {betCart.length > 0 && (
          <div className="bet-cart-simple">
            <div className="cart-simple-header">
              <span>{betCart.length} apuesta(s) en carrito</span>
              <span>Total: ${calculateCartTotal().toFixed(2)}</span>
            </div>

            <div className="cart-simple-actions">
              <Button
                onClick={() => setBetCart([])}
                variant="outline"
                size="sm"
              >
                Limpiar
              </Button>

              <Button
                onClick={processCartPurchase}
                loading={isLoading}
                disabled={calculateCartTotal() > parseFloat(balance)}
                variant="primary"
                size="sm"
              >
                Comprar
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Web3BettingPage;
