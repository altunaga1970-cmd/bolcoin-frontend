import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useContract } from '../../hooks/useContract';
import '../../components/layout/Layout.css';

// Contract addresses - should match .env
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...';
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const VRF_COORDINATOR = '0xAE975071Be8F8eE67addBC1A82488F1C24858067'; // Polygon Mainnet

function TransparencyPage() {
  const { t } = useTranslation('common');
  const { getJackpot } = useContract();
  const [jackpot, setJackpot] = useState('0');

  useEffect(() => {
    const loadJackpot = async () => {
      try {
        const jp = await getJackpot();
        setJackpot(jp || '0');
      } catch (err) {
        console.error('Error loading jackpot:', err);
      }
    };
    loadJackpot();
  }, [getJackpot]);

  return (
    <div className="info-page">
      <h1>{t('transparency.title')}</h1>
      <p className="page-subtitle">
        {t('transparency.subtitle')}
      </p>

      <h2>{t('transparency.contracts')}</h2>
      <p>{t('transparency.contracts_desc')}</p>

      <div className="contract-address">
        <div>
          <span className="label">{t('transparency.main_contract')}</span>
          <span className="address">{CONTRACT_ADDRESS}</span>
        </div>
        <a href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noopener noreferrer">
          {t('transparency.view_polygonscan')}
        </a>
      </div>

      <div className="contract-address">
        <div>
          <span className="label">{t('transparency.usdt_token')}</span>
          <span className="address">{TOKEN_ADDRESS}</span>
        </div>
        <a href={`https://polygonscan.com/token/${TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer">
          {t('transparency.view_polygonscan')}
        </a>
      </div>

      <div className="contract-address">
        <div>
          <span className="label">{t('transparency.vrf_coordinator')}</span>
          <span className="address">{VRF_COORDINATOR}</span>
        </div>
        <a href={`https://polygonscan.com/address/${VRF_COORDINATOR}`} target="_blank" rel="noopener noreferrer">
          {t('transparency.view_polygonscan')}
        </a>
      </div>

      <h2>{t('transparency.parameters')}</h2>

      <div className="info-cards">
        <div className="info-card">
          <h3>{t('transparency.current_jackpot')}</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${parseFloat(jackpot).toLocaleString()} USDT
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{t('transparency.fortuna_jackpot')}</p>
        </div>

        <div className="info-card">
          <h3>{t('transparency.jackpot_cap')}</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            $1,000,000 USDT
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{t('transparency.jackpot_cap_desc')}</p>
        </div>

        <div className="info-card">
          <h3>{t('transparency.operations_fee')}</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            15%
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{t('transparency.operations_fee_desc')}</p>
        </div>

        <div className="info-card">
          <h3>{t('transparency.jackpot_contribution')}</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            40%
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{t('transparency.jackpot_contribution_desc')}</p>
        </div>
      </div>

      <h2>{t('transparency.multipliers')}</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.game_type')}</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.digits')}</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.multiplier')}</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.odds')}</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Fijos</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>2</td>
            <td style={{ padding: '0.75rem', color: '#FFD700', textAlign: 'right', fontWeight: 'bold' }}>80x</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 100</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Centenas</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3</td>
            <td style={{ padding: '0.75rem', color: '#FFD700', textAlign: 'right', fontWeight: 'bold' }}>500x</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 1,000</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Parles</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4</td>
            <td style={{ padding: '0.75rem', color: '#FFD700', textAlign: 'right', fontWeight: 'bold' }}>900x</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 10,000</td>
          </tr>
        </tbody>
      </table>

      <h2>{t('transparency.prize_distribution')}</h2>
      <p>{t('transparency.distribution_desc')}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t('transparency.dist_jackpot') }} />
        <li dangerouslySetInnerHTML={{ __html: t('transparency.dist_prize_pool') }} />
        <li dangerouslySetInnerHTML={{ __html: t('transparency.dist_operations') }} />
        <li dangerouslySetInnerHTML={{ __html: t('transparency.dist_reserve') }} />
      </ul>
      <p>
        {t('transparency.cap_overflow')}
      </p>

      <h3>{t('transparency.prize_categories')}</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.category')}</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.matches')}</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.min_prize')}</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>{t('transparency.odds')}</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,215,0,0.1)' }}>
            <td style={{ padding: '0.75rem', color: '#FFD700', fontWeight: 'bold' }}>1 - Jackpot</td>
            <td style={{ padding: '0.75rem', color: '#FFD700' }}>6 + Clave</td>
            <td style={{ padding: '0.75rem', color: '#FFD700', textAlign: 'right', fontWeight: 'bold' }}>JACKPOT</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 139M</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>2</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>6 numeros</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$100,000</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 15M</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>5 + Clave</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$10,000</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 542K</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>5 numeros</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$1,000</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 60K</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>5</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4 + Clave</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$100</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 10K</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>6</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4 numeros</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$50</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 1.1K</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>7</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3 + Clave</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$10</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 567</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>8</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3 numeros</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$5</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>1 in 63</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
        {t('transparency.min_prize_note')}
      </p>

      <h2>{t('transparency.referral_program')}</h2>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t('transparency.referral_bonus') }} />
        <li>{t('transparency.referral_auto')}</li>
        <li>{t('transparency.referral_claim')}</li>
      </ul>

      <h2>{t('transparency.audit')}</h2>
      <p>{t('transparency.audit_desc')}</p>
      <ul>
        <li>{t('transparency.audit1')}</li>
        <li>{t('transparency.audit2')}</li>
        <li>{t('transparency.audit3')}</li>
        <li>{t('transparency.audit4')}</li>
        <li>{t('transparency.audit5')}</li>
      </ul>

      <div className="info-box">
        <p>
          {t('transparency.verify_note')}{' '}
          <Link to="/fairness">{t('transparency.provably_fair_link')}</Link>
        </p>
      </div>
    </div>
  );
}

export default TransparencyPage;
