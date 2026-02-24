import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../components/layout/Layout.css';

function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <div className="info-page">
      <h1>{t('contact.title')}</h1>
      <p className="page-subtitle">
        {t('contact.subtitle')}
      </p>

      <h2>{t('contact.community')}</h2>
      <p>{t('contact.community_desc')}</p>

      <div className="info-cards">
        <div className="info-card">
          <h3>{t('contact.telegram_title')}</h3>
          <p>{t('contact.telegram_desc')}</p>
          <a
            href="https://t.me/labolita"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FFD700', textDecoration: 'none' }}
          >
            t.me/labolita →
          </a>
        </div>

        <div className="info-card">
          <h3>{t('contact.twitter_title')}</h3>
          <p>{t('contact.twitter_desc')}</p>
          <a
            href="https://twitter.com/labolita"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FFD700', textDecoration: 'none' }}
          >
            @labolita →
          </a>
        </div>

        <div className="info-card">
          <h3>{t('contact.discord_title')}</h3>
          <p>{t('contact.discord_desc')}</p>
          <a
            href="https://discord.gg/labolita"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FFD700', textDecoration: 'none' }}
          >
            discord.gg/labolita →
          </a>
        </div>
      </div>

      <h2>{t('contact.email_support')}</h2>
      <p>
        {t('contact.email_desc')}
      </p>
      <div className="contract-address">
        <div>
          <span className="label">{t('contact.general_support')}</span>
          <span className="address">support@labolita.io</span>
        </div>
      </div>
      <div className="contract-address">
        <div>
          <span className="label">{t('contact.security_issues')}</span>
          <span className="address">security@labolita.io</span>
        </div>
      </div>

      <div className="info-box">
        <p dangerouslySetInnerHTML={{ __html: t('contact.response_time') }} />
      </div>

      <h2>{t('contact.before_contact')}</h2>
      <p>{t('contact.before_desc')}</p>
      <ul>
        <li><Link to="/faq" style={{ color: '#FFD700' }}>{t('faq.title')}</Link></li>
        <li><Link to="/how-it-works" style={{ color: '#FFD700' }}>{t('how_it_works.title')}</Link></li>
        <li><Link to="/legal/rules" style={{ color: '#FFD700' }}>{t('how_it_works.rules_link')}</Link></li>
        <li><Link to="/fairness" style={{ color: '#FFD700' }}>{t('how_it_works.learn_fairness')}</Link></li>
      </ul>

      <h2>{t('contact.security_notice')}</h2>
      <div className="warning-box">
        <p dangerouslySetInnerHTML={{ __html: t('contact.scam_warning') }} />
        <ul style={{ marginTop: '0.5rem', marginBottom: '0' }}>
          <li>{t('contact.scam1')}</li>
          <li>{t('contact.scam2')}</li>
          <li>{t('contact.scam3')}</li>
          <li>{t('contact.scam4')}</li>
        </ul>
      </div>
      <p>
        {t('contact.verify_channels')}{' '}
        <Link to="/official-links" style={{ color: '#FFD700' }}>{t('contact.official_links')}</Link>
      </p>

      <h2>{t('contact.bug_reports')}</h2>
      <p>
        {t('contact.bug_desc')}
      </p>
      <ul>
        <li>{t('contact.bug1')}</li>
        <li>{t('contact.bug2')}</li>
        <li>{t('contact.bug3')}</li>
        <li>{t('contact.bug4')}</li>
        <li>{t('contact.bug5')}</li>
      </ul>

      <h2>{t('contact.partnerships')}</h2>
      <p>
        {t('contact.partnerships_desc')}
      </p>
      <div className="contract-address">
        <div>
          <span className="label">{t('contact.business_inquiries')}</span>
          <span className="address">business@labolita.io</span>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
