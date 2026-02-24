import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import './AdminLayout.css';

function AdminLayout({ children }) {
  const { admin, logoutAdmin } = useAdminAuth();

  const formatAddr = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="ops-layout">
      {/* Topbar */}
      <div className="ops-topbar">
        <div className="ops-topbar-left">
          <Link to="/" className="ops-topbar-logo">BOLCOIN</Link>
          <span className="ops-topbar-badge">ADMIN OPS</span>
        </div>
        <div className="ops-topbar-right">
          {admin && (
            <span className="ops-topbar-addr">{formatAddr(admin.address)}</span>
          )}
          <button className="ops-topbar-logout" onClick={logoutAdmin}>Logout</button>
        </div>
      </div>

      <div className="ops-body">
        {/* Sidebar */}
        <nav className="ops-sidebar">
          <NavLink to="/admin/ops" end className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            Overview
          </NavLink>
          <NavLink to="/admin/finance" className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            Finance
          </NavLink>
          <NavLink to="/admin/system" className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            System
          </NavLink>
          <NavLink to="/admin/risk" className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            Risk
          </NavLink>

          <div className="ops-nav-separator" />

          <NavLink to="/admin/keno-pool" className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            Keno Pool
          </NavLink>
          <NavLink to="/admin/bolita-pool" className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            La Bolita
          </NavLink>

          <div className="ops-nav-separator" />

          <NavLink to="/admin/legacy" className={({ isActive }) => `ops-nav-item ${isActive ? 'active' : ''}`}>
            Legacy
          </NavLink>
        </nav>

        {/* Content */}
        <main className="ops-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
