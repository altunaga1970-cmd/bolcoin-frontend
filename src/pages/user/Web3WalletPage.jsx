import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet, JackpotBanner } from '../../components/web3';
import '../user/UserPages.css';
import '../../components/web3/Web3.css';

function Web3WalletPage() {
  const { isConnected, account, formatAddress } = useWeb3();
  const {
    getContractBalance,
    getTokenBalance,
    deposit,
    withdraw,
    isLoading
  } = useContract();
  const { error: showError } = useToast();

  const [activeTab, setActiveTab] = useState('deposit');
  const [contractBalance, setContractBalance] = useState('0');
  const [walletBalance, setWalletBalance] = useState('0');
  const [amount, setAmount] = useState('');
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

  // Manejar deposito
  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showError('Ingresa un monto valido');
      return;
    }
    if (parseFloat(amount) > parseFloat(walletBalance)) {
      showError('Balance insuficiente en wallet');
      return;
    }

    const success = await deposit(amount);
    if (success) {
      setAmount('');
      loadBalances();
    }
  };

  // Manejar retiro
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showError('Ingresa un monto valido');
      return;
    }
    if (parseFloat(amount) > parseFloat(contractBalance)) {
      showError('Balance insuficiente en contrato');
      return;
    }

    const success = await withdraw(amount);
    if (success) {
      setAmount('');
      loadBalances();
    }
  };

  // Establecer monto maximo
  const setMaxAmount = () => {
    if (activeTab === 'deposit') {
      setAmount(walletBalance);
    } else {
      setAmount(contractBalance);
    }
  };

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        <JackpotBanner variant="compact" />

        <div className="page-header">
          <h1>Mi Wallet Web3</h1>
          <p className="page-subtitle">Gestiona tu balance en blockchain</p>
        </div>

        {!isConnected ? (
          <div className="web3-wallet-section" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>Conecta tu Wallet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Conecta MetaMask para depositar, apostar y retirar
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <>
            {/* Balances */}
            <div className="web3-wallet-section">
              <div className="balance-display">
                <div className="balance-item">
                  <span className="label">Balance Disponible (Contrato)</span>
                  <span className="amount usdt">
                    {isRefreshing ? <Spinner size="sm" /> : `$${parseFloat(contractBalance).toFixed(2)} USDT`}
                  </span>
                </div>
                <div className="balance-item">
                  <span className="label">Balance en Wallet</span>
                  <span className="amount wallet">
                    {isRefreshing ? <Spinner size="sm" /> : `$${parseFloat(walletBalance).toFixed(2)} USDT`}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={loadBalances} disabled={isRefreshing}>
                Actualizar Balances
              </Button>
            </div>

            {/* Tabs */}
            <div className="wallet-tabs">
              <button
                className={`wallet-tab ${activeTab === 'deposit' ? 'active' : ''}`}
                onClick={() => { setActiveTab('deposit'); setAmount(''); }}
              >
                Depositar
              </button>
              <button
                className={`wallet-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
                onClick={() => { setActiveTab('withdraw'); setAmount(''); }}
              >
                Retirar
              </button>
            </div>

            {/* Formulario */}
            <div className="web3-wallet-section">
              <h3>{activeTab === 'deposit' ? 'Depositar USDT' : 'Retirar USDT'}</h3>

              <form className="web3-form" onSubmit={activeTab === 'deposit' ? handleDeposit : handleWithdraw}>
                <div className="input-group">
                  <label>
                    {activeTab === 'deposit'
                      ? `Monto a depositar (Max: $${parseFloat(walletBalance).toFixed(2)})`
                      : `Monto a retirar (Max: $${parseFloat(contractBalance).toFixed(2)})`
                    }
                  </label>
                  <div className="input-with-max">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isLoading}
                    />
                    <button type="button" className="max-btn" onClick={setMaxAmount}>
                      MAX
                    </button>
                  </div>
                </div>

                <Button type="submit" loading={isLoading} fullWidth>
                  {activeTab === 'deposit' ? 'Depositar' : 'Retirar'}
                </Button>
              </form>

              {activeTab === 'deposit' && (
                <div className="info-box" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,215,0,0.1)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Al depositar, tus USDT se transfieren al smart contract de La Bolita.
                    Podras usarlos para realizar apuestas y retirarlos cuando quieras.
                  </p>
                </div>
              )}

              {activeTab === 'withdraw' && (
                <div className="info-box" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,215,0,0.1)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Al retirar, tus USDT se transfieren del contrato a tu wallet.
                    Retiro directo, sin aprobaciones ni esperas.
                  </p>
                </div>
              )}
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
