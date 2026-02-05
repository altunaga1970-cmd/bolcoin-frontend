import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Spinner } from '../../components/common';
import * as adminApi from '../../api/adminApi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import './AdminPages.css';

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'warning' },
  approved: { label: 'Aprobado', color: 'info' },
  processing: { label: 'Procesando', color: 'info' },
  completed: { label: 'Completado', color: 'success' },
  rejected: { label: 'Rechazado', color: 'error' }
};

function WithdrawalsPage() {
  const { logout } = useAdminAuth();
  const { success, error } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal de rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getWithdrawals(1, 100, statusFilter === 'all' ? null : statusFilter);
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      error('Error al cargar retiros');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, error]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = async (withdrawal) => {
    if (!window.confirm(`Aprobar retiro de ${formatCurrency(withdrawal.amount)} para ${withdrawal.username}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await adminApi.approveWithdrawal(withdrawal.id);
      success('Retiro aprobado y procesado');
      fetchWithdrawals();
    } catch (err) {
      error(err.response?.data?.message || 'Error al aprobar retiro');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();

    if (!rejectReason.trim()) {
      error('Ingresa una razon para el rechazo');
      return;
    }

    setIsProcessing(true);
    try {
      await adminApi.rejectWithdrawal(selectedWithdrawal.id, rejectReason);
      success('Retiro rechazado');
      setShowRejectModal(false);
      fetchWithdrawals();
    } catch (err) {
      error(err.response?.data?.message || 'Error al rechazar retiro');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = withdrawals.filter(w => w.status === 'pending' && w.requires_approval).length;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="admin-logo">LA BOLITA</Link>
        <span className="admin-badge">ADMIN</span>
        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/draws">Sorteos</Link>
          <Link to="/admin/users">Usuarios</Link>
          <Link to="/admin/withdrawals">Retiros</Link>
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </nav>
      </header>

      <main className="admin-main">
        <div className="page-header-row">
          <h1 className="page-title">
            Gestionar Retiros
            {pendingCount > 0 && (
              <span className="pending-badge">{pendingCount} pendientes</span>
            )}
          </h1>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pendientes
          </button>
          <button
            className={`filter-tab ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => setStatusFilter('processing')}
          >
            Procesando
          </button>
          <button
            className={`filter-tab ${statusFilter === 'completed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('completed')}
          >
            Completados
          </button>
          <button
            className={`filter-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rechazados
          </button>
          <button
            className={`filter-tab ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Todos
          </button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <Spinner size="lg" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">
            <p>No hay retiros en esta categoria</p>
          </div>
        ) : (
          <div className="withdrawals-admin-table">
            <div className="table-header withdrawals-header">
              <span>ID</span>
              <span>Usuario</span>
              <span>Monto</span>
              <span>Crypto</span>
              <span>Direccion</span>
              <span>Fecha</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {withdrawals.map(withdrawal => {
              const statusInfo = STATUS_CONFIG[withdrawal.status] || STATUS_CONFIG.pending;

              return (
                <div key={withdrawal.id} className="table-row withdrawals-row">
                  <span className="withdrawal-id">#{withdrawal.id}</span>
                  <span className="username">
                    {withdrawal.username}
                    <span className="email-small">{withdrawal.email}</span>
                  </span>
                  <span className="amount">{formatCurrency(withdrawal.amount)}</span>
                  <span className="crypto">{withdrawal.crypto_currency.toUpperCase()}</span>
                  <span className="address" title={withdrawal.wallet_address}>
                    {withdrawal.wallet_address.substring(0, 12)}...
                  </span>
                  <span className="date">{formatDateTime(withdrawal.created_at)}</span>
                  <span className={`status-badge ${statusInfo.color}`}>
                    {statusInfo.label}
                    {withdrawal.requires_approval && withdrawal.status === 'pending' && ' (Requiere aprobacion)'}
                  </span>
                  <span className="actions-cell">
                    {withdrawal.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal)}
                          loading={isProcessing}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openRejectModal(withdrawal)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                      <span className="rejection-hint" title={withdrawal.rejection_reason}>
                        Ver razon
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Rechazo */}
      {showRejectModal && selectedWithdrawal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rechazar Retiro</h2>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>x</button>
            </div>
            <form onSubmit={handleReject}>
              <div className="modal-body">
                <p className="modal-info">
                  Usuario: <strong>{selectedWithdrawal.username}</strong>
                </p>
                <p className="modal-info">
                  Monto: <strong>{formatCurrency(selectedWithdrawal.amount)}</strong>
                </p>
                <p className="modal-info">
                  Direccion: <strong>{selectedWithdrawal.wallet_address}</strong>
                </p>

                <Input
                  label="Razon del rechazo"
                  placeholder="Ej: Direccion invalida, Actividad sospechosa, etc."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowRejectModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isProcessing}>
                  Confirmar Rechazo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WithdrawalsPage;
