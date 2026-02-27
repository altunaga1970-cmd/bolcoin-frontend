/**
 * useBingoGame Hook
 *
 * State machine + ball draw animation + polling for the Bingo game.
 *
 * Game states:
 *   BROWSING → BUYING → WAITING_CLOSE → WAITING_VRF → DRAWING → RESOLVED
 *
 * Drawing sub-states:
 *   - LINE_ANNOUNCED: pauses when a line winner is detected, shows announcement
 *   - BINGO_ANNOUNCED: stops when bingo winner is detected
 *
 * Ball animation: 4.5-second interval, drawnBalls[75] revealed one by one.
 * Stops at bingoWinnerBall (no need to draw remaining balls).
 * Auto-marks matching numbers on user cards.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from '../contexts/ToastContext';
import { useBalance } from '../contexts/BalanceContext';
import { useBingoContract } from './useBingoContract';
import bingoApi from '../api/bingoApi';

// Game states
const BINGO_STATES = {
  BROWSING: 'browsing',
  BUYING: 'buying',
  WAITING_CLOSE: 'waiting_close',
  WAITING_VRF: 'waiting_vrf',
  DRAWING: 'drawing',
  LINE_ANNOUNCED: 'line_announced',
  BINGO_ANNOUNCED: 'bingo_announced',
  RESOLVED: 'resolved',
  ERROR: 'error'
};

// Ball draw interval (ms) — 4.5 seconds per ball
const DRAW_INTERVAL = 4500;

// Polling interval for round status (ms)
const POLL_INTERVAL = 5000;

// Pause duration for line announcement before resuming (ms)
const LINE_PAUSE_MS = 5000;

// Bingo announcement duration (ms)
const BINGO_PAUSE_MS = 6000;

/**
 * Calculate the current ball index and game phase from server time.
 * Accounts for line/bingo pauses built into the timeline.
 * Returns { ballIndex, phase } where phase is 'drawing' | 'line_pause' | 'bingo_pause' | 'done'
 */
function calcSyncState(elapsedMs, lineWinnerBall, bingoWinnerBall, totalBalls) {
  // Guard: clamp elapsed to ≥0 (client clock can be slightly ahead of server)
  // and ensure totalBalls is valid to prevent negative ballIndex
  if (totalBalls <= 0) return { ballIndex: 0, phase: 'drawing' };
  const elapsed = Math.max(0, elapsedMs);

  const maxBall = bingoWinnerBall > 0 ? bingoWinnerBall : totalBalls;

  // Time when line pause starts (if there's a line winner)
  const linePauseStartMs = lineWinnerBall > 0 ? lineWinnerBall * DRAW_INTERVAL : Infinity;
  const linePauseEndMs = linePauseStartMs + LINE_PAUSE_MS;

  // Before line pause: pure ball drawing
  if (elapsed < linePauseStartMs) {
    const ballIndex = Math.min(Math.floor(elapsed / DRAW_INTERVAL), maxBall - 1);
    return { ballIndex, phase: 'drawing' };
  }

  // During line pause: freeze at line winner ball
  if (lineWinnerBall > 0 && elapsed < linePauseEndMs) {
    return { ballIndex: lineWinnerBall - 1, phase: 'line_pause' };
  }

  // After line pause: adjust elapsed by removing pause duration
  const adjustedMs = lineWinnerBall > 0
    ? elapsed - LINE_PAUSE_MS
    : elapsed;

  const ballIndex = Math.min(Math.floor(adjustedMs / DRAW_INTERVAL), maxBall - 1);

  // Check if we've reached bingo
  if (bingoWinnerBall > 0 && ballIndex >= bingoWinnerBall - 1) {
    // Calculate when bingo pause started and when it ends
    const bingoPauseStartMs = bingoWinnerBall * DRAW_INTERVAL + (lineWinnerBall > 0 ? LINE_PAUSE_MS : 0);
    const bingoPauseEndMs = bingoPauseStartMs + BINGO_PAUSE_MS;
    if (elapsed < bingoPauseEndMs) {
      return { ballIndex: bingoWinnerBall - 1, phase: 'bingo_pause' };
    }
    return { ballIndex: bingoWinnerBall - 1, phase: 'done' };
  }

  // Check if we've reached end of all balls
  if (ballIndex >= totalBalls - 1) {
    return { ballIndex: totalBalls - 1, phase: 'done' };
  }

  return { ballIndex, phase: 'drawing' };
}

/**
 * Generate 75 drawn balls from a VRF random word (deterministic shuffle)
 */
