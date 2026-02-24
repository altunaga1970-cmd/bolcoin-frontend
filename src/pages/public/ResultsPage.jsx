import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import './ResultsPage.css';

function ResultsPage() {
  const { t } = useTranslation('games');
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'bolita', 'fortuna'

  useEffect(() => {
    // Simular carga de resultados
    const loadResults = async () => {
      setLoading(true);
      // En produccion esto vendria del backend
      setTimeout(() => {
        setDraws([]);
        setLoading(false);
      }, 1000);
    };
    loadResults();
  }, []);

  const filteredDraws = draws.filter(draw => {
    if (filter === 'all') return true;
    if (filter === 'bolita') return draw.type === 'bolita';
    if (filter === 'fortuna') return draw.type === 'lottery';
    return true;
  });

  return (
    <div className="results-page">
      <MainNav />

      <main className="results-main">
        <div className="results-header-section">
          <h1 className="results-title">{t('results.title')}</h1>
          <p className="results-subtitle">
            {t('results.subtitle')}
          </p>
        </div>

        {/* Filtros */}
        <div className="results-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('results.filter_all')}
          </button>
          <button
            className={`filter-btn ${filter === 'bolita' ? 'active' : ''}`}
            onClick={() => setFilter('bolita')}
          >
            {t('results.filter_bolita')}
          </button>
          <button
            className={`filter-btn ${filter === 'fortuna' ? 'active' : ''}`}
            onClick={() => setFilter('fortuna')}
          >
            {t('results.filter_fortuna')}
          </button>
        </div>

        {/* Schedule Info */}
        <div className="schedule-cards">
          <div className="schedule-card bolita">
            <h3>{t('results.filter_bolita')}</h3>
            <p className="schedule-times">
              <span>08:00</span>
              <span>12:00</span>
              <span>20:00</span>
            </p>
            <p className="schedule-days">{t('results.every_day')}</p>
          </div>
          <div className="schedule-card fortuna">
            <h3>{t('results.filter_fortuna')}</h3>
            <p className="schedule-times">
              <span>21:00</span>
            </p>
            <p className="schedule-days">{t('results.wed_sat')}</p>
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="results-loading">
            <Spinner size="lg" />
            <p>{t('results.loading')}</p>
          </div>
        ) : filteredDraws.length === 0 ? (
          <div className="results-empty">
            <div className="empty-icon">🎰</div>
            <h3>{t('results.no_results')}</h3>
            <p>{t('results.results_appear')}</p>
            <Link to="/bet">
              <Button variant="primary">{t('results.play_la_bolita')}</Button>
            </Link>
          </div>
        ) : (
          <div className="results-list">
            {filteredDraws.map(draw => (
              <div key={draw.id} className={`result-card ${draw.type}`}>
                <div className="result-header">
                  <span className="result-type">
                    {draw.type === 'lottery' ? t('results.filter_fortuna') : t('results.filter_bolita')}
                  </span>
                  <span className="result-date">
                    {new Date(draw.scheduled_time).toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="result-numbers">
                  {draw.type === 'lottery' ? (
                    <>
                      {draw.winning_numbers.map((num, idx) => (
                        <span key={idx} className="result-ball">{num}</span>
                      ))}
                      <span className="result-plus">+</span>
                      <span className="result-ball key">{draw.winning_key}</span>
                    </>
                  ) : (
                    <span className="result-number-bolita">{draw.winning_number}</span>
                  )}
                </div>
                <div className="result-info">
                  <span>{t('results.draw_number', { number: draw.draw_number })}</span>
                  {draw.total_pool && (
                    <span>{t('results.pool', { amount: parseFloat(draw.total_pool).toLocaleString() })}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ResultsPage;
