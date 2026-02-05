import React, { useState, useEffect, useCallback } from 'react';
import kenoApi from '../../api/kenoApi';

/**
 * KenoPoolDashboard - Admin page for Keno pool monitoring and management
 *
 * Features:
 * - Real-time pool balance and health status
 * - Active sessions monitoring
 * - Pool distribution visualization
 * - VRF verification stats
 * - Alert system for low pool
 */
const KenoPoolDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Pool data
    const [poolData, setPoolData] = useState({
        pool: {
            balance: 0,
            totalBets: 0,
            totalPayouts: 0,
            totalFees: 0,
            gamesPlayed: 0
        },
        sessions: {
            active: 0,
            settled: 0,
            activeWagered: 0,
            activeWon: 0
        },
        health: {
            status: 'healthy',
            isHealthy: true,
            utilizationPercent: 0,
            pendingPayouts: 0,
            availableForPayouts: 0
        }
    });

    // Sessions data
    const [sessions, setSessions] = useState([]);

    // VRF stats
    const [vrfStats, setVrfStats] = useState({
        games: { verified: 0, unverified: 0, batched: 0 },
        batches: { total: 0, byStatus: {} },
        system: { enabled: false }
    });

    // Pool history for charts
    const [poolHistory, setPoolHistory] = useState([]);

    // Format currency helper
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '0.00';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // Format percentage
    const formatPercent = (value) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    // Fetch all data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [poolStatus, activeSessions, vrfData, history] = await Promise.all([
                kenoApi.getPoolStatus().catch(() => null),
                kenoApi.getActiveSessions().catch(() => ({ sessions: [] })),
                kenoApi.getVrfStats().catch(() => null),
                kenoApi.getPoolHistory(7).catch(() => ({ history: [] }))
            ]);

            if (poolStatus) {
                setPoolData(poolStatus);
            }

            if (activeSessions?.sessions) {
                setSessions(activeSessions.sessions);
            }

            if (vrfData) {
                setVrfStats(vrfData);
            }

            if (history?.history) {
                setPoolHistory(history.history);
            }

        } catch (err) {
            console.error('Error fetching Keno pool data:', err);
            setError('Error al cargar datos del pool');
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Stat Card component
    const StatCard = ({ title, value, subtitle, color = 'blue', icon }) => (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">{title}</span>
                {icon && <span className={`text-${color}-400`}>{icon}</span>}
            </div>
            <div className={`text-2xl font-bold text-${color}-400 mb-1`}>
                {value}
            </div>
            {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
        </div>
    );

    // Health status badge
    const HealthBadge = ({ status }) => {
        const statusConfig = {
            healthy: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Saludable' },
            warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Advertencia' },
            critical: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Critico' },
            depleted: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Agotado' }
        };
        const config = statusConfig[status] || statusConfig.healthy;

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    // Session row component
    const SessionRow = ({ session }) => {
        const isWinning = session.netResult > 0;
        return (
            <tr className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 px-4">
                    <span className="font-mono text-sm text-gray-300">
                        {session.walletAddress.slice(0, 6)}...{session.walletAddress.slice(-4)}
                    </span>
                </td>
                <td className="py-3 px-4 text-center text-gray-300">
                    {session.gamesPlayed}
                </td>
                <td className="py-3 px-4 text-right text-gray-300">
                    ${formatCurrency(session.totalWagered)}
                </td>
                <td className="py-3 px-4 text-right text-gray-300">
                    ${formatCurrency(session.totalWon)}
                </td>
                <td className={`py-3 px-4 text-right font-medium ${isWinning ? 'text-green-400' : 'text-red-400'}`}>
                    {isWinning ? '+' : ''}{formatCurrency(session.netResult)}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 text-sm">
                    {new Date(session.updatedAt).toLocaleTimeString()}
                </td>
            </tr>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Keno Pool Dashboard</h1>
                        <p className="text-gray-400 mt-1">Monitoreo del pool y sesiones de Keno</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <HealthBadge status={poolData.health?.status || 'healthy'} />
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Balance del Pool"
                        value={`$${formatCurrency(poolData.pool?.balance)} USDT`}
                        subtitle={`Disponible para pagos: $${formatCurrency(poolData.health?.availableForPayouts)}`}
                        color="blue"
                    />
                    <StatCard
                        title="Sesiones Activas"
                        value={poolData.sessions?.active || 0}
                        subtitle={`${poolData.sessions?.settled || 0} liquidadas total`}
                        color="green"
                    />
                    <StatCard
                        title="Pagos Pendientes"
                        value={`$${formatCurrency(poolData.health?.pendingPayouts)} USDT`}
                        subtitle={`De ${sessions.filter(s => s.netResult > 0).length} sesiones ganadoras`}
                        color="yellow"
                    />
                    <StatCard
                        title="Juegos Totales"
                        value={formatCurrency(poolData.pool?.gamesPlayed).replace('.00', '')}
                        subtitle={`Fees: $${formatCurrency(poolData.pool?.totalFees)}`}
                        color="purple"
                    />
                </div>

                {/* Pool Distribution Bar */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-8">
                    <h3 className="text-white font-semibold mb-4">Distribucion del Pool</h3>

                    {/* Warning/Critical alerts */}
                    {!poolData.health?.isHealthy && (
                        <div className={`mb-4 p-3 rounded-lg ${poolData.health?.status === 'critical' ? 'bg-red-500/20 border border-red-500/50' : 'bg-yellow-500/20 border border-yellow-500/50'}`}>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className={`text-sm ${poolData.health?.status === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                                    Pool bajo - Se activara auto-liquidacion de sesiones ganadoras
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="h-6 bg-gray-700 rounded-full overflow-hidden mb-4">
                        <div className="h-full flex">
                            {/* Available balance */}
                            <div
                                className="bg-green-500 transition-all duration-500"
                                style={{
                                    width: `${Math.max(0, (poolData.health?.availableForPayouts || 0) / (poolData.pool?.balance || 1) * 100)}%`
                                }}
                            />
                            {/* Pending payouts */}
                            <div
                                className="bg-yellow-500 transition-all duration-500"
                                style={{
                                    width: `${Math.max(0, (poolData.health?.pendingPayouts || 0) / (poolData.pool?.balance || 1) * 100)}%`
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded" />
                            <span className="text-gray-400">
                                Disponible: ${formatCurrency(poolData.health?.availableForPayouts)} USDT
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded" />
                            <span className="text-gray-400">
                                Pendiente: ${formatCurrency(poolData.health?.pendingPayouts)} USDT
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
                    {[
                        { id: 'overview', label: 'Resumen' },
                        { id: 'sessions', label: 'Sesiones' },
                        { id: 'vrf', label: 'VRF / Verificacion' },
                        { id: 'config', label: 'Configuracion' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 rounded-xl border border-gray-700">
                    {activeTab === 'overview' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Resumen del Pool</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Total Apostado</span>
                                    <span className="text-white font-bold">${formatCurrency(poolData.pool?.totalBets)} USDT</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Total Pagado</span>
                                    <span className="text-white font-bold">${formatCurrency(poolData.pool?.totalPayouts)} USDT</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">P/L Neto</span>
                                    <span className={`font-bold ${(poolData.pool?.totalBets - poolData.pool?.totalPayouts) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        ${formatCurrency(poolData.pool?.totalBets - poolData.pool?.totalPayouts)} USDT
                                    </span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Fees Acumulados</span>
                                    <span className="text-white font-bold">${formatCurrency(poolData.pool?.totalFees)} USDT</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Sesiones Activas</span>
                                    <span className="text-white font-bold">{poolData.sessions?.active || 0}</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Utilizacion Pool</span>
                                    <span className="text-white font-bold">{formatPercent(poolData.health?.utilizationPercent)}</span>
                                </div>
                            </div>

                            {/* Active sessions summary */}
                            <h4 className="text-white font-medium mb-3">Resumen de Sesiones Activas</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <span className="text-blue-400 text-sm block mb-1">Total Apostado (Activas)</span>
                                    <span className="text-white font-bold text-xl">${formatCurrency(poolData.sessions?.activeWagered)} USDT</span>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                    <span className="text-green-400 text-sm block mb-1">Total Ganado (Activas)</span>
                                    <span className="text-white font-bold text-xl">${formatCurrency(poolData.sessions?.activeWon)} USDT</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-semibold">Sesiones Activas</h3>
                                <span className="text-gray-400 text-sm">{sessions.length} sesiones</span>
                            </div>

                            {sessions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                                <th className="pb-3 px-4">Wallet</th>
                                                <th className="pb-3 px-4 text-center">Juegos</th>
                                                <th className="pb-3 px-4 text-right">Apostado</th>
                                                <th className="pb-3 px-4 text-right">Ganado</th>
                                                <th className="pb-3 px-4 text-right">Neto</th>
                                                <th className="pb-3 px-4 text-right">Ultima Actividad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sessions.map((session, idx) => (
                                                <SessionRow key={session.id || idx} session={session} />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No hay sesiones activas
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'vrf' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Verificacion VRF (Provably Fair)</h3>

                            {/* VRF Status */}
                            <div className="mb-6 p-4 rounded-lg bg-gray-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${vrfStats.system?.enabled ? 'bg-green-500' : 'bg-gray-500'}`} />
                                        <span className="text-white font-medium">
                                            Sistema VRF: {vrfStats.system?.enabled ? 'Habilitado' : 'Deshabilitado'}
                                        </span>
                                    </div>
                                    {!vrfStats.system?.enabled && (
                                        <span className="text-gray-400 text-sm">
                                            Verificacion local activa
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* VRF Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                                    <span className="text-green-400 text-sm block mb-1">Verificados</span>
                                    <span className="text-white font-bold text-xl">{vrfStats.games?.verified || 0}</span>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                                    <span className="text-yellow-400 text-sm block mb-1">Pendientes</span>
                                    <span className="text-white font-bold text-xl">{vrfStats.games?.unverified || 0}</span>
                                </div>
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                                    <span className="text-blue-400 text-sm block mb-1">En Batch</span>
                                    <span className="text-white font-bold text-xl">{vrfStats.games?.batched || 0}</span>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                                    <span className="text-purple-400 text-sm block mb-1">Batches Totales</span>
                                    <span className="text-white font-bold text-xl">{vrfStats.batches?.total || 0}</span>
                                </div>
                            </div>

                            {/* Batch Status */}
                            <h4 className="text-white font-medium mb-3">Estado de Batches</h4>
                            <div className="grid grid-cols-4 gap-4">
                                {['pending', 'requested', 'verified', 'failed'].map(status => (
                                    <div key={status} className="bg-gray-700/50 rounded-lg p-3 text-center">
                                        <span className="text-gray-400 text-xs block mb-1 capitalize">{status}</span>
                                        <span className="text-white font-bold">
                                            {vrfStats.batches?.byStatus?.[status] || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Info box */}
                            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <h5 className="text-blue-400 font-medium mb-2">Como funciona Provably Fair</h5>
                                <ul className="text-gray-400 text-sm space-y-1">
                                    <li>• Cada juego usa un server_seed + client_seed + nonce</li>
                                    <li>• Los resultados se generan instantaneamente con SHA-256</li>
                                    <li>• Cada hora se crea un batch para verificacion VRF</li>
                                    <li>• Los usuarios pueden verificar sus juegos en /keno/verify/[gameId]</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Configuracion del Pool</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Estos parametros se configuran en la base de datos. Algunos cambios requieren reiniciar el scheduler.
                            </p>

                            <div className="space-y-4">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Balance Minimo del Pool</span>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Por debajo de este valor se activa auto-liquidacion
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-400">$500 USDT</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Max Session Hours</span>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Sesiones se auto-liquidan despues de este tiempo
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold text-purple-400">24h</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Max Payout Ratio</span>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Pago maximo = Pool Balance x Ratio
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold text-green-400">10%</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Fee sobre Perdidas</span>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Porcentaje cobrado cuando el jugador pierde
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold text-yellow-400">12%</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">VRF Batch Interval</span>
                                            <p className="text-gray-400 text-sm mt-1">
                                                Frecuencia de creacion de batches VRF
                                            </p>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-400">1h</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KenoPoolDashboard;
