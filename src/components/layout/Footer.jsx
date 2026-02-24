import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Layout.css';

// Logo Bolcoin
const BolcoinLogo = () => (
  <svg viewBox="0 0 100 100" className="bolcoin-logo" width="32" height="32">
    <circle cx="50" cy="50" r="44" fill="none" stroke="#22c55e" strokeWidth="6"/>
    <circle cx="50" cy="50" r="12" fill="#22c55e"/>
  </svg>
);

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  const { t } = useTranslation('common');

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">
              <BolcoinLogo />
              <span>BOLCOIN</span>
            </Link>
            <p className="footer-tagline">
              {t('footer.tagline')}
            </p>
            <div className="footer-network">
              <span className="network-badge">
                <span className="network-dot"></span>
                {t('footer.polygon_network')}
              </span>
            </div>
          </div>

          {/* Games Section */}
          <div className="footer-section">
            <h4 className="footer-title">{t('footer.games')}</h4>
            <ul className="footer-links">
              <li><Link to="/bet">{t('footer.la_bolita_full')}</Link></li>
              <li><Link to="/lottery">{t('footer.la_fortuna_full')}</Link></li>
              <li><Link to="/keno">{t('footer.keno_instant')}</Link></li>
              <li><Link to="/claims">{t('footer.my_prizes')}</Link></li>
              <li><Link to="/results">{t('footer.results')}</Link></li>
              <li><Link to="/referrals">{t('footer.referral_program')}</Link></li>
            </ul>
          </div>

          {/* Platform Section */}
          <div className="footer-section">
            <h4 className="footer-title">{t('footer.platform')}</h4>
            <ul className="footer-links">
              <li><Link to="/how-it-works">{t('footer.how_it_works')}</Link></li>
              <li><Link to="/transparency">{t('footer.transparency')}</Link></li>
              <li><Link to="/fairness">{t('footer.provably_fair')}</Link></li>
              <li><Link to="/faq">{t('footer.faq')}</Link></li>
              <li><Link to="/official-links">{t('footer.official_links')}</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="footer-section">
            <h4 className="footer-title">{t('footer.legal')}</h4>
            <ul className="footer-links">
              <li><Link to="/legal/terms">{t('footer.terms')}</Link></li>
              <li><Link to="/legal/rules">{t('footer.game_rules')}</Link></li>
              <li><Link to="/legal/privacy">{t('footer.privacy')}</Link></li>
              <li><Link to="/legal/cookies">{t('footer.cookies')}</Link></li>
              <li><Link to="/legal/responsible-gaming">{t('footer.responsible_gaming')}</Link></li>
              <li><Link to="/legal/jurisdictions">{t('footer.restricted_jurisdictions')}</Link></li>
              <li><Link to="/legal/disclaimer">{t('footer.disclaimer')}</Link></li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="footer-section">
            <h4 className="footer-title">{t('footer.support')}</h4>
            <ul className="footer-links">
              <li><Link to="/contact">{t('footer.contact_us')}</Link></li>
              <li>
                <a href="https://t.me/labolita" target="_blank" rel="noopener noreferrer">
                  {t('footer.telegram')}
                </a>
              </li>
              <li>
                <a href="https://twitter.com/labolita" target="_blank" rel="noopener noreferrer">
                  {t('footer.twitter')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="footer-trust">
          <div className="trust-item">
            <span className="trust-icon">{'\uD83D\uDD12'}</span>
            <span>{t('footer.non_custodial')}</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">{'\uD83C\uDFB2'}</span>
            <span>{t('footer.chainlink_vrf')}</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">{'\uD83D\uDCDC'}</span>
            <span>{t('footer.open_source')}</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">{'\u26D3\uFE0F'}</span>
            <span>{t('footer.on_chain')}</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>{t('footer.copyright', { year: CURRENT_YEAR })}</p>
            <p className="footer-disclaimer-short">
              {t('footer.gambling_disclaimer')}
            </p>
          </div>
          <div className="footer-contracts">
            <span className="contract-label">{t('footer.contracts_verified')}</span>
            <a
              href="https://polygonscan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="contract-link"
            >
              PolygonScan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
