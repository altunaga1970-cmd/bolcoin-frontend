import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import './Wallet.css';

function BalanceDisplay({ balance, size = 'md' }) {
  return (
    <div className={`balance-display balance-${size}`}>
      <span className="balance-label">Balance Actual</span>
      <span className="balance-value">{formatCurrency(balance)}</span>
    </div>
  );
}

export default BalanceDisplay;
