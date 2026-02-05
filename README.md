# Bolcoin - Loteria Descentralizada

Plataforma de loteria descentralizada en Polygon con verificacion de resultados via Chainlink VRF.

## Juegos Disponibles

- **La Bolita** - Loteria tradicional cubana (Fijo, Centena, Parle)
- **La Fortuna** - Loteria 5/54 + Clave (Jackpot acumulado)
- **Keno** - Resultado instantaneo (1-10 numeros, 20 sorteados)

## Tecnologias

- React 18
- wagmi + RainbowKit (Multi-wallet: MetaMask, WalletConnect)
- ethers.js v6
- Polygon Network (Amoy Testnet / Mainnet)
- Chainlink VRF v2.5

## Configuracion

### Variables de Entorno

Copia `.env.example` a `.env` y configura:

```env
# API Backend
REACT_APP_API_URL=http://localhost:5000/api

# Red (80002 = Amoy Testnet, 137 = Mainnet)
REACT_APP_CHAIN_ID=80002

# Direcciones de contrato
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_TOKEN_ADDRESS=0x...

# WalletConnect (requerido)
REACT_APP_WALLETCONNECT_PROJECT_ID=tu_project_id
```

### Instalacion

```bash
npm install
npm start
```

### Build de Produccion

```bash
npm run build
```

Los archivos estaticos se generan en `/build`.

## Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub
2. Configura las variables de entorno en el dashboard
3. Deploy automatico con cada push

### GitHub Pages

1. Instala gh-pages: `npm install gh-pages --save-dev`
2. Agrega al package.json:
   ```json
   "homepage": "https://tuusuario.github.io/bolcoin-frontend",
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build"
   }
   ```
3. Ejecuta: `npm run deploy`

### Netlify

1. Conecta tu repositorio
2. Build command: `npm run build`
3. Publish directory: `build`

## Estructura del Proyecto

```
src/
├── api/           # Clientes API (betApi, kenoApi, etc.)
├── components/    # Componentes React
│   ├── common/    # Button, Spinner, etc.
│   ├── layout/    # MainNav, Header, Footer
│   └── web3/      # ConnectWallet, JackpotBanner
├── contexts/      # Contextos (Web3, Balance, Toast)
├── hooks/         # Custom hooks (useContract, useKenoGame)
├── pages/         # Paginas de la app
│   ├── public/    # HomePage, ResultsPage
│   ├── user/      # BettingPage, KenoPage, LotteryPage
│   ├── admin/     # Dashboard, ManageDraws
│   └── legal/     # Terms, Privacy, etc.
├── config/        # Configuracion wagmi
└── styles/        # Estilos globales
```

## Licencia

MIT
