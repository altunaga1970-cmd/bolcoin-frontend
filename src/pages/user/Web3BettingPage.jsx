import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Spinner, Checkbox } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet, JackpotBanner } from '../../components/web3';
import { formatDateTime } from '../../utils/formatters';
import drawApi from '../../api/drawApi';
import betApi from '../../api/betApi';
import jackpotApi from '../../api/jackpotApi';
import '../user/UserPages.css';

// Risk-managed multipliers and stake limits
const MIN_STAKE = 1;   // 1 USDT minimum
const MAX_STAKE = 10;  // 10 USDT maximum

const BET_TYPES = [
  { id: 'FIJO', label: 'Fijo', digits: 2, multiplier: '65x', multiplierNum: 65, placeholder: '00' },
  { id: 'CENTENA', label: 'Centena', digits: 3, multiplier: '300x', multiplierNum: 300, placeholder: '000' },
  { id: 'PARLE', label: 'Parle', digits: 4, multiplier: '1500x', multiplierNum: 1500, placeholder: '0000' }
];

function Web3BettingPage() {
  const { drawId: paramDrawId } = useParams();
  const { isConnected, account } = useWeb3();
  const { getContractBalance } = useContract();
  const { error: showError, success: showSuccess } = useToast();

  const [balance, setBalance] = useState('0');
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [selectedBetType, setSelectedBetType] = useState(BET_TYPES[0]);
  const [numbers, setNumbers] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Jackpot Pass
  const [includeJackpotPass, setIncludeJackpotPass] = useState(false);
  const [jackpotPassPrice] = useState(1); // 1 USDT
  const [jackpotInfo, setJackpotInfo] = useState(null);

  // Carrito de apuestas
  const [betCart, setBetCart] = useState([]);



  // Cargar balance y sorteos desde backend
  const loadData = useCallback(async () => {
    if (!isConnected) return;

    setIsLoadingDraws(true);
    try {
      // Obtener balance del contrato
      const contractBal = await getContractBalance();
      setBalance(contractBal);

      // Obtener información del jackpot
      try {
        const jackpotResponse = await jackpotApi.getPoolStats();
        setJackpotInfo(jackpotResponse.data);
      } catch (err) {
        console.warn('Could not load jackpot info:', err);
      }

      // Obtener sorteos activos del backend (scheduled + open)
      const response = await drawApi.getActive();
      const activeDraws = response.draws || [];

      // Filtrar solo sorteos de La Bolita que acepten apuestas
      // En desarrollo, mostrar todos los sorteos open de La Bolita
      const availableDraws = activeDraws.filter(draw => {
        const isOpen = draw.status === 'open'; // Solo sorteos ya abiertos
        const isBolita = !draw.draw_type || draw.draw_type === 'bolita'; // Solo La Bolita
        return isOpen && isBolita;
      });

      setDraws(availableDraws);

      // Auto-seleccionar el primer sorteo disponible o el del parámetro
      if (paramDrawId) {
        const draw = availableDraws.find(d => d.id === parseInt(paramDrawId));
        if (draw) {
          setSelectedDraw(draw);
        } else if (availableDraws.length > 0) {
          setSelectedDraw(availableDraws[0]);
        }
      } else if (availableDraws.length > 0) {
        setSelectedDraw(availableDraws[0]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoadingDraws(false);
    }
  }, [isConnected, paramDrawId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejar cambio de numeros
  const handleNumbersChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= selectedBetType.digits) {
      setNumbers(value);
    }
  };

  // Calcular costo total incluyendo Jackpot Pass
  const calculateTotalCost = () => {
    const betAmount = parseFloat(amount) || 0;
    const passCost = includeJackpotPass ? jackpotPassPrice : 0;
    return betAmount + passCost;
  };

  // Realizar apuesta via backend
  // Agregar apuesta al carrito
  const addBetToCart = (e) => {
    e.preventDefault();

    if (!selectedDraw) {
      showError('Selecciona un sorteo');
      return;
    }

    if (numbers.length !== selectedBetType.digits) {
      showError(`Ingresa ${selectedBetType.digits} digitos`);
      return;
    }

    const betAmount = parseFloat(amount);
    if (!betAmount || betAmount <= 0) {
      showError('Ingresa un monto valido');
      return;
    }

    // Validate stake limits (1-10 USDT)
    if (betAmount < MIN_STAKE) {
      showError(`Monto minimo: ${MIN_STAKE} USDT`);
      return;
    }

    if (betAmount > MAX_STAKE) {
      showError(`Monto maximo: ${MAX_STAKE} USDT`);
      return;
    }

    // Crear objeto de apuesta para el carrito
    const betItem = {
      id: Date.now(), // ID único temporal
      drawId: selectedDraw.id,
      drawNumber: selectedDraw.draw_number,
      game_type: selectedBetType.id,
      number: numbers.padStart(selectedBetType.digits, '0'),
      amount: betAmount,
      has_pass: includeJackpotPass,
      multiplier: selectedBetType.multiplierNum,
      potential_win: betAmount * selectedBetType.multiplierNum,
      jackpot_pass_cost: includeJackpotPass ? jackpotPassPrice : 0
    };

    setBetCart(prev => [...prev, betItem]);

    // Reset form
    setNumbers('');
    setAmount('');
    setIncludeJackpotPass(false);

    showSuccess('Apuesta agregada al carrito');
  };

  // Calcular total del carrito
  const calculateCartTotal = () => {
    return betCart.reduce((total, bet) => {
      return total + bet.amount + bet.jackpot_pass_cost;
    }, 0);
  };



  // Procesar compra del carrito
  const processCartPurchase = async () => {
    const totalCost = calculateCartTotal();

    if (totalCost > parseFloat(balance)) {
      showError(`Balance insuficiente en contrato. Tienes ${balance} USDT. Deposita más fondos primero.`);
      return;
    }

    if (betCart.length === 0) {
      showError('No hay apuestas en el carrito');
      return;
    }

    setIsLoading(true);
    try {
      // Agrupar apuestas por sorteo
      const betsByDraw = betCart.reduce((acc, bet) => {
        if (!acc[bet.drawId]) {
          acc[bet.drawId] = [];
        }

        // Convertir al formato del backend
        const gameTypeMap = {
          'FIJO': 'fijos',
          'CENTENA': 'centenas',
          'PARLE': 'parles'
        };

        acc[bet.drawId].push({
          game_type: gameTypeMap[bet.game_type],
          number: bet.number,
          amount: bet.amount,
          has_pass: bet.has_pass
        });

        return acc;
      }, {});

      console.log(`[Purchase] Processing ${betCart.length} bets across ${Object.keys(betsByDraw).length} draws`);

      // Enviar todas las apuestas agrupadas por sorteo
      for (const [drawId, bets] of Object.entries(betsByDraw)) {
        console.log(`[Purchase] Submitting ${bets.length} bets for draw ${drawId}`);
        await betApi.placeBets(parseInt(drawId), bets);
      }

      showSuccess(`¡Compra exitosa! ${betCart.length} apuesta(s) registrada(s) en blockchain.`);

      // Limpiar carrito
      setBetCart([]);
      loadData(); // Recargar balances

    } catch (err) {
      console.error('Error processing cart:', err);
      showError(err.response?.data?.message || 'Error al procesar las apuestas');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular ganancia potencial
  const potentialWin = () => {
    const betAmount = parseFloat(amount) || 0;
    return betAmount * selectedBetType.multiplierNum;
  };

  // Calcular costo total para mostrar
  const getTotalCostDisplay = () => {
    const betAmount = parseFloat(amount) || 0;
    const passCost = includeJackpotPass ? jackpotPassPrice : 0;
    const total = betAmount + passCost;
    return total;
  };

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        {/* Jackpot Banner */}
        <JackpotBanner variant="compact" />

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
            <p className="hint">Los sorteos se abren periodicamente</p>
          </div>
        ) : (
          <div className="betting-layout">
            {/* Panel izquierdo - Formulario */}
            <div className="betting-form-section">
              {/* Balance */}
              <div className="balance-section">
                <div className="balance-display-inline">
                  <span className="label">Balance disponible:</span>
                  <span className="amount">${parseFloat(balance).toFixed(2)} USDT</span>
                </div>
                <small className="balance-hint">
                  Balance en el contrato inteligente para apostar
                </small>
              </div>

              {/* Selector de sorteo */}
              <div className="form-group">
                <label>Sorteo</label>
                {isLoadingDraws ? (
                  <div className="loading-draws">Cargando sorteos...</div>
                ) : draws.length === 0 ? (
                  <div className="no-draws-message">
                    <p>No hay sorteos disponibles en este momento.</p>
                    <p className="hint">Los sorteos se crean automaticamente: Mañana (10:00), Tarde (15:00), Noche (21:00) UTC</p>
                  </div>
                ) : (
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
                        {draw.draw_number} - {formatDateTime(draw.scheduled_time)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tipo de apuesta */}
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
                      <span className="type-multiplier">{type.multiplier}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Numero */}
              <div className="form-group">
                <label>Numero ({selectedBetType.digits} digitos)</label>
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
                 <label>Monto (USDT) - Min: {MIN_STAKE}, Max: {MAX_STAKE}</label>
                 <Input
                   type="number"
                   step="1"
                   min={MIN_STAKE}
                   max={MAX_STAKE}
                   placeholder={`${MIN_STAKE}-${MAX_STAKE}`}
                   value={amount}
                   onChange={(e) => {
                     const val = e.target.value;
                     if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= MAX_STAKE)) {
                       setAmount(val);
                     }
                   }}
                 />
                 <div className="amount-quick-select">
                   {[1, 2, 5, 10].map(val => (
                     <button
                       key={val}
                       type="button"
                       className={`quick-amount-btn ${amount === String(val) ? 'active' : ''}`}
                       onClick={() => setAmount(String(val))}
                     >
                       ${val}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Jackpot Pass Option */}
               <div className="form-group">
                 <div className="jackpot-pass-section">
                   <Checkbox
                     id="jackpot-pass"
                     checked={includeJackpotPass}
                     onChange={(e) => setIncludeJackpotPass(e.target.checked)}
                     label={
                       <div className="jackpot-pass-label">
                         <span className="pass-title">🏆 Jackpot Pass</span>
                         <span className="pass-price">+${jackpotPassPrice} USDT</span>
                       </div>
                     }
                   />
                   <p className="jackpot-pass-description">
                     Añade +1 USDT para participar en el Super Jackpot diario.
                     Si ganas tu apuesta base, también participas por el jackpot.
                   </p>
                   {jackpotInfo && (
                     <div className="jackpot-pool-info">
                       <small>
                         Pool actual: ${jackpotApi.formatPoolBalance(jackpotInfo.superJackpotPool)}
                       </small>
                     </div>
                   )}
                 </div>
               </div>

               {/* Resumen */}
               {amount && parseFloat(amount) > 0 && (
                 <div className="bet-summary">
                   <div className="summary-row">
                     <span>Tipo:</span>
                     <span>{selectedBetType.label} ({selectedBetType.multiplier})</span>
                   </div>
                   <div className="summary-row">
                     <span>Numero:</span>
                     <span>{numbers || '---'}</span>
                   </div>
                   <div className="summary-row">
                     <span>Apuesta base:</span>
                     <span>${parseFloat(amount).toFixed(2)}</span>
                   </div>
                   {includeJackpotPass && (
                     <div className="summary-row">
                       <span>Jackpot Pass:</span>
                       <span>${jackpotPassPrice.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="summary-row total-cost">
                     <span>Total a debitar:</span>
                     <span>${getTotalCostDisplay().toFixed(2)}</span>
                   </div>
                   <div className="summary-row highlight">
                     <span>Ganancia potencial:</span>
                     <span>${potentialWin().toFixed(2)}</span>
                   </div>
                   {includeJackpotPass && jackpotInfo && (
                     <div className="summary-row jackpot-info">
                       <span>Jackpot potencial:</span>
                       <span>Hasta ${jackpotApi.formatPoolBalance(jackpotInfo.superJackpotPool * 0.05)}</span>
                     </div>
                   )}
                 </div>
               )}

               <Button
                 onClick={addBetToCart}
                 disabled={!numbers || !amount || numbers.length !== selectedBetType.digits}
                 fullWidth
               >
                 🛒 Agregar al Carrito
               </Button>

               <p className="blockchain-notice">
                 Las apuestas se agregan a tu carrito. Al comprar, se registran en el smart contract de Polygon.
                 Sistema híbrido no-custodial: tú controlas tus fondos.
               </p>
            </div>

            {/* Panel derecho - Info del sorteo */}
            {selectedDraw && (
              <div className="draw-info-section">
                <h3>Sorteo Actual</h3>
                <div className="draw-card">
                  <div className="draw-header">
                    <span className="draw-number">{selectedDraw.draw_number}</span>
                    <span className="draw-status open">ABIERTO</span>
                  </div>
                  <div className="draw-details">
                    <div className="detail-row">
                      <span className="label">Fecha/Hora:</span>
                      <span className="value">{formatDateTime(selectedDraw.scheduled_time)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Apuestas:</span>
                      <span className="value">{selectedDraw.bets_count}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Pozo:</span>
                      <span className="value">${parseFloat(selectedDraw.total_bets_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="multipliers-info">
                  <h4>Multiplicadores</h4>
                  <div className="multiplier-row">
                    <span>Fijo (2 digitos)</span>
                    <span className="mult">65x</span>
                  </div>
                  <div className="multiplier-row">
                    <span>Centena (3 digitos)</span>
                    <span className="mult">300x</span>
                  </div>
                  <div className="multiplier-row">
                    <span>Parle (4 digitos)</span>
                    <span className="mult">1500x</span>
                  </div>
                  <div className="stake-limits-info">
                    <h4>Limites de Apuesta</h4>
                    <p>Min: <strong>{MIN_STAKE} USDT</strong> | Max: <strong>{MAX_STAKE} USDT</strong></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carrito Simple */}
        {betCart.length > 0 && (
          <div className="bet-cart-simple">
            <div className="cart-simple-header">
              <span>🛒 {betCart.length} apuesta(s) en carrito</span>
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
                💳 Comprar
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Web3BettingPage;
