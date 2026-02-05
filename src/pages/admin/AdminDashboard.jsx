import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../../components/common';
import './AdminPages.css';

function AdminDashboard() {
  const { adminRole, logout } = useAdminAuth();
  const { account, formatAddress } = useWeb3();

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
          <Link to="/admin/audit-logs">Logs</Link>
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </nav>
      </header>

      <main className="admin-main">
        <h1 className="page-title">Panel de Administracion</h1>
        <p className="admin-welcome">
          Wallet: {formatAddress(account)} | Rol: {adminRole}
        </p>

        <div className="admin-grid">
          <div className="admin-card">
            <h3>Gestionar Sorteos</h3>
            <p>Crear, abrir, cerrar sorteos e ingresar resultados</p>
            <Link to="/admin/draws">
              <Button fullWidth>Ir a Sorteos</Button>
            </Link>
          </div>

          <div className="admin-card">
            <h3>Gestionar Usuarios</h3>
            <p>Ver usuarios, ajustar balances</p>
            <Link to="/admin/users">
              <Button variant="secondary" fullWidth>Ir a Usuarios</Button>
            </Link>
          </div>

          <div className="admin-card">
            <h3>Gestionar Retiros</h3>
            <p>Aprobar o rechazar solicitudes de retiro</p>
            <Link to="/admin/withdrawals">
              <Button variant="secondary" fullWidth>Ir a Retiros</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
