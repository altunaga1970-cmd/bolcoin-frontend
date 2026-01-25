import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import './ResultsPage.css';

function ResultsPage() {
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
          <h1 className="results-title">Resultados</h1>
          <p className="results-subtitle">
            Consulta los resultados de los sorteos de La Bolita y La Fortuna
          </p>
        </div>

        {/* Filtros */}
        <div className="results-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`filter-btn ${filter === 'bolita' ? 'active' : ''}`}
            onClick={() => setFilter('bolita')}
          >
            La Bolita
          </button>
          <button
            className={`filter-btn ${filter === 'fortuna' ? 'active' : ''}`}
            onClick={() => setFilter('fortuna')}
          >
            La Fortuna
          </button>
        </div>

        {/* Schedule Info */}
        <div className="schedule-cards">
          <div className="schedule-card bolita">
            <h3>La Bolita</h3>
            <p className="schedule-times">
              <span>08:00</span>
              <span>12:00</span>
              <span>20:00</span>
            </p>
            <p className="schedule-days">Todos los dias</p>
          </div>
          <div className="schedule-card fortuna">
            <h3>La Fortuna</h3>
            <p className="schedule-times">
              <span>21:00</span>
            </p>
            <p className="schedule-days">Miercoles y Sabados</p>
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="results-loading">
            <Spinner size="lg" />
            <p>Cargando resultados...</p>
          </div>
        ) : filteredDraws.length === 0 ? (
          <div className="results-empty">
            <div className="empty-icon">🎰</div>
            <h3>No hay resultados disponibles</h3>
            <p>Los resultados apareceran aqui despues de cada sorteo.</p>
            <Link to="/bet">
              <Button variant="primary">Jugar La Bolita</Button>
            </Link>
          </div>
        ) : (
          <div className="results-list">
            {filteredDraws.map(draw => (
              <div key={draw.id} className={`result-card ${draw.type}`}>
                <div className="result-header">
                  <span className="result-type">
                    {draw.type === 'lottery' ? 'La Fortuna' : 'La Bolita'}
                  </span>
                  <span className="result-date">
                    {new Date(draw.scheduled_time).toLocaleDateString('es-ES', {
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
                  <span>Sorteo #{draw.draw_number}</span>
                  {draw.total_pool && (
                    <span>Pozo: ${parseFloat(draw.total_pool).toLocaleString()}</span>
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
