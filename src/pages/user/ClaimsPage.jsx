import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { useToast } from '../../contexts/ToastContext';
import { Button, Spinner, Alert } from '../../components/common';
import { MainNav } from '../../components/layout';
import {
    getClaimsSummary,
    getUserClaims,
    getClaimDataForDraw,
    processClaim,
    formatPrizeAmount,
    getCategoryName,
    getCategoryColor,
    getClaimStatusInfo
} from '../../api/claimsApi';
import { useContract } from '../../hooks/useContract';
import './UserPages.css';
import './ClaimsPage.css';

function ClaimsPage() {
    const { account, disconnectWallet, formatAddress } = useWeb3();
    const { success, error: toastError } = useToast();
    const { contract, isReady: contractReady } = useContract();

    const [summary, setSummary] = useState(null);
    const [claims, setClaims] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [isClaiming, setIsClaiming] = useState(null);
    const [error, setError] = useState(null);

    // Cargar resumen y claims
    const fetchData = useCallback(async (page = 1) => {
        setIsLoading(true);
        setError(null);

        try {
            const [summaryData, claimsData] = await Promise.all([
                getClaimsSummary(),
                getUserClaims(page, 10)
            ]);

            setSummary(summaryData.data);
            setClaims(claimsData.data);
            setPagination(claimsData.pagination);
        } catch (err) {
            console.error('Error cargando claims:', err);
            setError(err.response?.data?.message || 'Error al cargar los datos');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Ejecutar claim on-chain
    const handleClaim = async (claim) => {
        if (!contractReady || !contract) {
            toastError('Contrato no disponible. Verifica tu conexion.');
            return;
        }

        setIsClaiming(claim.claimId);
        setError(null);

        try {
            // Obtener datos completos del claim
            const claimDataResponse = await getClaimDataForDraw(claim.draw_id);
            const claimData = claimDataResponse.data.claims.find(c => c.claimId === claim.claimId);

            if (!claimData) {
                throw new Error('No se encontraron datos del claim');
            }

            // Ejecutar transaccion on-chain
            const tx = await contract.claimPrize(
                claimData.leafHash,
                claimData.proof,
                claimData.merkleRoot,
                claim.draw_id,
                claim.category,
                claim.prize_amount
            );

            success('Transaccion enviada. Esperando confirmacion...');

            // Esperar confirmacion
            const receipt = await tx.wait();

            // Notificar al backend
            await processClaim(claim.claimId, receipt.hash);

            success(`Premio de ${formatPrizeAmount(claim.prize_amount)} reclamado exitosamente!`);

            // Recargar datos
            fetchData();
        } catch (err) {
            console.error('Error reclamando premio:', err);
            const errorMsg = err.reason || err.message || 'Error al reclamar el premio';
            toastError(errorMsg);
            setError(errorMsg);
        } finally {
            setIsClaiming(null);
        }
    };

    const handleLoadMore = () => {
        if (pagination.page < pagination.totalPages) {
            fetchData(pagination.page + 1);
        }
    };

    return (
        <div className="user-page">
            <MainNav />

            <main className="user-main">
                <h1 className="page-title">Mis Premios</h1>

                {error && (
                    <Alert type="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {isLoading ? (
                    <div className="loading-container">
                        <Spinner size="lg" />
                        <p>Cargando premios...</p>
                    </div>
                ) : (
                    <>
                        {/* Resumen de Claims */}
                        {summary && (
                            <div className="claims-summary">
                                <div className="summary-card total-won">
                                    <span className="summary-label">Total Ganado</span>
                                    <span className="summary-value">
                                        {formatPrizeAmount(summary.total_claimed || 0)}
                                    </span>
                                </div>
                                <div className="summary-card pending">
                                    <span className="summary-label">Pendiente por Reclamar</span>
                                    <span className="summary-value">
                                        {formatPrizeAmount(summary.total_pending || 0)}
                                    </span>
                                </div>
                                <div className="summary-card claims-count">
                                    <span className="summary-label">Premios Pendientes</span>
                                    <span className="summary-value">
                                        {summary.pendingClaims?.length || 0}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Claims Pendientes */}
                        {summary?.pendingClaims?.length > 0 && (
                            <section className="claims-section pending-claims">
                                <h2>Premios Pendientes de Reclamar</h2>
                                <div className="claims-list">
                                    {summary.pendingClaims.map((claim) => (
                                        <ClaimCard
                                            key={claim.id}
                                            claim={claim}
                                            onClaim={handleClaim}
                                            isClaiming={isClaiming === claim.id}
                                            contractReady={contractReady}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Historial de Claims */}
                        <section className="claims-section claims-history">
                            <h2>Historial de Premios</h2>
                            {claims.length === 0 ? (
                                <div className="empty-state">
                                    <p>No tienes premios registrados aun.</p>
                                    <Link to="/lottery">
                                        <Button>Jugar La Fortuna</Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="claims-list">
                                        {claims.map((claim) => (
                                            <ClaimCard
                                                key={claim.id}
                                                claim={claim}
                                                onClaim={handleClaim}
                                                isClaiming={isClaiming === claim.id}
                                                contractReady={contractReady}
                                                showHistory
                                            />
                                        ))}
                                    </div>

                                    {pagination.page < pagination.totalPages && (
                                        <div className="load-more">
                                            <Button
                                                variant="outline"
                                                onClick={handleLoadMore}
                                            >
                                                Cargar mas
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}

// Componente de tarjeta de claim
function ClaimCard({ claim, onClaim, isClaiming, contractReady, showHistory = false }) {
    const statusInfo = getClaimStatusInfo(claim.status);
    const categoryColor = getCategoryColor(claim.category);
    const isPending = claim.status === 'pending';
    const isExpired = claim.status === 'expired';

    // Calcular tiempo restante
    const getTimeRemaining = () => {
        if (!claim.expires_at) return null;
        const expires = new Date(claim.expires_at);
        const now = new Date();
        const diff = expires - now;

        if (diff <= 0) return 'Expirado';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h restantes`;
        return `${hours}h restantes`;
    };

    return (
        <div className={`claim-card status-${claim.status}`}>
            <div className="claim-header">
                <span className={`claim-category category-${categoryColor}`}>
                    {getCategoryName(claim.category)}
                </span>
                <span className={`claim-status status-${statusInfo.color}`}>
                    {statusInfo.label}
                </span>
            </div>

            <div className="claim-body">
                <div className="claim-amount">
                    {formatPrizeAmount(claim.prize_amount)}
                </div>
                <div className="claim-details">
                    <span>Sorteo #{claim.draw_id}</span>
                    {claim.ticket_id && <span>Ticket: {claim.ticket_id.slice(0, 10)}...</span>}
                </div>
            </div>

            <div className="claim-footer">
                {isPending && (
                    <>
                        <span className="claim-expires">
                            {getTimeRemaining()}
                        </span>
                        <Button
                            onClick={() => onClaim(claim)}
                            disabled={!contractReady || isClaiming}
                            loading={isClaiming}
                            size="sm"
                        >
                            {isClaiming ? 'Reclamando...' : 'Reclamar'}
                        </Button>
                    </>
                )}

                {claim.status === 'claimed' && claim.tx_hash && (
                    <a
                        href={`https://polygonscan.com/tx/${claim.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="claim-tx-link"
                    >
                        Ver transaccion
                    </a>
                )}

                {isExpired && (
                    <span className="claim-expired-text">
                        Premio no reclamado a tiempo
                    </span>
                )}
            </div>
        </div>
    );
}

export default ClaimsPage;