function generateDrawnBalls(randomWord) {
  const balls = Array.from({ length: 75 }, (_, i) => i + 1);
  let seed = BigInt(randomWord);

  for (let i = 74; i > 0; i--) {
    seed = (seed * 6364136223846793005n + 1442695040888963407n) & ((1n << 64n) - 1n);
    const j = Number(seed % BigInt(i + 1));
    [balls[i], balls[j]] = [balls[j], balls[i]];
  }

  return balls;
}

export function useBingoGame(roomNumber = null, initialRoundId = null) {
  const { isConnected, account, chainId } = useWeb3();
  const { error: showError, success: showSuccess, info: showInfo } = useToast();
  const { refreshBalance, loadDatabaseBalance, updateBalanceOptimistic } = useBalance();
  const {
    isOnChain,
    buyCards: buyCardsOnChain,
    getCardPrice,
    getJackpotBalance,
    getUserCardIds,
    getCardNumbers,
    getRoundInfo: getRoundInfoOnChain,
    getRoundResults: getRoundResultsOnChain,
    onVrfFulfilled,
    onRoundResolved,
  } = useBingoContract();

  // ── Config ──────────────────────────────────────────────────────────
  const [config, setConfig] = useState(null);
  const [cardPrice, setCardPrice] = useState('1');
  const [jackpot, setJackpot] = useState('0');

  // ── Game state ──────────────────────────────────────────────────────
  const [gameState, setGameState] = useState(BINGO_STATES.BROWSING);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  // 'approving' | 'buying' | null — granular on-chain tx step for UX
  const [txStep, setTxStep] = useState(null);

  // ── Round data ──────────────────────────────────────────────────────
  const [rounds, setRounds] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [roundDetail, setRoundDetail] = useState(null);

  // ── Cards ───────────────────────────────────────────────────────────
  const [cardCount, setCardCount] = useState(1);
  const [myCards, setMyCards] = useState([]);

  // ── Ball draw animation ─────────────────────────────────────────────
  const [drawnBalls, setDrawnBalls] = useState([]);
  const [currentBallIndex, setCurrentBallIndex] = useState(-1);
  const [animatedBalls, setAnimatedBalls] = useState([]);

  // ── Line/Bingo winner ball positions (1-based ball count) ──────────
  const [lineWinnerBallPos, setLineWinnerBallPos] = useState(0);
  const [bingoWinnerBallPos, setBingoWinnerBallPos] = useState(0);
  const [lineAnnounced, setLineAnnounced] = useState(false);

  // ── Refs for stale-closure-safe access ────────────────────────────
  const gameStateRef = useRef(gameState);
  const selectedRoundRef = useRef(selectedRound);
  const lineAnnouncedRef = useRef(false);
  const buyingRef = useRef(false); // prevents concurrent purchase attempts
  gameStateRef.current = gameState;
  selectedRoundRef.current = selectedRound;
  lineAnnouncedRef.current = lineAnnounced;

  // ── Auto-mark vs manual mark ────────────────────────────────────────
  const [autoMark, setAutoMark] = useState(true);
  const [manualMarks, setManualMarks] = useState(new Set());

  // ── Server-synced drawing ──────────────────────────────────────────
  const [drawStartedAt, setDrawStartedAt] = useState(null);

  // ── Results ─────────────────────────────────────────────────────────
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);

  // ── Sound ──────────────────────────────────────────────────────────
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ==========================================================================
  // LOAD CONFIG + ROUNDS
  // ==========================================================================

  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await bingoApi.getConfig();
        setConfig(cfg);
        if (cfg.jackpotBalance) setJackpot(cfg.jackpotBalance);
        if (cfg.cardPrice) setCardPrice(cfg.cardPrice);
      } catch (err) {
        console.warn('[useBingoGame] Error loading config:', err);
      }
    }
    loadConfig();
  }, []);

  // Load card price from contract if on-chain
  useEffect(() => {
    if (!isOnChain) return;
    async function loadPrices() {
      const price = await getCardPrice();
      if (price !== '0') setCardPrice(price);
      const jp = await getJackpotBalance();
      setJackpot(jp);
    }
    loadPrices();
  }, [isOnChain, getCardPrice, getJackpotBalance]);

  // Load rounds (open + recent resolved), filtered by room if provided
  // Merges both sets and deduplicates by round_id
  const loadRounds = useCallback(async () => {
    try {
      const [openRounds, recentRounds] = await Promise.all([
        bingoApi.getRounds('open', null, roomNumber).catch(() => []),
        bingoApi.getRounds(null, 10, roomNumber).catch(() => []),
      ]);
      // Merge and deduplicate — recent rounds include resolved ones with user cards
      const seen = new Set();
      const merged = [];
      for (const r of [...(recentRounds || []), ...(openRounds || [])]) {
        const rid = r.round_id ?? r.roundId ?? r.id;
        if (!seen.has(rid)) {
          seen.add(rid);
          merged.push(r);
        }
      }
      // Sort by round_id descending (newest first)
      merged.sort((a, b) => (b.round_id ?? b.id) - (a.round_id ?? a.id));
      setRounds(merged);
      return merged;
    } catch (err) {
      console.warn('[useBingoGame] Error loading rounds:', err);
      return [];
    }
  }, [roomNumber]);

  // Load rounds on mount + poll for new rounds every 10s
  useEffect(() => {
    let cancelled = false;
    async function init() {
      // If we have a specific round to show (e.g., from "Mis Salas Activas" banner),
      // load it directly instead of searching through rounds
      if (initialRoundId && !selectedRoundRef.current) {
        try {
          const detail = await bingoApi.getRoundDetail(initialRoundId);
          if (!cancelled && detail) {
            const roundData = detail.round || detail;
            selectRound({ round_id: initialRoundId, status: roundData.status, ...roundData });
            return;
          }
        } catch (err) {
          console.warn('[useBingoGame] Error loading initial round:', err);
        }
      }

      const allRounds = await loadRounds();
      if (!cancelled && allRounds.length > 0 && !selectedRoundRef.current) {
        // Default entry (no initialRoundId): prioritize open round for buying
        const openRound = allRounds.find(r => r.status === 'open');
        if (openRound) {
          selectRound(openRound);
        } else if (isConnected) {
          // No open round — check drawing round (synced draw in progress)
          const drawingRound = allRounds.find(r => r.status === 'drawing');
          if (drawingRound) {
            selectRound(drawingRound);
          } else {
            // Check closed round (resolving)
            const closedRound = allRounds.find(r => r.status === 'closed');
            if (closedRound) {
              selectRound(closedRound);
            }
          }
        }
      }
    }
    init();

    const pollId = setInterval(async () => {
      if (cancelled) return;
      const currentState = gameStateRef.current;
      if (['waiting_close', 'waiting_vrf', 'drawing', 'buying', 'line_announced', 'bingo_announced'].includes(currentState)) {
        return;
      }
      const allRounds = await loadRounds();
      if (allRounds.length > 0) {
        const openRound = allRounds.find(r => r.status === 'open');
        const currentRound = selectedRoundRef.current;
        if (openRound && (!currentRound || currentRound.round_id !== openRound.round_id)) {
          if (currentState === 'browsing' || currentState === 'resolved') {
            selectRound(openRound);
          }
        }
      }
    }, 10000);

    return () => { cancelled = true; clearInterval(pollId); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load user cards when round selected
  const loadMyCards = useCallback(async (roundId) => {
    if (!isConnected || !roundId) return;
    try {
      if (isOnChain) {
        const cardIds = await getUserCardIds(roundId);
        const cards = [];
        for (const cardId of cardIds) {
          const numbers = await getCardNumbers(cardId);
          cards.push({ cardId, numbers });
        }
        setMyCards(cards);
      } else {
        const cards = await bingoApi.getMyCards(roundId);
        setMyCards(cards || []);
      }
    } catch (err) {
      console.warn('[useBingoGame] Error loading my cards:', err);
    }
  }, [isConnected, isOnChain, getUserCardIds, getCardNumbers]);

  // Load user history
  useEffect(() => {
    if (!isConnected) return;
    async function loadHistory() {
      try {
        const data = await bingoApi.getHistory(20);
        setHistory(data || []);
      } catch (err) {
        console.warn('[useBingoGame] Error loading history:', err);
      }
    }
    loadHistory();
  }, [isConnected]);

  // ==========================================================================
  // SELECT ROUND
  // ==========================================================================

  const getRoundId = useCallback((round) => {
    return round?.round_id ?? round?.roundId ?? round?.id;
  }, []);

  const selectRound = useCallback(async (round) => {
    setSelectedRound(round);
    setGameState(BINGO_STATES.BROWSING);
    setMyCards([]);
    setDrawnBalls([]);
    setAnimatedBalls([]);
    setCurrentBallIndex(-1);
    setResults(null);
    setManualMarks(new Set());
    setLineAnnounced(false);
    setLineWinnerBallPos(0);
    setBingoWinnerBallPos(0);
    setDrawStartedAt(null);
    animationStartedRef.current = false;

    if (round) {
      const roundId = round.round_id ?? round.roundId ?? round.id;
      try {
        const detail = await bingoApi.getRoundDetail(roundId);
        setRoundDetail(detail);
        await loadMyCards(roundId);

        const roundData = detail?.round || detail;
        const resultsData = detail?.results || null;
        const cardsData = detail?.cards || [];
        const balls = roundData?.drawn_balls || roundData?.drawnBalls;

        if (roundData && roundData.status === 'resolved' && balls && balls.length > 0) {
          // Find line/bingo ball positions from cards data
          let lineBall = 0;
          let bingoBall = 0;
          cardsData.forEach(c => {
            if (c.is_line_winner && c.line_hit_ball) lineBall = c.line_hit_ball;
            if (c.is_bingo_winner && c.bingo_hit_ball) bingoBall = c.bingo_hit_ball;
          });

          setDrawnBalls(balls);
          const showUpTo = bingoBall > 0 ? bingoBall : balls.length;
          setAnimatedBalls(balls.slice(0, showUpTo));
          setCurrentBallIndex(showUpTo - 1);
          setLineWinnerBallPos(lineBall);
          setBingoWinnerBallPos(bingoBall);
          setLineAnnounced(lineBall > 0);

          setResults({
            lineWinner: roundData.line_winner || null,
            bingoWinner: roundData.bingo_winner || null,
            linePrize: roundData.line_prize || 0,
            bingoPrize: roundData.bingo_prize || 0,
            jackpotWon: roundData.jackpot_won || false,
            jackpotPaid: roundData.jackpot_paid || 0,
            lineWinnerBallPos: lineBall,
            bingoWinnerBallPos: bingoBall,
            cards: cardsData,
            ...resultsData,
          });
          setGameState(BINGO_STATES.RESOLVED);
        } else if (roundData && roundData.status === 'drawing' && balls && balls.length > 0) {
          // Drawing in progress — sync animation from server timestamp
          let lineBall = 0;
          let bingoBall = 0;
          cardsData.forEach(c => {
            if (c.is_line_winner && c.line_hit_ball) lineBall = c.line_hit_ball;
            if (c.is_bingo_winner && c.bingo_hit_ball) bingoBall = c.bingo_hit_ball;
          });

          const elapsed = Date.now() - new Date(roundData.draw_started_at).getTime();
          const { ballIndex, phase } = calcSyncState(elapsed, lineBall, bingoBall, balls.length);

          setDrawnBalls(balls);
          setAnimatedBalls(balls.slice(0, Math.max(0, ballIndex + 1)));
          setCurrentBallIndex(ballIndex);
          setLineWinnerBallPos(lineBall);
          setBingoWinnerBallPos(bingoBall);
          setDrawStartedAt(roundData.draw_started_at);
          setLineAnnounced(phase !== 'drawing' && lineBall > 0);

          setResults({
            lineWinner: roundData.line_winner || null,
            bingoWinner: roundData.bingo_winner || null,
            linePrize: roundData.line_prize || 0,
            bingoPrize: roundData.bingo_prize || 0,
            jackpotWon: roundData.jackpot_won || false,
            jackpotPaid: roundData.jackpot_paid || 0,
            lineWinnerBallPos: lineBall,
            bingoWinnerBallPos: bingoBall,
            cards: cardsData,
            ...resultsData,
          });

          if (phase === 'bingo_pause') setGameState(BINGO_STATES.BINGO_ANNOUNCED);
          else if (phase === 'line_pause') setGameState(BINGO_STATES.LINE_ANNOUNCED);
          else setGameState(BINGO_STATES.DRAWING);
        } else if (roundData && roundData.status === 'closed') {
          // Round is closed but not yet resolved — poll for resolution
          setGameState(BINGO_STATES.WAITING_VRF);
        } else if (roundData && roundData.status === 'open') {
          // Round still open — check if user already has cards
          const userCards = await bingoApi.getMyCards(roundId).catch(() => []);
          if (userCards && userCards.length > 0) {
            setMyCards(userCards);
            setGameState(BINGO_STATES.WAITING_CLOSE);
          }
        }
      } catch (err) {
        console.warn('[useBingoGame] Error loading round detail:', err);
      }
    }
  }, [loadMyCards]);

  // ==========================================================================
  // BUY CARDS
  // ==========================================================================

  const buyCards = useCallback(async () => {
    if (!isConnected || !selectedRound) {
      showError('Conecta tu wallet y selecciona una ronda');
      return;
    }
    // Prevent concurrent calls (double-click on confirm button)
    if (buyingRef.current) return;
    buyingRef.current = true;

    const roundId = selectedRound.round_id ?? selectedRound.roundId ?? selectedRound.id;

    setIsLoading(true);
    setError(null);
    setGameState(BINGO_STATES.BUYING);

    try {
      if (isOnChain) {
        showInfo('Preparando tu compra...');
        const { tx: receipt, cardIds } = await buyCardsOnChain(roundId, cardCount, {
          onApproving: () => { setTxStep('approving'); showInfo('Paso 1/2: Aprobando USDT en tu wallet…'); },
          onBuying:    () => { setTxStep('buying');    showInfo('Paso 2/2: Comprando cartas en tu wallet…'); },
        });
        // Build explorer link for on-chain tx receipt
        const explorers = { 137: 'https://polygonscan.com', 80002: 'https://amoy.polygonscan.com', 80001: 'https://mumbai.polygonscan.com' };
        const explorerBase = explorers[chainId] || 'https://polygonscan.com';
        const txUrl = receipt?.hash ? `${explorerBase}/tx/${receipt.hash}` : null;
        showSuccess(
          <span>
            {cardIds.length} carta(s) comprada(s)
            {txUrl && <> · <a href={txUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Ver tx</a></>}
          </span>
        );
        await loadMyCards(roundId);
      } else {
        showInfo('Comprando cartas...');
        const cards = await bingoApi.buyCardsOffChain(roundId, cardCount);
        showSuccess(`${cards.length} carta(s) comprada(s)`);
        await loadMyCards(roundId);
      }

      setGameState(BINGO_STATES.WAITING_CLOSE);
      await refreshBalance();
    } catch (err) {
      console.error('[useBingoGame] Error buying cards:', err);

      // User intentionally rejected the wallet prompt — not an error
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        showInfo('Compra cancelada');
        setGameState(BINGO_STATES.BROWSING);
        return;
      }

      // Approve succeeded but buy reverted — clarify no funds were spent
      if (err._step === 'buy') {
        const msg = err.reason || err.message || 'Error al comprar cartas';
        showError(`La autorización fue exitosa pero la compra falló. No se descontaron fondos. (${msg})`);
        setError(msg);
        setGameState(BINGO_STATES.BROWSING);
        return;
      }

      // Stuck pending tx in MetaMask (e.g. prior approve still pending)
      if (err.code === 'REPLACEMENT_UNDERPRICED' || err.message?.includes('replacement fee too low') || err.message?.includes('replacement transaction underpriced')) {
        showError('Hay una transacción pendiente en MetaMask. Cancela o acelera la aprobación de USDT pendiente y vuelve a intentar.');
        setGameState(BINGO_STATES.BROWSING);
        return;
      }

      // Round not found on-chain (e.g. stale off-chain round shown in lobby)
      if (err.data === '0x666710f4' || err.message?.includes('RoundNotFound')) {
        showError('Esta ronda ya no existe. La página se actualizará con la ronda actual.');
        setGameState(BINGO_STATES.BROWSING);
        // Force lobby refresh so stale round disappears
        window.dispatchEvent(new CustomEvent('bingo:refresh-lobby'));
        return;
      }

      // Stale nonce in MetaMask — previous tx was already mined but nonce cache not updated
      if (err.code === 'NONCE_EXPIRED' || err.message?.includes('nonce too low') || err.message?.includes('nonce has already been used')) {
        showError('El nonce de MetaMask está desactualizado. Ve a MetaMask → Configuración → Avanzado → Restablecer cuenta y vuelve a intentar.');
        setGameState(BINGO_STATES.BROWSING);
        return;
      }

      const msg = err.response?.data?.message || err.reason || err.message || 'Error al comprar cartas';
      showError(msg);
      setError(msg);
      setGameState(BINGO_STATES.ERROR);
    } finally {
      setIsLoading(false);
      setTxStep(null);
      buyingRef.current = false;
    }
  }, [isConnected, selectedRound, cardCount, isOnChain, chainId, buyCardsOnChain, loadMyCards, showError, showInfo, showSuccess, refreshBalance]);

  // ==========================================================================
  // POLLING: watch for round close → VRF → resolution
  // ==========================================================================

  useEffect(() => {
    if (!selectedRound) return;
    if (gameState !== BINGO_STATES.WAITING_CLOSE && gameState !== BINGO_STATES.WAITING_VRF && gameState !== BINGO_STATES.DRAWING && gameState !== BINGO_STATES.LINE_ANNOUNCED && gameState !== BINGO_STATES.BINGO_ANNOUNCED) return;

    const roundId = selectedRound.round_id ?? selectedRound.roundId ?? selectedRound.id;
    console.log(`[useBingoGame] Starting round status poll for round #${roundId}, state: ${gameState}`);

    const pollTimer = setInterval(async () => {
      try {
        const detail = await bingoApi.getRoundDetail(roundId);
        if (!detail) return;

        setRoundDetail(detail);

        const roundData = detail.round || detail;
        const status = roundData.status;
        const currentState = gameStateRef.current;

        console.log(`[useBingoGame] Poll: round #${roundId} status=${status}, gameState=${currentState}`);

        if (status === 'closed' && currentState === BINGO_STATES.WAITING_CLOSE) {
          setGameState(BINGO_STATES.WAITING_VRF);
          showInfo('Ronda cerrada. Resolviendo...');
        }

        if (status === 'drawing') {
          const balls = roundData.drawn_balls || roundData.drawnBalls;
          if (balls && balls.length > 0 && currentState !== BINGO_STATES.DRAWING && currentState !== BINGO_STATES.LINE_ANNOUNCED && currentState !== BINGO_STATES.BINGO_ANNOUNCED) {
            console.log(`[useBingoGame] Round drawing! ${balls.length} balls. Starting synced animation.`);

            const resultsData = detail.results || null;
            const cardsData = detail.cards || [];

            let lineBall = 0;
            let bingoBall = 0;
            cardsData.forEach(c => {
              if (c.is_line_winner && c.line_hit_ball) lineBall = c.line_hit_ball;
              if (c.is_bingo_winner && c.bingo_hit_ball) bingoBall = c.bingo_hit_ball;
            });

            const elapsed = Date.now() - new Date(roundData.draw_started_at).getTime();
            const { ballIndex, phase } = calcSyncState(elapsed, lineBall, bingoBall, balls.length);

            setDrawnBalls(balls);
            setAnimatedBalls(balls.slice(0, Math.max(0, ballIndex + 1)));
            setCurrentBallIndex(ballIndex);
            setLineWinnerBallPos(lineBall);
            setBingoWinnerBallPos(bingoBall);
            setDrawStartedAt(roundData.draw_started_at);
            setLineAnnounced(phase !== 'drawing' && lineBall > 0);
            animationStartedRef.current = false;

            setResults({
              lineWinner: roundData.line_winner || null,
              bingoWinner: roundData.bingo_winner || null,
              linePrize: roundData.line_prize || 0,
              bingoPrize: roundData.bingo_prize || 0,
              jackpotWon: roundData.jackpot_won || false,
              jackpotPaid: roundData.jackpot_paid || 0,
              lineWinnerBallPos: lineBall,
              bingoWinnerBallPos: bingoBall,
              cards: cardsData,
              ...resultsData,
            });

            if (phase === 'bingo_pause') setGameState(BINGO_STATES.BINGO_ANNOUNCED);
            else if (phase === 'line_pause') setGameState(BINGO_STATES.LINE_ANNOUNCED);
            else setGameState(BINGO_STATES.DRAWING);
          }
        }

        if (status === 'resolved') {
          // If animation is active, don't interrupt — let it finish naturally
          if (currentState === BINGO_STATES.DRAWING ||
              currentState === BINGO_STATES.LINE_ANNOUNCED ||
              currentState === BINGO_STATES.BINGO_ANNOUNCED) {
            return;
          }

          const balls = roundData.drawn_balls || roundData.drawnBalls;
          if (balls && balls.length > 0) {
            const resultsData = detail.results || null;
            const cardsData = detail.cards || [];

            let lineBall = 0;
            let bingoBall = 0;
            cardsData.forEach(c => {
              if (c.is_line_winner && c.line_hit_ball) lineBall = c.line_hit_ball;
              if (c.is_bingo_winner && c.bingo_hit_ball) bingoBall = c.bingo_hit_ball;
            });

            // If we were waiting for VRF and missed 'drawing', start animation as fallback
            if (currentState === BINGO_STATES.WAITING_VRF || currentState === BINGO_STATES.WAITING_CLOSE) {
              console.log(`[useBingoGame] Missed 'drawing' status, starting animation fallback`);
              const fallbackStart = roundData.draw_started_at || new Date().toISOString();
              const elapsed = Date.now() - new Date(fallbackStart).getTime();
              const { ballIndex, phase } = calcSyncState(elapsed, lineBall, bingoBall, balls.length);

              setDrawnBalls(balls);
              setAnimatedBalls(balls.slice(0, Math.max(0, ballIndex + 1)));
              setCurrentBallIndex(ballIndex);
              setLineWinnerBallPos(lineBall);
              setBingoWinnerBallPos(bingoBall);
              setDrawStartedAt(fallbackStart);
              setLineAnnounced(phase !== 'drawing' && lineBall > 0);
              animationStartedRef.current = false;

              setResults({
                lineWinner: roundData.line_winner || null,
                bingoWinner: roundData.bingo_winner || null,
                linePrize: roundData.line_prize || 0,
                bingoPrize: roundData.bingo_prize || 0,
                jackpotWon: roundData.jackpot_won || false,
                jackpotPaid: roundData.jackpot_paid || 0,
                lineWinnerBallPos: lineBall,
                bingoWinnerBallPos: bingoBall,
                cards: cardsData,
                ...resultsData,
              });

              if (phase === 'bingo_pause') setGameState(BINGO_STATES.BINGO_ANNOUNCED);
              else if (phase === 'line_pause') setGameState(BINGO_STATES.LINE_ANNOUNCED);
              else setGameState(BINGO_STATES.DRAWING);
              return;
            }

            // Not in animation and not waiting — show final results directly
            const showUpTo = bingoBall > 0 ? bingoBall : balls.length;
            setDrawnBalls(balls);
            setAnimatedBalls(balls.slice(0, showUpTo));
            setCurrentBallIndex(showUpTo - 1);
            setLineWinnerBallPos(lineBall);
            setBingoWinnerBallPos(bingoBall);
            setLineAnnounced(lineBall > 0);
            setDrawStartedAt(null);

            setResults({
              lineWinner: roundData.line_winner || null,
              bingoWinner: roundData.bingo_winner || null,
              linePrize: roundData.line_prize || 0,
              bingoPrize: roundData.bingo_prize || 0,
              jackpotWon: roundData.jackpot_won || false,
              jackpotPaid: roundData.jackpot_paid || 0,
              lineWinnerBallPos: lineBall,
              bingoWinnerBallPos: bingoBall,
              cards: cardsData,
              ...resultsData,
            });

            setGameState(BINGO_STATES.RESOLVED);
            loadDatabaseBalance();
            refreshBalance();
          }
        }
      } catch (err) {
        console.warn('[useBingoGame] Poll error:', err);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(pollTimer);
  }, [selectedRound, gameState, showInfo, refreshBalance, loadDatabaseBalance]);

  // ==========================================================================
  // BALL DRAW ANIMATION — fully server-synced, pauses calculated from timestamp
  // ==========================================================================

  // Track whether animation has started
  const animationStartedRef = useRef(false);

  // Single synced animation effect: calculates everything from server time
  useEffect(() => {
    const isAnimating = gameState === BINGO_STATES.DRAWING ||
                        gameState === BINGO_STATES.LINE_ANNOUNCED ||
                        gameState === BINGO_STATES.BINGO_ANNOUNCED;
    if (!isAnimating || drawnBalls.length === 0 || !drawStartedAt) return;

    animationStartedRef.current = true;

    const syncInterval = setInterval(() => {
      const elapsed = Date.now() - new Date(drawStartedAt).getTime();
      const { ballIndex, phase } = calcSyncState(
        elapsed, lineWinnerBallPos, bingoWinnerBallPos, drawnBalls.length
      );

      // Update ball display
      setCurrentBallIndex(prev => {
        if (ballIndex < prev) return prev; // Don't go backwards
        setAnimatedBalls(drawnBalls.slice(0, ballIndex + 1));
        return ballIndex;
      });

      // Update game state based on phase
      if (phase === 'line_pause') {
        setLineAnnounced(true);
        if (gameStateRef.current !== BINGO_STATES.LINE_ANNOUNCED) {
          setGameState(BINGO_STATES.LINE_ANNOUNCED);
        }
      } else if (phase === 'bingo_pause') {
        if (gameStateRef.current !== BINGO_STATES.BINGO_ANNOUNCED) {
          setGameState(BINGO_STATES.BINGO_ANNOUNCED);
        }
      } else if (phase === 'done') {
        clearInterval(syncInterval);
        if (gameStateRef.current !== BINGO_STATES.RESOLVED) {
          setGameState(BINGO_STATES.RESOLVED);
          // Force balance refresh from DB (bypasses keno session endpoint)
          loadDatabaseBalance();
          refreshBalance();
        }
      } else {
        // phase === 'drawing' — ensure we're in DRAWING state
        if (gameStateRef.current === BINGO_STATES.LINE_ANNOUNCED) {
          setGameState(BINGO_STATES.DRAWING);
        }
      }
    }, 1000);

    return () => clearInterval(syncInterval);
  }, [drawnBalls, drawStartedAt, lineWinnerBallPos, bingoWinnerBallPos]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================================================
  // MANUAL RESUME / SKIP (user clicks overlay)
  // ==========================================================================

  const resumeAfterLine = useCallback(() => {
    // No-op: line pause is server-timed, auto-resumes when pause window ends
  }, []);

  const finalizeResults = useCallback(() => {
    setDrawStartedAt(null); // Stop synced animation
    setGameState(BINGO_STATES.RESOLVED);
    loadDatabaseBalance();
    refreshBalance();
  }, [refreshBalance, loadDatabaseBalance]);

  // ==========================================================================
  // SKIP TO RESULTS
  // ==========================================================================

  const skipToResults = useCallback(() => {
    setDrawStartedAt(null); // Stop synced animation
    const showUpTo = bingoWinnerBallPos > 0 ? bingoWinnerBallPos : drawnBalls.length;
    setAnimatedBalls(drawnBalls.slice(0, showUpTo));
    setCurrentBallIndex(showUpTo - 1);
    setLineAnnounced(lineWinnerBallPos > 0);
    setGameState(BINGO_STATES.RESOLVED);
    loadDatabaseBalance();
    refreshBalance();
  }, [drawnBalls, lineWinnerBallPos, bingoWinnerBallPos, refreshBalance, loadDatabaseBalance]);

  // ==========================================================================
  // MANUAL MARK
  // ==========================================================================

  const toggleManualMark = useCallback((num) => {
    // Only allow marking numbers that have actually been drawn
    if (!animatedBalls.includes(num)) return;
    setManualMarks(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }, [animatedBalls]);

  const toggleAutoMark = useCallback(() => {
    setAutoMark(prev => !prev);
  }, []);

  // ==========================================================================
  // SOUND TOGGLE
  // ==========================================================================

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // ==========================================================================
  // CARD HELPER: check marks, lines, bingo
  // ==========================================================================

  const isMarked = useCallback((num) => {
    if (autoMark) return animatedBalls.includes(num);
    return manualMarks.has(num);
  }, [autoMark, animatedBalls, manualMarks]);

  const checkLine = useCallback((card, rowIndex) => {
    if (!card || !card.numbers) return false;
    const start = rowIndex * 5;
    const row = card.numbers.slice(start, start + 5);
    return row.every(n => n === 0 || isMarked(n));
  }, [isMarked]);

  const checkBingo = useCallback((card) => {
    if (!card || !card.numbers) return false;
    return card.numbers.every(n => n === 0 || isMarked(n));
  }, [isMarked]);

  const hasAnyLine = useCallback((card) => {
    for (let r = 0; r < 3; r++) {
      if (checkLine(card, r)) return true;
    }
    return false;
  }, [checkLine]);

  // ==========================================================================
  // CURRENT BALL (for animation display)
  // ==========================================================================

  const currentBall = useMemo(() => {
    if (currentBallIndex < 0 || currentBallIndex >= drawnBalls.length) return null;
    return drawnBalls[currentBallIndex];
  }, [currentBallIndex, drawnBalls]);

  const progress = useMemo(() => {
    if (drawnBalls.length === 0) return 0;
    return ((currentBallIndex + 1) / 75) * 100;
  }, [currentBallIndex, drawnBalls.length]);

  // ==========================================================================
  // BINGO COLUMN HELPER (B-I-N-G-O)
  // ==========================================================================

  const getBallColumn = useCallback((num) => {
    if (num <= 15) return 'B';
    if (num <= 30) return 'I';
    if (num <= 45) return 'N';
    if (num <= 60) return 'G';
    return 'O';
  }, []);

  // ==========================================================================
  // RESET
  // ==========================================================================

  const resetGame = useCallback(() => {
    setGameState(BINGO_STATES.BROWSING);
    setSelectedRound(null);
    setRoundDetail(null);
    setMyCards([]);
    setDrawnBalls([]);
    setAnimatedBalls([]);
    setCurrentBallIndex(-1);
    setResults(null);
    setManualMarks(new Set());
    setError(null);
    setLineAnnounced(false);
    setLineWinnerBallPos(0);
    setBingoWinnerBallPos(0);
    setDrawStartedAt(null);
    animationStartedRef.current = false;
    loadRounds();
  }, [loadRounds]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // State
    gameState,
    error,
    isLoading,
    txStep,       // 'approving' | 'buying' | null — on-chain tx granular step

    // Config
    config,
    cardPrice,
    jackpot,

    // Rounds
    rounds,
    selectedRound,
    roundDetail,
    selectRound,

    // Cards
    cardCount,
    setCardCount,
    myCards,
    buyCards,

    // Ball draw animation (server-synced)
    drawStartedAt,
    drawnBalls,
    animatedBalls,
    currentBall,
    currentBallIndex,
    progress,
    skipToResults,
    getBallColumn,
    lineWinnerBallPos,
    bingoWinnerBallPos,
    lineAnnounced,

    // Line/Bingo announcements
    resumeAfterLine,
    finalizeResults,

    // Marking
    autoMark,
    toggleAutoMark,
    manualMarks,
    toggleManualMark,
    isMarked,
    checkLine,
    checkBingo,
    hasAnyLine,

    // Sound
    soundEnabled,
    toggleSound,

    // Results
    results,
    history,

    // Actions
    resetGame,
    loadRounds,

    // On-chain mode
    isOnChain,

    // States
    STATES: BINGO_STATES
  };
}

export default useBingoGame;
