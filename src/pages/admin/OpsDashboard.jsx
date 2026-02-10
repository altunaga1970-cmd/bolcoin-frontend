import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getOpsSummary } from '../../api/adminOpsApi';

function OpsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOpsSummary()
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Error loading summary'))
      .finally(() => setLoading(false));
  }, []);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const formatUSD = (val) => {
    return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AdminLayout>
      <h1 className="ops-page-title">Operations Overview</h1>

      {loading && <div className="ops-loading">Loading...</div>}
      {error && <div className="ops-error">{error}</div>}

      {data && (
        <div className="ops-cards-grid">
          <div className="ops-card">
            <div className="ops-card-label">System Health</div>
            <div className={`ops-card-value ${data.health}`}>{data.health}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Database</div>
            <div className={`ops-card-value ${data.dbAvailable ? 'healthy' : 'degraded'}`}>
              {data.dbAvailable ? 'Connected' : 'Unavailable'}
            </div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Uptime</div>
            <div className="ops-card-value">{formatUptime(data.uptime)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Total Users</div>
            <div className="ops-card-value gold">{data.totals?.totalUsers || 0}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Total Deposits</div>
            <div className="ops-card-value">{formatUSD(data.totals?.totalDeposits)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Total Withdrawals</div>
            <div className="ops-card-value">{formatUSD(data.totals?.totalWithdrawals)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Total Fees</div>
            <div className="ops-card-value">{formatUSD(data.totals?.totalFees)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Pending Withdrawals</div>
            <div className="ops-card-value">
              {data.pendingWithdrawals?.count || 0}
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginLeft: '0.5rem' }}>
                ({formatUSD(data.pendingWithdrawals?.totalAmount)})
              </span>
            </div>
          </div>

          {data.kenoPool && (
            <div className="ops-card">
              <div className="ops-card-label">Keno Pool</div>
              <div className="ops-card-value gold">Active</div>
            </div>
          )}

          <div className="ops-card" style={{ gridColumn: '1 / -1' }}>
            <div className="ops-card-label">Feature Flags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {data.flags && Object.entries(data.flags).map(([key, enabled]) => (
                <span
                  key={key}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: enabled ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: enabled ? '#10b981' : '#ef4444',
                    border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}
                >
                  {key}: {enabled ? 'ON' : 'OFF'}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default OpsDashboard;
