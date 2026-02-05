/* eslint-disable no-undef */
import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from '../contexts/ToastContext';
import LaBolitaRiskManagedABI from '../contracts/LaBolitaRiskManagedABI.json';

// Direcciones del contrato Risk Managed
const RISK_CONTRACT_ADDRESS = import.meta.env.VITE_RISK_CONTRACT_ADDRESS || '';
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '';

// ABI minimo para ERC20
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// Mapeo de tipos de apuesta
const BET_TYPES = {
  FIJO: 0,
  CENTENA: 1,
  PARLE: 2
};

// Mapeo de estados de sorteo
const DRAW_STATUS = {
  0: 'scheduled',
  1: 'open',
  2: 'closed',
  3: 'completed',
  4: 'cancelled'
};

// Multiplicadores (65x, 300x, 1500x)
const MULTIPLIERS = {
  0: 65,    // Fijo
  1: 300,   // Centena
  2: 1500   // Parle
};

export function useRiskContract() {
  const { signer, provider, account, isConnected } = useWeb3();
  const { error: showError, success: showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Instancias de contratos
  const contract = useMemo(() => {
    if (!provider || !RISK_CONTRACT_ADDRESS) return null;
    return new ethers.Contract(
      RISK_CONTRACT_ADDRESS,
      LaBolitaRiskManagedABI,
      signer || provider
    );
  }, [provider, signer]);

  const tokenContract = useMemo(() => {
    if (!provider || !TOKEN_ADDRESS) return null;
    return new ethers.Contract(
      TOKEN_ADDRESS,
      ERC20_ABI,
      signer || provider
    );
  }, [provider, signer]);

  // ============ Risk Management Functions ============

  // Get pool status
  const getPoolStatus = useCallback(async () => {
    if (!contract) return null;
    try {
      const [totalPool, usableBalance, payoutCap] = await Promise.all([
        contract.totalPoolBalance(),
        contract.getUsableBalance(),
        contract.getPayoutCap()
      ]);
      return {
        totalPool: ethers.formatUnits(totalPool, 6),
        usableBalance: ethers.formatUnits(usableBalance, 6),
        payoutCap: ethers.formatUnits(payoutCap, 6)
      };
    } catch (err) {
      console.error('Error getting pool status:', err);
      return null;
    }
  }, [contract]);

  // Get risk parameters
  const getRiskParameters = useCallback(async () => {
    if (!contract) return null;
    try {
      const [reserveRatio, riskFactor, absoluteMax, minBet, maxBet] = await Promise.all([
        contract.reserveRatioBps(),
        contract.riskFactorBps(),
        contract.absoluteMaxPayout(),
        contract.minBetAmount(),
        contract.maxBetAmount()
      ]);
      return {
        reserveRatio: Number(reserveRatio) / 100,
        riskFactor: Number(riskFactor) / 100,
        absoluteMaxPayout: ethers.formatUnits(absoluteMax, 6),
        minBetAmount: ethers.formatUnits(minBet, 6),
        maxBetAmount: ethers.formatUnits(maxBet, 6)
      };
    } catch (err) {
      console.error('Error getting risk parameters:', err);
      return null;
    }
  }, [contract]);

  // Get exposure for a specific number
  const getExposure = useCallback(async (dayId, betType, number) => {
    if (!contract) return null;
    try {
      const [totalStake, totalLiability] = await contract.getExposure(dayId, betType, number);
      return {
        totalStake: ethers.formatUnits(totalStake, 6),
        totalLiability: ethers.formatUnits(totalLiability, 6)
      };
    } catch (err) {
      console.error('Error getting exposure:', err);
      return null;
    }
  }, [contract]);

  // Get current month ID
  const getCurrentMonthId = useCallback(async () => {
    if (!contract) return 0;
    try {
      return Number(await contract.getCurrentMonthId());
    } catch (err) {
      console.error('Error getting current month ID:', err);
      return 0;
    }
  }, [contract]);

  // Get monthly record
  const getMonthlyRecord = useCallback(async (monthId) => {
    if (!contract) return null;
    try {
      const record = await contract.monthlyRecords(monthId);
      return {
        netProfit: ethers.formatUnits(record.netProfit, 6),
        operatorFee: ethers.formatUnits(record.operatorFee, 6),
        commissionPaid: record.commissionPaid
      };
    } catch (err) {
      console.error('Error getting monthly record:', err);
      return null;
    }
  }, [contract]);

  // Get pending operator fees
  const getPendingOperatorFees = useCallback(async () => {
    if (!contract) return '0';
    try {
      const fees = await contract.pendingOperatorFees();
      return ethers.formatUnits(fees, 6);
    } catch (err) {
      console.error('Error getting pending fees:', err);
      return '0';
    }
  }, [contract]);

  // Check if bet can be placed (exposure check)
  const canPlaceBet = useCallback(async (dayId, betType, number, amount) => {
    if (!contract) return { allowed: false, reason: 'Contract not available' };
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      const payoutCap = await contract.getPayoutCap();
      const [, currentLiability] = await contract.getExposure(dayId, betType, number);

      const multiplier = MULTIPLIERS[betType] || 65;
      const newLiability = currentLiability + (amountWei * BigInt(multiplier * 10000) / BigInt(10000));

      if (newLiability > payoutCap) {
        const maxAllowed = (payoutCap - currentLiability) / BigInt(multiplier);
        return {
          allowed: false,
          reason: 'Exposure limit exceeded',
          maxAllowed: ethers.formatUnits(maxAllowed > 0 ? maxAllowed : 0, 6)
        };
      }
      return { allowed: true };
    } catch (err) {
      console.error('Error checking bet allowance:', err);
      return { allowed: false, reason: err.message };
    }
  }, [contract]);

  // ============ User Functions ============

  // Get user balance
  const getContractBalance = useCallback(async () => {
    if (!contract || !account) return '0';
    try {
      const balance = await contract.getBalance(account);
      return ethers.formatUnits(balance, 6);
    } catch (err) {
      console.error('Error getting contract balance:', err);
      return '0';
    }
  }, [contract, account]);

  // Get token balance
  const getTokenBalance = useCallback(async () => {
    if (!tokenContract || !account) return '0';
    try {
      const balance = await tokenContract.balanceOf(account);
      return ethers.formatUnits(balance, 6);
    } catch (err) {
      console.error('Error getting token balance:', err);
      return '0';
    }
  }, [tokenContract, account]);

  // Deposit tokens
  const deposit = useCallback(async (amount) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      // Check allowance
      const allowance = await tokenContract.allowance(account, RISK_CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        showSuccess('Aprobando tokens primero...');
        const approveTx = await tokenContract.approve(RISK_CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
      }

      const tx = await contract.deposit(amountWei);
      showSuccess('Procesando deposito...');
      await tx.wait();
      showSuccess('Deposito exitoso!');
      return true;
    } catch (err) {
      console.error('Error depositing:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, tokenContract, signer, account, showError, showSuccess]);

  // Withdraw tokens
  const withdraw = useCallback(async (amount) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      const tx = await contract.withdraw(amountWei);
      showSuccess('Procesando retiro...');
      await tx.wait();
      showSuccess('Retiro exitoso!');
      return true;
    } catch (err) {
      console.error('Error withdrawing:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Get open draws
  const getOpenDraws = useCallback(async () => {
    if (!contract) return [];
    try {
      const drawIds = await contract.getOpenDraws();
      const draws = await Promise.all(
        drawIds.map(async (id) => {
          const draw = await contract.getDraw(id);
          return formatDraw(draw);
        })
      );
      return draws;
    } catch (err) {
      console.error('Error getting open draws:', err);
      return [];
    }
  }, [contract]);

  // Get draw
  const getDraw = useCallback(async (drawId) => {
    if (!contract) return null;
    try {
      const draw = await contract.getDraw(drawId);
      return formatDraw(draw);
    } catch (err) {
      console.error('Error getting draw:', err);
      return null;
    }
  }, [contract]);

  // Place bet
  const placeBet = useCallback(async (drawId, betType, numbers, amount) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      const betTypeNum = BET_TYPES[betType.toUpperCase()] ?? betType;

      const tx = await contract.placeBet(drawId, betTypeNum, numbers, amountWei);
      showSuccess('Procesando apuesta...');
      await tx.wait();
      showSuccess('Apuesta realizada!');
      return true;
    } catch (err) {
      console.error('Error placing bet:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Get user bets
  const getUserBets = useCallback(async () => {
    if (!contract || !account) return [];
    try {
      const betIds = await contract.getUserBets(account);
      const bets = await Promise.all(
        betIds.map(async (id) => {
          const bet = await contract.getBet(id);
          const draw = await contract.getDraw(bet.drawId);
          return formatBet(id, bet, draw);
        })
      );
      return bets.reverse();
    } catch (err) {
      console.error('Error getting user bets:', err);
      return [];
    }
  }, [contract, account]);

  // Check winnings
  const checkWinnings = useCallback(async (betId) => {
    if (!contract) return '0';
    try {
      const winnings = await contract.checkWinnings(betId);
      return ethers.formatUnits(winnings, 6);
    } catch (err) {
      console.error('Error checking winnings:', err);
      return '0';
    }
  }, [contract]);

  // Claim winnings
  const claimWinnings = useCallback(async (betId) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.claimWinnings(betId);
      showSuccess('Reclamando ganancias...');
      await tx.wait();
      showSuccess('Ganancias reclamadas!');
      return true;
    } catch (err) {
      console.error('Error claiming winnings:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // ============ Admin Functions ============

  // Create daily draws
  const createDailyDraws = useCallback(async () => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.createDailyDraws();
      showSuccess('Creando sorteos...');
      await tx.wait();
      showSuccess('Sorteos diarios creados!');
      return true;
    } catch (err) {
      console.error('Error creating daily draws:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Close draw
  const closeDraw = useCallback(async (drawId) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.closeDraw(drawId);
      await tx.wait();
      showSuccess('Sorteo cerrado!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

  // Submit results
  const submitResults = useCallback(async (drawId, fijos, centenas, parles) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.submitResults(drawId, fijos, centenas, parles);
      showSuccess('Enviando resultados...');
      await tx.wait();
      showSuccess('Resultados guardados!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

  // Settle daily results
  const settleDailyResults = useCallback(async (dayId) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.settleDailyResults(dayId);
      showSuccess('Liquidando dia...');
      await tx.wait();
      showSuccess('Dia liquidado!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

  // Calculate monthly commission
  const calculateMonthlyCommission = useCallback(async (monthId) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.calculateMonthlyCommission(monthId);
      showSuccess('Calculando comision...');
      await tx.wait();
      showSuccess('Comision calculada!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

  // Withdraw operator fees
  const withdrawOperatorFees = useCallback(async () => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.withdrawOperatorFees();
      showSuccess('Retirando comisiones...');
      await tx.wait();
      showSuccess('Comisiones retiradas!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

  // ============ Helpers ============

  const handleError = (err) => {
    let message = 'Error en la transaccion';

    if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
      message = 'Transaccion rechazada';
    } else if (err.reason) {
      message = err.reason;
    } else if (err.message?.includes('insufficient funds')) {
      message = 'Fondos insuficientes para gas';
    } else if (err.message?.includes('Below min bet')) {
      message = 'Monto minimo: 1 USDT';
    } else if (err.message?.includes('Above max bet')) {
      message = 'Monto maximo: 10 USDT';
    } else if (err.message?.includes('Exposure limit exceeded')) {
      message = 'Limite de exposicion excedido para este numero';
    }

    showError(message);
  };

  return {
    // Estado
    isLoading,
    isConnected,
    contractAddress: RISK_CONTRACT_ADDRESS,
    tokenAddress: TOKEN_ADDRESS,

    // Risk Management
    getPoolStatus,
    getRiskParameters,
    getExposure,
    getCurrentMonthId,
    getMonthlyRecord,
    getPendingOperatorFees,
    canPlaceBet,

    // User Functions
    getContractBalance,
    getTokenBalance,
    deposit,
    withdraw,
    getOpenDraws,
    getDraw,
    placeBet,
    getUserBets,
    checkWinnings,
    claimWinnings,

    // Admin Functions
    createDailyDraws,
    closeDraw,
    submitResults,
    settleDailyResults,
    calculateMonthlyCommission,
    withdrawOperatorFees
  };
}

// Formatters
function formatDraw(draw) {
  return {
    id: Number(draw.id),
    dayId: Number(draw.dayId),
    draw_number: draw.drawNumber,
    scheduled_time: new Date(Number(draw.scheduledTime) * 1000).toISOString(),
    status: DRAW_STATUS[Number(draw.status)],
    winning_fijos: draw.winningFijos,
    winning_centenas: draw.winningCentenas,
    winning_parles: draw.winningParles,
    bets_count: Number(draw.totalBets),
    total_bets_amount: ethers.formatUnits(draw.totalAmount, 6),
    total_paid_out: ethers.formatUnits(draw.totalPaidOut, 6)
  };
}

function formatBet(id, bet, draw) {
  const betTypes = ['fijo', 'centena', 'parle'];
  return {
    id: Number(id),
    draw_id: Number(bet.drawId),
    bet_type: betTypes[Number(bet.betType)],
    numbers: bet.numbers,
    amount: ethers.formatUnits(bet.amount, 6),
    claimed: bet.claimed,
    payout: ethers.formatUnits(bet.payout, 6),
    draw: formatDraw(draw)
  };
}

export default useRiskContract;
