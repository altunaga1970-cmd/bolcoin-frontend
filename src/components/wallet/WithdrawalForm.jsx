import React, { useState, useEffect } from 'react';
import { Button, Input, Alert } from '../common';
import * as paymentApi from '../../api/paymentApi';
import { formatCurrency } from '../../utils/formatters';
import './Wallet.css';

const POPULAR_CURRENCIES = [
  { code: 'usdttrc20', name: 'USDT (TRC20)' },
  { code: 'usdterc20', name: 'USDT (ERC20)' },
  { code: 'btc', name: 'Bitcoin' },
  { code: 'eth', name: 'Ethereum' },
  { code: 'ltc', name: 'Litecoin' },
  { code: 'bnb', name: 'BNB' },
  { code: 'sol', name: 'Solana' },
  { code: 'xrp', name: 'XRP' }
];

function WithdrawalForm({ balance, onWithdrawalCreated }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usdttrc20');
  const [walletAddress, setWalletAddress] = useState('');
  const [limits, setLimits] = useState({ min: 5, autoLimit: 500 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar limites
  useEffect(() => {
    async function loadLimits() {
      try {
        const data = await paymentApi.getWithdrawalLimits();
        setLimits(data);
      } catch (err) {
        console.error('Error cargando limites:', err);
      }
    }
    loadLimits();
  }, []);

  const handleMaxAmount = () => {
    setAmount(balance.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numAmount = parseFloat(amount);

    // Validaciones
    if (!numAmount || numAmount <= 0) {
      setError('Ingresa un monto valido');
      return;
    }

    if (numAmount < limits.min) {
      setError(`El monto minimo de retiro es ${limits.min} USDT`);
      return;
    }

    if (numAmount > balance) {
      setError('Monto excede tu balance disponible');
      return;
    }

    if (!currency) {
      setError('Selecciona una criptomoneda');
      return;
    }

    if (!walletAddress.trim()) {
      setError('Ingresa la direccion de tu wallet');
      return;
    }

    // Validacion basica de direccion
    if (walletAddress.length < 20) {
      setError('La direccion de wallet parece invalida');
      return;
    }

    setIsLoading(true);
    try {
      const result = await paymentApi.requestWithdrawal(numAmount, currency, walletAddress);

      if (result.withdrawal.requires_approval) {
        setSuccess('Retiro enviado para aprobacion. Te notificaremos cuando sea procesado.');
      } else {
        setSuccess('Retiro procesado exitosamente!');
      }

      setAmount('');
      setWalletAddress('');
      onWithdrawalCreated && onWithdrawalCreated(result.withdrawal);
    } catch (err) {
      setError(err.response?.data?.message || 'Error procesando retiro');
    } finally {
      setIsLoading(false);
    }
  };

  const requiresApproval = parseFloat(amount) > limits.autoLimit;

  return (
    <form className="withdrawal-form" onSubmit={handleSubmit}>
      <h3>Retirar Fondos</h3>

      <div className="balance-info">
        <span>Balance disponible:</span>
        <span className="balance-value">{formatCurrency(balance)}</span>
      </div>

      <div className="form-group">
        <label>Monto a retirar (USDT)</label>
        <div className="amount-input-row">
          <Input
            type="number"
            placeholder={`Minimo ${limits.min} USDT`}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
              setSuccess('');
            }}
            min={limits.min}
            max={balance}
            step="0.01"
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleMaxAmount}>
            MAX
          </Button>
        </div>
      </div>

      <div className="form-group">
        <label>Criptomoneda de salida</label>
        <select
          className="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {POPULAR_CURRENCIES.map(cur => (
            <option key={cur.code} value={cur.code}>
              {cur.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Direccion de wallet</label>
        <Input
          type="text"
          placeholder={`Tu direccion de ${currency.toUpperCase()}`}
          value={walletAddress}
          onChange={(e) => {
            setWalletAddress(e.target.value);
            setError('');
          }}
        />
      </div>

      {requiresApproval && (
        <Alert type="warning">
          Los retiros mayores a {formatCurrency(limits.autoLimit)} requieren aprobacion del administrador.
          El proceso puede tomar hasta 24 horas.
        </Alert>
      )}

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        disabled={!amount || !currency || !walletAddress}
      >
        {requiresApproval ? 'Solicitar Retiro' : 'Retirar Ahora'}
      </Button>

      <div className="withdrawal-info">
        <p>Minimo: {formatCurrency(limits.min)}</p>
        <p>Retiros hasta {formatCurrency(limits.autoLimit)}: Automaticos</p>
        <p>Retiros mayores: Requieren aprobacion</p>
      </div>
    </form>
  );
}

export default WithdrawalForm;
