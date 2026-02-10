import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getOpsSummary } from '../../api/adminOpsApi';

function SystemStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOpsSummary()
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  }, []);

  const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <AdminLayout>
      <h1 className="ops-page-title">System Status</h1>

      {loading && <div className="ops-loading">Loading...</div>}
      {error && <div className="ops-error">{error}</div>}

      {data && (
        <>
          <div className="ops-cards-grid">
            <div className="ops-card">
              <div className="ops-card-label">Health</div>
              <div className={`ops-card-value ${data.health}`}>{data.health}</div>
            </div>

            <div className="ops-card">
              <div className="ops-card-label">Database Connection</div>
              <div className={`ops-card-value ${data.dbAvailable ? 'healthy' : 'degraded'}`}>
                {data.dbAvailable ? 'Connected' : 'Unavailable'}
              </div>
            </div>

            <div className="ops-card">
              <div className="ops-card-label">Server Uptime</div>
              <div className="ops-card-value">{formatUptime(data.uptime)}</div>
            </div>

            <div className="ops-card">
              <div className="ops-card-label">Scheduler</div>
              <div className={`ops-card-value ${data.schedulerRunning ? 'healthy' : 'degraded'}`}>
                {data.schedulerRunning ? 'Running' : 'Stopped'}
              </div>
            </div>
          </div>

          <h2 style={{ color: '#fff', fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem' }}>
            Feature Flags
          </h2>
          <div>
            {data.flags && Object.entries(data.flags).map(([key, enabled]) => (
              <div key={key} className="ops-toggle-row" style={{ cursor: 'default' }}>
                <div className="ops-toggle-info">
                  <div className="ops-toggle-key">{key}</div>
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: enabled ? '#10b981' : '#ef4444'
                }}>
                  {enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}

export default SystemStatus;
