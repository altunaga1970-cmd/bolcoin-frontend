import React from 'react';
import {
    calculateRevenueBreakdown,
    estimatePrizes,
    formatCurrency,
    formatLargeNumber
} from '../../utils/prizeCalculations';
import './Prizes.css';

/**
 * Prize breakdown component
 * Shows how ticket revenue is distributed
 */
function PrizeBreakdown({
    ticketCount = 0,
    currentJackpot = 0,
    showPieChart = true,
    showDetails = true
}) {
    const revenueBreakdown = calculateRevenueBreakdown(ticketCount);
    const prizeEstimates = ticketCount > 0 ? estimatePrizes(ticketCount, currentJackpot) : null;

    // Calculate pie chart segments
    const total = revenueBreakdown.totalSales || 1;
    let currentAngle = 0;

    const segments = revenueBreakdown.breakdown.map(item => {
        const startAngle = currentAngle;
        const angle = (item.amount / total) * 360;
        currentAngle += angle;

        return {
            ...item,
            startAngle,
            endAngle: currentAngle,
            percentage: (item.amount / total) * 100
        };
    });

    // SVG pie chart helper
    const getArcPath = (startAngle, endAngle, radius = 50) => {
        const start = polarToCartesian(50, 50, radius, startAngle);
        const end = polarToCartesian(50, 50, radius, endAngle);
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;

        return `M 50 50 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    };

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians)
        };
    };

    const colorMap = {
        gold: '#FFD700',
        green: '#22c55e',
        blue: '#3b82f6',
        gray: '#6b7280'
    };

    return (
        <div className="prize-breakdown">
            <h3 className="breakdown-title">Distribucion de Ingresos</h3>

            <div className="breakdown-content">
                {showPieChart && ticketCount > 0 && (
                    <div className="breakdown-chart">
                        <svg viewBox="0 0 100 100" className="pie-chart">
                            {segments.map((seg, i) => (
                                <path
                                    key={i}
                                    d={getArcPath(seg.startAngle, seg.endAngle)}
                                    fill={colorMap[seg.color] || '#ccc'}
                                    className={`pie-segment pie-${seg.color}`}
                                />
                            ))}
                            <circle cx="50" cy="50" r="25" fill="var(--color-background, #0d0d0d)" />
                            <text x="50" y="48" textAnchor="middle" className="pie-center-text">
                                {ticketCount}
                            </text>
                            <text x="50" y="58" textAnchor="middle" className="pie-center-label">
                                tickets
                            </text>
                        </svg>
                    </div>
                )}

                <div className="breakdown-legend">
                    {revenueBreakdown.breakdown.map((item, i) => (
                        <div key={i} className={`legend-item legend-${item.color}`}>
                            <div className="legend-color" style={{ backgroundColor: colorMap[item.color] }} />
                            <div className="legend-info">
                                <span className="legend-name">{item.nameEs}</span>
                                <span className="legend-percent">{item.percent}%</span>
                                {ticketCount > 0 && (
                                    <span className="legend-amount">
                                        {formatCurrency(item.amount)}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showDetails && prizeEstimates && (
                <div className="breakdown-details">
                    <div className="detail-section">
                        <h4>Resumen del Sorteo</h4>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <span className="detail-label">Venta Total</span>
                                <span className="detail-value">
                                    {formatCurrency(prizeEstimates.totalSales)}
                                </span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Pool de Premios</span>
                                <span className="detail-value">
                                    {formatCurrency(prizeEstimates.prizePool.adjusted)}
                                </span>
                            </div>
                            <div className="detail-item highlight">
                                <span className="detail-label">Jackpot Nuevo</span>
                                <span className="detail-value jackpot">
                                    {formatLargeNumber(prizeEstimates.jackpot.new)}
                                </span>
                            </div>
                            {prizeEstimates.jackpot.overflow > 0 && (
                                <div className="detail-item warning">
                                    <span className="detail-label">Excedente Jackpot</span>
                                    <span className="detail-value">
                                        +{formatCurrency(prizeEstimates.jackpot.overflow)} al pool
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {ticketCount === 0 && (
                <div className="breakdown-empty">
                    <p>Ingresa la cantidad de tickets vendidos para ver la distribucion estimada.</p>
                </div>
            )}
        </div>
    );
}

export default PrizeBreakdown;
