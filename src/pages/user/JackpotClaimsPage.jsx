import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useToast } from '../../contexts/ToastContext';
import { Button, Spinner, Alert } from '../../components/common';
import { MainNav } from '../../components/layout';
import {
    getPoolStats,
    getPendingClaims,
    getClaimProof,
    processJackpotClaim,
    formatPoolBalance
} from '../../api/jackpotApi';
import './UserPages.css';
import './JackpotClaimsPage.css';

function JackpotClaimsPage() {
    const { account, isConnected } = useWeb3();
    const { success, error: toastError } = useToast();

    const [poolStats, setPoolStats] = useState(null);
    const [claims, setClaims] = useState([]);
    const [passes, setPasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('claims');

    // Load data
    const fetchData = useCallback(async () => {
        if (!isConnected) return;

        setIsLoading(true);
        setError(null);

        try {
            const [statsData, claimsData] = await Promise.all([
                getPoolStats(),
                getPendingClaims()
            ]);

            setPoolStats(statsData.data);
            setClaims(claimsData.data?.claims || []);
        } catch (err) {
            console.error('Error loading jackpot data:', err);
            setError(err.response?.data?.message || 'Error al cargar los datos');
        } finally {
            setIsLoading(false);
        }
    }, [isConnected]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle claim on-chain
    const handleClaim = async (claim) => {
        setIsClaiming(claim.id); // ticket_id
        setError(null);

        try {
            // Get claim proof from backend
            const proofData = await getClaimProof(claim.round_id, claim.id);

            if (!proofData || !proofData.proof) {
                throw new Error('No se encontró proof para este claim');
            }

            // Process claim via backend (que ejecutará la tx on-chain)
            const result = await processJackpotClaim(
                claim.round_id,
                claim.id,
                proofData.proof
            );

            success(`¡Claim procesado exitosamente! Recibiste ${result.data?.amount || '0'} USDT`);

            // Refresh data
            fetchData();
        } catch (err) {
            console.error('Error claiming jackpot:', err);
            setError(err.response?.data?.message || 'Error al procesar el claim');
        } finally {
            setIsClaiming(null);
        }
    };
            //     claimData.merkleProof
            // );
            // await tx.wait();

            // Record claim in backend (simulation)
            // await recordClaim(claim.round_id, tx.hash);

            success(`Claim de ${formatPoolBalance(claim.claim_amount)} procesado!`);
            fetchData();
        } catch (err) {
            console.error('Error claiming:', err);
            toastError(err.message || 'Error al procesar el claim');
        } finally {
            setIsClaiming(null);
        }
    };

    // Calculate stats
    const pendingClaims = claims.filter(c => !c.claimed);
    const totalPending = pendingClaims.reduce((sum, c) => sum + parseFloat(c.claim_amount || 0), 0);
    const totalClaimed = claims.filter(c => c.claimed).reduce((sum, c) => sum + parseFloat(c.claim_amount || 0), 0);

    if (!isConnected) {
        return (
            <div className="user-page">
                <MainNav />
                <main className="user-main">
                    <div className="empty-state">
                        <h3>Conecta tu Wallet</h3>
                        <p>Necesitas conectar tu wallet para ver tus claims del Super Jackpot</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="user-page">
            <MainNav />

            <main className="user-main">
                <div className="page-header">
                    <h1>Super Jackpot Pass</h1>
                    <p className="page-subtitle">Gestiona tus passes y claims del Super Jackpot</p>
                </div>

                {/* Pool Stats Banner */}
                {poolStats && (
                    <div className="jackpot-pool-banner">
                        <div className="pool-info">
                            <span className="pool-label">Pool Actual</span>
                            <span className="pool-amount">{formatPoolBalance(poolStats.poolBalance)}</span>
                        </div>
                        <div className="pool-stats-grid">
                            <div className="pool-stat">
                                <span className="stat-value">{poolStats.totalPasses || 0}</span>
                                <span className="stat-label">Passes Totales</span>
                            </div>
                            <div className="pool-stat">
                                <span className="stat-value">{formatPoolBalance(totalPending)}</span>
                                <span className="stat-label">Pendiente</span>
                            </div>
                            <div className="pool-stat">
                                <span className="stat-value">{formatPoolBalance(totalClaimed)}</span>
                                <span className="stat-label">Reclamado</span>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <Alert type="error" message={error} onDismiss={() => setError(null)} />
                )}

                {/* Tabs */}
                <div className="jackpot-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'claims' ? 'active' : ''}`}
                        onClick={() => setActiveTab('claims')}
                    >
                        Claims ({pendingClaims.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'passes' ? 'active' : ''}`}
                        onClick={() => setActiveTab('passes')}
                    >
                        Mis Passes ({passes.length})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Historial
                    </button>
                </div>

                {isLoading ? (
                    <div className="loading-container">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <div className="jackpot-content">
                        {/* Claims Tab */}
                        {activeTab === 'claims' && (
                            <div className="claims-list">
                                {pendingClaims.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No tienes claims pendientes</p>
                                        <p className="hint">Compra tickets con Jackpot Pass para participar</p>
                                    </div>
                                ) : (
                                    pendingClaims.map(claim => (
                                        <div key={claim.id} className="claim-card">
                                            <div className="claim-header">
                                                <span className="claim-round">{claim.round_number}</span>
                                                <span className={`claim-status ${getRoundStatusInfo(claim.round_status).color}`}>
                                                    {getRoundStatusInfo(claim.round_status).label}
                                                </span>
                                            </div>
                                            <div className="claim-amount">
                                                {formatPoolBalance(claim.claim_amount)}
                                            </div>
                                            <Button
                                                onClick={() => handleClaim(claim)}
                                                loading={isClaiming === claim.round_id}
                                                disabled={claim.round_status !== 'claims_open'}
                                                fullWidth
                                            >
                                                {claim.round_status === 'claims_open'
                                                    ? 'Reclamar'
                                                    : 'No disponible'}
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Passes Tab */}
                        {activeTab === 'passes' && (
                            <div className="passes-list">
                                {passes.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No tienes passes activos</p>
                                        <p className="hint">Activa el Jackpot Pass al comprar tickets de loteria</p>
                                    </div>
                                ) : (
                                    passes.map(pass => (
                                        <div key={pass.id} className="pass-card">
                                            <div className="pass-card-header">
                                                <span className="pass-ticket">Ticket #{pass.ticket_id}</span>
                                                <span className="pass-round">{pass.round_number}</span>
                                            </div>
                                            <div className="pass-card-info">
                                                <div className="pass-detail">
                                                    <span className="detail-label">Precio:</span>
                                                    <span className="detail-value">${pass.pass_price} USDT</span>
                                                </div>
                                                <div className="pass-detail">
                                                    <span className="detail-label">Estado:</span>
                                                    <span className={`detail-value ${pass.is_winner ? 'winner' : ''}`}>
                                                        {pass.is_winner ? 'GANADOR' : 'Participando'}
                                                    </span>
                                                </div>
                                                <div className="pass-detail">
                                                    <span className="detail-label">Fecha:</span>
                                                    <span className="detail-value">
                                                        {new Date(pass.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div className="history-list">
                                {claims.filter(c => c.claimed).length === 0 ? (
                                    <div className="empty-state">
                                        <p>No tienes historial de claims</p>
                                    </div>
                                ) : (
                                    claims.filter(c => c.claimed).map(claim => (
                                        <div key={claim.id} className="history-card">
                                            <div className="history-header">
                                                <span className="history-round">{claim.round_number}</span>
                                                <span className="history-date">
                                                    {new Date(claim.claimed_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="history-amount">
                                                {formatPoolBalance(claim.claim_amount)}
                                            </div>
                                            {claim.claim_tx_hash && (
                                                <a
                                                    href={`https://polygonscan.com/tx/${claim.claim_tx_hash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="history-tx-link"
                                                >
                                                    Ver transaccion
                                                </a>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Info Section */}
                <div className="jackpot-info-section">
                    <h3>Como funciona el Super Jackpot Pass</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-number">1</span>
                            <div className="info-content">
                                <h4>Compra el Pass</h4>
                                <p>Agrega +1 USDT al comprar tu ticket de loteria</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-number">2</span>
                            <div className="info-content">
                                <h4>Acumula el Pool</h4>
                                <p>95% de tu pass va al pool. El surplus de sorteos tambien se suma.</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <span className="info-number">3</span>
                            <div className="info-content">
                                <h4>Gana y Reclama</h4>
                                <p>Si tu ticket gana, recibes parte del 5% diario del pool.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default JackpotClaimsPage;
