import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const LEGACY_PAGES = [
  { path: '/admin/draws', title: 'Sorteos', desc: 'Manage lottery draws and results' },
  { path: '/admin/users', title: 'Usuarios', desc: 'View and manage user accounts' },
  { path: '/admin/withdrawals', title: 'Retiros', desc: 'Process and review withdrawal requests' },
  { path: '/admin/audit-logs', title: 'Audit Logs', desc: 'View system audit trail' },
  { path: '/admin/web3', title: 'Web3', desc: 'Web3 and blockchain administration' },
  { path: '/admin/bankroll', title: 'Bankroll', desc: 'Bankroll management dashboard' },
  { path: '/admin/keno-pool', title: 'Keno Pool', desc: 'Keno pool health and management' }
];

function LegacyHome() {
  return (
    <AdminLayout>
      <h1 className="ops-page-title">Legacy Admin Pages</h1>

      <div className="ops-legacy-grid">
        {LEGACY_PAGES.map(page => (
          <Link key={page.path} to={page.path} className="ops-legacy-card">
            <div className="ops-legacy-card-title">{page.title}</div>
            <div className="ops-legacy-card-desc">{page.desc}</div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}

export default LegacyHome;
