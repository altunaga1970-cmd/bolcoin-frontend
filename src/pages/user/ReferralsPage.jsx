import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet, JackpotBanner } from '../../components/web3';
import './UserPages.css';
import './ReferralsPage.css';

function ReferralsPage() {
  const { t } = useTranslation('games');
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
            <h3>{t('common:common.connect_wallet')}</h3>
            <p>{t('referrals.connect_prompt')}</p>
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
        <h1 className="page-title">{t('referrals.title')}</h1>

        {loading ? (
          <div className="loading-state">
            <Spinner size="lg" />
            <p>{t('referrals.loading')}</p>
          </div>
        ) : (
          <>
            {/* Banner de bienvenida */}
            {config?.welcomeEnabled && (
              <div className="welcome-banner">
                <div className="banner-icon">🎁</div>
                <div className="banner-content">
                  <h3>{t('referrals.welcome_banner')}</h3>
                  <p dangerouslySetInnerHTML={{ __html: t('referrals.welcome_desc', { amount: config.welcomeBonus }) }} />
                </div>
              </div>
            )}

            {/* Link de referido */}
            <div className="referral-card">
              <h3>{t('referrals.your_link')}</h3>
              <p
                className="referral-description"
                dangerouslySetInnerHTML={{ __html: t('referrals.link_desc', { percent: stats?.referralBonusRate || config?.bonusPercent || 5 }) }}
              />

              <div className="referral-link-box">
                <code className="referral-link">
                  {window.location.origin}/referrals?ref={formatAddress(account)}
                </code>
                <Button onClick={copyReferralLink} variant="primary" size="sm">
                  {copied ? t('referrals.copied') : t('referrals.copy')}
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
                <div className="stat-label">{t('referrals.referrals_count')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">${stats?.totalEarnings || '0.00'}</div>
                <div className="stat-label">{t('referrals.total_earnings')}</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-value">${stats?.pendingEarnings || '0.00'}</div>
                <div className="stat-label">{t('referrals.pending_claim')}</div>
                {parseFloat(stats?.pendingEarnings || 0) > 0 && (
                  <Button
                    onClick={handleClaimEarnings}
                    size="sm"
                    disabled={isLoading}
                    className="claim-btn"
                  >
                    {isLoading ? t('referrals.processing') : t('referrals.claim')}
                  </Button>
                )}
              </div>
            </div>

            {/* Registrar referidor si no tiene */}
            {!myReferrer && (
              <div className="referral-card register-section">
                <h3>{t('referrals.have_code')}</h3>
                <p>{t('referrals.enter_address')}</p>

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
                    {isLoading ? t('referrals.registering') : t('referrals.register')}
                  </Button>
                </div>
              </div>
            )}

            {/* Mi referidor */}
            {myReferrer && (
              <div className="referral-card my-referrer">
                <h3>{t('referrals.your_referrer')}</h3>
                <p>{t('referrals.referred_by')} <code>{formatAddress(myReferrer)}</code></p>
              </div>
            )}

            {/* Lista de referidos */}
            {referredList.length > 0 && (
              <div className="referral-card">
                <h3>{t('referrals.your_referrals', { count: referredList.length })}</h3>
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
              <h3>{t('referrals.how_it_works_title')}</h3>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h4>{t('referrals.step1_title')}</h4>
                  <p>{t('referrals.step1_desc')}</p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h4>{t('referrals.step2_title')}</h4>
                  <p>{t('referrals.step2_desc')}</p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h4>{t('referrals.step3_title')}</h4>
                  <p>{t('referrals.step3_desc', { percent: config?.bonusPercent || 5 })}</p>
                </div>
                <div className="step-card">
                  <div className="step-number">4</div>
                  <h4>{t('referrals.step4_title')}</h4>
                  <p>{t('referrals.step4_desc')}</p>
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
