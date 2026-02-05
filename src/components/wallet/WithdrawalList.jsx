import React, { useState, useEffect, useCallback } from 'react';
import { Button, Spinner } from '../common';
import * as paymentApi from '../../api/paymentApi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import './Wallet.css';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aprobado', color: 'info' },
  processing: { label: 'Procesando', color: 'info' },
  completed: { label: 'Completado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' }
};

function WithdrawalList({ refreshTrigger }) {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadWithdrawals = useCallback(async (loadMore = false) => {
    try {
      setIsLoading(true);
      const currentPage = loadMore ? page + 1 : 1;
      const data = await paymentApi.getWithdrawals(currentPage, 10);

      if (loadMore) {
        setWithdrawals(prev => [...prev, ...data.withdrawals]);
      } else {
        setWithdrawals(data.withdrawals);
      }

      setPage(currentPage);
      setHasMore(currentPage < data.pagination.totalPages);
    } catch (err) {
      console.error('Error cargando retiros:', err);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadWithdrawals();
  }, [refreshTrigger, loadWithdrawals]);

  if (isLoading && withdrawals.length === 0) {
    return (
      <div className="withdrawal-list loading-container">
        <Spinner />
      </div>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <div className="withdrawal-list empty">
        <p>No tienes retiros registrados</p>
      </div>
    );
  }

  return (
    <div className="withdrawal-list">
      <h4>Historial de Retiros</h4>

      <div className="withdrawals-table">
        <div className="table-header withdrawal-header">
          <span>Fecha</span>
          <span>Monto</span>
          <span>Crypto</span>
          <span>Estado</span>
        </div>

        {withdrawals.map(withdrawal => {
          const status = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;

          return (
            <div key={withdrawal.id} className="table-row withdrawal-row">
              <span className="date">{formatDateTime(withdrawal.created_at)}</span>
              <span className="amount">{formatCurrency(withdrawal.amount)}</span>
              <span className="crypto">{withdrawal.crypto_currency.toUpperCase()}</span>
              <span className={`status-badge ${status.color}`}>
                {status.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detalles expandibles */}
      {withdrawals.map(withdrawal => (
        withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
          <div key={`reason-${withdrawal.id}`} className="rejection-reason">
            <strong>Retiro #{withdrawal.id} rechazado:</strong> {withdrawal.rejection_reason}
          </div>
        )
      ))}

      {hasMore && (
        <div className="load-more">
          <Button
            variant="ghost"
            onClick={() => loadWithdrawals(true)}
            loading={isLoading}
          >
            Cargar mas
          </Button>
        </div>
      )}
    </div>
  );
}

export default WithdrawalList;
