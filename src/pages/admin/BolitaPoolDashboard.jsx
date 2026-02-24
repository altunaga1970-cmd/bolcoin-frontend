import React, { useState, useEffect, useCallback } from 'react';
import bolitaPoolApi from '../../api/bolitaPoolApi';

/**
 * BolitaPoolDashboard - Admin page for La Bolita pool monitoring
 *
 * Features:
 * - Pool totals (wagered, payouts, profit, house edge)
 * - Draw management (open, completed, cancelled)
 * - Exposure monitoring per number
 * - Daily history for charts
 */
const BolitaPoolDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const [poolData, setPoolData] = useState(null);
    const [draws, setDraws] = useState([]);
    const [exposures, setExposures] = useState([]);
    const [history, setHistory] = useState([]);

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '0.00';
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [poolStatus, drawsData, exposuresData, historyData] = await Promise.all([
                bolitaPoolApi.getPoolStatus().catch(() => null),
                bolitaPoolApi.getDraws('all', 20).catch(() => ({ draws: [] })),
                bolitaPoolApi.getExposures().catch(() => ({ exposures: [] })),
                bolitaPoolApi.getHistory(7).catch(() => ({ history: [] }))
            ]);

            if (poolStatus) setPoolData(poolStatus);
            if (drawsData?.draws) setDraws(drawsData.draws);
            if (exposuresData?.exposures) setExposures(exposuresData.exposures);
            if (historyData?.history) setHistory(historyData.history);
        } catch (err) {
            console.error('Error fetching Bolita pool data:', err);
            setError('Error al cargar datos de La Bolita');
        }

        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const StatCard = ({ title, value, subtitle, color = 'blue' }) => (
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">{title}</span>
            </div>
            <div className={`text-2xl font-bold text-${color}-400 mb-1`}>
                {value}
            </div>
            {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
        </div>
    );

    const StatusBadge = ({ status }) => {
        const config = {
            open: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Abierto' },
            closed: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Cerrado' },
            completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Completado' },
            cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelado' },
            active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Activo' },
            idle: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Inactivo' }
        };
        const c = config[status] || config.idle;
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
                {c.label}
            </span>
        );
    };

    const gameTypeLabel = (type) => {
        const labels = { fijo: 'Fijo (65x)', centena: 'Centena (300x)', parle: 'Parle (1000x)' };
        return labels[type] || type;
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">La Bolita Dashboard</h1>
                        <p className="text-gray-400 mt-1">Monitoreo de sorteos, apuestas y exposicion</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {poolData && <StatusBadge status={poolData.health?.status || 'idle'} />}
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

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                        {error}
                    </div>
                )}

                {/* Stats Grid */}
                {poolData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            title="Total Apostado"
                            value={`$${formatCurrency(poolData.pool?.totalWagered)} USDT`}
                            subtitle={`${poolData.pool?.totalBets || 0} apuestas totales`}
                            color="blue"
                        />
                        <StatCard
                            title="Total Pagado"
                            value={`$${formatCurrency(poolData.pool?.totalPayouts)} USDT`}
                            subtitle={`Ultimas 24h: $${formatCurrency(poolData.recentPayouts24h)}`}
                            color="green"
                        />
                        <StatCard
                            title="Profit Neto"
                            value={`$${formatCurrency(poolData.pool?.netProfit)} USDT`}
                            subtitle={`House edge: ${poolData.pool?.houseEdgePercent || 0}%`}
                            color={poolData.pool?.netProfit >= 0 ? 'green' : 'red'}
                        />
                        <StatCard
                            title="Sorteos"
                            value={`${poolData.draws?.open || 0} abiertos`}
                            subtitle={`${poolData.draws?.completed || 0} completados, ${poolData.draws?.total || 0} total`}
                            color="purple"
                        />
                    </div>
                )}

                {/* Exposure Alert */}
                {poolData?.activeBets?.count > 0 && (
                    <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-yellow-400 text-sm">
                                {poolData.activeBets.count} apuestas pendientes por ${formatCurrency(poolData.activeBets.totalAmount)} USDT
                            </span>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
                    {[
                        { id: 'overview', label: 'Resumen' },
                        { id: 'draws', label: 'Sorteos' },
                        { id: 'exposures', label: 'Exposicion' },
                        { id: 'history', label: 'Historial' }
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
                    {activeTab === 'overview' && poolData && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Resumen General</h3>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Sorteos Abiertos</span>
                                    <span className="text-white font-bold">{poolData.draws?.open || 0}</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Sorteos Completados</span>
                                    <span className="text-white font-bold">{poolData.draws?.completed || 0}</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Sorteos Cancelados</span>
                                    <span className="text-white font-bold">{poolData.draws?.cancelled || 0}</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Apuestas Pendientes</span>
                                    <span className="text-white font-bold">{poolData.activeBets?.count || 0}</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">House Edge</span>
                                    <span className="text-white font-bold">{poolData.pool?.houseEdgePercent || 0}%</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Pagos 24h</span>
                                    <span className="text-white font-bold">${formatCurrency(poolData.recentPayouts24h)}</span>
                                </div>
                            </div>

                            {/* Multipliers info */}
                            <h4 className="text-white font-medium mb-3">Multiplicadores</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                                    <span className="text-blue-400 text-sm block mb-1">Fijo</span>
                                    <span className="text-white font-bold text-xl">65x</span>
                                    <span className="text-gray-400 text-xs block">2 digitos</span>
                                </div>
                                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                                    <span className="text-green-400 text-sm block mb-1">Centena</span>
                                    <span className="text-white font-bold text-xl">300x</span>
                                    <span className="text-gray-400 text-xs block">3 digitos</span>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                                    <span className="text-purple-400 text-sm block mb-1">Parle</span>
                                    <span className="text-white font-bold text-xl">1000x</span>
                                    <span className="text-gray-400 text-xs block">4 digitos</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'draws' && (
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-semibold">Sorteos Recientes</h3>
                                <span className="text-gray-400 text-sm">{draws.length} sorteos</span>
                            </div>

                            {draws.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                                <th className="pb-3 px-4">Sorteo</th>
                                                <th className="pb-3 px-4 text-center">Estado</th>
                                                <th className="pb-3 px-4 text-center">Apuestas</th>
                                                <th className="pb-3 px-4 text-right">Apostado</th>
                                                <th className="pb-3 px-4 text-right">Pagado</th>
                                                <th className="pb-3 px-4 text-right">P/L</th>
                                                <th className="pb-3 px-4 text-center">Numero</th>
                                                <th className="pb-3 px-4 text-right">Hora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {draws.map((draw) => (
                                                <tr key={draw.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                    <td className="py-3 px-4">
                                                        <span className="font-mono text-sm text-gray-300">{draw.drawNumber}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <StatusBadge status={draw.status} />
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-gray-300">{draw.betCount}</td>
                                                    <td className="py-3 px-4 text-right text-gray-300">${formatCurrency(draw.totalWagered)}</td>
                                                    <td className="py-3 px-4 text-right text-gray-300">${formatCurrency(draw.totalPayouts)}</td>
                                                    <td className={`py-3 px-4 text-right font-medium ${draw.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {draw.netResult >= 0 ? '+' : ''}{formatCurrency(draw.netResult)}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        {draw.winningNumber ? (
                                                            <span className="font-mono text-yellow-400 font-bold">{draw.winningNumber}</span>
                                                        ) : (
                                                            <span className="text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-gray-500 text-sm">
                                                        {new Date(draw.scheduledTime).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No hay sorteos registrados
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'exposures' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Exposicion por Numero (Sorteos Abiertos)</h3>

                            {exposures.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                                <th className="pb-3 px-4">Sorteo</th>
                                                <th className="pb-3 px-4">Tipo</th>
                                                <th className="pb-3 px-4 text-center">Numero</th>
                                                <th className="pb-3 px-4 text-center">Apuestas</th>
                                                <th className="pb-3 px-4 text-right">Monto</th>
                                                <th className="pb-3 px-4 text-right">Exposicion Max</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exposures.map((exp, idx) => (
                                                <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                    <td className="py-3 px-4 font-mono text-sm text-gray-300">{exp.drawNumber}</td>
                                                    <td className="py-3 px-4 text-gray-300">{gameTypeLabel(exp.gameType)}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className="font-mono text-yellow-400 font-bold">{exp.betNumber}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-gray-300">{exp.betCount}</td>
                                                    <td className="py-3 px-4 text-right text-gray-300">${formatCurrency(exp.totalAmount)}</td>
                                                    <td className={`py-3 px-4 text-right font-medium ${exp.maxExposure > 1000 ? 'text-red-400' : 'text-yellow-400'}`}>
                                                        ${formatCurrency(exp.maxExposure)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No hay exposicion activa (ningun sorteo abierto con apuestas)
                                </div>
                            )}

                            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                <h5 className="text-blue-400 font-medium mb-2">Sobre la Exposicion</h5>
                                <ul className="text-gray-400 text-sm space-y-1">
                                    <li>Fijo: Apuesta x 65 = exposicion maxima</li>
                                    <li>Centena: Apuesta x 300 = exposicion maxima</li>
                                    <li>Parle: Apuesta x 1000 = exposicion maxima</li>
                                    <li>El contrato verifica limites de exposicion on-chain</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Historial Diario (7 dias)</h3>

                            {history.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                                <th className="pb-3 px-4">Dia</th>
                                                <th className="pb-3 px-4 text-center">Sorteos</th>
                                                <th className="pb-3 px-4 text-center">Apuestas</th>
                                                <th className="pb-3 px-4 text-right">Apostado</th>
                                                <th className="pb-3 px-4 text-right">Pagado</th>
                                                <th className="pb-3 px-4 text-right">Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((day, idx) => (
                                                <tr key={idx} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                                                    <td className="py-3 px-4 text-gray-300">
                                                        {new Date(day.day).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-gray-300">{day.draws}</td>
                                                    <td className="py-3 px-4 text-center text-gray-300">{day.bets}</td>
                                                    <td className="py-3 px-4 text-right text-gray-300">${formatCurrency(day.wagered)}</td>
                                                    <td className="py-3 px-4 text-right text-gray-300">${formatCurrency(day.payouts)}</td>
                                                    <td className={`py-3 px-4 text-right font-medium ${day.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {day.profit >= 0 ? '+' : ''}{formatCurrency(day.profit)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No hay historial disponible
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BolitaPoolDashboard;
