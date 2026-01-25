import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { useToast } from './ToastContext';

const Web3Context = createContext(null);

// Configuracion de redes soportadas
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

// Chain ID por defecto (cambiar segun ambiente)
const DEFAULT_CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID || '80002');

export function Web3Provider({ children }) {
  const { error: showError, success: showSuccess } = useToast();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const isConnected = Boolean(account);

  // REF para saber si el usuario ha conectado explicitamente en esta sesion
  // Esto evita que MetaMask auto-conecte sin permiso del usuario
  const hasUserConnectedRef = useRef(false);

  // Verificar si MetaMask esta instalado
  const isMetaMaskInstalled = typeof window !== 'undefined' && Boolean(window.ethereum);

  // Verificar red correcta
  useEffect(() => {
    setIsCorrectNetwork(chainId === DEFAULT_CHAIN_ID);
  }, [chainId]);

  // Escuchar cambios de cuenta y red - SOLO si el usuario ya conecto
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      // SOLO procesar si el usuario ya conecto explicitamente en esta sesion
      if (!hasUserConnectedRef.current) {
        return; // Ignorar - el usuario no ha conectado aun
      }

      if (accounts.length === 0) {
        // Usuario desconecto desde MetaMask
        setAccount(null);
        setSigner(null);
        hasUserConnectedRef.current = false;
        sessionStorage.removeItem('walletAddress');
      } else {
        // Cambio de cuenta - actualizar
        setAccount(accounts[0]);
        sessionStorage.setItem('walletAddress', accounts[0]);
        console.log(`[Web3Context] Connected wallet: ${accounts[0]}`);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      // Solo actualizar chainId si el usuario esta conectado
      if (hasUserConnectedRef.current) {
        const newChainId = parseInt(chainIdHex, 16);
        setChainId(newChainId);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  // Conectar wallet - SIEMPRE requiere accion explicita del usuario
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      showError('MetaMask no esta instalado. Por favor instalalo para continuar.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      // Solicitar conexion - esto abre MetaMask para autorizacion
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        showError('No se selecciono ninguna cuenta');
        return;
      }

      // Marcar que el usuario conecto explicitamente
      hasUserConnectedRef.current = true;

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      // Guardar dirección de wallet para autenticación API
      sessionStorage.setItem('walletAddress', accounts[0]);
      console.log(`[Web3Context] Initial connection - wallet: ${accounts[0]}`);

      showSuccess('Wallet conectada correctamente');

      // Cambiar a la red correcta según DEFAULT_CHAIN_ID
      try {
        const targetChain = SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
        const chainIdHex = '0x' + DEFAULT_CHAIN_ID.toString(16);
        
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        });
        console.log(`[Web3Context] Switched to ${targetChain.name} network`);
      } catch (switchError) {
        console.log(`[Web3Context] Could not switch to target network:`, switchError.message);

        // Si no existe, intentar agregarla
        if (switchError.code === 4902) { // Chain not added
          try {
            const targetChain = SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
            const chainIdHex = '0x' + DEFAULT_CHAIN_ID.toString(16);
            
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: chainIdHex,
                chainName: targetChain.name,
                nativeCurrency: {
                  name: targetChain.currency,
                  symbol: targetChain.currency,
                  decimals: 18
                },
                rpcUrls: [targetChain.rpcUrl],
                blockExplorerUrls: targetChain.explorer ? [targetChain.explorer] : []
              }]
            });
            console.log(`[Web3Context] ${targetChain.name} network added to MetaMask`);

            // Ahora intentar cambiar a ella
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainIdHex }]
            });
            console.log(`[Web3Context] Switched to newly added ${targetChain.name} network`);
          } catch (addError) {
            console.log(`[Web3Context] Could not add target network:`, addError.message);
          }
        }
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      if (err.code === 4001) {
        showError('Conexion rechazada por el usuario');
      } else {
        showError('Error al conectar wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled, showError, showSuccess]);

  // Desconectar wallet
  const disconnectWallet = useCallback(() => {
    // Marcar que el usuario NO esta conectado
    hasUserConnectedRef.current = false;

    // Limpiar estado local
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);

    // Limpiar sesion admin si existe
    sessionStorage.removeItem('admin_session_token');
    // Limpiar dirección de wallet para autenticación API
    sessionStorage.removeItem('walletAddress');

    showSuccess('Wallet desconectada');
  }, [showSuccess]);

  // Cambiar a la red correcta
  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;

    const targetChain = SUPPORTED_CHAINS[DEFAULT_CHAIN_ID];
    if (!targetChain) {
      showError('Red no soportada');
      return;
    }

    const chainIdHex = '0x' + DEFAULT_CHAIN_ID.toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
    } catch (switchError) {
      // Red no agregada, intentar agregarla
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: targetChain.name,
              nativeCurrency: {
                name: targetChain.currency,
                symbol: targetChain.currency,
                decimals: 18
              },
              rpcUrls: [targetChain.rpcUrl],
              blockExplorerUrls: targetChain.explorer ? [targetChain.explorer] : []
            }]
          });
        } catch (addError) {
          showError('Error al agregar la red');
        }
      } else {
        showError('Error al cambiar de red');
      }
    }
  }, [showError]);

  // Formatear direccion
  const formatAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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

  // Obtener balance nativo (MATIC)
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

  const value = {
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
  };

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
