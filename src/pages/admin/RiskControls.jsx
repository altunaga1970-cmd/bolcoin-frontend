import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getToggles, setToggle } from '../../api/adminOpsApi';

const TOGGLE_DESCRIPTIONS = {
  maintenance_mode: 'Put the entire platform in maintenance mode. Users cannot access the site.',
  feature_withdrawals: 'Enable or disable user withdrawals.',
  feature_deposits: 'Enable or disable user deposits.',
  game_keno: 'Enable or disable the Keno game.',
  game_bolita: 'Enable or disable La Bolita game.',
  game_fortuna: 'Enable or disable La Fortuna game.'
};

function RiskControls() {
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(null);

  const fetchToggles = useCallback(() => {
    getToggles()
      .then(res => setFlags(res.flags))
      .catch(err => setError(err.message || 'Error loading toggles'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchToggles(); }, [fetchToggles]);

  const handleToggle = async (key, currentValue) => {
    if (key === 'maintenance_mode' && !currentValue) {
      const confirmed = window.confirm(
        'Are you sure you want to enable MAINTENANCE MODE? Users will not be able to access the platform.'
      );
      if (!confirmed) return;
    }

    setToggling(key);
    try {
      await setToggle(key, !currentValue);
      fetchToggles();
    } catch (err) {
      setError(err.message || 'Error toggling flag');
    } finally {
      setToggling(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="ops-page-title">Risk Controls</h1>

      {loading && <div className="ops-loading">Loading...</div>}
      {error && <div className="ops-error">{error}</div>}

      {flags && (
        <div>
          {Object.entries(flags).map(([key, enabled]) => (
            <div key={key} className="ops-toggle-row">
              <div className="ops-toggle-info">
                <div className="ops-toggle-key">{key}</div>
                <div className="ops-toggle-desc">
                  {TOGGLE_DESCRIPTIONS[key] || 'Feature flag'}
                </div>
              </div>
              <button
                className={`ops-toggle-btn ${enabled ? 'on' : 'off'}`}
                onClick={() => handleToggle(key, enabled)}
                disabled={toggling === key}
                aria-label={`Toggle ${key}`}
              />
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

export default RiskControls;
