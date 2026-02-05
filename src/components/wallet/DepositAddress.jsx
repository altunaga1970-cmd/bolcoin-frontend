import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../common';
import * as paymentApi from '../../api/paymentApi';
import { formatCurrency } from '../../utils/formatters';
import './Wallet.css';

const STATUS_LABELS = {
  waiting: 'Esperando pago',
  confirming: 'Confirmando...',
  confirmed: 'Confirmado',
  sending: 'Procesando',
  finished: 'Completado',
  failed: 'Fallido',
  expired: 'Expirado'
};

const STATUS_COLORS = {
  waiting: 'warning',
  confirming: 'info',
  confirmed: 'info',
  sending: 'info',
  finished: 'success',
  failed: 'error',
  expired: 'error'
};

function DepositAddress({ deposit, onComplete, onCancel }) {
  const [currentDeposit, setCurrentDeposit] = useState(deposit);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  // Calcular tiempo restante
  useEffect(() => {
    if (!currentDeposit.expires_at) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const expires = new Date(currentDeposit.expires_at);
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(0);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [currentDeposit.expires_at]);

  // Polling del estado
  const checkStatus = useCallback(async () => {
    try {
      const data = await paymentApi.getDepositStatus(currentDeposit.id);
      setCurrentDeposit(data.deposit);

      if (data.deposit.payment_status === 'finished') {
        onComplete && onComplete(data.deposit);
      }
    } catch (err) {
      console.error('Error verificando estado:', err);
    }
  }, [currentDeposit.id, onComplete]);

  useEffect(() => {
    // Solo hacer polling si el estado es pendiente
    if (['waiting', 'confirming', 'confirmed', 'sending'].includes(currentDeposit.payment_status)) {
      const interval = setInterval(checkStatus, 10000); // Cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [currentDeposit.payment_status, checkStatus]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(currentDeposit.pay_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copiando:', err);
    }
  };

  const isCompleted = currentDeposit.payment_status === 'finished';
  const isFailed = ['failed', 'expired'].includes(currentDeposit.payment_status);

  return (
    <div className="deposit-address">
      <div className={`deposit-status status-${STATUS_COLORS[currentDeposit.payment_status]}`}>
        <span className="status-icon">
          {currentDeposit.payment_status === 'waiting' && '⏳'}
          {currentDeposit.payment_status === 'confirming' && '🔄'}
          {currentDeposit.payment_status === 'finished' && '✓'}
          {isFailed && '✕'}
        </span>
        <span className="status-text">{STATUS_LABELS[currentDeposit.payment_status]}</span>
      </div>

      {!isCompleted && !isFailed && (
        <>
          <div className="deposit-amount-info">
            <div className="amount-row">
              <span className="label">Enviar exactamente:</span>
              <span className="value crypto-amount">
                {currentDeposit.pay_amount} {currentDeposit.pay_currency.toUpperCase()}
              </span>
            </div>
            <div className="amount-row">
              <span className="label">Recibiras:</span>
              <span className="value">{formatCurrency(currentDeposit.price_amount)}</span>
            </div>
          </div>

          <div className="qr-container">
            {/* QR Code placeholder - usar libreria qrcode.react */}
            <div className="qr-placeholder">
              <div className="qr-text">QR</div>
              <span>Escanea para pagar</span>
            </div>
          </div>

          <div className="address-container">
            <label>Direccion de pago:</label>
            <div className="address-box">
              <code className="address-text">{currentDeposit.pay_address}</code>
              <Button
                size="sm"
                variant="secondary"
                onClick={copyAddress}
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>

          {timeLeft !== null && timeLeft !== 0 && (
            <div className="timer-container">
              <span className="timer-label">Tiempo restante:</span>
              <span className="timer-value">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
            </div>
          )}

          {timeLeft === 0 && (
            <div className="timer-expired">
              Esta direccion ha expirado
            </div>
          )}

          <div className="deposit-instructions">
            <p>1. Copia la direccion o escanea el codigo QR</p>
            <p>2. Envia exactamente {currentDeposit.pay_amount} {currentDeposit.pay_currency.toUpperCase()}</p>
            <p>3. Espera la confirmacion (puede tomar varios minutos)</p>
            <p>4. Tu balance se actualizara automaticamente</p>
          </div>
        </>
      )}

      {isCompleted && (
        <div className="deposit-completed">
          <div className="completed-icon">✓</div>
          <h4>Deposito completado!</h4>
          <p>Se han acreditado {formatCurrency(currentDeposit.outcome_amount || currentDeposit.price_amount)} a tu cuenta.</p>
          <Button onClick={onCancel}>Cerrar</Button>
        </div>
      )}

      {isFailed && (
        <div className="deposit-failed">
          <div className="failed-icon">✕</div>
          <h4>Deposito {currentDeposit.payment_status === 'expired' ? 'expirado' : 'fallido'}</h4>
          <p>Por favor, intenta crear un nuevo deposito.</p>
          <Button onClick={onCancel}>Crear nuevo deposito</Button>
        </div>
      )}

      {!isCompleted && !isFailed && (
        <div className="deposit-actions">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={checkStatus}>
            Verificar estado
          </Button>
        </div>
      )}
    </div>
  );
}

export default DepositAddress;
