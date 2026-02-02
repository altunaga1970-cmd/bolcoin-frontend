import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { polygon, polygonAmoy, hardhat, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

// Chain ID por defecto (debe coincidir con REACT_APP_CHAIN_ID)
const DEFAULT_CHAIN_ID = parseInt(process.env.REACT_APP_CHAIN_ID || '80002');

// Hardhat local chain personalizado
const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
};

// Determinar chains soportados segun ambiente
const getSupportedChains = () => {
  const chains = [];

  // Siempre incluir Polygon mainnet
  chains.push(polygon);

  // Incluir testnets y localhost en desarrollo
  if (process.env.NODE_ENV === 'development' || DEFAULT_CHAIN_ID === 31337) {
    chains.push(localhost);
    chains.push(polygonAmoy);
    chains.push(sepolia);
  } else if (DEFAULT_CHAIN_ID === 80002) {
    // Si estamos en Amoy testnet
    chains.push(polygonAmoy);
  }

  // Reordenar para que el default chain sea el primero
  return chains.sort((a, b) => {
    if (a.id === DEFAULT_CHAIN_ID) return -1;
    if (b.id === DEFAULT_CHAIN_ID) return 1;
    return 0;
  });
};

// WalletConnect Project ID - obtener de https://cloud.walletconnect.com/
// IMPORTANTE: Reemplaza con tu propio Project ID en produccion
const WALLETCONNECT_PROJECT_ID = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Configuracion de wagmi con RainbowKit
export const config = getDefaultConfig({
  appName: 'La Bolita',
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: getSupportedChains(),
  transports: {
    [polygon.id]: http('https://polygon-bor-rpc.publicnode.com'),
    [polygonAmoy.id]: http('https://polygon-amoy-bor-rpc.publicnode.com'),
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
  ssr: false,
});

// Exportar constantes utiles
export const SUPPORTED_CHAIN_IDS = getSupportedChains().map(c => c.id);
export const DEFAULT_CHAIN = getSupportedChains()[0];
export { DEFAULT_CHAIN_ID };
