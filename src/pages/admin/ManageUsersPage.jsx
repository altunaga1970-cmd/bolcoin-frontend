import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Spinner } from '../../components/common';
import * as adminApi from '../../api/adminApi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import './AdminPages.css';

function ManageUsersPage() {
  const { logout } = useAdminAuth();
  const { success, error } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de ajuste de balance
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Modal de detalles
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers(1, 100, searchTerm);
      setUsers(data.users || []);
    } catch (err) {
      error('Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const openBalanceModal = (user) => {
    setSelectedUser(user);
    setAdjustAmount('');
    setAdjustReason('');
    setShowBalanceModal(true);
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();

    const amount = parseFloat(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      error('Ingresa un monto valido (positivo para agregar, negativo para quitar)');
      return;
    }

    if (!adjustReason.trim()) {
      error('Ingresa una razon para el ajuste');
      return;
    }

    setIsAdjusting(true);
    try {
      await adminApi.adjustBalance(selectedUser.id, amount, adjustReason);
      success(`Balance ajustado: ${amount > 0 ? '+' : ''}${amount} USDT`);
      setShowBalanceModal(false);
      fetchUsers();
    } catch (err) {
      error(err.message || 'Error al ajustar balance');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openDetailsModal = async (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setLoadingDetails(true);

    try {
      const data = await adminApi.getUserById(user.id);
      setUserDetails(data.user);
      setUserStats(data.stats);
    } catch (err) {
      error('Error al cargar detalles del usuario');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/" className="admin-logo">LA BOLITA</Link>
        <span className="admin-badge">ADMIN</span>
        <nav className="admin-nav">
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/draws">Sorteos</Link>
          <Link to="/admin/users">Usuarios</Link>
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </nav>
      </header>

      <main className="admin-main">
        <div className="page-header-row">
          <h1 className="page-title">Gestionar Usuarios</h1>
        </div>

        <form className="search-form" onSubmit={handleSearch}>
          <Input
            placeholder="Buscar por username o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit">Buscar</Button>
        </form>

        {isLoading ? (
          <div className="loading-container">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header users-header">
              <span>ID</span>
              <span>Usuario</span>
              <span>Email</span>
              <span>Rol</span>
              <span>Balance</span>
              <span>Registro</span>
              <span>Acciones</span>
            </div>
            {users.map(user => (
              <div key={user.id} className="table-row users-row">
                <span className="user-id">{user.id}</span>
                <span className="username">{user.username}</span>
                <span className="email">{user.email}</span>
                <span className={`role-badge ${user.role}`}>
                  {user.role === 'admin' ? 'Admin' : 'Usuario'}
                </span>
                <span className="balance">{formatCurrency(user.balance)}</span>
                <span className="date">{formatDateTime(user.created_at)}</span>
                <span className="actions-cell">
                  <Button size="sm" variant="ghost" onClick={() => openDetailsModal(user)}>
                    Ver
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => openBalanceModal(user)}>
                    Ajustar
                  </Button>
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Ajustar Balance */}
      {showBalanceModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowBalanceModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajustar Balance</h2>
              <button className="modal-close" onClick={() => setShowBalanceModal(false)}>x</button>
            </div>
            <form onSubmit={handleAdjustBalance}>
              <div className="modal-body">
                <p className="modal-info">
                  Usuario: <strong>{selectedUser.username}</strong>
                </p>
                <p className="modal-info">
                  Balance actual: <strong>{formatCurrency(selectedUser.balance)}</strong>
                </p>

                <Input
                  label="Monto a ajustar"
                  type="number"
                  step="0.01"
                  placeholder="Ej: 100 para agregar, -50 para quitar"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                />

                <Input
                  label="Razon del ajuste"
                  placeholder="Ej: Bonificacion, Correccion, etc."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                />

                {adjustAmount && !isNaN(parseFloat(adjustAmount)) && (
                  <div className="balance-preview">
                    Nuevo balance: <strong>
                      {formatCurrency(parseFloat(selectedUser.balance) + parseFloat(adjustAmount))}
                    </strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowBalanceModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isAdjusting}>
                  Confirmar Ajuste
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles de Usuario */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-details" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Usuario</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>x</button>
            </div>
            <div className="modal-body">
              {loadingDetails ? (
                <div className="loading-container">
                  <Spinner />
                </div>
              ) : userDetails ? (
                <div className="user-details">
                  <div className="detail-section">
                    <h4>Informacion General</h4>
                    <div className="detail-row">
                      <span>ID:</span>
                      <span>{userDetails.id}</span>
                    </div>
                    <div className="detail-row">
                      <span>Usuario:</span>
                      <span>{userDetails.username}</span>
                    </div>
                    <div className="detail-row">
                      <span>Email:</span>
                      <span>{userDetails.email}</span>
                    </div>
                    <div className="detail-row">
                      <span>Rol:</span>
                      <span className={`role-badge ${userDetails.role}`}>
                        {userDetails.role === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Balance:</span>
                      <span className="balance-value">{formatCurrency(userDetails.balance)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Registro:</span>
                      <span>{formatDateTime(userDetails.created_at)}</span>
                    </div>
                    <div className="detail-row">
                      <span>Ultimo login:</span>
                      <span>{userDetails.last_login ? formatDateTime(userDetails.last_login) : 'Nunca'}</span>
                    </div>
                  </div>

                  {userStats && (
                    <div className="detail-section">
                      <h4>Estadisticas</h4>
                      <div className="detail-row">
                        <span>Total apuestas:</span>
                        <span>{userStats.total_bets || 0}</span>
                      </div>
                      <div className="detail-row">
                        <span>Apostado total:</span>
                        <span>{formatCurrency(userStats.total_wagered || 0)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Ganancias totales:</span>
                        <span className="win-value">{formatCurrency(userStats.total_winnings || 0)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>No se pudieron cargar los detalles</p>
              )}
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => {
                setShowDetailsModal(false);
                openBalanceModal(selectedUser);
              }}>
                Ajustar Balance
              </Button>
              <Button onClick={() => setShowDetailsModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsersPage;
