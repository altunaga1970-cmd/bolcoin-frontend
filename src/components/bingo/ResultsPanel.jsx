/**
 * ResultsPanel — Shows round results: line/bingo winners, prizes, jackpot.
 * Supports multiple co-winners (prize split).
 */

import React from 'react';
import { useTranslation } from 'react-i18next';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

function shortenAddr(addr) {
  if (!addr || addr === ZERO_ADDR) return null;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Parse winner field: can be a single address string, a JSON array string, or an actual array.
 * Returns array of addresses (excluding zero address).
 */
function parseWinners(winner) {
  if (!winner) return [];
  if (Array.isArray(winner)) return winner.filter(a => a && a !== ZERO_ADDR);
  if (typeof winner === 'string') {
    if (winner.startsWith('[')) {
      try { return JSON.parse(winner).filter(a => a && a !== ZERO_ADDR); } catch { return []; }
    }
    if (winner !== ZERO_ADDR) return [winner];
  }
  return [];
}

function ResultsPanel({ results, roomColor }) {
  const { t } = useTranslation('games');
  if (!results) return null;

  const lineWinners = parseWinners(results.lineWinner);
  const bingoWinners = parseWinners(results.bingoWinner);
  const hasLineWinner = lineWinners.length > 0;
  const hasBingoWinner = bingoWinners.length > 0;

  const formatWinners = (winners) => {
    if (winners.length === 1) return shortenAddr(winners[0]);
    return t('bingo.results_panel.n_winners', { count: winners.length });
  };

  return (
    <div className="results-panel-v2" style={{ '--room-color': roomColor }}>
      <h3>{t('bingo.results.title')}</h3>

      <div className="result-v2-row">
        <span className="result-v2-label">{t('bingo.results.line_winner')}</span>
        <span className={`result-v2-value ${hasLineWinner ? 'winner' : ''}`}>
          {hasLineWinner
            ? `${formatWinners(lineWinners)} (#${results.lineWinnerBallPos || results.lineWinnerBall || '?'})`
            : t('bingo.results.no_winner')}
        </span>
      </div>
      {hasLineWinner && lineWinners.length > 1 && (
        <div className="result-v2-row result-v2-subrow">
          <span className="result-v2-label"></span>
          <span className="result-v2-value" style={{ fontSize: '0.85em', opacity: 0.8 }}>
            {lineWinners.map(a => shortenAddr(a)).join(', ')}
          </span>
        </div>
      )}

      <div className="result-v2-row">
        <span className="result-v2-label">{t('bingo.results.bingo_winner')}</span>
        <span className={`result-v2-value ${hasBingoWinner ? 'winner' : ''}`}>
          {hasBingoWinner
            ? `${formatWinners(bingoWinners)} (#${results.bingoWinnerBallPos || results.bingoWinnerBall || '?'})`
            : t('bingo.results.no_winner')}
        </span>
      </div>
      {hasBingoWinner && bingoWinners.length > 1 && (
        <div className="result-v2-row result-v2-subrow">
          <span className="result-v2-label"></span>
          <span className="result-v2-value" style={{ fontSize: '0.85em', opacity: 0.8 }}>
            {bingoWinners.map(a => shortenAddr(a)).join(', ')}
          </span>
        </div>
      )}

      {parseFloat(results.linePrize) > 0 && (
        <div className="result-v2-row">
          <span className="result-v2-label">{t('bingo.results.line_prize')}</span>
          <span className="result-v2-value">
            ${parseFloat(results.linePrize).toFixed(2)} USDT
            {lineWinners.length > 1 ? ` (${(parseFloat(results.linePrize) / lineWinners.length).toFixed(2)} ${t('bingo.results_panel.per_person')})` : ''}
          </span>
        </div>
      )}

      {parseFloat(results.bingoPrize) > 0 && (
        <div className="result-v2-row">
          <span className="result-v2-label">{t('bingo.results.bingo_prize')}</span>
          <span className="result-v2-value">
            ${parseFloat(results.bingoPrize).toFixed(2)} USDT
            {bingoWinners.length > 1 ? ` (${(parseFloat(results.bingoPrize) / bingoWinners.length).toFixed(2)} ${t('bingo.results_panel.per_person')})` : ''}
          </span>
        </div>
      )}

      {results.jackpotWon && (
        <div className="result-v2-row jackpot-row">
          <span className="result-v2-label">{t('bingo.results.jackpot')}</span>
          <span className="result-v2-value jackpot">${parseFloat(results.jackpotPaid).toFixed(2)} USDT</span>
        </div>
      )}
    </div>
  );
}

export default ResultsPanel;
