import React, { useState, useCallback } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConnectWallet } from '../web3';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import LanguageSwitcher from '../../i18n/LanguageSwitcher';
import './Layout.css';

// Logo Bolcoin
const BolcoinLogo = () => (
  <svg viewBox="0 0 100 100" className="bolcoin-logo" width="28" height="28">
    <circle cx="50" cy="50" r="44" fill="none" stroke="#22c55e" strokeWidth="6"/>
    <circle cx="50" cy="50" r="12" fill="#22c55e"/>
  </svg>
);

function Header({ variant = 'default' }) {
  const { isAdmin } = useAdminAuth();
  const { isGameEnabled } = useConfig();
  const { t } = useTranslation('common');
  const [mobileOpen, setMobileOpen] = useState(false);

  const showBolita = isGameEnabled('bolita');
  const showFortuna = isGameEnabled('fortuna');

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const navLinks = (
    <>
      {showBolita && (
        <NavLink to="/bet" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
          {t('nav.la_bolita')}
        </NavLink>
      )}
      {showFortuna && (
        <NavLink to="/lottery" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
          {t('nav.la_fortuna')}
        </NavLink>
      )}
      <NavLink to="/keno" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
        {t('nav.keno')}
      </NavLink>
      <NavLink to="/bingo" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
        {t('nav.bingo')}
      </NavLink>
      <NavLink to="/results" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
        {t('nav.results')}
      </NavLink>
      <NavLink to="/referrals" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
        {t('nav.referrals')}
      </NavLink>
      <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMobile}>
        {t('nav.how_it_works')}
      </NavLink>
    </>
  );

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <BolcoinLogo />
          <span>BOLCOIN</span>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav">
          {navLinks}
        </nav>

        <div className="header-actions">
          <LanguageSwitcher />
          <Link to={isAdmin ? "/admin/ops" : "/admin/login"} className="header-admin-link">
            {t('nav.admin')}
          </Link>
          <ConnectWallet variant="header" showBalance />

          {/* Hamburger button (mobile only) */}
          <button
            className={`mobile-menu-btn ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="mobile-nav-overlay" onClick={closeMobile}>
          <nav className="mobile-nav" onClick={e => e.stopPropagation()}>
            {navLinks}
            <Link to={isAdmin ? "/admin/ops" : "/admin/login"} className="mobile-admin-link" onClick={closeMobile}>
              {t('nav.admin')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
