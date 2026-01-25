import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_COLORS } from '../../utils/constants';
import { Spinner } from '../common';
import './Wallet.css';

function TransactionList({ transactions, isLoading, onLoadMore, hasMore }) {
  if (isLoading && transactions.length === 0) {
    return (
      <div className="transactions-loading">
        <Spinner />
        <p>Cargando transacciones...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="transactions-empty">
        <p>No hay transacciones todavia.</p>
      </div>
    );
  }

  return (
    <div className="transactions-list">
      <h3 className="transactions-title">Historial de Transacciones</h3>

      <div className="transactions-table">
        <div className="transactions-header">
          <span>Tipo</span>
          <span>Monto</span>
          <span>Descripcion</span>
          <span>Fecha</span>
        </div>

        {transactions.map(tx => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </div>

      {hasMore && (
        <div className="transactions-load-more">
          <button
            className="load-more-btn"
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? 'Cargando...' : 'Cargar mas'}
          </button>
        </div>
      )}
    </div>
  );
}

function TransactionRow({ transaction }) {
  const { type, amount, description, created_at } = transaction;
  const typeLabel = TRANSACTION_TYPE_LABELS[type] || type;
  const colorClass = TRANSACTION_TYPE_COLORS[type] || 'default';

  const isPositive = ['recharge', 'win', 'refund'].includes(type);
  const amountClass = isPositive ? 'positive' : 'negative';

  return (
    <div className="transaction-row">
      <span className={`transaction-type type-${colorClass}`}>
        {typeLabel}
      </span>
      <span className={`transaction-amount ${amountClass}`}>
        {isPositive ? '+' : '-'}{formatCurrency(Math.abs(amount))}
      </span>
      <span className="transaction-description">
        {description || '-'}
      </span>
      <span className="transaction-date">
        {formatDateTime(created_at)}
      </span>
    </div>
  );
}

export default TransactionList;
