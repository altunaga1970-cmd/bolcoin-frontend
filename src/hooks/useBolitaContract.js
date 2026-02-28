/**
 * useBolitaContract Hook
 *
 * Interacts directly with LaBolitaGame.sol on-chain.
 * Uses env vars:
 *   VITE_BOLITA_CONTRACT_ADDRESS — deployed LaBolitaGame address
 *   VITE_BOLITA_MODE — 'onchain' | 'offchain' (default: 'offchain')
 *
 * When VITE_BOLITA_CONTRACT_ADDRESS is not set, isOnChain = false
 * and the hook is a no-op (frontend falls back to off-chain API).
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from './useContract';
import LaBolitaGameABI from '../contracts/LaBolitaGameABI.json';

const BOLITA_ADDRESS = import.meta.env.VITE_BOLITA_CONTRACT_ADDRESS || '';
const BOLITA_MODE = import.meta.env.VITE_BOLITA_MODE || 'offchain';

// USDT uses 6 decimals
const TOKEN_DECIMALS = 6;
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
];

// Draw status enum matching Solidity
const DRAW_STATUS = {
  0: 'created',
  1: 'open',
  2: 'closed',
  3: 'vrf_pending',
  4: 'vrf_fulfilled',
  5: 'resolved',
  6: 'cancelled'
};

// Bet type mapping
const BET_TYPE_MAP = { FIJO: 0, CENTENA: 1, PARLE: 2 };

// Payout status
const PAYOUT_STATUS = { 0: 'pending', 1: 'paid', 2: 'unpaid', 3: 'refunded' };

// Polygon Amoy requires minimum 25 Gwei priority fee.
// MetaMask sometimes underestimates on testnet — we enforce a 30 Gwei floor,
// matching the backend AMOY_GAS_OVERRIDES used by the scheduler.
const MIN_PRIORITY_FEE = ethers.parseUnits('30', 'gwei');

async function getAmoyGasOverrides(signerOrProvider) {
  try {
    const feeData = await signerOrProvider.provider.getFeeData();
    return {
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas > MIN_PRIORITY_FEE
        ? feeData.maxPriorityFeePerGas
        : MIN_PRIORITY_FEE,
      maxFeePerGas: feeData.maxFeePerGas > MIN_PRIORITY_FEE
        ? feeData.maxFeePerGas
        : ethers.parseUnits('35', 'gwei'),
    };
  } catch {
    return {
      maxPriorityFeePerGas: MIN_PRIORITY_FEE,
      maxFeePerGas: ethers.parseUnits('35', 'gwei'),
    };
  }
}

export function useBolitaContract() {
  const { provider, signer, account } = useWeb3();
  const { tokenAddress: fallbackTokenAddress } = useContract();

  // ── Contract instances ──────────────────────────────────────────────

  const bolitaContract = useMemo(() => {
    if (!BOLITA_ADDRESS || !provider) return null;
    return new ethers.Contract(BOLITA_ADDRESS, LaBolitaGameABI, signer || provider);
  }, [provider, signer]);

  // Read the payment token address from the bolita contract
  const [paymentTokenAddress, setPaymentTokenAddress] = useState(null);
  useEffect(() => {
    if (!bolitaContract) return;
    bolitaContract.paymentToken().then(addr => {
      setPaymentTokenAddress(addr);
    }).catch(() => {});
  }, [bolitaContract]);

  const tokenContract = useMemo(() => {
    const addr = paymentTokenAddress || fallbackTokenAddress;
    if (!provider || !addr) return null;
    return new ethers.Contract(addr, ERC20_ABI, signer || provider);
  }, [provider, signer, paymentTokenAddress, fallbackTokenAddress]);

  const isOnChain = !!(bolitaContract && BOLITA_MODE === 'onchain');

  // ── Read functions ──────────────────────────────────────────────────

  const getAvailablePool = useCallback(async () => {
    if (!bolitaContract) return '0';
    try {
      const pool = await bolitaContract.availablePool();
      return ethers.formatUnits(pool, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[BolitaContract] Error reading availablePool:', err);
      return '0';
    }
  }, [bolitaContract]);

  const getMultipliers = useCallback(async () => {
    if (!bolitaContract) return { fijo: 65, centena: 300, parle: 1000 };
    try {
      const [f, c, p] = await bolitaContract.getMultipliers();
      return {
        fijo: Number(f) / 100,
        centena: Number(c) / 100,
        parle: Number(p) / 100
      };
    } catch (err) {
      console.error('[BolitaContract] Error reading multipliers:', err);
      return { fijo: 65, centena: 300, parle: 1000 };
    }
  }, [bolitaContract]);

  const getDrawInfo = useCallback(async (drawId) => {
    if (!bolitaContract) return null;
    try {
      const d = await bolitaContract.getDraw(drawId);
      return {
        id: Number(d.id),
        draw_number: d.drawNumber,
        scheduled_time: new Date(Number(d.scheduledTime) * 1000).toISOString(),
        status: DRAW_STATUS[Number(d.status)] || 'unknown',
        is_open: Number(d.status) === 1,
        winningNumber: Number(d.winningNumber),
        totalAmount: ethers.formatUnits(d.totalAmount, TOKEN_DECIMALS),
        totalPaidOut: ethers.formatUnits(d.totalPaidOut, TOKEN_DECIMALS),
        totalBets: Number(d.totalBets),
      };
    } catch (err) {
      console.error('[BolitaContract] Error reading draw:', err);
      return null;
    }
  }, [bolitaContract]);

  const getOpenDraws = useCallback(async () => {
    if (!bolitaContract) return [];
    try {
      const drawIds = await bolitaContract.getOpenDraws();
      const draws = [];
      for (const id of drawIds) {
        const info = await getDrawInfo(Number(id));
        if (info) draws.push(info);
      }
      return draws;
    } catch (err) {
      console.error('[BolitaContract] Error getting open draws:', err);
      return [];
    }
  }, [bolitaContract, getDrawInfo]);

  const getBet = useCallback(async (betId) => {
    if (!bolitaContract) return null;
    try {
      const b = await bolitaContract.getBet(betId);
      return {
        betId: Number(betId),
        drawId: Number(b.drawId),
        player: b.player,
        amount: ethers.formatUnits(b.amount, TOKEN_DECIMALS),
        payout: ethers.formatUnits(b.payout, TOKEN_DECIMALS),
        betType: Number(b.betType),
        number: Number(b.number),
        resolved: b.resolved,
        won: b.won,
      };
    } catch (err) {
      console.error('[BolitaContract] Error reading bet:', err);
      return null;
    }
  }, [bolitaContract]);

  const getUserBets = useCallback(async (userAddress) => {
    if (!bolitaContract) return [];
    try {
      const addr = userAddress || account;
      if (!addr) return [];
      const betIds = await bolitaContract.getUserBetIds(addr, 0, 50);
      const userBets = [];
      for (const betId of betIds) {
        const bet = await getBet(Number(betId));
        if (bet) userBets.push(bet);
      }
      return userBets.reverse();
    } catch (err) {
      console.error('[BolitaContract] Error getting user bets:', err);
      return [];
    }
  }, [bolitaContract, account, getBet]);

  const getNumberExposure = useCallback(async (drawId, betType, betNumber) => {
    if (!bolitaContract) return '0';
    try {
      const betTypeNum = typeof betType === 'string' ? BET_TYPE_MAP[betType] : betType;
      const exposure = await bolitaContract.getNumberExposure(drawId, betTypeNum, betNumber);
      return ethers.formatUnits(exposure, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[BolitaContract] Error reading exposure:', err);
      return '0';
    }
  }, [bolitaContract]);

  const getMaxExposure = useCallback(async () => {
    if (!bolitaContract) return '2';
    try {
      const limit = await bolitaContract.maxExposurePerNumber();
      return ethers.formatUnits(limit, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[BolitaContract] Error reading maxExposurePerNumber:', err);
      return '2';
    }
  }, [bolitaContract]);

  const getBetLimits = useCallback(async () => {
    if (!bolitaContract) return { min: '0.01', max: '2', maxPerNumber: '2', pool: '0' };
    try {
      const [min, max, maxPerNum, pool] = await Promise.all([
        bolitaContract.minBetAmount(),
        bolitaContract.maxBetAmount(),
        bolitaContract.maxExposurePerNumber(),
        bolitaContract.availablePool(),
      ]);
      return {
        min: ethers.formatUnits(min, TOKEN_DECIMALS),
        max: ethers.formatUnits(max, TOKEN_DECIMALS),
        maxPerNumber: ethers.formatUnits(maxPerNum, TOKEN_DECIMALS),
        pool: ethers.formatUnits(pool, TOKEN_DECIMALS),
      };
    } catch (err) {
      console.error('[BolitaContract] Error reading bet limits:', err);
      return { min: '0.01', max: '2', maxPerNumber: '2', pool: '0' };
    }
  }, [bolitaContract]);

  const getTokenBalance = useCallback(async () => {
    if (!tokenContract || !account) return '0';
    try {
      const balance = await tokenContract.balanceOf(account);
      return ethers.formatUnits(balance, TOKEN_DECIMALS);
    } catch (err) {
      console.error('[BolitaContract] Error reading balance:', err);
      return '0';
    }
  }, [tokenContract, account]);

  // ── Write functions ─────────────────────────────────────────────────

  /**
   * Place a single bet on-chain:
   * 1. Check USDT allowance
   * 2. Approve if needed
   * 3. Call placeBet(drawId, betType, betNumber, amount)
   * 4. Parse BetPlaced event from receipt
   */
  const placeBet = useCallback(async (drawId, betType, betNumber, amount) => {
    if (!bolitaContract || !tokenContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }

    const betTypeNum = typeof betType === 'string' ? BET_TYPE_MAP[betType] : betType;
    const amountRaw = ethers.parseUnits(amount.toString(), TOKEN_DECIMALS);
    const gasOverrides = await getAmoyGasOverrides(signer);

    // Check allowance
    const allowance = await tokenContract.allowance(account, BOLITA_ADDRESS);
    if (allowance < amountRaw) {
      const approveTx = await tokenContract.approve(BOLITA_ADDRESS, amountRaw, gasOverrides);
      await approveTx.wait();
    }

    const tx = await bolitaContract.placeBet(drawId, betTypeNum, betNumber, amountRaw, gasOverrides);
    const receipt = await tx.wait();

    // Parse BetPlaced event
    let betId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = bolitaContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === 'BetPlaced') {
          betId = parsed.args.betId.toString();
          break;
        }
      } catch {
        // not our event
      }
    }

    return { tx: receipt, drawId, betId };
  }, [bolitaContract, tokenContract, signer, account]);

  /**
   * Place multiple bets in a single transaction (cart checkout)
   * 1. Calculate total amount needed
   * 2. Approve total
   * 3. Call placeBetsBatch(drawId, betsInput[])
   */
  const placeBetsBatch = useCallback(async (drawId, bets) => {
    if (!bolitaContract || !tokenContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }

    // Calculate total needed for approval
    let totalAmount = 0n;
    const betsInput = bets.map(b => {
      const betTypeNum = typeof b.betType === 'string' ? BET_TYPE_MAP[b.betType] : b.betType;
      const amountRaw = ethers.parseUnits(b.amount.toString(), TOKEN_DECIMALS);
      totalAmount += amountRaw;
      return {
        betType: betTypeNum,
        number: b.betNumber ?? b.number,
        amount: amountRaw
      };
    });

    const gasOverrides = await getAmoyGasOverrides(signer);

    // Check allowance for total
    const allowance = await tokenContract.allowance(account, BOLITA_ADDRESS);
    if (allowance < totalAmount) {
      const approveTx = await tokenContract.approve(BOLITA_ADDRESS, totalAmount, gasOverrides);
      await approveTx.wait();
    }

    const tx = await bolitaContract.placeBetsBatch(drawId, betsInput, gasOverrides);
    const receipt = await tx.wait();

    // Parse BetPlaced events
    const betIds = [];
    for (const log of receipt.logs) {
      try {
        const parsed = bolitaContract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === 'BetPlaced') {
          betIds.push(parsed.args.betId.toString());
        }
      } catch {
        // not our event
      }
    }

    return { tx: receipt, drawId, betIds };
  }, [bolitaContract, tokenContract, signer, account]);

  const retryUnpaidBet = useCallback(async (betId) => {
    if (!bolitaContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }
    const tx = await bolitaContract.retryUnpaidBet(betId);
    const receipt = await tx.wait();
    return receipt;
  }, [bolitaContract, signer]);

  const cancelStaleDraw = useCallback(async (drawId) => {
    if (!bolitaContract || !signer) {
      throw new Error('Wallet o contrato no disponible');
    }
    const tx = await bolitaContract.cancelStaleDraw(drawId);
    const receipt = await tx.wait();
    return receipt;
  }, [bolitaContract, signer]);

  // ── Event listeners ─────────────────────────────────────────────────

  /**
   * Listen for DrawResolved event for a specific draw.
   * Returns a cleanup function.
   */
  const onDrawResolved = useCallback((drawId, callback) => {
    if (!bolitaContract) return () => {};

    const filter = bolitaContract.filters.DrawResolved(drawId);

    const handler = (resolvedDrawId, winningNumber, totalPaidOut) => {
      callback({
        drawId: resolvedDrawId.toString(),
        winningNumber: Number(winningNumber),
        totalPaidOut: ethers.formatUnits(totalPaidOut, TOKEN_DECIMALS),
      });
      bolitaContract.off(filter, handler);
    };

    bolitaContract.on(filter, handler);
    return () => bolitaContract.off(filter, handler);
  }, [bolitaContract]);

  /**
   * Listen for BetResolved events for the current user.
   */
  const onBetResolved = useCallback((callback) => {
    if (!bolitaContract || !account) return () => {};

    const filter = bolitaContract.filters.BetResolved(null, account);

    const handler = (betId, player, won, payout) => {
      callback({
        betId: betId.toString(),
        won,
        payout: ethers.formatUnits(payout, TOKEN_DECIMALS),
      });
    };

    bolitaContract.on(filter, handler);
    return () => bolitaContract.off(filter, handler);
  }, [bolitaContract, account]);

  /**
   * WinningNumberSet was removed in the deployed contract.
   * Resolution is tracked via DrawResolved instead.
   */
  // eslint-disable-next-line no-unused-vars
  const onWinningNumberSet = useCallback((_drawId, _callback) => {
    return () => {};
  }, []);

  /**
   * Get the last N resolved draws (for results banner).
   */
  const getResolvedDraws = useCallback(async (count = 3) => {
    if (!bolitaContract) return [];
    try {
      const total = await bolitaContract.drawCounter();
      const resolved = [];

      // Scan backwards from most recent draw
      for (let id = Number(total); id >= 1 && resolved.length < count; id--) {
        const info = await getDrawInfo(id);
        if (info && info.status === 'resolved') {
          resolved.push(info);
        }
      }
      return resolved;
    } catch (err) {
      console.error('[BolitaContract] Error getting resolved draws:', err);
      return [];
    }
  }, [bolitaContract, getDrawInfo]);

  return {
    isOnChain,
    bolitaContract,
    bolitaContractAddress: BOLITA_ADDRESS,

    // Read
    getAvailablePool,
    getMultipliers,
    getDrawInfo,
    getOpenDraws,
    getResolvedDraws,
    getBet,
    getUserBets,
    getNumberExposure,
    getMaxExposure,
    getBetLimits,
    getTokenBalance,

    // Write
    placeBet,
    placeBetsBatch,
    retryUnpaidBet,
    cancelStaleDraw,

    // Events
    onDrawResolved,
    onBetResolved,
    onWinningNumberSet,

    // Constants
    BET_TYPE_MAP,
    DRAW_STATUS,
    PAYOUT_STATUS,
  };
}

export default useBolitaContract;
