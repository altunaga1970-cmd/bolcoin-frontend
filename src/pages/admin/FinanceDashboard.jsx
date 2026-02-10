import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getOpsSummary } from '../../api/adminOpsApi';

function FinanceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOpsSummary()
      .then(res => setData(res))
      .catch(err => setError(err.message || 'Error loading data'))
      .finally(() => setLoading(false));
  }, []);

  const formatUSD = (val) => {
    return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const netPosition = data
    ? (data.totals?.totalDeposits || 0) - (data.totals?.totalWithdrawals || 0)
    : 0;

  return (
    <AdminLayout>
      <h1 className="ops-page-title">Finance</h1>

      {loading && <div className="ops-loading">Loading...</div>}
      {error && <div className="ops-error">{error}</div>}

      {data && (
        <div className="ops-cards-grid">
          <div className="ops-card">
            <div className="ops-card-label">Total Deposits</div>
            <div className="ops-card-value healthy">{formatUSD(data.totals?.totalDeposits)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Total Withdrawals</div>
            <div className="ops-card-value">{formatUSD(data.totals?.totalWithdrawals)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Fees Collected</div>
            <div className="ops-card-value gold">{formatUSD(data.totals?.totalFees)}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Net Position (Deposits - Withdrawals)</div>
            <div className={`ops-card-value ${netPosition >= 0 ? 'healthy' : 'degraded'}`}>
              {formatUSD(netPosition)}
            </div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Pending Withdrawals Count</div>
            <div className="ops-card-value">{data.pendingWithdrawals?.count || 0}</div>
          </div>

          <div className="ops-card">
            <div className="ops-card-label">Pending Withdrawals Amount</div>
            <div className="ops-card-value">{formatUSD(data.pendingWithdrawals?.totalAmount)}</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default FinanceDashboard;
