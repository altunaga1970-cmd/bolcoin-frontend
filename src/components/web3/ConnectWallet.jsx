import React, { useState, useCallback } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../common';
import './Web3.css';

// Polygonscan URL based on network
const getExplorerUrl = (chainId) => {
  const explorers = {
    137: 'https://polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    31337: 'http://localhost:8545' // Local hardhat
  };
  return explorers[chainId] || 'https://polygonscan.com';
};

function ConnectWallet({ variant = 'default', showBalance = false, showExplorerLink = true }) {
  const {
    account,
    isConnected,
    isConnecting,
    isCorrectNetwork,
    currentNetwork,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    formatAddress,
    getNativeBalance,
    error: web3Error
  } = useWeb3();

  const [balance, setBalance] = useState('0');
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Load balance
  React.useEffect(() => {
    if (isConnected && showBalance) {
      getNativeBalance()
        .then(setBalance)
        .catch(err => console.error('Error loading balance:', err));
    }
  }, [isConnected, showBalance, getNativeBalance]);

  // Copy address to clipboard
  const copyAddress = useCallback(async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying address:', err);
    }
  }, [account]);

  // Agregar/Cambiar a red Hardhat Local
  const addHardhatNetwork = useCallback(async () => {
    if (!window.ethereum) {
      setLocalError('MetaMask no detectado');
      return;
    }

    try {
      // Primero intentar cambiar a red existente
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // 31337 en hex
      });
      console.log('Switched to existing Hardhat network');
      setLocalError(null);
    } catch (switchError) {
      console.log('Switch error:', switchError.code, switchError.message);

      // Si no existe, agregarla
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69', // 31337 en hex
              chainName: 'Hardhat Local',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:8545'],
              blockExplorerUrls: []
            }]
          });

          // Ahora cambiar a ella
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }],
          });

          setLocalError(null);
        } catch (addError) {
          console.error('Error adding Hardhat network:', addError);
          setLocalError('Error configurando red Hardhat: ' + addError.message);
        }
      } else {
        setLocalError('Error cambiando a red Hardhat: ' + switchError.message);
      }
    }
  }, []);

  // Handle connect with error handling
  const handleConnect = useCallback(async () => {
    setLocalError(null);
    try {
      await connectWallet();
    } catch (err) {
      setLocalError(err.message || 'Failed to connect wallet');
    }
  }, [connectWallet]);

  // Handle network switch with error handling
  const handleSwitchNetwork = useCallback(async () => {
    setLocalError(null);
    try {
      await switchNetwork();
    } catch (err) {
      setLocalError(err.message || 'Failed to switch network');
    }
  }, [switchNetwork]);

  // Get explorer URL for address
  const explorerUrl = `${getExplorerUrl(chainId)}/address/${account}`;

  // Display error
  const displayError = localError || web3Error;

  // Not connected
  if (!isConnected) {
    return (
      <div className="connect-wallet-container">
        <Button
          onClick={handleConnect}
          loading={isConnecting}
          variant={variant === 'header' ? 'secondary' : 'primary'}
          size={variant === 'header' ? 'sm' : 'md'}
          className="connect-wallet-btn"
          aria-label="Connect cryptocurrency wallet"
        >
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </Button>

        {displayError && variant !== 'header' && (
          <div className="wallet-error" role="alert">
            <span className="error-icon">!</span>
            <span className="error-message">{displayError}</span>
            <button
              className="error-dismiss"
              onClick={() => setLocalError(null)}
              aria-label="Dismiss error"
            >
              x
            </button>
          </div>
        )}

        {variant !== 'header' && (
          <>
            <p className="wallet-help-text">
              Conecta tu wallet para apostar en La Bolita.
            </p>

            {/* Solo mostrar botón Hardhat si hay wallet injected (MetaMask) */}
            {typeof window !== 'undefined' && window.ethereum && (
              <Button
                onClick={addHardhatNetwork}
                variant="outline"
                size="sm"
                className="add-network-btn"
              >
                🔧 Agregar Red Hardhat Local
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  // Wrong network
  if (!isCorrectNetwork) {
    return (
      <div className="connect-wallet-container wrong-network">
        <div className="network-warning" role="alert">
          <span className="warning-icon">!</span>
          <span>Red incorrecta: {currentNetwork?.name || 'Desconocida'}</span>
        </div>
        <div className="network-buttons">
          <Button
            onClick={handleSwitchNetwork}
            variant="danger"
            size={variant === 'header' ? 'sm' : 'md'}
            className="switch-network-btn"
            aria-label="Switch to Polygon network"
          >
            Cambiar a Polygon
          </Button>

          {/* Solo mostrar botón Hardhat si hay wallet injected (MetaMask) */}
          {typeof window !== 'undefined' && window.ethereum && (
            <Button
              onClick={addHardhatNetwork}
              variant="outline"
              size={variant === 'header' ? 'sm' : 'md'}
              className="add-hardhat-btn"
            >
              🔧 Agregar Hardhat Local
            </Button>
          )}
        </div>
        {displayError && (
          <div className="wallet-error" role="alert">
            <span className="error-message">{displayError}</span>
          </div>
        )}
      </div>
    );
  }

  // Connected - compact header version
  if (variant === 'header') {
    return (
      <div className="wallet-connected-header">
        {showBalance && (
          <span className="wallet-balance" title="Balance MATIC">
            {parseFloat(balance).toFixed(4)} MATIC
          </span>
        )}
        <div className="wallet-info-header">
          <span className="wallet-network-badge" title={`Connected to ${currentNetwork?.name}`}>
            <span className="network-dot active"></span>
            {currentNetwork?.name}
          </span>
          <button
            className="wallet-address-btn"
            onClick={copyAddress}
            title={copied ? 'Copiado!' : 'Click para copiar direccion'}
            aria-label={`Wallet address: ${account}. Click to copy.`}
          >
            {formatAddress(account)}
            {copied && <span className="copied-badge">Copiado</span>}
          </button>
          {showExplorerLink && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
              title="Ver en Polygonscan"
              aria-label="View address on Polygonscan"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
          <button
            className="disconnect-btn-header"
            onClick={disconnectWallet}
            title="Desconectar wallet"
            aria-label="Disconnect wallet"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Connected - full version
  return (
    <div className="wallet-connected" role="region" aria-label="Wallet information">
      <div className="wallet-status">
        <span className="status-dot connected" aria-hidden="true"></span>
        <span className="status-text">Conectado</span>
      </div>

      <div className="wallet-details">
        <div className="wallet-row">
          <span className="label">Red:</span>
          <span className="value network-value">
            <span className="network-dot active" aria-hidden="true"></span>
            {currentNetwork?.name}
          </span>
        </div>
        <div className="wallet-row">
          <span className="label">Direccion:</span>
          <div className="address-container">
            <button
              className="address-value"
              onClick={copyAddress}
              title={copied ? 'Copiado!' : 'Click para copiar'}
              aria-label={`Address: ${account}. Click to copy.`}
            >
              {formatAddress(account)}
              {copied && <span className="copied-indicator">Copiado!</span>}
            </button>
            {showExplorerLink && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="explorer-link-full"
                title="Ver en Polygonscan"
                aria-label="View on Polygonscan"
              >
                Ver en Explorer
              </a>
            )}
          </div>
        </div>
        {showBalance && (
          <div className="wallet-row">
            <span className="label">Balance:</span>
            <span className="value balance-value">{parseFloat(balance).toFixed(4)} MATIC</span>
          </div>
        )}
      </div>

      <div className="wallet-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="disconnect-btn"
          aria-label="Disconnect wallet"
        >
          Desconectar
        </Button>
      </div>

      {displayError && (
        <div className="wallet-error" role="alert">
          <span className="error-message">{displayError}</span>
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;
