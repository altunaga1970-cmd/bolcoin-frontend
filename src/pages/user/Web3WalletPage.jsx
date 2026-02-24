import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet, JackpotBanner } from '../../components/web3';
import '../user/UserPages.css';
import '../../components/web3/Web3.css';

function Web3WalletPage() {
  const { t } = useTranslation('games');
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
          <h1>{t('wallet_page.title')}</h1>
          <p className="page-subtitle">{t('wallet_page.subtitle')}</p>
        </div>

        {!isConnected ? (
          <div className="web3-wallet-section" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>{t('wallet_page.connect_prompt')}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {t('wallet_page.connect_prompt_desc')}
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <>
            {/* Balances */}
            <div className="web3-wallet-section">
              <div className="balance-display">
                <div className="balance-item">
                  <span className="label">{t('wallet_page.pool_balance')}</span>
                  <span className="amount usdt">
                    {isRefreshing ? <Spinner size="sm" /> : `$${parseFloat(contractBalance).toFixed(2)} USDT`}
                  </span>
                </div>
                <div className="balance-item">
                  <span className="label">{t('wallet_page.wallet_balance')}</span>
                  <span className="amount wallet">
                    {isRefreshing ? <Spinner size="sm" /> : `$${parseFloat(walletBalance).toFixed(2)} USDT`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={loadBalances} disabled={isRefreshing}>
                {t('wallet_page.refresh')}
              </Button>
            </div>

            {/* Info non-custodial */}
            <div className="web3-wallet-section">
              <div className="info-box" style={{ padding: '1rem', background: 'rgba(255,215,0,0.1)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                  {t('wallet_page.non_custodial_info')}
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
                  {t('wallet_page.needs_usdt')}
                </p>
              </div>
            </div>

            {/* Info de cuenta */}
            <div className="web3-wallet-section">
              <h3>{t('wallet_page.your_account')}</h3>
              <div className="wallet-details">
                <div className="wallet-row">
                  <span className="label">{t('wallet_page.address')}</span>
                  <span className="value" style={{ fontFamily: 'monospace', color: 'var(--gold)' }}>
                    {formatAddress(account)}
                  </span>
                </div>
                <div className="wallet-row">
                  <span className="label">{t('wallet_page.network')}</span>
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
