import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useToast } from '../contexts/ToastContext';
import LaBolitaABI from '../contracts/LaBolitaABI.json';

// Direcciones del contrato (actualizar despues del deploy)
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
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

// Mapeo de estados de loteria
const LOTTERY_STATUS = {
  0: 'scheduled',
  1: 'open',
  2: 'closed',
  3: 'completed'
};

// Categorias de premios de La Fortuna
const LOTTERY_CATEGORIES = {
  0: { name: 'Sin premio', description: '' },
  1: { name: 'JACKPOT', description: '5 aciertos + Clave' },
  2: { name: '2da Categoria', description: '5 aciertos' },
  3: { name: '3ra Categoria', description: '4 aciertos + Clave' },
  4: { name: '4ta Categoria', description: '4 aciertos' },
  5: { name: '5ta Categoria', description: '3 aciertos + Clave' },
  6: { name: '6ta Categoria', description: '3 aciertos' }
};

export function useContract() {
  const { signer, provider, account, isConnected } = useWeb3();
  const { error: showError, success: showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Instancias de contratos
  const contract = useMemo(() => {
    if (!provider || !CONTRACT_ADDRESS) return null;
    return new ethers.Contract(
      CONTRACT_ADDRESS,
      LaBolitaABI,
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

  // ============ Funciones de Lectura ============

  // Obtener balance en el contrato
  const getContractBalance = useCallback(async () => {
    if (!contract || !account) return '0';
    try {
      const balance = await contract.getBalance(account);
      return ethers.formatUnits(balance, 6); // USDT tiene 6 decimales
    } catch (err) {
      console.error('Error getting contract balance:', err);
      return '0';
    }
  }, [contract, account]);

  // Obtener balance de tokens en wallet
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

  // Depositar tokens al contrato
  const depositToContract = useCallback(async (amount) => {
    if (!tokenContract || !contract || !account) {
      throw new Error('Wallet o contratos no conectados');
    }

    try {
      const amountInWei = ethers.parseUnits(amount.toString(), 6);

      // Primero aprobar que el contrato gaste nuestros tokens
      console.log(`[Contract] Approving ${amount} USDT for contract...`);
      const approveTx = await tokenContract.approve(contract.target, amountInWei);
      await approveTx.wait();
      console.log(`[Contract] Approval confirmed: ${approveTx.hash}`);

      // Luego depositar al contrato
      console.log(`[Contract] Depositing ${amount} USDT to contract...`);
      const depositTx = await contract.deposit(amountInWei);
      await depositTx.wait();
      console.log(`[Contract] Deposit confirmed: ${depositTx.hash}`);

      return depositTx.hash;
    } catch (err) {
      console.error('Error depositing to contract:', err);
      throw err;
    }
  }, [tokenContract, contract, account]);

  // Obtener sorteos abiertos
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

  // Obtener un sorteo
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

  // Obtener todos los sorteos
  const getAllDraws = useCallback(async () => {
    if (!contract) return [];
    try {
      const counter = await contract.drawCounter();
      const draws = [];
      for (let i = 1; i <= Number(counter); i++) {
        const draw = await contract.getDraw(i);
        draws.push(formatDraw(draw));
      }
      return draws.reverse(); // Mas recientes primero
    } catch (err) {
      console.error('Error getting all draws:', err);
      return [];
    }
  }, [contract]);

  // Obtener apuestas del usuario
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

  // Verificar ganancias de una apuesta
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

  // ============ Funciones de Referidos ============

  // Obtener info de referidos
  const getReferralInfo = useCallback(async (address = null) => {
    if (!contract) return null;
    try {
      const userAddress = address || account;
      if (!userAddress) return null;

      const info = await contract.getReferralInfo(userAddress);
      return {
        referrer: info[0],
        totalReferred: Number(info[1]),
        totalEarnings: ethers.formatUnits(info[2], 6),
        pendingEarnings: ethers.formatUnits(info[3], 6),
        hasReceivedBonus: info[4],
        joinedAt: Number(info[5]) > 0 ? new Date(Number(info[5]) * 1000) : null
      };
    } catch (err) {
      console.error('Error getting referral info:', err);
      return null;
    }
  }, [contract, account]);

  // Obtener estadisticas de referidos
  const getReferralStats = useCallback(async () => {
    if (!contract || !account) return null;
    try {
      const stats = await contract.getReferralStats(account);
      return {
        totalReferred: Number(stats[0]),
        totalEarnings: ethers.formatUnits(stats[1], 6),
        pendingEarnings: ethers.formatUnits(stats[2], 6),
        referralBonusRate: Number(stats[3]) / 100 // Convertir de basis points a %
      };
    } catch (err) {
      console.error('Error getting referral stats:', err);
      return null;
    }
  }, [contract, account]);

  // Obtener lista de usuarios referidos
  const getReferredUsers = useCallback(async () => {
    if (!contract || !account) return [];
    try {
      return await contract.getReferredUsers(account);
    } catch (err) {
      console.error('Error getting referred users:', err);
      return [];
    }
  }, [contract, account]);

  // Obtener configuracion de referidos
  const getReferralConfig = useCallback(async () => {
    if (!contract) return null;
    try {
      const config = await contract.getReferralConfig();
      return {
        bonusPercent: Number(config[0]) / 100, // Convertir de basis points a %
        welcomeBonus: ethers.formatUnits(config[1], 6),
        welcomeEnabled: config[2],
        systemEnabled: config[3]
      };
    } catch (err) {
      console.error('Error getting referral config:', err);
      return null;
    }
  }, [contract]);

  // Verificar si tiene referidor
  const hasReferrer = useCallback(async () => {
    if (!contract || !account) return false;
    try {
      return await contract.hasReferrer(account);
    } catch (err) {
      console.error('Error checking referrer:', err);
      return false;
    }
  }, [contract, account]);

  // ============ Funciones de LA FORTUNA - Lectura ============

  // Obtener jackpot actual
  const getJackpot = useCallback(async () => {
    if (!contract) return '0';
    try {
      const jackpot = await contract.getJackpot();
      return ethers.formatUnits(jackpot, 6);
    } catch (err) {
      console.error('Error getting jackpot:', err);
      return '0';
    }
  }, [contract]);

  // Obtener info del jackpot con proximo sorteo
  const getJackpotInfo = useCallback(async () => {
    if (!contract) return null;
    try {
      const info = await contract.getJackpotInfo();
      return {
        jackpot: ethers.formatUnits(info[0], 6),
        nextDrawId: Number(info[1]),
        nextDrawName: info[2],
        nextDrawTime: Number(info[3]) > 0 ? new Date(Number(info[3]) * 1000) : null
      };
    } catch (err) {
      console.error('Error getting jackpot info:', err);
      return null;
    }
  }, [contract]);

  // Obtener sorteos de loteria abiertos
  const getOpenLotteryDraws = useCallback(async () => {
    if (!contract) return [];
    try {
      const drawIds = await contract.getOpenLotteryDraws();
      const draws = await Promise.all(
        drawIds.map(async (id) => {
          const draw = await contract.getLotteryDraw(id);
          return formatLotteryDraw(draw);
        })
      );
      return draws;
    } catch (err) {
      console.error('Error getting open lottery draws:', err);
      return [];
    }
  }, [contract]);

  // Obtener un sorteo de loteria
  const getLotteryDraw = useCallback(async (lotteryId) => {
    if (!contract) return null;
    try {
      const draw = await contract.getLotteryDraw(lotteryId);
      return formatLotteryDraw(draw);
    } catch (err) {
      console.error('Error getting lottery draw:', err);
      return null;
    }
  }, [contract]);

  // Obtener boleto de loteria
  const getLotteryTicket = useCallback(async (ticketId) => {
    if (!contract) return null;
    try {
      const ticket = await contract.getLotteryTicket(ticketId);
      return formatLotteryTicket(ticketId, ticket);
    } catch (err) {
      console.error('Error getting lottery ticket:', err);
      return null;
    }
  }, [contract]);

  // Obtener boletos del usuario
  const getUserLotteryTickets = useCallback(async () => {
    if (!contract || !account) return [];
    try {
      const ticketIds = await contract.getUserLotteryTickets(account);
      const tickets = await Promise.all(
        ticketIds.map(async (id) => {
          const ticket = await contract.getLotteryTicket(id);
          const draw = await contract.getLotteryDraw(ticket.lotteryId);
          return { ...formatLotteryTicket(id, ticket), draw: formatLotteryDraw(draw) };
        })
      );
      return tickets.reverse();
    } catch (err) {
      console.error('Error getting user lottery tickets:', err);
      return [];
    }
  }, [contract, account]);

  // Obtener configuracion de loteria
  const getLotteryConfig = useCallback(async () => {
    if (!contract) return null;
    try {
      const config = await contract.getLotteryConfig();
      return {
        ticketPrice: ethers.formatUnits(config[0], 6),
        jackpotPercent: Number(config[1]) / 100,
        minJackpot: ethers.formatUnits(config[2], 6),
        currentJackpot: ethers.formatUnits(config[3], 6),
        totalLotteries: Number(config[4]),
        totalTickets: Number(config[5])
      };
    } catch (err) {
      console.error('Error getting lottery config:', err);
      return null;
    }
  }, [contract]);

  // Obtener tabla de premios
  const getLotteryPrizes = useCallback(async () => {
    if (!contract) return null;
    try {
      const prizes = await contract.getLotteryPrizes();
      return {
        category2: ethers.formatUnits(prizes[0], 6),
        category3: ethers.formatUnits(prizes[1], 6),
        category4: ethers.formatUnits(prizes[2], 6),
        category5: ethers.formatUnits(prizes[3], 6),
        category6: ethers.formatUnits(prizes[4], 6)
      };
    } catch (err) {
      console.error('Error getting lottery prizes:', err);
      return null;
    }
  }, [contract]);

  // Verificar premio de boleto
  const checkLotteryPrize = useCallback(async (ticketId) => {
    if (!contract) return { category: 0, prize: '0' };
    try {
      const result = await contract.checkLotteryPrize(ticketId);
      return {
        category: Number(result[0]),
        prize: ethers.formatUnits(result[1], 6),
        categoryInfo: LOTTERY_CATEGORIES[Number(result[0])]
      };
    } catch (err) {
      console.error('Error checking lottery prize:', err);
      return { category: 0, prize: '0' };
    }
  }, [contract]);

  // ============ Funciones de Escritura ============

  // Aprobar tokens para el contrato
  const approveTokens = useCallback(async (amount) => {
    if (!tokenContract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);
      const tx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
      showSuccess('Aprobando tokens...');
      await tx.wait();
      showSuccess('Tokens aprobados');
      return true;
    } catch (err) {
      console.error('Error approving tokens:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [tokenContract, signer, showError, showSuccess]);

  // Verificar allowance
  const checkAllowance = useCallback(async () => {
    if (!tokenContract || !account) return '0';
    try {
      const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS);
      return ethers.formatUnits(allowance, 6);
    } catch (err) {
      console.error('Error checking allowance:', err);
      return '0';
    }
  }, [tokenContract, account]);

  // Depositar tokens
  const deposit = useCallback(async (amount) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      // Verificar allowance
      const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        showSuccess('Aprobando tokens primero...');
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
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

  // Retirar tokens
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

  // Depositar con codigo de referido
  const depositWithReferral = useCallback(async (amount, referrerAddress) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount.toString(), 6);

      // Verificar allowance
      const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS);
      if (allowance < amountWei) {
        showSuccess('Aprobando tokens primero...');
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amountWei);
        await approveTx.wait();
      }

      const tx = await contract.depositWithReferral(amountWei, referrerAddress);
      showSuccess('Procesando deposito con referido...');
      await tx.wait();
      showSuccess('Deposito exitoso! Tu referidor recibira bonos por tus apuestas.');
      return true;
    } catch (err) {
      console.error('Error depositing with referral:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, tokenContract, signer, account, showError, showSuccess]);

  // Registrar referido sin deposito
  const registerReferral = useCallback(async (referrerAddress) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.registerReferral(referrerAddress);
      showSuccess('Registrando referido...');
      await tx.wait();
      showSuccess('Referido registrado correctamente!');
      return true;
    } catch (err) {
      console.error('Error registering referral:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Reclamar ganancias de referidos
  const claimReferralEarnings = useCallback(async () => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.claimReferralEarnings();
      showSuccess('Reclamando ganancias de referidos...');
      await tx.wait();
      showSuccess('Ganancias reclamadas exitosamente!');
      return true;
    } catch (err) {
      console.error('Error claiming referral earnings:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Realizar apuesta
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

  // Reclamar ganancias
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

  // Reclamar todas las ganancias de un sorteo
  const claimAllWinnings = useCallback(async (drawId) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.claimAllWinnings(drawId);
      showSuccess('Reclamando ganancias...');
      await tx.wait();
      showSuccess('Todas las ganancias reclamadas!');
      return true;
    } catch (err) {
      console.error('Error claiming all winnings:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // ============ Funciones de LA FORTUNA - Escritura ============

  // Comprar boleto de loteria
  const buyLotteryTicket = useCallback(async (lotteryId, numbers, keyNumber) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      // numbers debe ser un array de 5 numeros [1-54]
      // keyNumber es un numero del 0-9
      const tx = await contract.buyLotteryTicket(lotteryId, numbers, keyNumber);
      showSuccess('Comprando boleto...');
      await tx.wait();
      showSuccess('Boleto comprado exitosamente!');
      return true;
    } catch (err) {
      console.error('Error buying lottery ticket:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Comprar multiples boletos (Quick Pick)
  const buyMultipleLotteryTickets = useCallback(async (lotteryId, quantity) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.buyMultipleLotteryTickets(lotteryId, quantity);
      showSuccess(`Comprando ${quantity} boletos...`);
      await tx.wait();
      showSuccess(`${quantity} boletos comprados!`);
      return true;
    } catch (err) {
      console.error('Error buying multiple lottery tickets:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Reclamar premio de loteria
  const claimLotteryPrize = useCallback(async (ticketId) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.claimLotteryPrize(ticketId);
      showSuccess('Reclamando premio...');
      await tx.wait();
      showSuccess('Premio reclamado!');
      return true;
    } catch (err) {
      console.error('Error claiming lottery prize:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // Reclamar todos los premios de un sorteo de loteria
  const claimAllLotteryPrizes = useCallback(async (lotteryId) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const tx = await contract.claimAllLotteryPrizes(lotteryId);
      showSuccess('Reclamando todos los premios...');
      await tx.wait();
      showSuccess('Todos los premios reclamados!');
      return true;
    } catch (err) {
      console.error('Error claiming all lottery prizes:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  // ============ Funciones de Admin ============

  const createDraw = useCallback(async (drawNumber, scheduledTime) => {
    if (!contract || !signer) {
      showError('Wallet no conectada');
      return false;
    }

    setIsLoading(true);
    try {
      const timestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
      const tx = await contract.createDraw(drawNumber, timestamp);
      showSuccess('Creando sorteo...');
      await tx.wait();
      showSuccess('Sorteo creado!');
      return true;
    } catch (err) {
      console.error('Error creating draw:', err);
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showError, showSuccess]);

  const openDraw = useCallback(async (drawId) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.openDraw(drawId);
      await tx.wait();
      showSuccess('Sorteo abierto!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

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

  const submitResults = useCallback(async (drawId, fijos, centenas, parles) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.submitResults(drawId, fijos, centenas, parles);
      showSuccess('Enviando resultados...');
      await tx.wait();
      showSuccess('Resultados guardados en blockchain!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [contract, signer, showSuccess]);

  const cancelDraw = useCallback(async (drawId) => {
    if (!contract || !signer) return false;
    setIsLoading(true);
    try {
      const tx = await contract.cancelDraw(drawId);
      await tx.wait();
      showSuccess('Sorteo cancelado y apuestas reembolsadas!');
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
    } else if (err.message?.includes('Insufficient balance')) {
      message = 'Balance insuficiente';
    }

    showError(message);
  };

  return {
    // Estado
    isLoading,
    isConnected,
    contractAddress: CONTRACT_ADDRESS,
    tokenAddress: TOKEN_ADDRESS,

    // Lectura
    getContractBalance,
    getTokenBalance,
    depositToContract,
    getOpenDraws,
    getDraw,
    getAllDraws,
    getUserBets,
    checkWinnings,
    checkAllowance,

    // Escritura Usuario
    approveTokens,
    deposit,
    withdraw,
    placeBet,
    claimWinnings,
    claimAllWinnings,

    // Referidos - Lectura
    getReferralInfo,
    getReferralStats,
    getReferredUsers,
    getReferralConfig,
    hasReferrer,

    // Referidos - Escritura
    depositWithReferral,
    registerReferral,
    claimReferralEarnings,

    // La Fortuna - Lectura
    getJackpot,
    getJackpotInfo,
    getOpenLotteryDraws,
    getLotteryDraw,
    getLotteryTicket,
    getUserLotteryTickets,
    getLotteryConfig,
    getLotteryPrizes,
    checkLotteryPrize,

    // La Fortuna - Escritura
    buyLotteryTicket,
    buyMultipleLotteryTickets,
    claimLotteryPrize,
    claimAllLotteryPrizes,

    // Escritura Admin
    createDraw,
    openDraw,
    closeDraw,
    submitResults,
    cancelDraw
  };
}

// Formateadores
function formatDraw(draw) {
  return {
    id: Number(draw.id),
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

// Formateadores para La Fortuna
function formatLotteryDraw(draw) {
  return {
    id: Number(draw.id),
    drawName: draw.drawName,
    scheduledTime: new Date(Number(draw.scheduledTime) * 1000),
    status: LOTTERY_STATUS[Number(draw.status)],
    winningNumbers: draw.winningNumbers.map(n => Number(n)),
    keyNumber: Number(draw.keyNumber),
    jackpot: ethers.formatUnits(draw.jackpot, 6),
    totalTickets: Number(draw.totalTickets),
    totalCollected: ethers.formatUnits(draw.totalCollected, 6),
    totalPaidOut: ethers.formatUnits(draw.totalPaidOut, 6),
    jackpotWon: draw.jackpotWon
  };
}

function formatLotteryTicket(id, ticket) {
  return {
    id: Number(id),
    player: ticket.player,
    lotteryId: Number(ticket.lotteryId),
    numbers: ticket.numbers.map(n => Number(n)),
    keyNumber: Number(ticket.keyNumber),
    purchaseTime: new Date(Number(ticket.purchaseTime) * 1000),
    claimed: ticket.claimed,
    prize: ethers.formatUnits(ticket.prize, 6),
    category: Number(ticket.category),
    categoryInfo: LOTTERY_CATEGORIES[Number(ticket.category)]
  };
}

export default useContract;
