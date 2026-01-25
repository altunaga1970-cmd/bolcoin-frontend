import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Spinner } from '../../components/common';
import { ConnectWallet } from '../../components/web3';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import './AdminPages.css';

const STATUS_LABELS = {
  scheduled: 'Programado',
  open: 'Abierto',
  closed: 'Cerrado',
  completed: 'Completado',
  cancelled: 'Cancelado'
};

function Web3AdminPage() {
  const { isConnected, account } = useWeb3();
  const {
    getAllDraws,
    createDraw,
    openDraw,
    closeDraw,
    submitResults,
    cancelDraw,
    isLoading
  } = useContract();
  const { error: showError, success: showSuccess } = useToast();

  const [draws, setDraws] = useState([]);
  const [isLoadingDraws, setIsLoadingDraws] = useState(true);
  const [filter, setFilter] = useState('all');

  // Modal crear sorteo
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDrawNumber, setNewDrawNumber] = useState('');
  const [newDrawTime, setNewDrawTime] = useState('');

  // Modal resultados
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [resultFijos, setResultFijos] = useState('');
  const [resultCentenas, setResultCentenas] = useState('');
  const [resultParles, setResultParles] = useState('');

  // Cargar sorteos
  const loadDraws = useCallback(async () => {
    if (!isConnected) return;
    setIsLoadingDraws(true);
    try {
      const allDraws = await getAllDraws();
      setDraws(allDraws);
    } catch (err) {
      console.error('Error loading draws:', err);
    } finally {
      setIsLoadingDraws(false);
    }
  }, [isConnected, getAllDraws]);

  useEffect(() => {
    loadDraws();
  }, [loadDraws]);

  // Filtrar sorteos
  const filteredDraws = draws.filter(draw => {
    if (filter === 'all') return true;
    return draw.status === filter;
  });

  // Crear sorteo
  const handleCreateDraw = async (e) => {
    e.preventDefault();
    if (!newDrawNumber || !newDrawTime) {
      showError('Completa todos los campos');
      return;
    }

    const success = await createDraw(newDrawNumber, newDrawTime);
    if (success) {
      setShowCreateModal(false);
      setNewDrawNumber('');
      setNewDrawTime('');
      loadDraws();
    }
  };

  // Abrir sorteo
  const handleOpenDraw = async (drawId) => {
    const success = await openDraw(drawId);
    if (success) loadDraws();
  };

  // Cerrar sorteo
  const handleCloseDraw = async (drawId) => {
    const success = await closeDraw(drawId);
    if (success) loadDraws();
  };

  // Abrir modal de resultados
  const openResultsModal = (draw) => {
    setSelectedDraw(draw);
    setResultFijos('');
    setResultCentenas('');
    setResultParles('');
    setShowResultsModal(true);
  };

  // Enviar resultados
  const handleSubmitResults = async (e) => {
    e.preventDefault();

    if (!/^\d{2}$/.test(resultFijos)) {
      showError('Fijos debe ser de 2 digitos (00-99)');
      return;
    }
    if (!/^\d{3}$/.test(resultCentenas)) {
      showError('Centenas debe ser de 3 digitos (000-999)');
      return;
    }
    if (!/^\d{4}$/.test(resultParles)) {
      showError('Parle debe ser de 4 digitos (0000-9999)');
      return;
    }

    const success = await submitResults(selectedDraw.id, resultFijos, resultCentenas, resultParles);
    if (success) {
      setShowResultsModal(false);
      loadDraws();
    }
  };

  // Cancelar sorteo
  const handleCancelDraw = async (drawId) => {
    if (!window.confirm('¿Cancelar sorteo y reembolsar apuestas?')) return;
    const success = await cancelDraw(drawId);
    if (success) loadDraws();
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
        <span className="admin-badge">ADMIN WEB3</span>
        <nav className="admin-nav">
          <Link to="/admin/web3" className="active">Sorteos</Link>
        </nav>
        <div className="header-right">
          <ConnectWallet variant="header" />
        </div>
      </header>

      <main className="admin-main">
        {!isConnected ? (
          <div className="connect-prompt" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Panel de Administracion Web3</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Conecta tu wallet de administrador para gestionar los sorteos en blockchain
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <>
            <div className="page-header-row">
              <h1 className="page-title">Gestionar Sorteos (Blockchain)</h1>
              <Button onClick={() => setShowCreateModal(true)}>+ Nuevo Sorteo</Button>
            </div>

            <div className="blockchain-info" style={{
              background: 'rgba(138, 43, 226, 0.1)',
              border: '1px solid rgba(138, 43, 226, 0.3)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Todas las operaciones se ejecutan directamente en el smart contract de Polygon.
                Las transacciones son permanentes e inmutables.
              </p>
            </div>

            <div className="filter-tabs">
              {['all', 'scheduled', 'open', 'closed', 'completed'].map(status => (
                <button
                  key={status}
                  className={`filter-tab ${filter === status ? 'active' : ''}`}
                  onClick={() => setFilter(status)}
                >
                  {status === 'all' ? 'Todos' : STATUS_LABELS[status]}
                </button>
              ))}
            </div>

            {isLoadingDraws ? (
              <div className="loading-container">
                <Spinner size="lg" />
              </div>
            ) : filteredDraws.length === 0 ? (
              <div className="empty-state">
                <p>No hay sorteos {filter !== 'all' ? `con estado "${STATUS_LABELS[filter]}"` : ''}</p>
              </div>
            ) : (
              <div className="draws-table">
                <div className="table-header">
                  <span>ID</span>
                  <span>Sorteo</span>
                  <span>Fecha/Hora</span>
                  <span>Estado</span>
                  <span>Apuestas</span>
                  <span>Recaudado</span>
                  <span>Resultados</span>
                  <span>Acciones</span>
                </div>
                {filteredDraws.map(draw => (
                  <div key={draw.id} className="table-row">
                    <span className="draw-id">#{draw.id}</span>
                    <span className="draw-number">{draw.draw_number}</span>
                    <span>{formatDateTime(draw.scheduled_time)}</span>
                    <span className={`status-badge ${getStatusClass(draw.status)}`}>
                      {STATUS_LABELS[draw.status]}
                    </span>
                    <span>{draw.bets_count}</span>
                    <span>${parseFloat(draw.total_bets_amount).toFixed(2)}</span>
                    <span className="results-cell">
                      {draw.status === 'completed' ? (
                        <div className="results-display">
                          <span title="Fijos">{draw.winning_fijos}</span>
                          <span title="Centenas">{draw.winning_centenas}</span>
                          <span title="Parle">{draw.winning_parles}</span>
                        </div>
                      ) : (
                        <span className="no-results">-</span>
                      )}
                    </span>
                    <span className="actions-cell">
                      {draw.status === 'scheduled' && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => handleOpenDraw(draw.id)} disabled={isLoading}>
                            Abrir
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancelDraw(draw.id)} disabled={isLoading}>
                            Cancelar
                          </Button>
                        </>
                      )}
                      {draw.status === 'open' && (
                        <Button size="sm" variant="secondary" onClick={() => handleCloseDraw(draw.id)} disabled={isLoading}>
                          Cerrar
                        </Button>
                      )}
                      {draw.status === 'closed' && (
                        <Button size="sm" onClick={() => openResultsModal(draw)} disabled={isLoading}>
                          Resultados
                        </Button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
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
                  placeholder="Ej: 2024-01-15-AM"
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
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  Esta transaccion creara un nuevo sorteo en el smart contract.
                </p>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isLoading}>
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
              <h2>Ingresar Resultados (Blockchain)</h2>
              <button className="modal-close" onClick={() => setShowResultsModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitResults}>
              <div className="modal-body">
                <p className="modal-info">
                  Sorteo: <strong>{selectedDraw.draw_number}</strong>
                </p>
                <p className="modal-info">
                  Apuestas: <strong>{selectedDraw.bets_count}</strong> |
                  Recaudado: <strong>${parseFloat(selectedDraw.total_bets_amount).toFixed(2)}</strong>
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

                <div className="results-warning" style={{ background: 'rgba(255, 193, 7, 0.1)', borderColor: 'rgba(255, 193, 7, 0.3)' }}>
                  <strong>IMPORTANTE:</strong> Una vez confirmados, los resultados se guardaran permanentemente
                  en la blockchain. Los usuarios podran reclamar sus ganancias directamente del contrato.
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowResultsModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" loading={isLoading}>
                  Confirmar en Blockchain
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Web3AdminPage;
