import React, { useState, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../common';
import './Web3.css';

// Polygonscan URL based on network
const getExplorerUrl = (chainId) => {
  const explorers = {
    137: 'https://polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    31337: 'http://localhost:8545'
  };
  return explorers[chainId] || 'https://polygonscan.com';
};

function ConnectWallet({ variant = 'default', showBalance = false, showExplorerLink = true }) {
  const {
    account,
    isConnected,
    isCorrectNetwork,
    currentNetwork,
    chainId,
    formatAddress,
    getNativeBalance,
  } = useWeb3();

  const [balance, setBalance] = useState('0');
  const [copied, setCopied] = useState(false);

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

  // Get explorer URL for address
  const explorerUrl = `${getExplorerUrl(chainId)}/address/${account}`;

  // Variante header - usa ConnectButton.Custom para control total
  if (variant === 'header') {
    return (
      <ConnectButton.Custom>
        {({
          account: rkAccount,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && rkAccount && chain;

          return (
            <div
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <Button
                      onClick={openConnectModal}
                      variant="secondary"
                      size="sm"
                      className="connect-wallet-btn"
                    >
                      Conectar Wallet
                    </Button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <Button
                      onClick={openChainModal}
                      variant="danger"
                      size="sm"
                      className="switch-network-btn"
                    >
                      Red incorrecta
                    </Button>
                  );
                }

                return (
                  <div className="wallet-connected-header">
                    {showBalance && rkAccount.balanceFormatted && (
                      <span className="wallet-balance" title="Balance">
                        {rkAccount.balanceFormatted}
                      </span>
                    )}
                    <div className="wallet-info-header">
                      <button
                        className="wallet-network-badge"
                        onClick={openChainModal}
                        title={`Connected to ${chain.name}`}
                      >
                        <span className="network-dot active"></span>
                        {chain.name}
                      </button>
                      <button
                        className="wallet-address-btn"
                        onClick={copyAddress}
                        title={copied ? 'Copiado!' : 'Click para copiar direccion'}
                      >
                        {rkAccount.displayName}
                        {copied && <span className="copied-badge">Copiado</span>}
                      </button>
                      {showExplorerLink && (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="explorer-link"
                          title="Ver en Explorer"
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
                        onClick={openAccountModal}
                        title="Opciones de cuenta"
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
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    );
  }

  // Variante default - usa ConnectButton.Custom para mantener el estilo existente
  return (
    <ConnectButton.Custom>
      {({
        account: rkAccount,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && rkAccount && chain;

        return (
          <div
            className="connect-wallet-container"
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <>
                    <Button
                      onClick={openConnectModal}
                      variant="primary"
                      size="md"
                      className="connect-wallet-btn"
                    >
                      Conectar Wallet
                    </Button>
                    <p className="wallet-help-text">
                      Conecta tu wallet para apostar en La Bolita.
                      <br />
                      <small>Soportamos MetaMask, WalletConnect, Coinbase y mas.</small>
                    </p>
                  </>
                );
              }

              if (chain.unsupported) {
                return (
                  <div className="wrong-network">
                    <div className="network-warning" role="alert">
                      <span className="warning-icon">!</span>
                      <span>Red incorrecta: {chain.name || 'Desconocida'}</span>
                    </div>
                    <Button
                      onClick={openChainModal}
                      variant="danger"
                      size="md"
                      className="switch-network-btn"
                    >
                      Cambiar Red
                    </Button>
                  </div>
                );
              }

              // Connected and correct network
              return (
                <div className="wallet-connected" role="region" aria-label="Wallet information">
                  <div className="wallet-status">
                    <span className="status-dot connected"></span>
                    <span className="status-text">Conectado</span>
                  </div>

                  <div className="wallet-details">
                    <div className="wallet-row">
                      <span className="label">Red:</span>
                      <button
                        className="value network-value"
                        onClick={openChainModal}
                        style={{ cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
                      >
                        <span className="network-dot active"></span>
                        {chain.name}
                      </button>
                    </div>
                    <div className="wallet-row">
                      <span className="label">Direccion:</span>
                      <div className="address-container">
                        <button
                          className="address-value"
                          onClick={copyAddress}
                          title={copied ? 'Copiado!' : 'Click para copiar'}
                        >
                          {rkAccount.displayName}
                          {copied && <span className="copied-indicator">Copiado!</span>}
                        </button>
                        {showExplorerLink && (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="explorer-link-full"
                            title="Ver en Explorer"
                          >
                            Ver en Explorer
                          </a>
                        )}
                      </div>
                    </div>
                    {showBalance && rkAccount.balanceFormatted && (
                      <div className="wallet-row">
                        <span className="label">Balance:</span>
                        <span className="value balance-value">{rkAccount.balanceFormatted}</span>
                      </div>
                    )}
                  </div>

                  <div className="wallet-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openAccountModal}
                      className="disconnect-btn"
                    >
                      Desconectar
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}

export default ConnectWallet;
