/**
 * BallDraw — Compact ball draw animation panel (sidebar)
 *
 * Shows current ball (large, colored), progress bar, 75-ball grid, controls.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function getBallColumn(num) {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
}

function BallDraw({ currentBall, currentBallIndex, drawnBalls, animatedBalls, progress, onSkip, autoMark, onToggleAutoMark, isDrawing, totalBalls }) {
  const { t } = useTranslation('games');
  const animatedSet = useMemo(() => new Set(animatedBalls), [animatedBalls]);
  const displayTotal = totalBalls || drawnBalls.length;

  return (
    <div className="ball-draw-v2">
      {/* Current ball */}
      {currentBall && (
        <div className="current-ball-v2-display">
          <div className={`current-ball-v2 col-${getBallColumn(currentBall)}`} key={currentBall}>
            <span className="ball-v2-col">{getBallColumn(currentBall)}</span>
            <span className="ball-v2-num">{currentBall}</span>
          </div>
          <span className="ball-v2-counter">
            {t('bingo.ball_draw.ball_counter', { current: currentBallIndex + 1, total: displayTotal })}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="draw-progress-v2">
        <div className="draw-progress-v2-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* 75-slot ball history grid (compact 15 cols) */}
      <div className="ball-history-v2">
        {Array.from({ length: 75 }, (_, i) => i + 1).map(num => {
          const isDrawn = animatedSet.has(num);
          const col = getBallColumn(num);
          return (
            <div
              key={num}
              className={`ball-slot-v2 ${isDrawn ? `drawn col-${col}` : ''}`}
            >
              {num}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="draw-controls-v2">
        <label className="auto-mark-v2">
          <input type="checkbox" checked={autoMark} onChange={onToggleAutoMark} />
          {t('bingo.ball_draw.auto_mark')}
        </label>

        {/* Skip removed: multiplayer game, all players watch the same draw */}
      </div>
    </div>
  );
}

export default BallDraw;
