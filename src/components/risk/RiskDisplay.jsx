import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * RiskDisplay Component
 * Shows current bankroll status and payout cap for users
 */
const RiskDisplay = ({
    totalPool = 0,
    usableBalance = 0,
    payoutCap = 0,
    reserveAmount = 0,
    showDetails = false,
    compact = false
}) => {
    const reservePercentage = totalPool > 0 ? ((reserveAmount / totalPool) * 100).toFixed(1) : 0;
    const usablePercentage = totalPool > 0 ? ((usableBalance / totalPool) * 100).toFixed(1) : 0;

    if (compact) {
        return (
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-3 border border-blue-500/30">
                <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Pago Max:</span>
                    <span className="text-white font-bold">{formatCurrency(payoutCap)} USDT</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <h3 className="text-white font-semibold">Estado del Pool</h3>
            </div>

            <div className="space-y-3">
                {/* Payout Cap - Highlighted */}
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                    <div className="flex items-center justify-between">
                        <span className="text-green-300 text-sm font-medium">Pago Maximo Disponible</span>
                        <span className="text-green-400 font-bold text-lg">{formatCurrency(payoutCap)} USDT</span>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                        Maximo pago por numero ganador
                    </p>
                </div>

                {showDetails && (
                    <>
                        {/* Pool Total */}
                        <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                            <span className="text-gray-400 text-sm">Pool Total</span>
                            <span className="text-white font-medium">{formatCurrency(totalPool)} USDT</span>
                        </div>

                        {/* Usable Balance */}
                        <div className="flex items-center justify-between py-2 border-b border-gray-700/50">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">Disponible</span>
                                <span className="text-xs text-blue-400">({usablePercentage}%)</span>
                            </div>
                            <span className="text-white font-medium">{formatCurrency(usableBalance)} USDT</span>
                        </div>

                        {/* Reserve */}
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">Reserva</span>
                                <span className="text-xs text-yellow-400">({reservePercentage}%)</span>
                            </div>
                            <span className="text-yellow-400 font-medium">{formatCurrency(reserveAmount)} USDT</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2">
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full flex">
                                    <div
                                        className="bg-blue-500"
                                        style={{ width: `${usablePercentage}%` }}
                                    />
                                    <div
                                        className="bg-yellow-500"
                                        style={{ width: `${reservePercentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between mt-1 text-xs">
                                <span className="text-blue-400">Disponible</span>
                                <span className="text-yellow-400">Reserva</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RiskDisplay;
