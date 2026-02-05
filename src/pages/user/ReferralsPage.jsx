import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet, JackpotBanner } from '../../components/web3';
import './UserPages.css';
import './ReferralsPage.css';

function ReferralsPage() {
  const { account, isConnected, connectWallet, formatAddress } = useWeb3();
  const {
    getReferralInfo,
    getReferralStats,
    getReferredUsers,
    getReferralConfig,
    registerReferral,
    claimReferralEarnings,
    isLoading
  } = useContract();

  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [referredList, setReferredList] = useState([]);
  const [myReferrer, setMyReferrer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referrerInput, setReferrerInput] = useState('');

  // Obtener codigo de referido de la URL si existe
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.startsWith('0x')) {
      setReferrerInput(ref);
    }
  }, [searchParams]);

  // Cargar datos
  const loadData = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [statsData, configData, referredData, infoData] = await Promise.all([
        getReferralStats(),
        getReferralConfig(),
        getReferredUsers(),
        getReferralInfo()
      ]);

      setStats(statsData);
      setConfig(configData);
      setReferredList(referredData || []);

      if (infoData && infoData.referrer !== '0x0000000000000000000000000000000000000000') {
        setMyReferrer(infoData.referrer);
      }
    } catch (err) {
      console.error('Error loading referral data:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, getReferralStats, getReferralConfig, getReferredUsers, getReferralInfo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copiar link de referido
  const copyReferralLink = () => {
    const link = `${window.location.origin}/referrals?ref=${account}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Registrar con un referidor
  const handleRegisterReferral = async () => {
    if (!referrerInput || !referrerInput.startsWith('0x')) return;
    const success = await registerReferral(referrerInput);
    if (success) {
      loadData();
    }
  };

  // Reclamar ganancias
  const handleClaimEarnings = async () => {
    const success = await claimReferralEarnings();
    if (success) {
      loadData();
    }
  };

  if (!isConnected) {
    return (
      <div className="user-page">
        <MainNav />
        <main className="user-main">
          <JackpotBanner variant="compact" />
          <div className="connect-prompt">
            <h3>Conecta tu Wallet</h3>
            <p>Necesitas conectar tu wallet para ver tu programa de referidos</p>
            <ConnectWallet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        <JackpotBanner variant="compact" />
        <h1 className="page-title">Programa de Referidos</h1>

        {loading ? (
          <div className="loading-state">
            <Spinner size="lg" />
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* Banner de bienvenida */}
            {config?.welcomeEnabled && (
              <div className="welcome-banner">
                <div className="banner-icon">🎁</div>
                <div className="banner-content">
                  <h3>Bono de Bienvenida</h3>
                  <p>Nuevos usuarios reciben <strong>${config.welcomeBonus} USDT</strong> en su primer deposito</p>
                </div>
              </div>
            )}

            {/* Link de referido */}
            <div className="referral-card">
              <h3>Tu Link de Referido</h3>
              <p className="referral-description">
                Comparte este link y gana <strong>{stats?.referralBonusRate || config?.bonusPercent || 5}%</strong> de cada apuesta que hagan tus referidos
              </p>

              <div className="referral-link-box">
                <code className="referral-link">
                  {window.location.origin}/referrals?ref={formatAddress(account)}
                </code>
                <Button onClick={copyReferralLink} variant="primary" size="sm">
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>

              <div className="share-buttons">
                <a
                  href={`https://twitter.com/intent/tweet?text=Unete%20a%20La%20Bolita%20y%20gana!%20${encodeURIComponent(window.location.origin + '/referrals?ref=' + account)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn twitter"
                >
                  Twitter
                </a>
                <a
                  href={`https://wa.me/?text=Unete%20a%20La%20Bolita%20y%20gana!%20${encodeURIComponent(window.location.origin + '/referrals?ref=' + account)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn whatsapp"
                >
                  WhatsApp
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/referrals?ref=' + account)}&text=Unete%20a%20La%20Bolita%20y%20gana!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn telegram"
                >
                  Telegram
                </a>
              </div>
            </div>

            {/* Estadisticas */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats?.totalReferred || 0}</div>
                <div className="stat-label">Referidos</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${stats?.totalEarnings || '0.00'}</div>
                <div className="stat-label">Ganancias Totales</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-value">${stats?.pendingEarnings || '0.00'}</div>
                <div className="stat-label">Pendiente por Cobrar</div>
                {parseFloat(stats?.pendingEarnings || 0) > 0 && (
                  <Button
                    onClick={handleClaimEarnings}
                    size="sm"
                    disabled={isLoading}
                    className="claim-btn"
                  >
                    {isLoading ? 'Procesando...' : 'Reclamar'}
                  </Button>
                )}
              </div>
            </div>

            {/* Registrar referidor si no tiene */}
            {!myReferrer && (
              <div className="referral-card register-section">
                <h3>¿Tienes un codigo de referido?</h3>
                <p>Si alguien te invito, ingresa su direccion de wallet para registrarte como su referido</p>

                <div className="register-form">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={referrerInput}
                    onChange={(e) => setReferrerInput(e.target.value)}
                    className="referrer-input"
                  />
                  <Button
                    onClick={handleRegisterReferral}
                    disabled={isLoading || !referrerInput}
                  >
                    {isLoading ? 'Registrando...' : 'Registrar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Mi referidor */}
            {myReferrer && (
              <div className="referral-card my-referrer">
                <h3>Tu Referidor</h3>
                <p>Fuiste referido por: <code>{formatAddress(myReferrer)}</code></p>
              </div>
            )}

            {/* Lista de referidos */}
            {referredList.length > 0 && (
              <div className="referral-card">
                <h3>Tus Referidos ({referredList.length})</h3>
                <div className="referred-list">
                  {referredList.map((address, index) => (
                    <div key={index} className="referred-item">
                      <span className="referred-number">#{index + 1}</span>
                      <code className="referred-address">{formatAddress(address)}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Como funciona */}
            <div className="how-it-works">
              <h3>¿Como Funciona?</h3>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h4>Comparte tu Link</h4>
                  <p>Envia tu link de referido a amigos y conocidos</p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h4>Ellos se Registran</h4>
                  <p>Cuando depositan usando tu link, quedan vinculados a ti</p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h4>Gana Comisiones</h4>
                  <p>Recibe {config?.bonusPercent || 5}% de cada apuesta que hagan</p>
                </div>
                <div className="step-card">
                  <div className="step-number">4</div>
                  <h4>Cobra cuando Quieras</h4>
                  <p>Tus ganancias se acumulan y puedes reclamarlas en cualquier momento</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ReferralsPage;
