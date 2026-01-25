import React from 'react';
import {
    PRIZE_CATEGORIES,
    formatCurrency,
    getWinningOdds,
    getCategoryColorClass
} from '../../utils/prizeCalculations';
import './Prizes.css';

/**
 * Prize category table component
 * Shows all prize categories with odds and prizes
 */
function CategoryTable({
    estimatedPrizes = null,
    currentJackpot = 0,
    showOdds = true,
    showEstimates = true,
    compact = false
}) {
    const odds = showOdds ? getWinningOdds() : [];

    // Merge categories with odds and estimates
    const categories = PRIZE_CATEGORIES.map(cat => {
        const oddsInfo = odds.find(o => o.category === cat.category);
        const estimate = estimatedPrizes?.categories?.find(e => e.category === cat.category);

        return {
            ...cat,
            odds: oddsInfo?.odds || '-',
            oddsNumber: oddsInfo?.oddsNumber || 0,
            estimatedPrize: estimate?.estimatedPrize ||
                (cat.category === 1 ? currentJackpot : cat.minPrize),
            isGuaranteedMin: estimate?.isGuaranteedMin || false,
            poolShare: estimate?.poolShare || 0
        };
    });

    if (compact) {
        return (
            <div className="category-table-compact">
                {categories.map(cat => (
                    <div
                        key={cat.category}
                        className={`category-row-compact ${getCategoryColorClass(cat.category)}`}
                    >
                        <div className="category-matches">
                            {cat.matches}{cat.keyMatch ? '+C' : ''}
                        </div>
                        <div className="category-name">{cat.name}</div>
                        <div className="category-prize">
                            {cat.category === 1 ? 'JACKPOT' : formatCurrency(cat.estimatedPrize)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="category-table">
            <table>
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Aciertos</th>
                        {showEstimates && <th>Premio Estimado</th>}
                        {showOdds && <th>Probabilidad</th>}
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.category} className={getCategoryColorClass(cat.category)}>
                            <td className="category-cell">
                                <span className={`category-badge ${getCategoryColorClass(cat.category)}`}>
                                    {cat.category}
                                </span>
                                <span className="category-name">{cat.name}</span>
                                {cat.category === 1 && (
                                    <span className="jackpot-badge">JACKPOT</span>
                                )}
                            </td>
                            <td className="matches-cell">
                                <span className="matches-count">{cat.matches}</span>
                                {cat.keyMatch && <span className="key-indicator">+Clave</span>}
                            </td>
                            {showEstimates && (
                                <td className="prize-cell">
                                    {cat.category === 1 ? (
                                        <span className="jackpot-amount">
                                            {formatCurrency(cat.estimatedPrize)}
                                        </span>
                                    ) : (
                                        <div className="prize-info">
                                            <span className="prize-amount">
                                                {formatCurrency(cat.estimatedPrize)}
                                            </span>
                                            {cat.isGuaranteedMin && (
                                                <span className="guaranteed-badge">Garantizado</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                            )}
                            {showOdds && (
                                <td className="odds-cell">
                                    <span className="odds-value">{cat.odds}</span>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="category-table-footer">
                <p className="footnote">
                    * Los premios de las categorias 2-8 son minimos garantizados.
                    El premio real puede ser mayor segun las ventas.
                </p>
                <p className="footnote">
                    * Las probabilidades son aproximadas basadas en una loteria 6/49 con numero clave 0-9.
                </p>
            </div>
        </div>
    );
}

export default CategoryTable;
