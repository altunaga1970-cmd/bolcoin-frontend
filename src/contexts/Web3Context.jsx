import React, { createContext, useContext, useCallback, useMemo, useEffect } from 'react';
import { ethers } from 'ethers';
import { useToast } from './ToastContext';

// Wagmi imports
import { WagmiProvider, useAccount, useChainId, useConnect, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configuración de wagmi
import { config, SUPPORTED_CHAINS, DEFAULT_CHAIN_ID } from '../config/wagmi';

// Importar estilos de RainbowKit
import '@rainbow-me/rainbowkit/styles.css';

const Web3Context = createContext(null);

// Cliente de React Query
const queryClient = new QueryClient();

// Hook interno que implementa la lógica de Web3 usando wagmi
function useWeb3Internal() {
  const { error: showError, success: showSuccess } = useToast();

  // Hooks de wagmi
  const { address, isConnected: wagmiIsConnected, isConnecting: wagmiIsConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  // wagmi v2: useWalletClient devuelve un viem WalletClient
  const { data: walletClient } = useWalletClient();

  // Estado derivado
  const account = address || null;
  const isConnected = wagmiIsConnected && Boolean(account);
  const isConnecting = wagmiIsConnecting;
  const isCorrectNetwork = chainId === DEFAULT_CHAIN_ID;

  // Verificar si hay wallet injected (MetaMask, etc.)
  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);

  // Provider y Signer usando ethers.js (para compatibilidad con código existente)
  const getProviderAndSigner = useCallback(async () => {
    if (!isConnected || !walletClient) return { provider: null, signer: null };

    try {
      // walletClient.transport tiene el provider subyacente
      const ethersProvider = new ethers.BrowserProvider(walletClient.transport, chainId);
      const ethersSigner = await ethersProvider.getSigner();
      return { provider: ethersProvider, signer: ethersSigner };
    } catch (err) {
      console.error('[Web3Context] Error getting provider/signer:', err);
    }

    return { provider: null, signer: null };
  }, [isConnected, walletClient, chainId]);

  // Guardar wallet address en localStorage cuando cambie (para API interceptors)
  useEffect(() => {
    if (account) {
      localStorage.setItem('walletAddress', account);
      sessionStorage.setItem('walletAddress', account);
      console.log(`[Web3Context] Connected wallet: ${account}`);
    } else {
      localStorage.removeItem('walletAddress');
      sessionStorage.removeItem('walletAddress');
      localStorage.removeItem('walletSignature');
      localStorage.removeItem('walletMessage');
    }
  }, [account]);

  // Conectar wallet - Abre el modal de RainbowKit
  const connectWallet = useCallback(async () => {
    if (openConnectModal) {
      openConnectModal();
    } else {
      showError('No se pudo abrir el modal de conexión');
    }
  }, [openConnectModal, showError]);

  // Desconectar wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
    sessionStorage.removeItem('admin_session_token');
    sessionStorage.removeItem('walletAddress');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletSignature');
    localStorage.removeItem('walletMessage');
    localStorage.removeItem('walletSignatureAddr');
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

  // Formatear dirección
  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Validar red antes de transacciones
  const validateNetworkBeforeTransaction = useCallback(async () => {
    if (!isConnected) {
      showError('Por favor, conecta tu wallet primero');
      return false;
    }
    if (!isCorrectNetwork) {
      showError('Por favor, cambia a la red correcta antes de continuar');
      await switchNetwork();
      return false;
    }
    return true;
  }, [isConnected, isCorrectNetwork, showError, switchNetwork]);

  // Obtener balance nativo
  const getNativeBalance = useCallback(async () => {
    if (!account) return '0';

    try {
      const { provider } = await getProviderAndSigner();
      if (!provider) return '0';

      const balance = await provider.getBalance(account);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error getting balance:', err);
      return '0';
    }
  }, [account, getProviderAndSigner]);

  // Crear objetos provider y signer que se actualizan dinámicamente
  const [providerState, setProviderState] = React.useState(null);
  const [signerState, setSignerState] = React.useState(null);

  // Actualizar provider/signer cuando cambie la conexión o walletClient
  useEffect(() => {
    if (isConnected && walletClient) {
      getProviderAndSigner().then(({ provider, signer }) => {
        setProviderState(provider);
        setSignerState(signer);
      });
    } else {
      setProviderState(null);
      setSignerState(null);
    }
  }, [isConnected, walletClient, getProviderAndSigner, chainId]);

  // Sign authentication message when signer becomes available
  useEffect(() => {
    if (!signerState || !account) return;
    // Only sign if we don't already have a valid signature for this account
    const existingSig = localStorage.getItem('walletSignature');
    const existingAddr = localStorage.getItem('walletSignatureAddr');
    if (existingSig && existingAddr === account.toLowerCase()) return;

    const signAuth = async () => {
      try {
        const message = `Bolcoin Auth: ${account.toLowerCase()} at ${Math.floor(Date.now() / 86400000)}`;
        const signature = await signerState.signMessage(message);
        localStorage.setItem('walletSignature', signature);
        localStorage.setItem('walletMessage', message);
        localStorage.setItem('walletSignatureAddr', account.toLowerCase());
      } catch (err) {
        // User rejected signature - API calls requiring auth will fail
        console.warn('[Web3Context] Auth signature rejected:', err.message);
      }
    };
    signAuth();
  }, [signerState, account]);

  return {
    // Estado
    provider: providerState,
    signer: signerState,
    account,
    chainId,
    isConnecting,
    isConnected,
    isCorrectNetwork,
    isMetaMaskInstalled,

    // Configuración
    supportedChains: SUPPORTED_CHAINS,
    defaultChainId: DEFAULT_CHAIN_ID,
    currentNetwork: SUPPORTED_CHAINS[chainId] || null,

    // Funciones
    connectWallet,
    disconnectWallet,
    switchNetwork,
    formatAddress,
    getNativeBalance,
    validateNetworkBeforeTransaction,

    // Función auxiliar para obtener provider/signer fresco
    getProviderAndSigner,
  };
}

// Componente interno que provee el contexto
function Web3ContextProvider({ children }) {
  const web3Value = useWeb3Internal();

  return (
    <Web3Context.Provider value={web3Value}>
      {children}
    </Web3Context.Provider>
  );
}

// Provider principal que envuelve todo con wagmi y RainbowKit
export function Web3Provider({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FFD700',
            accentColorForeground: '#0D0D0D',
            borderRadius: 'medium',
            fontStack: 'system',
          })}
          modalSize="compact"
        >
          <Web3ContextProvider>
            {children}
          </Web3ContextProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Hook público - MISMA API que antes
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 debe usarse dentro de Web3Provider');
  }
  return context;
}

export default Web3Context;
