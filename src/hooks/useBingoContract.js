/**
 * useBingoContract Hook
 *
 * Interacts directly with BingoGame.sol on-chain.
 * Uses env vars:
 *   VITE_BINGO_CONTRACT_ADDRESS — deployed BingoGame address
 *
 * Provides: buyCards, getCardPrice, getJackpotBalance, getOpenRounds,
 *           getUserCardIds, getCardNumbers, getRoundInfo
 */

import { useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from './useContract';
import BingoGameABI from '../contracts/BingoGameABI.json';

const ZERO_ADDRESS = '0x' + '0'.repeat(40);
const BINGO_ADDRESS_RAW = import.meta.env.VITE_BINGO_CONTRACT_ADDRESS || '';
const BINGO_ADDRESS = BINGO_ADDRESS_RAW === ZERO_ADDRESS ? '' : BINGO_ADDRESS_RAW;
const TOKEN_DECIMALS = 6; // USDT decimals

export function useBingoContract() {
  const { provider, signer, account } = useWeb3();
  const { tokenAddress } = useContract();

  // ── Contract instances ──────────────────────────────────────────────

  const bingoContract = useMemo(() => {
    if (!BINGO_ADDRESS || !provider) return null;
    return new ethers.Contract(BINGO_ADDRESS, BingoGameABI, signer || provider);
  }, [provider, signer]);

  const tokenContract = useMemo(() => {
    if (!provider || !tokenAddress) return null;
    const ERC20_ABI = [
      'function balanceOf(address) view returns (uint256)',
      'function allowance(address,address) view returns (uint256)',
      'function approve(address,uint256) returns (bool)',
    ];
    return new ethers.Contract(tokenAddress, ERC20_ABI, signer || provider);
  }, [provider, signer, tokenAddress]);

  const isOnChain = !!bingoContract;

  // ── Read functions ──────────────────────────────────────────────────

  const getCardPrice = useCallback(async () => {
    if (!bingoContract) return '0';
    try {
      const price = await bingoContract.cardPrice();
      return ethers.formatUnits(price, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[BingoContract] Error reading cardPrice:', err);
      return '0';
    }
  }, [bingoContract]);

  const getJackpotBalance = useCallback(async () => {
    if (!bingoContract) return '0';
    try {
      const balance = await bingoContract.jackpotBalance();
      return ethers.formatUnits(balance, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[BingoContract] Error reading jackpotBalance:', err);
      return '0';
    }
  }, [bingoContract]);

  const getOpenRounds = useCallback(async () => {
    if (!bingoContract) return [];
    try {
      const ids = await bingoContract.getOpenRounds();
      return ids.map(id => Number(id));
    } catch (err) {
      console.error('[BingoContract] Error reading openRounds:', err);
      return [];
    }
  }, [bingoContract]);

  const getRoundInfo = useCallback(async (roundId) => {
    if (!bingoContract) return null;
    try {
      const info = await bingoContract.getRoundInfo(roundId);
      return {
        id: Number(info.id),
        status: Number(info.status),
        scheduledClose: Number(info.scheduledClose),
        totalCards: Number(info.totalCards),
        totalRevenue: ethers.formatUnits(info.totalRevenue, TOKEN_DECIMALS),
        vrfRandomWord: info.vrfRandomWord.toString(),
      };
    } catch (err) {
      console.error('[BingoContract] Error reading roundInfo:', err);
      return null;
    }
  }, [bingoContract]);

  const getUserCardIds = useCallback(async (roundId) => {
    if (!bingoContract || !account) return [];
    try {
      const ids = await bingoContract.getUserCardIds(roundId, account);
      return ids.map(id => Number(id));
    } catch (err) {
      console.error('[BingoContract] Error reading userCardIds:', err);
      return [];
    }
  }, [bingoContract, account]);

  const getCardNumbers = useCallback(async (cardId) => {
    if (!bingoContract) return [];
    try {
      const nums = await bingoContract.getCardNumbers(cardId);
      return Array.from(nums).map(n => Number(n));
    } catch (err) {
      console.error('[BingoContract] Error reading cardNumbers:', err);
      return [];
    }
  }, [bingoContract]);

  const getRoundResults = useCallback(async (roundId) => {
    if (!bingoContract) return null;
    try {
      // getRoundResults returns: (address[] lineWinners, uint8 lineWinnerBall,
      //   address[] bingoWinners, uint8 bingoWinnerBall, bool jackpotWon,
      //   uint256 jackpotPaid, uint256 feeAmount, uint256 reserveAmount,
      //   uint256 linePrize, uint256 bingoPrize)
      const [lineWinners, lineWinnerBall, bingoWinners, bingoWinnerBall,
             jackpotWon, jackpotPaid, feeAmount, reserveAmount, linePrize, bingoPrize] =
        await bingoContract.getRoundResults(roundId);
      return {
        lineWinners:     Array.from(lineWinners),
        lineWinnerBall:  Number(lineWinnerBall),
        bingoWinners:    Array.from(bingoWinners),
        bingoWinnerBall: Number(bingoWinnerBall),
        jackpotWon,
        jackpotPaid:     ethers.formatUnits(jackpotPaid, TOKEN_DECIMALS),
        feeAmount:       ethers.formatUnits(feeAmount, TOKEN_DECIMALS),
        reserveAmount:   ethers.formatUnits(reserveAmount, TOKEN_DECIMALS),
        linePrize:       ethers.formatUnits(linePrize, TOKEN_DECIMALS),
        bingoPrize:      ethers.formatUnits(bingoPrize, TOKEN_DECIMALS),
      };
    } catch (err) {
      console.error('[BingoContract] Error reading roundResults:', err);
      return null;
    }
  }, [bingoContract]);

  // ── Write functions ─────────────────────────────────────────────────

  /**
   * Buy cards for a round.
   * Flow: check allowance → approve if needed → buyCards
   *
   * @param {number} roundId
   * @param {number} count           - 1 to 4
   * @param {object} [callbacks]
   * @param {function} [callbacks.onApproving]  - called when approval tx is pending
   * @param {function} [callbacks.onBuying]     - called when buy tx is pending
   * @returns {{ tx, cardIds }}
   */
  const buyCards = useCallback(async (roundId, count, callbacks = {}) => {
    if (!bingoContract || !tokenContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }

    const priceRaw = await bingoContract.cardPrice();
    const totalCost = priceRaw * BigInt(count);

    // Pre-flight: balance check (avoids wasting gas on a doomed approve)
    const balance = await tokenContract.balanceOf(account);
    if (balance < totalCost) {
      const needed = ethers.formatUnits(totalCost, TOKEN_DECIMALS);
      throw new Error(`Saldo USDT insuficiente. Necesitas ${needed} USDT`);
    }

    // Build gas overrides — Polygon Amoy requires minimum 25 Gwei priority fee.
    // MetaMask underestimates via eth_maxPriorityFeePerGas (not supported on Amoy).
    const MIN_PRIORITY_FEE = ethers.parseUnits('30', 'gwei');
    const feeData = await signer.provider.getFeeData();
    const gasOverrides = {
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas > MIN_PRIORITY_FEE
        ? feeData.maxPriorityFeePerGas
        : MIN_PRIORITY_FEE,
      maxFeePerGas: feeData.maxFeePerGas > MIN_PRIORITY_FEE
        ? feeData.maxFeePerGas
        : ethers.parseUnits('35', 'gwei'),
    };

    // Step 1: Approve if allowance insufficient (approve exact amount for safety)
    const allowance = await tokenContract.allowance(account, BINGO_ADDRESS);
    if (allowance < totalCost) {
      callbacks.onApproving?.();
      const approveTx = await tokenContract.approve(BINGO_ADDRESS, totalCost, gasOverrides);
      await approveTx.wait();
    }

    // Step 2: Buy cards — wrap separately so caller can distinguish approve vs buy failure
    callbacks.onBuying?.();
    let tx;
    try {
      tx = await bingoContract.buyCards(roundId, count, gasOverrides);
    } catch (err) {
      // Re-throw with context so useBingoGame can show a precise message
      err._step = 'buy';
      throw err;
    }
    const receipt = await tx.wait();

    // Parse CardsPurchased event
    let cardIds = [];
    for (const log of receipt.logs) {
      try {
        const parsed = bingoContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === 'CardsPurchased') {
          cardIds = parsed.args.cardIds.map(id => Number(id));
          break;
        }
      } catch {
        // not our event
      }
    }

    return { tx: receipt, cardIds };
  }, [bingoContract, tokenContract, signer, account]);

  // ── Event listeners ─────────────────────────────────────────────────

  /**
   * Listen for VrfFulfilled event for a round
   */
  const onVrfFulfilled = useCallback((roundId, callback) => {
    if (!bingoContract) return () => {};

    const filter = bingoContract.filters.VrfFulfilled(roundId);

    const handler = (eventRoundId, randomWord) => {
      callback({
        roundId: Number(eventRoundId),
        randomWord: randomWord.toString(),
      });
      bingoContract.off(filter, handler);
    };

    bingoContract.on(filter, handler);
    return () => bingoContract.off(filter, handler);
  }, [bingoContract]);

  /**
   * Listen for RoundResolved event for a round.
   * Event: RoundResolved(uint256 roundId, address[] lineWinners, uint8 lineWinnerBall,
   *                      address[] bingoWinners, uint8 bingoWinnerBall, bool jackpotWon, uint256 jackpotPaid)
   */
  const onRoundResolved = useCallback((roundId, callback) => {
    if (!bingoContract) return () => {};

    const filter = bingoContract.filters.RoundResolved(roundId);

    const handler = (eventRoundId, lineWinners, lineWinnerBall, bingoWinners, bingoWinnerBall, jackpotWon, jackpotPaid) => {
      callback({
        roundId:         Number(eventRoundId),
        lineWinners:     Array.from(lineWinners),
        lineWinnerBall:  Number(lineWinnerBall),
        bingoWinners:    Array.from(bingoWinners),
        bingoWinnerBall: Number(bingoWinnerBall),
        jackpotWon,
        jackpotPaid: ethers.formatUnits(jackpotPaid, TOKEN_DECIMALS),
      });
      bingoContract.off(filter, handler);
    };

    bingoContract.on(filter, handler);
    return () => bingoContract.off(filter, handler);
  }, [bingoContract]);

  return {
    isOnChain,
    bingoContract,
    bingoContractAddress: BINGO_ADDRESS,

    // Read
    getCardPrice,
    getJackpotBalance,
    getOpenRounds,
    getRoundInfo,
    getUserCardIds,
    getCardNumbers,
    getRoundResults,

    // Write
    buyCards,

    // Events
    onVrfFulfilled,
    onRoundResolved,
  };
}

export default useBingoContract;
