/**
 * useKenoContract Hook
 *
 * Interacts directly with KenoGame.sol on-chain.
 * Uses env vars:
 *   VITE_KENO_CONTRACT_ADDRESS — deployed KenoGame address
 *   VITE_KENO_MODE — 'onchain' | 'offchain' (default: 'offchain')
 *
 * When VITE_KENO_CONTRACT_ADDRESS is not set, isOnChain = false
 * and the hook is a no-op (frontend falls back to off-chain API).
 */

import { useMemo, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from './useContract';
import KenoGameABI from '../contracts/KenoGameABI.json';

const KENO_ADDRESS = import.meta.env.VITE_KENO_CONTRACT_ADDRESS || '';
const KENO_MODE = import.meta.env.VITE_KENO_MODE || 'offchain';

// USDT uses 6 decimals
const TOKEN_DECIMALS = 6;

export function useKenoContract() {
  const { provider, signer, account } = useWeb3();
  const { tokenAddress } = useContract();

  // ── Contract instances ──────────────────────────────────────────────

  const kenoContract = useMemo(() => {
    if (!KENO_ADDRESS || !provider) return null;
    return new ethers.Contract(KENO_ADDRESS, KenoGameABI, signer || provider);
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

  const isOnChain = !!(kenoContract && KENO_MODE === 'onchain');

  // ── Read functions ──────────────────────────────────────────────────

  const getAvailablePool = useCallback(async () => {
    if (!kenoContract) return '0';
    try {
      const pool = await kenoContract.availablePool();
      return ethers.formatUnits(pool, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[KenoContract] Error reading availablePool:', err);
      return '0';
    }
  }, [kenoContract]);

  const getBetAmount = useCallback(async () => {
    if (!kenoContract) return '1';
    try {
      const amt = await kenoContract.betAmount();
      return ethers.formatUnits(amt, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[KenoContract] Error reading betAmount:', err);
      return '1';
    }
  }, [kenoContract]);

  const getBet = useCallback(async (betId) => {
    if (!kenoContract) return null;
    try {
      const bet = await kenoContract.bets(betId);
      return {
        user: bet.user,
        amount: ethers.formatUnits(bet.amount, TOKEN_DECIMALS),
        payout: ethers.formatUnits(bet.payout, TOKEN_DECIMALS),
        spots: Number(bet.spots),
        hits: Number(bet.hits),
        selectedBitmap: bet.selectedBitmap,
        drawnBitmap: bet.drawnBitmap,
        status: Number(bet.status), // 0=Pending, 1=Paid, 2=Unpaid
      };
    } catch (err) {
      console.error('[KenoContract] Error reading bet:', err);
      return null;
    }
  }, [kenoContract]);

  const getPayoutMultiplier = useCallback(async (spots, hits) => {
    if (!kenoContract) return 0;
    try {
      const mult = await kenoContract.getPayoutMultiplier(spots, hits);
      return Number(mult);
    } catch (err) {
      console.error('[KenoContract] Error reading payoutMultiplier:', err);
      return 0;
    }
  }, [kenoContract]);

  // ── Write functions ─────────────────────────────────────────────────

  /**
   * Place a bet on-chain:
   * 1. Check USDT allowance for betAmount
   * 2. Approve if needed
   * 3. Call kenoContract.placeBet(selectedNumbers)
   * 4. Parse BetPlaced event from receipt
   *
   * @param {number[]} selectedNumbers - Array of chosen numbers (1-80)
   * @returns {{ tx, betId, vrfRequestId }}
   */
  const placeBet = useCallback(async (selectedNumbers) => {
    if (!kenoContract || !tokenContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }

    // Read bet amount from contract
    const betAmountRaw = await kenoContract.betAmount();

    // Check allowance
    const allowance = await tokenContract.allowance(account, KENO_ADDRESS);
    if (allowance < betAmountRaw) {
      const approveTx = await tokenContract.approve(KENO_ADDRESS, betAmountRaw);
      await approveTx.wait();
    }

    // Convert numbers to uint8[]
    const nums = selectedNumbers.map((n) => Number(n));

    // Send placeBet tx
    const tx = await kenoContract.placeBet(nums);
    const receipt = await tx.wait();

    // Parse BetPlaced event
    let betId = null;
    let vrfRequestId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = kenoContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === 'BetPlaced') {
          betId = parsed.args.betId.toString();
          vrfRequestId = parsed.args.vrfRequestId.toString();
          break;
        }
      } catch {
        // not our event
      }
    }

    return { tx: receipt, betId, vrfRequestId };
  }, [kenoContract, tokenContract, signer, account]);

  // ── Event listeners ─────────────────────────────────────────────────

  /**
   * Listen for BetResolved event matching a specific betId.
   * Returns a cleanup function.
   *
   * @param {string} betId
   * @param {function} callback - called with { hits, payout, paid, drawnNumbers }
   * @returns {function} removeListener
   */
  const onBetResolved = useCallback((betId, callback) => {
    if (!kenoContract) return () => {};

    const filter = kenoContract.filters.BetResolved(betId);

    const handler = (resolvedBetId, user, hits, payout, paid) => {
      if (resolvedBetId.toString() === betId.toString()) {
        callback({
          betId: resolvedBetId.toString(),
          hits: Number(hits),
          payout: ethers.formatUnits(payout, TOKEN_DECIMALS),
          paid,
        });
        // Auto-remove after first match
        kenoContract.off(filter, handler);
      }
    };

    kenoContract.on(filter, handler);

    // Return cleanup
    return () => kenoContract.off(filter, handler);
  }, [kenoContract]);

  // ── Pending bet recovery ────────────────────────────────────────────

  const getPendingBets = useCallback(async (userAddress) => {
    if (!kenoContract) return [];
    try {
      const currentBetCount = await kenoContract.betCounter();
      const pending = [];
      const start = Math.max(1, Number(currentBetCount) - 50);
      for (let id = start; id <= Number(currentBetCount); id++) {
        const bet = await kenoContract.bets(id);
        if (bet.user.toLowerCase() === userAddress.toLowerCase() && Number(bet.status) === 0) {
          pending.push({
            betId: id,
            user: bet.user,
            amount: ethers.formatUnits(bet.amount, TOKEN_DECIMALS),
            payout: ethers.formatUnits(bet.payout, TOKEN_DECIMALS),
            spots: Number(bet.spots),
            hits: Number(bet.hits),
            selectedBitmap: bet.selectedBitmap,
            drawnBitmap: bet.drawnBitmap,
            status: Number(bet.status),
          });
        }
      }
      return pending;
    } catch (err) {
      console.error('[KenoContract] Error getting pending bets:', err);
      return [];
    }
  }, [kenoContract]);

  const cancelStaleBet = useCallback(async (betId) => {
    if (!kenoContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }
    const tx = await kenoContract.cancelStaleBet(betId);
    const receipt = await tx.wait();
    return receipt;
  }, [kenoContract, signer]);

  // ── Helpers ─────────────────────────────────────────────────────────

  /**
   * Parse drawn numbers from a selectedBitmap (uint256).
   * Each set bit at position (n-1) means number n was drawn.
   */
  const parseBitmap = useCallback((bitmap) => {
    const nums = [];
    const bn = BigInt(bitmap);
    for (let i = 1; i <= 80; i++) {
      if ((bn >> BigInt(i)) & 1n) {
        nums.push(i);
      }
    }
    return nums;
  }, []);

  return {
    isOnChain,
    kenoContract,
    kenoContractAddress: KENO_ADDRESS,

    // Read
    getAvailablePool,
    getBetAmount,
    getBet,
    getPayoutMultiplier,

    // Write
    placeBet,
    cancelStaleBet,

    // Pending recovery
    getPendingBets,

    // Events
    onBetResolved,

    // Helpers
    parseBitmap,
  };
}

export default useKenoContract;
