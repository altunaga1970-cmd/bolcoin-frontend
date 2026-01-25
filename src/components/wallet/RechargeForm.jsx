import React, { useState } from 'react';
import { Button, Input, Alert } from '../common';
import { validateRechargeAmount } from '../../utils/validators';
import { QUICK_RECHARGE_OPTIONS } from '../../utils/constants';
import './Wallet.css';

function RechargeForm({ onSubmit, isLoading, error }) {
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState(null);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    setValidationError(null);
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validation = validateRechargeAmount(amount);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    onSubmit(parseFloat(amount));
    setAmount('');
  };

  return (
    <form className="recharge-form" onSubmit={handleSubmit}>
      <h3 className="recharge-title">Recargar Balance</h3>

      {(error || validationError) && (
        <Alert type="error" className="recharge-error">
          {error || validationError}
        </Alert>
      )}

      <div className="quick-amounts">
        {QUICK_RECHARGE_OPTIONS.map(value => (
          <button
            key={value}
            type="button"
            className={`quick-amount-btn ${amount === value.toString() ? 'active' : ''}`}
            onClick={() => handleQuickAmount(value)}
          >
            {value} USDT
          </button>
        ))}
      </div>

      <Input
        label="Monto personalizado"
        type="number"
        value={amount}
        onChange={handleAmountChange}
        placeholder="Ingresa el monto"
        min="1"
        max="100000"
        step="0.01"
      />

      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        disabled={!amount}
      >
        Recargar
      </Button>
    </form>
  );
}

export default RechargeForm;
