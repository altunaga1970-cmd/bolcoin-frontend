/**
 * useDirectBalance - Lee balance USDT directamente de blockchain
 *
 * Fallback para cuando el backend no está disponible.
 * Usa RPC públicos para leer - NO depende del provider de la wallet.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// RPCs públicos por red (para lectura, no necesitan wallet)
const PUBLIC_RPCS = {
  137: 'https://polygon-bor-rpc.publicnode.com',    // Polygon Mainnet (más estable)
  80002: 'https://rpc-amoy.polygon.technology',     // Polygon Amoy
  1: 'https://eth.llamarpc.com',                     // Ethereum Mainnet
  11155111: 'https://rpc.sepolia.org',              // Sepolia
  31337: 'http://127.0.0.1:8545',                    // Hardhat local
};

// Direcciones USDT por red
const USDT_ADDRESSES = {
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',   // Polygon Mainnet (USDT)
  80002: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // Polygon Amoy (test USDT)
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7',    // Ethereum Mainnet
  11155111: '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia
  31337: import.meta.env.VITE_TOKEN_ADDRESS || '', // Hardhat local (empty = no USDT contract deployed)
};

// ABI mínimo para leer balance ERC20
const ERC20_BALANCE_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

/**
 * Crear provider RPC público para una red
 */
function getPublicProvider(chainId) {
  const rpcUrl = PUBLIC_RPCS[chainId];
  if (!rpcUrl) return null;

  try {
    return new ethers.JsonRpcProvider(rpcUrl);
  } catch (err) {
    console.error(`[DirectBalance] Error creating provider for chain ${chainId}:`, err);
    return null;
  }
}

/**
 * Hook para leer balance USDT directamente de blockchain
 * Usa RPC público - no depende del provider de la wallet
 */
export function useDirectBalance() {
  const { account, chainId, isConnected } = useWeb3();

  const [usdtBalance, setUsdtBalance] = useState('0');
  const [nativeBalance, setNativeBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Cache del provider para evitar recrearlo
  const providerRef = useRef(null);
  const lastChainIdRef = useRef(null);

  // Obtener o crear provider para la red actual
  const getProvider = useCallback(() => {
    if (lastChainIdRef.current !== chainId) {
      providerRef.current = getPublicProvider(chainId);
      lastChainIdRef.current = chainId;
    }
    return providerRef.current;
  }, [chainId]);

  // Obtener dirección USDT para la red actual
  const getUsdtAddress = useCallback(() => {
    return USDT_ADDRESSES[chainId] || null;
  }, [chainId]);

  // Leer balance USDT - RETORNA el valor leído
  const fetchUsdtBalance = useCallback(async () => {
    if (!isConnected || !account) {
      console.log('[DirectBalance] Not connected or no account');
      return '0';
    }

    const provider = getProvider();
    if (!provider) {
      console.warn(`[DirectBalance] No RPC provider for chain ${chainId}`);
      return '0';
    }

    const usdtAddress = getUsdtAddress();
    if (!usdtAddress) {
      console.warn(`[DirectBalance] No USDT address for chain ${chainId}`);
      return '0';
    }

    try {
      console.log(`[DirectBalance] Fetching USDT balance for ${account} on chain ${chainId}`);
      console.log(`[DirectBalance] USDT contract: ${usdtAddress}`);

      const tokenContract = new ethers.Contract(usdtAddress, ERC20_BALANCE_ABI, provider);

      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.decimals()
      ]);

      const formatted = ethers.formatUnits(balance, decimals);
      console.log(`[DirectBalance] USDT balance: ${formatted} (raw: ${balance}, decimals: ${decimals})`);

      return formatted;
    } catch (err) {
      console.error('[DirectBalance] Error fetching USDT balance:', err);
      return '0';
    }
  }, [isConnected, account, chainId, getProvider, getUsdtAddress]);

  // Leer balance nativo (POL/ETH) - RETORNA el valor leído
  const fetchNativeBalance = useCallback(async () => {
    if (!isConnected || !account) {
      return '0';
    }

    const provider = getProvider();
    if (!provider) {
      return '0';
    }

    try {
      const balance = await provider.getBalance(account);
      const formatted = ethers.formatEther(balance);
      console.log(`[DirectBalance] Native balance: ${formatted}`);
      return formatted;
    } catch (err) {
      console.error('[DirectBalance] Error fetching native balance:', err);
      return '0';
    }
  }, [isConnected, account, getProvider]);

  // Refrescar ambos balances - RETORNA los valores leídos
  const refreshDirectBalance = useCallback(async () => {
    if (!isConnected || !account) {
      setUsdtBalance('0');
      setNativeBalance('0');
      return { usdt: '0', native: '0' };
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[DirectBalance] Refreshing balances...');

      const [usdt, native] = await Promise.all([
        fetchUsdtBalance(),
        fetchNativeBalance()
      ]);

      // Actualizar estados
      setUsdtBalance(usdt);
      setNativeBalance(native);
      setLastUpdated(new Date());

      console.log('[DirectBalance] Balances updated:', { usdt, native });

      // IMPORTANTE: Retornar los valores leídos directamente
      return { usdt, native };
    } catch (err) {
      console.error('[DirectBalance] Error refreshing:', err);
      setError('Error actualizando balances');
      return { usdt: '0', native: '0' };
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, account, fetchUsdtBalance, fetchNativeBalance]);

  // Cargar balance cuando cambie cuenta o red
  useEffect(() => {
    if (isConnected && account && chainId) {
      console.log(`[DirectBalance] Account/chain changed: ${account} on ${chainId}`);
      refreshDirectBalance();
    } else {
      setUsdtBalance('0');
      setNativeBalance('0');
    }
  }, [isConnected, account, chainId]); // No incluir refreshDirectBalance

  // Helpers
  const isPolygonMainnet = chainId === 137;
  const isPolygonAmoy = chainId === 80002;
  const isSupported = Boolean(USDT_ADDRESSES[chainId]) && Boolean(PUBLIC_RPCS[chainId]);

  const networkName = {
    137: 'Polygon',
    80002: 'Polygon Amoy',
    1: 'Ethereum',
    11155111: 'Sepolia',
    31337: 'Hardhat'
  }[chainId] || `Chain ${chainId}`;

  return {
    // Balances
    usdtBalance,
    nativeBalance,

    // Estado
    isLoading,
    error,
    lastUpdated,

    // Info de red
    chainId,
    networkName,
    isPolygonMainnet,
    isPolygonAmoy,
    isSupported,
    usdtAddress: getUsdtAddress(),

    // Funciones
    refreshDirectBalance,

    // Formateados
    formattedUsdtBalance: `${parseFloat(usdtBalance || '0').toFixed(2)} USDT`,
    formattedNativeBalance: `${parseFloat(nativeBalance || '0').toFixed(4)} ${isPolygonMainnet || isPolygonAmoy ? 'POL' : 'ETH'}`,
  };
}

export default useDirectBalance;
