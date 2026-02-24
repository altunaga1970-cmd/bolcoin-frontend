import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../components/layout/Layout.css';

function HowItWorksPage() {
  const { t } = useTranslation('common');

  return (
    <div className="info-page">
      <h1>{t('how_it_works.title')}</h1>
      <p className="page-subtitle">
        {t('how_it_works.subtitle')}
      </p>

      <h2>{t('how_it_works.getting_started')}</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>{t('how_it_works.step1_title')}</h3>
          <p>{t('how_it_works.step1_desc')}</p>
        </div>
        <div className="info-card">
          <h3>{t('how_it_works.step2_title')}</h3>
          <p>{t('how_it_works.step2_desc')}</p>
        </div>
        <div className="info-card">
          <h3>{t('how_it_works.step3_title')}</h3>
          <p>{t('how_it_works.step3_desc')}</p>
        </div>
        <div className="info-card">
          <h3>{t('how_it_works.step4_title')}</h3>
          <p>{t('how_it_works.step4_desc')}</p>
        </div>
      </div>

      <h2>{t('how_it_works.our_games')}</h2>

      <h3>{t('how_it_works.bolita_title')}</h3>
      <p>
        {t('how_it_works.bolita_desc')}
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>{t('how_it_works.table_game')}</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#FFD700' }}>{t('how_it_works.table_digits')}</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#FFD700' }}>{t('how_it_works.table_multiplier')}</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>{t('how_it_works.table_max_bet')}</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem' }}>Fijos</td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}>2 (00-99)</td>
            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>80x</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1,000 USDT</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem' }}>Centenas</td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}>3 (000-999)</td>
            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>500x</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1,000 USDT</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}>Parles</td>
            <td style={{ padding: '0.75rem', textAlign: 'center' }}>4 (0000-9999)</td>
            <td style={{ padding: '0.75rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>900x</td>
            <td style={{ padding: '0.75rem', textAlign: 'right' }}>1,000 USDT</td>
          </tr>
        </tbody>
      </table>
      <p><Link to="/web3" style={{ color: '#FFD700' }}>{t('how_it_works.play_bolita')}</Link></p>

      <h3>{t('how_it_works.fortuna_title')}</h3>
      <p>
        {t('how_it_works.fortuna_desc')}
      </p>
      <ul>
        <li>{t('how_it_works.fortuna_price')}</li>
        <li>{t('how_it_works.fortuna_tickets')}</li>
        <li>{t('how_it_works.fortuna_categories')}</li>
        <li>{t('how_it_works.fortuna_jackpot')}</li>
      </ul>
      <p><Link to="/lottery" style={{ color: '#FFD700' }}>{t('how_it_works.play_fortuna')}</Link></p>

      <h2>{t('how_it_works.how_results')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('how_it_works.results_desc') }} />
      <ul>
        <li>{t('how_it_works.results_random')}</li>
        <li>{t('how_it_works.results_no_manipulate')}</li>
        <li>{t('how_it_works.results_verify')}</li>
      </ul>
      <p><Link to="/fairness" style={{ color: '#FFD700' }}>{t('how_it_works.learn_fairness')}</Link></p>

      <h2>{t('how_it_works.claiming_prizes')}</h2>
      <p>
        {t('how_it_works.claiming_desc')}
      </p>

      <h2>{t('how_it_works.why_polygon')}</h2>
      <p>{t('how_it_works.polygon_intro')}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t('how_it_works.polygon_low_fees') }} />
        <li dangerouslySetInnerHTML={{ __html: t('how_it_works.polygon_fast') }} />
        <li dangerouslySetInnerHTML={{ __html: t('how_it_works.polygon_security') }} />
        <li dangerouslySetInnerHTML={{ __html: t('how_it_works.polygon_support') }} />
      </ul>

      <h2>{t('how_it_works.important_notes')}</h2>
      <div className="warning-box">
        <p dangerouslySetInnerHTML={{ __html: t('how_it_works.non_custodial_note') }} />
      </div>

      <div className="info-box">
        <p dangerouslySetInnerHTML={{ __html: t('how_it_works.gas_note') }} />
      </div>

      <h2>{t('how_it_works.need_help')}</h2>
      <ul>
        <li><Link to="/faq" style={{ color: '#FFD700' }}>{t('how_it_works.faq_link')}</Link></li>
        <li><Link to="/legal/rules" style={{ color: '#FFD700' }}>{t('how_it_works.rules_link')}</Link></li>
        <li><Link to="/contact" style={{ color: '#FFD700' }}>{t('how_it_works.contact_link')}</Link></li>
      </ul>
    </div>
  );
}

export default HowItWorksPage;
