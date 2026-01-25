import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Spinner } from '../../components/common';
import * as adminApi from '../../api/adminApi';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { DRAW_STATUS_LABELS } from '../../utils/constants';
import './AdminPages.css';

function ManageDrawsPage() {
  const { logout } = useAdminAuth();
  const { success, error } = useToast();
  const [draws, setDraws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal de crear sorteo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDrawNumber, setNewDrawNumber] = useState('');
  const [newDrawTime, setNewDrawTime] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Modal de resultados
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [resultFijos, setResultFijos] = useState('');
  const [resultCentenas, setResultCentenas] = useState('');
  const [resultParles, setResultParles] = useState('');
  const [isSubmittingResults, setIsSubmittingResults] = useState(false);

  const fetchDraws = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = filter === 'all' ? null : filter;
      const data = await adminApi.getDraws(1, 50, status);
      setDraws(data.draws || []);
    } catch (err) {
      error('Error al cargar sorteos');
    } finally {
      setIsLoading(false);
    }
  }, [filter, error]);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    if (!newDrawNumber || !newDrawTime) {
      error('Completa todos los campos');
      return;
    }

    setIsCreating(true);
    try {
      await adminApi.createDraw(newDrawNumber, newDrawTime);
      success('Sorteo creado exitosamente');
      setShowCreateModal(false);
      setNewDrawNumber('');
      setNewDrawTime('');
      fetchDraws();
    } catch (err) {
      error(err.message || 'Error al crear sorteo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenDraw = async (drawId) => {
    try {
      await adminApi.openDraw(drawId);
      success('Sorteo abierto para apuestas');
      fetchDraws();
    } catch (err) {
      error(err.message || 'Error al abrir sorteo');
    }
  };

  const handleCloseDraw = async (drawId) => {
    try {
      await adminApi.closeDraw(drawId);
      success('Sorteo cerrado');
      fetchDraws();
    } catch (err) {
      error(err.message || 'Error al cerrar sorteo');
    }
  };

  const openResultsModal = (draw) => {
    setSelectedDraw(draw);
    setResultFijos('');
    setResultCentenas('');
    setResultParles('');
    setShowResultsModal(true);
  };

  const handleSubmitResults = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!/^\d{2}$/.test(resultFijos)) {
      error('Fijos debe ser de 2 digitos (00-99)');
      return;
    }
    if (!/^\d{3}$/.test(resultCentenas)) {
      error('Centenas debe ser de 3 digitos (000-999)');
      return;
    }
    if (!/^\d{4}$/.test(resultParles)) {
      error('Parle debe ser de 4 digitos (0000-9999)');
      return;
    }

    setIsSubmittingResults(true);
    try {
      await adminApi.enterResults(selectedDraw.id, resultFijos, resultCentenas, resultParles);
      success('Resultados ingresados y pagos procesados');
      setShowResultsModal(false);
      fetchDraws();
    } catch (err) {
      error(err.message || 'Error al ingresar resultados');
    } finally {
      setIsSubmittingResults(false);
    }
  };

  const getStatusClass = (status) => {
    const classes = {
      scheduled: 'status-scheduled',
      open: 'status-open',
      closed: 'status-closed',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return classes[status] || '';
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
          <Link to="/admin/withdrawals">Retiros</Link>
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </nav>
      </header>

      <main className="admin-main">
        <div className="page-header-row">
          <h1 className="page-title">Gestionar Sorteos</h1>
          <Button onClick={() => setShowCreateModal(true)}>+ Nuevo Sorteo</Button>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`filter-tab ${filter === 'scheduled' ? 'active' : ''}`}
            onClick={() => setFilter('scheduled')}
          >
            Programados
          </button>
          <button
            className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
            onClick={() => setFilter('open')}
          >
            Abiertos
          </button>
          <button
            className={`filter-tab ${filter === 'closed' ? 'active' : ''}`}
            onClick={() => setFilter('closed')}
          >
            Cerrados
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completados
          </button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <Spinner size="lg" />
          </div>
        ) : draws.length === 0 ? (
          <div className="empty-state">
            <p>No hay sorteos {filter !== 'all' ? `con estado "${DRAW_STATUS_LABELS[filter]}"` : ''}</p>
          </div>
        ) : (
          <div className="draws-table">
            <div className="table-header">
              <span>Sorteo</span>
              <span>Fecha/Hora</span>
              <span>Estado</span>
              <span>Apuestas</span>
              <span>Recaudado</span>
              <span>Resultados</span>
              <span>Acciones</span>
            </div>
            {draws.map(draw => (
              <div key={draw.id} className="table-row">
                <span className="draw-number">{draw.draw_number}</span>
                <span>{formatDateTime(draw.scheduled_time)}</span>
                <span className={`status-badge ${getStatusClass(draw.status)}`}>
                  {DRAW_STATUS_LABELS[draw.status] || draw.status}
                </span>
                <span>{draw.bets_count || 0}</span>
                <span>{formatCurrency(draw.total_bets_amount || 0)}</span>
                <span className="results-cell">
                  {draw.status === 'completed' ? (
                    <div className="results-display">
                      <span title="Fijos">{draw.winning_fijos || draw.winning_number?.slice(2)}</span>
                      <span title="Centenas">{draw.winning_centenas || draw.winning_number?.slice(1)}</span>
                      <span title="Parle">{draw.winning_parles || draw.winning_number}</span>
                    </div>
                  ) : (
                    <span className="no-results">-</span>
                  )}
                </span>
                <span className="actions-cell">
                  {draw.status === 'scheduled' && (
                    <Button size="sm" variant="secondary" onClick={() => handleOpenDraw(draw.id)}>
                      Abrir
                    </Button>
                  )}
                  {draw.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => handleCloseDraw(draw.id)}>
                      Cerrar
                    </Button>
                  )}
                  {draw.status === 'closed' && (
                    <Button size="sm" onClick={() => openResultsModal(draw)}>
                      Resultados
                    </Button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear Sorteo */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Crear Nuevo Sorteo</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateDraw}>
              <div className="modal-body">
                <Input
                  label="Numero/Nombre del Sorteo"
                  placeholder="Ej: 2026-01-14-AM"
                  value={newDrawNumber}
                  onChange={(e) => setNewDrawNumber(e.target.value)}
                  required
                />
                <Input
                  label="Fecha y Hora Programada"
                  type="datetime-local"
                  value={newDrawTime}
                  onChange={(e) => setNewDrawTime(e.target.value)}
                  required
                />
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isCreating}>
                  Crear Sorteo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ingresar Resultados */}
      {showResultsModal && selectedDraw && (
        <div className="modal-overlay" onClick={() => setShowResultsModal(false)}>
          <div className="modal-content modal-results" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ingresar Resultados</h2>
              <button className="modal-close" onClick={() => setShowResultsModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitResults}>
              <div className="modal-body">
                <p className="modal-info">
                  Sorteo: <strong>{selectedDraw.draw_number}</strong>
                </p>
                <p className="modal-info">
                  Apuestas: <strong>{selectedDraw.bets_count || 0}</strong> |
                  Recaudado: <strong>{formatCurrency(selectedDraw.total_bets_amount || 0)}</strong>
                </p>

                <div className="results-inputs">
                  <div className="result-input-group">
                    <label>Fijos (2 digitos)</label>
                    <input
                      type="text"
                      className="result-input"
                      placeholder="00"
                      maxLength={2}
                      value={resultFijos}
                      onChange={(e) => setResultFijos(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <span className="multiplier-hint">80x</span>
                  </div>

                  <div className="result-input-group">
                    <label>Centenas (3 digitos)</label>
                    <input
                      type="text"
                      className="result-input"
                      placeholder="000"
                      maxLength={3}
                      value={resultCentenas}
                      onChange={(e) => setResultCentenas(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <span className="multiplier-hint">500x</span>
                  </div>

                  <div className="result-input-group">
                    <label>Parle (4 digitos)</label>
                    <input
                      type="text"
                      className="result-input"
                      placeholder="0000"
                      maxLength={4}
                      value={resultParles}
                      onChange={(e) => setResultParles(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <span className="multiplier-hint">900x</span>
                  </div>
                </div>

                <div className="results-warning">
                  Una vez ingresados los resultados, se procesaran automaticamente los pagos a los ganadores.
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowResultsModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isSubmittingResults}>
                  Confirmar Resultados
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageDrawsPage;
