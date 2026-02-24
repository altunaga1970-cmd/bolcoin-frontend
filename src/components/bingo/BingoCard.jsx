/**
 * BingoCard — Single bingo card (3 rows x 5 cols = 15 numbers)
 *
 * Animated marking, row-complete glow, bingo detection.
 * Blinking "almost" signals: 1 number away from line or bingo.
 */

import React, { useMemo } from 'react';

const BINGO_COLUMNS = ['B', 'I', 'N', 'G', 'O'];

function BingoCard({ card, isMarked, checkLine, checkBingo, hasAnyLine, autoMark, onToggleMark, isDrawing, roomColor, lineAnnounced, animatedBalls = [] }) {
  const hasBingo = isDrawing && checkBingo(card);
  const hasLine = isDrawing && hasAnyLine(card);
  const numbers = card.numbers || card.card_numbers || [];
  const cardId = card.cardId || card.card_id;

  // Detect "almost" states: 1 number away from line or bingo
  const { almostLine, almostBingo, almostLineRow } = useMemo(() => {
    if (!isDrawing || !numbers.length) return { almostLine: false, almostBingo: false, almostLineRow: -1 };

    let totalUnmarked = 0;
    let bestRowMissing = Infinity;
    let bestRow = -1;

    for (let row = 0; row < 3; row++) {
      let rowMissing = 0;
      for (let col = 0; col < 5; col++) {
        const num = numbers[row * 5 + col];
        if (num !== 0 && !isMarked(num)) {
          rowMissing++;
          totalUnmarked++;
        }
      }
      if (rowMissing < bestRowMissing) {
        bestRowMissing = rowMissing;
        bestRow = row;
      }
    }

    // Almost line: exactly 1 missing in any row (and first line not yet announced)
    const almostL = !lineAnnounced && !hasLine && bestRowMissing === 1;
    // Almost bingo: exactly 1 number missing total (and already has line or line announced)
    const almostB = !hasBingo && totalUnmarked === 1;

    return {
      almostLine: almostL,
      almostBingo: almostB,
      almostLineRow: almostL ? bestRow : -1,
    };
  }, [isDrawing, numbers, isMarked, hasLine, hasBingo, lineAnnounced]);

  const cardClass = [
    'bingo-card-v2',
    hasBingo ? 'has-bingo' : '',
    hasLine && !hasBingo ? 'has-line' : '',
    almostBingo ? 'almost-bingo' : '',
    almostLine && !almostBingo ? 'almost-line' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass} style={{ '--room-color': roomColor }}>
      <div className="card-v2-id">
        #{cardId}
        {almostBingo && <span className="almost-badge almost-badge-bingo">1 para BINGO!</span>}
        {almostLine && !almostBingo && <span className="almost-badge almost-badge-line">1 para LÍNEA!</span>}
      </div>

      {/* B I N G O column headers */}
      <div className="card-v2-header">
        {BINGO_COLUMNS.map((col, i) => (
          <span key={col} className={`card-v2-col-label col-hdr-${i}`}>{col}</span>
        ))}
      </div>

      {/* 3 explicit row wrappers for row-level styling */}
      <div className="card-v2-grid">
        {[0, 1, 2].map(row => {
          const rowComplete = isDrawing && checkLine(card, row);
          const isAlmostRow = row === almostLineRow;

          const rowClass = [
            'card-v2-row',
            rowComplete ? 'row-complete' : '',
            isAlmostRow && almostLine && !almostBingo ? 'almost-row' : '',
          ].filter(Boolean).join(' ');

          return (
            <div key={row} className={rowClass}>
              {numbers.slice(row * 5, row * 5 + 5).map((num, col) => {
                const marked = num === 0 || (isDrawing && isMarked(num));
                const isMissingInAlmostRow = isAlmostRow && !marked && num !== 0;
                const isDrawn = num !== 0 && animatedBalls.includes(num);
                const canClick = !autoMark && num !== 0 && isDrawn;

                const classes = [
                  'card-v2-num',
                  `col-${col}`,
                  num === 0 ? 'free' : '',
                  marked ? 'marked' : '',
                  rowComplete ? 'row-hit' : '',
                  isMissingInAlmostRow ? 'almost-missing' : '',
                  almostBingo && !marked && num !== 0 ? 'almost-missing-bingo' : '',
                ].filter(Boolean).join(' ');

                return (
                  <button
                    key={col}
                    className={classes}
                    onClick={() => canClick && onToggleMark && onToggleMark(num)}
                    disabled={autoMark || num === 0 || (!autoMark && !isDrawn)}
                  >
                    {num === 0 ? '★' : num}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BingoCard;
