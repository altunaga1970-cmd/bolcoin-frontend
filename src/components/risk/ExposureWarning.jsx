import React from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * ExposureWarning Component
 * Shows warning when a number is near or at the exposure limit
 */
const ExposureWarning = ({
    number,
    betType,
    currentLiability = 0,
    payoutCap = 0,
    percentageUsed = 0,
    maxAllowedStake = 0,
    suggestedStake = 0,
    onUseSuggested,
    isBlocked = false
}) => {
    // Determine alert level
    let alertLevel = 'normal';
    let alertColor = 'green';
    let alertBg = 'green';

    if (percentageUsed >= 100 || isBlocked) {
        alertLevel = 'blocked';
        alertColor = 'red';
        alertBg = 'red';
    } else if (percentageUsed >= 90) {
        alertLevel = 'critical';
        alertColor = 'red';
        alertBg = 'red';
    } else if (percentageUsed >= 70) {
        alertLevel = 'warning';
        alertColor = 'yellow';
        alertBg = 'yellow';
    }

    // Don't show anything if under warning threshold
    if (alertLevel === 'normal') {
        return null;
    }

    const getIcon = () => {
        if (alertLevel === 'blocked') {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        );
    };

    const getMessage = () => {
        const betTypeLabel = {
            fijo: 'Fijo',
            fijos: 'Fijo',
            centena: 'Centena',
            centenas: 'Centena',
            parle: 'Parle',
            parles: 'Parle'
        }[betType?.toLowerCase()] || betType;

        if (alertLevel === 'blocked') {
            return `El numero ${number} (${betTypeLabel}) ha alcanzado el limite de exposicion. No se pueden aceptar mas apuestas para este numero.`;
        }
        if (alertLevel === 'critical') {
            return `El numero ${number} (${betTypeLabel}) esta cerca del limite (${percentageUsed.toFixed(1)}%). Quedan pocos cupos disponibles.`;
        }
        return `El numero ${number} (${betTypeLabel}) tiene alta demanda (${percentageUsed.toFixed(1)}% del limite).`;
    };

    return (
        <div className={`rounded-lg p-4 border bg-${alertBg}-500/10 border-${alertColor}-500/30`}>
            <div className="flex items-start gap-3">
                <div className={`text-${alertColor}-400 flex-shrink-0 mt-0.5`}>
                    {getIcon()}
                </div>
                <div className="flex-1">
                    <h4 className={`font-semibold text-${alertColor}-400 mb-1`}>
                        {alertLevel === 'blocked' ? 'Numero Bloqueado' :
                         alertLevel === 'critical' ? 'Alerta Critica' : 'Advertencia'}
                    </h4>
                    <p className="text-gray-300 text-sm mb-3">
                        {getMessage()}
                    </p>

                    {/* Progress bar showing usage */}
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-400">Exposicion actual</span>
                            <span className={`text-${alertColor}-400`}>{percentageUsed.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-${alertColor}-500 transition-all duration-300`}
                                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-gray-800/50 rounded p-2">
                            <span className="text-gray-400 block">Exposicion</span>
                            <span className="text-white font-medium">{formatCurrency(currentLiability)} USDT</span>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                            <span className="text-gray-400 block">Limite</span>
                            <span className="text-white font-medium">{formatCurrency(payoutCap)} USDT</span>
                        </div>
                    </div>

                    {/* Suggested stake if available */}
                    {alertLevel !== 'blocked' && maxAllowedStake > 0 && (
                        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                            <div>
                                <span className="text-gray-400 text-xs block">Maximo permitido</span>
                                <span className="text-white font-semibold">{formatCurrency(maxAllowedStake)} USDT</span>
                            </div>
                            {onUseSuggested && suggestedStake > 0 && (
                                <button
                                    onClick={() => onUseSuggested(suggestedStake)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                                >
                                    Usar {formatCurrency(suggestedStake)} USDT
                                </button>
                            )}
                        </div>
                    )}

                    {alertLevel === 'blocked' && (
                        <div className="bg-red-900/30 rounded-lg p-3 text-center">
                            <span className="text-red-300 text-sm">
                                Por favor, selecciona otro numero o tipo de apuesta.
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * ExposureIndicator - Compact version for bet lists
 */
export const ExposureIndicator = ({ percentageUsed = 0, size = 'sm' }) => {
    if (percentageUsed < 50) return null;

    let color = 'yellow';
    if (percentageUsed >= 100) color = 'red';
    else if (percentageUsed >= 90) color = 'red';
    else if (percentageUsed >= 70) color = 'orange';

    const sizeClasses = {
        xs: 'text-xs px-1.5 py-0.5',
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-2.5 py-1'
    };

    return (
        <span className={`bg-${color}-500/20 text-${color}-400 rounded ${sizeClasses[size]}`}>
            {percentageUsed >= 100 ? 'LLENO' : `${percentageUsed.toFixed(0)}%`}
        </span>
    );
};

export default ExposureWarning;
