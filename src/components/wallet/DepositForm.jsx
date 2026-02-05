import React, { useState, useEffect } from 'react';
import { Button, Input, Spinner } from '../common';
import * as paymentApi from '../../api/paymentApi';
import { validateRechargeAmount } from '../../utils/validators';
import './Wallet.css';

const QUICK_AMOUNTS = [10, 25, 50, 100, 500, 1000];

function DepositForm({ onDepositCreated }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [currencies, setCurrencies] = useState([]);
  const [minAmount, setMinAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [error, setError] = useState('');

  // Cargar criptomonedas disponibles
  useEffect(() => {
    async function loadCurrencies() {
      try {
        const data = await paymentApi.getCurrencies();
        // Filtrar las mas populares primero
        const popular = ['btc', 'eth', 'ltc', 'usdttrc20', 'usdt', 'usdterc20', 'bnb', 'doge', 'xrp', 'sol'];
        const sorted = data.currencies.sort((a, b) => {
          const aIndex = popular.indexOf(a.toLowerCase());
          const bIndex = popular.indexOf(b.toLowerCase());
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setCurrencies(sorted);
        // Seleccionar USDT por defecto si esta disponible
        const defaultCurrency = sorted.find(c => c.toLowerCase().includes('usdt')) || sorted[0];
        if (defaultCurrency) setCurrency(defaultCurrency);
      } catch (err) {
        setError('Error cargando criptomonedas');
        console.error(err);
      } finally {
        setLoadingCurrencies(false);
      }
    }
    loadCurrencies();
  }, []);

  // Obtener monto minimo cuando cambia la moneda
  useEffect(() => {
    async function loadMinAmount() {
      if (!currency) return;
      try {
        const data = await paymentApi.getMinAmount(currency);
        setMinAmount(data.min_amount);
      } catch (err) {
        console.error('Error obteniendo monto minimo:', err);
      }
    }
    loadMinAmount();
  }, [currency]);

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validar monto
    const validation = validateRechargeAmount(parseFloat(amount));
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    if (!currency) {
      setError('Selecciona una criptomoneda');
      return;
    }

    setIsLoading(true);
    try {
      const deposit = await paymentApi.createDeposit(parseFloat(amount), currency);
      onDepositCreated(deposit.deposit);
    } catch (err) {
      setError(err.response?.data?.message || 'Error creando deposito');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCurrencies) {
    return (
      <div className="deposit-form loading-container">
        <Spinner />
        <p>Cargando opciones de pago...</p>
      </div>
    );
  }

  return (
    <form className="deposit-form" onSubmit={handleSubmit}>
      <h3>Depositar Fondos</h3>

      <div className="form-group">
        <label>Monto en USDT</label>
        <div className="quick-amounts">
          {QUICK_AMOUNTS.map(value => (
            <button
              key={value}
              type="button"
              className={`quick-amount-btn ${amount === value.toString() ? 'active' : ''}`}
              onClick={() => handleQuickAmount(value)}
            >
              ${value}
            </button>
          ))}
        </div>
        <Input
          type="number"
          placeholder="O ingresa otro monto"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError('');
          }}
          min="1"
          max="100000"
          step="0.01"
        />
      </div>

      <div className="form-group">
        <label>Criptomoneda a enviar</label>
        <select
          className="currency-select"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {currencies.map(cur => (
            <option key={cur} value={cur}>
              {cur.toUpperCase()}
            </option>
          ))}
        </select>
        {minAmount && (
          <span className="min-amount-hint">
            Minimo: {minAmount} {currency.toUpperCase()}
          </span>
        )}
      </div>

      {error && <div className="form-error">{error}</div>}

      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        disabled={!amount || !currency}
      >
        Generar Direccion de Pago
      </Button>

      <p className="deposit-info">
        Tu deposito sera convertido automaticamente a USDT al precio actual del mercado.
      </p>
    </form>
  );
}

export default DepositForm;
