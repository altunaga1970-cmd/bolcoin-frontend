import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet, JackpotBanner } from '../../components/web3';
import '../user/UserPages.css';
import '../../components/web3/Web3.css';

function Web3WalletPage() {
  const { isConnected, account, formatAddress } = useWeb3();
  const {
    getContractBalance,
    getTokenBalance
  } = useContract();

  const [contractBalance, setContractBalance] = useState('0');
  const [walletBalance, setWalletBalance] = useState('0');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cargar balances
  const loadBalances = useCallback(async () => {
    if (!isConnected) return;
    setIsRefreshing(true);
    try {
      const [contract, wallet] = await Promise.all([
        getContractBalance(),
        getTokenBalance()
      ]);
      setContractBalance(contract);
      setWalletBalance(wallet);
    } catch (err) {
      console.error('Error loading balances:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [isConnected, getContractBalance, getTokenBalance]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        <JackpotBanner variant="compact" />

        <div className="page-header">
          <h1>Mi Wallet</h1>
          <p className="page-subtitle">Saldo disponible en tu wallet</p>
        </div>

        {!isConnected ? (
          <div className="web3-wallet-section" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>Conecta tu Wallet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Conecta MetaMask para apostar directamente desde tu wallet
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <>
            {/* Balances */}
            <div className="web3-wallet-section">
              <div className="balance-display">
                <div className="balance-item">
                  <span className="label">Liquidez del pool (contrato)</span>
                  <span className="amount usdt">
                    {isRefreshing ? <Spinner size="sm" /> : `$${parseFloat(contractBalance).toFixed(2)} USDT`}
                  </span>
                </div>
                <div className="balance-item">
                  <span className="label">USDT en tu wallet</span>
                  <span className="amount wallet">
                    {isRefreshing ? <Spinner size="sm" /> : `$${parseFloat(walletBalance).toFixed(2)} USDT`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={loadBalances} disabled={isRefreshing}>
                Actualizar Balances
              </Button>
            </div>

            {/* Info non-custodial */}
            <div className="web3-wallet-section">
              <div className="info-box" style={{ padding: '1rem', background: 'rgba(255,215,0,0.1)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  Tu saldo se usa directamente desde tu wallet; ya no existe recarga manual de balance.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                  Necesitas USDT en Polygon y POL para gas.
                </p>
              </div>
            </div>

            {/* Info de cuenta */}
            <div className="web3-wallet-section">
              <h3>Tu Cuenta</h3>
              <div className="wallet-details">
                <div className="wallet-row">
                  <span className="label">Direccion:</span>
                  <span className="value" style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>
                    {formatAddress(account)}
                  </span>
                </div>
                <div className="wallet-row">
                  <span className="label">Red:</span>
                  <span className="value">Polygon</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Web3WalletPage;
