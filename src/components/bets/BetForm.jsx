import React, { useState } from 'react';
import { Button, Input } from '../common';
import GameTypeSelector from './GameTypeSelector';
import { GAME_RULES, QUICK_BET_AMOUNTS } from '../../utils/constants';
import { validateBetNumber, validateBetAmount } from '../../utils/validators';
import { formatCurrency, calculatePotentialWin } from '../../utils/formatters';
import './Bets.css';

function BetForm({ onAddBet, balance }) {
  const [gameType, setGameType] = useState('fijos');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  const rules = GAME_RULES[gameType];

  const handleNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Solo numeros
    if (value.length <= rules.digits) {
      setNumber(value);
      if (errors.number) {
        setErrors(prev => ({ ...prev, number: null }));
      }
    }
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: null }));
    }
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    // Validar numero
    const numberValidation = validateBetNumber(gameType, number);
    if (!numberValidation.valid) {
      newErrors.number = numberValidation.error;
    }

    // Validar monto
    const costMultiplier = gameType === 'corrido' ? 2 : 1;
    const totalCost = parseFloat(amount) * costMultiplier;
    const amountValidation = validateBetAmount(amount, balance);
    if (!amountValidation.valid) {
      newErrors.amount = amountValidation.error;
    } else if (totalCost > balance) {
      newErrors.amount = 'Balance insuficiente para esta apuesta';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Agregar apuesta
    onAddBet({
      gameType,
      number: number.padStart(rules.digits, '0'),
      amount: parseFloat(amount),
      multiplier: rules.multiplier
    });

    // Limpiar formulario
    setNumber('');
    setAmount('');
    setErrors({});
  };

  const potentialWin = amount ? calculatePotentialWin(parseFloat(amount), rules.multiplier) : 0;
  const totalCost = amount ? parseFloat(amount) * (gameType === 'corrido' ? 2 : 1) : 0;

  return (
    <form className="bet-form" onSubmit={handleSubmit}>
      <GameTypeSelector
        selectedType={gameType}
        onSelect={setGameType}
      />

      <div className="bet-form-inputs">
        <div className="bet-number-input">
          <Input
            label={`Numero (${rules.digits} digitos)`}
            type="text"
            value={number}
            onChange={handleNumberChange}
            placeholder={rules.placeholder}
            maxLength={rules.digits}
            error={errors.number}
          />
        </div>

        <div className="bet-amount-input">
          <Input
            label="Monto (USDT)"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="Ej: 10"
            min="1"
            max="1000"
            step="0.01"
            error={errors.amount}
          />
          <div className="quick-amounts">
            {QUICK_BET_AMOUNTS.map(value => (
              <button
                key={value}
                type="button"
                className={`quick-btn ${amount === value.toString() ? 'active' : ''}`}
                onClick={() => handleQuickAmount(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {amount && number && (
        <div className="bet-preview">
          <div className="preview-row">
            <span>Costo total:</span>
            <span className="preview-value">{formatCurrency(totalCost)}</span>
          </div>
          <div className="preview-row">
            <span>Ganancia potencial:</span>
            <span className="preview-value potential-win">{formatCurrency(potentialWin)}</span>
          </div>
          {gameType === 'corrido' && (
            <div className="preview-note">
              * Corrido crea 2 apuestas Fijos: {number.slice(0, 2).padStart(2, '0')} y {number.slice(2).padStart(2, '0')}
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        fullWidth
        disabled={!number || !amount}
      >
        Agregar al Carrito
      </Button>
    </form>
  );
}

export default BetForm;
