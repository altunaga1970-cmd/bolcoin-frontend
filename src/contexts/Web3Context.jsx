import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useAccount, useChainId, useDisconnect, useSwitchChain, useConnectorClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useToast } from './ToastContext';
import { DEFAULT_CHAIN_ID } from '../config/wagmi';

const Web3Context = createContext(null);

// Configuracion de redes soportadas (mantenido para compatibilidad)
const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    rpcUrl: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io'
  },
  137: {
    name: 'Polygon Mainnet',
    currency: 'POL',
    rpcUrl: 'https://polygon-bor-rpc.publicnode.com',
    explorer: 'https://polygonscan.com'
  },
  80001: {
    name: 'Polygon Mumbai',
    currency: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorer: 'https://mumbai.polygonscan.com'
  },
  80002: {
    name: 'Polygon Amoy',
    currency: 'POL',
    rpcUrl: 'https://polygon-amoy-bor-rpc.publicnode.com',
    explorer: 'https://amoy.polygonscan.com'
  },
  11155111: {
    name: 'Sepolia',
    currency: 'ETH',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io'
  },
  31337: {
    name: 'Localhost',
    currency: 'ETH',
    rpcUrl: 'http://127.0.0.1:8545',
    explorer: ''
  }
};

// Funcion helper para convertir viem WalletClient a ethers Signer
function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new ethers.BrowserProvider(transport, network);
  return provider.getSigner(account.address);
}

export function Web3Provider({ children }) {
  const { error: showError, success: showSuccess } = useToast();

  // Hooks de wagmi
  const { address, isConnected: wagmiIsConnected, isConnecting: wagmiIsConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useConnectorClient();

  // Estado local para provider/signer (compatibilidad con ethers)
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Derivar isConnected y account de wagmi
  const account = address || null;
  const isConnected = wagmiIsConnected && Boolean(address);
  const isConnecting = wagmiIsConnecting;

  // Verificar red correcta
  const isCorrectNetwork = chainId === DEFAULT_CHAIN_ID;

  // Convertir walletClient a ethers provider/signer cuando cambie
  useEffect(() => {
    async function setupEthers() {
      if (walletClient && isConnected) {
        try {
          const { chain, transport } = walletClient;
          const network = {
            chainId: chain.id,
            name: chain.name,
          };

          // Crear ethers provider desde el transport de viem
          const ethersProvider = new ethers.BrowserProvider(transport, network);
          const ethersSigner = await ethersProvider.getSigner(address);

          setProvider(ethersProvider);
          setSigner(ethersSigner);

          // Guardar direccion para autenticacion API
          sessionStorage.setItem('walletAddress', address);
        } catch (err) {
          console.error('[Web3Context] Error setting up ethers:', err);
        }
      } else {
        setProvider(null);
        setSigner(null);
      }
    }

    setupEthers();
  }, [walletClient, isConnected, address]);

  // Conectar wallet - abre el modal de RainbowKit
  const connectWallet = useCallback(async () => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  // Desconectar wallet
  const disconnectWallet = useCallback(() => {
    disconnect();

    // Limpiar estado local
    setProvider(null);
    setSigner(null);

    // Limpiar sesion
    sessionStorage.removeItem('admin_session_token');
    sessionStorage.removeItem('walletAddress');

    showSuccess('Wallet desconectada');
  }, [disconnect, showSuccess]);

  // Cambiar a la red correcta
  const switchNetwork = useCallback(async () => {
    if (!switchChain) {
      showError('No se puede cambiar de red');
      return;
    }

    try {
      await switchChain({ chainId: DEFAULT_CHAIN_ID });
    } catch (err) {
      console.error('[Web3Context] Error switching network:', err);
      showError('Error al cambiar de red');
    }
  }, [switchChain, showError]);

  // Formatear direccion
  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Validar red antes de transacciones
  const validateNetworkBeforeTransaction = useCallback(async () => {
    if (!isConnected || !isCorrectNetwork) {
      if (!isConnected) {
        showError('Por favor, conecta tu wallet primero');
        return false;
      }
      if (!isCorrectNetwork) {
        showError('Por favor, cambia a la red correcta antes de continuar');
        await switchNetwork();
        return false;
      }
      return false;
    }
    return true;
  }, [isConnected, isCorrectNetwork, showError, switchNetwork]);

  // Obtener balance nativo
  const getNativeBalance = useCallback(async () => {
    if (!provider || !account) return '0';
    try {
      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error getting balance:', err);
      return '0';
    }
  }, [provider, account]);

  // isMetaMaskInstalled - para compatibilidad (ahora soportamos multiwallet)
  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);

  const value = useMemo(() => ({
    // Estado
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    isConnected,
    isCorrectNetwork,
    isMetaMaskInstalled,

    // Configuracion
    supportedChains: SUPPORTED_CHAINS,
    defaultChainId: DEFAULT_CHAIN_ID,
    currentNetwork: SUPPORTED_CHAINS[chainId] || null,

    // Funciones
    connectWallet,
    disconnectWallet,
    switchNetwork,
    formatAddress,
    getNativeBalance,
    validateNetworkBeforeTransaction
  }), [
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    isConnected,
    isCorrectNetwork,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    formatAddress,
    getNativeBalance,
    validateNetworkBeforeTransaction
  ]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 debe usarse dentro de Web3Provider');
  }
  return context;
}

export default Web3Context;
