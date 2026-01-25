import React from 'react';
import { formatLargeNumber, formatCurrency, LOTTERY_CONFIG } from '../../utils/prizeCalculations';
import './Prizes.css';

/**
 * Jackpot status display component
 * Shows current jackpot, cap progress, and next contribution
 */
function JackpotStatus({ currentJackpot, nextDrawTickets = 0, size = 'md', showDetails = true }) {
    const cap = LOTTERY_CONFIG.jackpot.cap;
    const percentOfCap = Math.min((currentJackpot / cap) * 100, 100);
    const isCapped = currentJackpot >= cap;

    // Calculate next contribution
    const ticketPrice = LOTTERY_CONFIG.ticketPrice;
    const contributionRate = LOTTERY_CONFIG.revenueDistribution.jackpotBps / 10000;
    const nextContribution = nextDrawTickets * ticketPrice * contributionRate;
    const projectedJackpot = Math.min(currentJackpot + nextContribution, cap);

    return (
        <div className={`jackpot-status jackpot-${size}`}>
            <div className="jackpot-header">
                <span className="jackpot-label">JACKPOT</span>
                {isCapped && <span className="jackpot-capped-badge">MAX</span>}
            </div>

            <div className="jackpot-amount">
                {formatLargeNumber(currentJackpot)}
            </div>

            {showDetails && (
                <>
                    <div className="jackpot-progress-container">
                        <div className="jackpot-progress-bar">
                            <div
                                className="jackpot-progress-fill"
                                style={{ width: `${percentOfCap}%` }}
                            />
                        </div>
                        <div className="jackpot-progress-labels">
                            <span>{formatCurrency(0)}</span>
                            <span>CAP: {formatLargeNumber(cap)}</span>
                        </div>
                    </div>

                    {nextDrawTickets > 0 && !isCapped && (
                        <div className="jackpot-projection">
                            <span className="projection-label">
                                Proyeccion proximo sorteo:
                            </span>
                            <span className="projection-value">
                                +{formatCurrency(nextContribution)} = {formatLargeNumber(projectedJackpot)}
                            </span>
                        </div>
                    )}

                    <div className="jackpot-info">
                        <div className="jackpot-info-item">
                            <span className="info-label">Contribucion por ticket</span>
                            <span className="info-value">
                                {(contributionRate * 100).toFixed(0)}% ({formatCurrency(ticketPrice * contributionRate)})
                            </span>
                        </div>
                        {isCapped && (
                            <div className="jackpot-info-item capped-warning">
                                <span className="info-label">Excedente va a</span>
                                <span className="info-value">Pool de Premios</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default JackpotStatus;
