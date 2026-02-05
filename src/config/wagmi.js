import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy, mainnet, sepolia, localhost } from 'wagmi/chains';

// Chain ID por defecto desde variables de entorno
const DEFAULT_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '137');

// Configuración de Hardhat local personalizada
const hardhatLocal = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

// Mapeo de chainId a chain object
const chainMap = {
  1: mainnet,
  137: polygon,
  80001: polygonAmoy, // Mumbai deprecated, usando Amoy
  80002: polygonAmoy,
  11155111: sepolia,
  31337: hardhatLocal,
};

// Obtener la chain por defecto
const defaultChain = chainMap[DEFAULT_CHAIN_ID] || polygon;

// Configurar chains - poner la default primero
const getChains = () => {
  const chains = [defaultChain];

  // Agregar polygon si no es la default
  if (DEFAULT_CHAIN_ID !== 137) {
    chains.push(polygon);
  }

  // Agregar polygonAmoy si no es la default
  if (DEFAULT_CHAIN_ID !== 80002) {
    chains.push(polygonAmoy);
  }

  // Agregar hardhat local solo en desarrollo
  if (import.meta.env.DEV && DEFAULT_CHAIN_ID !== 31337) {
    chains.push(hardhatLocal);
  }

  return chains;
};

// WalletConnect Project ID - REQUERIDO para WalletConnect v2
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn(
    '[wagmi] VITE_WALLETCONNECT_PROJECT_ID no está configurado. ' +
    'WalletConnect no funcionará. Obtén uno en https://cloud.walletconnect.com/'
  );
}

// Configuración de wagmi con RainbowKit
export const config = getDefaultConfig({
  appName: 'Bolcoin',
  projectId: projectId || 'placeholder-id', // RainbowKit requiere un valor
  chains: getChains(),
  ssr: false, // Deshabilitar SSR para Create React App
});

// Exportar constantes útiles
export const SUPPORTED_CHAIN_IDS = Object.keys(chainMap).map(Number);
export const DEFAULT_CHAIN = defaultChain;
export { DEFAULT_CHAIN_ID };

// Información de redes soportadas (para compatibilidad con código existente)
export const SUPPORTED_CHAINS = {
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
