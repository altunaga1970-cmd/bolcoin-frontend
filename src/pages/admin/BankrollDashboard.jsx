import React, { useState, useEffect, useCallback } from 'react';
import { useRiskContract } from '../../hooks/useRiskContract';
import { formatCurrency } from '../../utils/formatters';

/**
 * BankrollDashboard - Admin page for risk management and bankroll monitoring
 */
const BankrollDashboard = () => {
    const { getPoolStatus, getRiskParameters, getPendingOperatorFees, isConnected } = useRiskContract();

    const [loading, setLoading] = useState(true);
    const [bankrollInfo, setBankrollInfo] = useState({
        totalPool: 0,
        usableBalance: 0,
        reserveAmount: 0,
        payoutCap: 0,
        pendingOperatorFees: 0
    });

    const [exposures, setExposures] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [settlements, setSettlements] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');

    // Risk config
    const [riskConfig, setRiskConfig] = useState({
        reserveRatioBps: 3000,
        riskFactorBps: 1000,
        absoluteMaxPayout: 10000,
        operatorCommissionBps: 1500,
        minStake: 1,
        maxStake: 10
    });

    const fetchBankrollData = useCallback(async () => {
        if (!isConnected) return;

        setLoading(true);
        try {
            // Fetch bankroll info from contract
            const [poolStatus, riskParams, fees] = await Promise.all([
                getPoolStatus(),
                getRiskParameters(),
                getPendingOperatorFees()
            ]);

            if (poolStatus) {
                const totalPool = parseFloat(poolStatus.totalPool) || 0;
                const usableBalance = parseFloat(poolStatus.usableBalance) || 0;

                setBankrollInfo({
                    totalPool,
                    usableBalance,
                    reserveAmount: totalPool - usableBalance,
                    payoutCap: parseFloat(poolStatus.payoutCap) || 0,
                    pendingOperatorFees: parseFloat(fees) || 0
                });
            }

            if (riskParams) {
                setRiskConfig({
                    reserveRatioBps: riskParams.reserveRatio * 100,
                    riskFactorBps: riskParams.riskFactor * 100,
                    absoluteMaxPayout: parseFloat(riskParams.absoluteMaxPayout),
                    operatorCommissionBps: 1500,
                    minStake: parseFloat(riskParams.minBetAmount),
                    maxStake: parseFloat(riskParams.maxBetAmount)
                });
            }
        } catch (error) {
            console.error('Error fetching bankroll data:', error);
        }
        setLoading(false);
    }, [isConnected, getPoolStatus, getRiskParameters, getPendingOperatorFees]);

    useEffect(() => {
        fetchBankrollData();
        const interval = setInterval(fetchBankrollData, 30000);
        return () => clearInterval(interval);
    }, [fetchBankrollData]);

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

    const AlertBadge = ({ level }) => {
        const colors = {
            warning: 'bg-yellow-500/20 text-yellow-400',
            critical: 'bg-orange-500/20 text-orange-400',
            blocked: 'bg-red-500/20 text-red-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs ${colors[level] || colors.warning}`}>
                {level.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gestion de Riesgo</h1>
                        <p className="text-gray-400 mt-1">Monitoreo de bankroll y exposicion</p>
                    </div>
                    <button
                        onClick={fetchBankrollData}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Pool Total"
                        value={`${formatCurrency(bankrollInfo.totalPool)} USDT`}
                        subtitle="Balance total del contrato"
                        color="blue"
                    />
                    <StatCard
                        title="Balance Disponible"
                        value={`${formatCurrency(bankrollInfo.usableBalance)} USDT`}
                        subtitle={`${((bankrollInfo.usableBalance / (bankrollInfo.totalPool || 1)) * 100).toFixed(1)}% del pool`}
                        color="green"
                    />
                    <StatCard
                        title="Payout Cap"
                        value={`${formatCurrency(bankrollInfo.payoutCap)} USDT`}
                        subtitle="Maximo pago por numero"
                        color="purple"
                    />
                    <StatCard
                        title="Comisiones Pendientes"
                        value={`${formatCurrency(bankrollInfo.pendingOperatorFees)} USDT`}
                        subtitle="Por retirar"
                        color="yellow"
                    />
                </div>

                {/* Reserve Progress */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 mb-8">
                    <h3 className="text-white font-semibold mb-4">Distribucion del Pool</h3>
                    <div className="h-4 bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div className="h-full flex">
                            <div
                                className="bg-green-500"
                                style={{ width: `${(bankrollInfo.usableBalance / (bankrollInfo.totalPool || 1)) * 100}%` }}
                            />
                            <div
                                className="bg-yellow-500"
                                style={{ width: `${(bankrollInfo.reserveAmount / (bankrollInfo.totalPool || 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded" />
                            <span className="text-gray-400">Disponible: {formatCurrency(bankrollInfo.usableBalance)} USDT</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded" />
                            <span className="text-gray-400">Reserva (30%): {formatCurrency(bankrollInfo.reserveAmount)} USDT</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2">
                    {['overview', 'exposure', 'settlements', 'config'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            {tab === 'overview' && 'Resumen'}
                            {tab === 'exposure' && 'Exposicion'}
                            {tab === 'settlements' && 'Liquidaciones'}
                            {tab === 'config' && 'Configuracion'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-gray-800 rounded-xl border border-gray-700">
                    {activeTab === 'overview' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Resumen del Sistema</h3>

                            {/* Risk Parameters */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Reserva</span>
                                    <span className="text-white font-bold">{riskConfig.reserveRatioBps / 100}%</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Factor de Riesgo</span>
                                    <span className="text-white font-bold">{riskConfig.riskFactorBps / 100}%</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Max Payout Absoluto</span>
                                    <span className="text-white font-bold">{formatCurrency(riskConfig.absoluteMaxPayout)} USDT</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Comision Operador</span>
                                    <span className="text-white font-bold">{riskConfig.operatorCommissionBps / 100}%</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Stake Minimo</span>
                                    <span className="text-white font-bold">{riskConfig.minStake} USDT</span>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <span className="text-gray-400 text-sm block mb-1">Stake Maximo</span>
                                    <span className="text-white font-bold">{riskConfig.maxStake} USDT</span>
                                </div>
                            </div>

                            {/* Multipliers */}
                            <h4 className="text-white font-medium mb-3">Multiplicadores</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
                                    <span className="text-blue-400 text-sm block mb-1">Fijo (2 cifras)</span>
                                    <span className="text-white font-bold text-xl">65x</span>
                                </div>
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-center">
                                    <span className="text-purple-400 text-sm block mb-1">Centena (3 cifras)</span>
                                    <span className="text-white font-bold text-xl">300x</span>
                                </div>
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                                    <span className="text-yellow-400 text-sm block mb-1">Parle (4 cifras)</span>
                                    <span className="text-white font-bold text-xl">1500x</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'exposure' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Exposicion por Numero</h3>

                            {alerts.length > 0 ? (
                                <div className="space-y-3">
                                    {alerts.map((alert, idx) => (
                                        <div key={idx} className="bg-gray-700/50 rounded-lg p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <AlertBadge level={alert.alertLevel} />
                                                <div>
                                                    <span className="text-white font-medium">{alert.number}</span>
                                                    <span className="text-gray-400 text-sm ml-2">({alert.betType})</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-white">{formatCurrency(alert.totalLiability)} USDT</div>
                                                <div className="text-gray-400 text-sm">{alert.percentageUsed.toFixed(1)}% del cap</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400">No hay alertas de exposicion activas</p>
                                    <p className="text-gray-500 text-sm mt-1">Todos los numeros estan dentro de los limites seguros</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settlements' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Liquidaciones Recientes</h3>

                            {settlements.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                                                <th className="pb-3">Fecha</th>
                                                <th className="pb-3">Apostado</th>
                                                <th className="pb-3">Pagado</th>
                                                <th className="pb-3">P/L</th>
                                                <th className="pb-3">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settlements.map((s, idx) => (
                                                <tr key={idx} className="border-b border-gray-700/50">
                                                    <td className="py-3 text-white">{s.date}</td>
                                                    <td className="py-3 text-gray-300">{formatCurrency(s.totalStaked)} USDT</td>
                                                    <td className="py-3 text-gray-300">{formatCurrency(s.totalPaidOut)} USDT</td>
                                                    <td className={`py-3 ${s.profitOrLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {s.profitOrLoss >= 0 ? '+' : ''}{formatCurrency(s.profitOrLoss)} USDT
                                                    </td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-1 rounded text-xs ${s.settled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                            {s.settled ? 'Liquidado' : 'Pendiente'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    No hay liquidaciones registradas
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'config' && (
                        <div className="p-6">
                            <h3 className="text-white font-semibold mb-4">Configuracion de Riesgo</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Los parametros de riesgo se configuran en el smart contract. Los cambios requieren una transaccion on-chain.
                            </p>

                            <div className="space-y-4">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Ratio de Reserva</span>
                                            <p className="text-gray-400 text-sm mt-1">Porcentaje del pool que se mantiene en reserva</p>
                                        </div>
                                        <span className="text-2xl font-bold text-blue-400">30%</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Factor de Riesgo</span>
                                            <p className="text-gray-400 text-sm mt-1">Porcentaje del usable disponible para riesgo diario</p>
                                        </div>
                                        <span className="text-2xl font-bold text-purple-400">10%</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Payout Maximo Absoluto</span>
                                            <p className="text-gray-400 text-sm mt-1">Limite superior independiente del pool</p>
                                        </div>
                                        <span className="text-2xl font-bold text-green-400">10,000 USDT</span>
                                    </div>
                                </div>

                                <div className="bg-gray-700/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-white font-medium">Comision del Operador</span>
                                            <p className="text-gray-400 text-sm mt-1">Solo sobre beneficio neto positivo mensual</p>
                                        </div>
                                        <span className="text-2xl font-bold text-yellow-400">15%</span>
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

export default BankrollDashboard;
