import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../common';
import './MainNav.css';

// MetaMask Fox Icon SVG
const MetaMaskIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 318.6 318.6" className="metamask-icon">
    <polygon fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" points="274.1,35.5 174.6,109.4 193,65.8"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="44.4,35.5 143.1,110.1 125.6,65.8"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="238.3,206.8 211.8,247.4 268.5,263 284.8,207.7"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="33.9,207.7 50.1,263 106.8,247.4 80.3,206.8"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 87.8,162.1 144.1,164.6 142.1,104.1"/>
    <polygon fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" points="214.9,138.2 175.9,103.4 174.6,164.6 230.8,162.1"/>
    <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 140.6,230.9 111.4,208.1"/>
    <polygon fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" points="177.9,230.9 211.8,247.4 207.1,208.1"/>
    <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="211.8,247.4 177.9,230.9 180.6,253 180.3,262.3"/>
    <polygon fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 138.3,262.3 138.1,253 140.6,230.9"/>
    <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="138.8,193.5 110.6,185.2 130.5,176.1"/>
    <polygon fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" points="179.7,193.5 188,176.1 208,185.2"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="106.8,247.4 111.6,206.8 80.3,207.7"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="207,206.8 211.8,247.4 238.3,207.7"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="230.8,162.1 174.6,164.6 179.8,193.5 188.1,176.1 208.1,185.2"/>
    <polygon fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" points="110.6,185.2 130.6,176.1 138.8,193.5 144.1,164.6 87.8,162.1"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="87.8,162.1 111.4,208.1 110.6,185.2"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="208.1,185.2 207.1,208.1 230.8,162.1"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="144.1,164.6 138.8,193.5 145.4,227.6 146.9,182.7"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 171.9,182.6 173.1,227.6 179.8,193.5"/>
    <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="179.8,193.5 173.1,227.6 177.9,230.9 207.1,208.1 208.1,185.2"/>
    <polygon fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" points="110.6,185.2 111.4,208.1 140.6,230.9 145.4,227.6 138.8,193.5"/>
    <polygon fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" points="180.3,262.3 180.6,253 178.1,250.8 140.4,250.8 138.1,253 138.3,262.3 106.8,247.4 117.8,256.4 140.1,271.9 178.4,271.9 200.8,256.4 211.8,247.4"/>
    <polygon fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" points="177.9,230.9 173.1,227.6 145.4,227.6 140.6,230.9 138.1,253 140.4,250.8 178.1,250.8 180.6,253"/>
    <polygon fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" points="278.3,114.2 286.8,73.4 274.1,35.5 177.9,106.9 214.9,138.2 267.2,153.5 278.8,140 273.8,136.4 281.8,129.1 275.6,124.3 283.6,118.2"/>
    <polygon fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" points="31.8,73.4 40.3,114.2 34.9,118.2 42.9,124.3 36.8,129.1 44.8,136.4 39.8,140 51.3,153.5 103.6,138.2 140.6,106.9 44.4,35.5"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="267.2,153.5 214.9,138.2 230.8,162.1 207.1,208.1 238.3,207.7 284.8,207.7"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="103.6,138.2 51.3,153.5 33.9,207.7 80.3,207.7 111.4,208.1 87.8,162.1"/>
    <polygon fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" points="174.6,164.6 177.9,106.9 193.1,65.8 125.6,65.8 140.6,106.9 144.1,164.6 145.3,182.8 145.4,227.6 173.1,227.6 173.3,182.8"/>
  </svg>
);

// Hamburger Icon
const HamburgerIcon = ({ isOpen }) => (
  <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
    <span></span>
    <span></span>
    <span></span>
  </div>
);

function MainNav() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    isConnected,
    account,
    connectWallet,
    disconnectWallet,
    formatAddress,
    isConnecting,
    currentNetwork
  } = useWeb3();

  const isActive = (path) => location.pathname === path;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/bet', label: 'La Bolita' },
    { to: '/lottery', label: 'La Fortuna' },
    { to: '/wallet', label: 'Billetera' },
    { to: '/history', label: 'Historial' },
    { to: '/results', label: 'Resultados' },
  ];

  return (
    <header className="main-nav">
      <div className="main-nav-content">
        <Link to="/" className="nav-logo">LA BOLITA</Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.to) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Wallet */}
        <div className="nav-wallet desktop-wallet">
          {isConnected ? (
            <div className="wallet-connected-nav">
              <div className="wallet-info">
                <span className="network-badge">
                  <span className="network-dot"></span>
                  {currentNetwork?.name || 'Red'}
                </span>
                <span className="wallet-address-nav">
                  <MetaMaskIcon />
                  {formatAddress(account)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectWallet}
                className="disconnect-btn"
              >
                Salir
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={connectWallet}
              disabled={isConnecting}
              className="connect-btn"
            >
              <MetaMaskIcon />
              <span className="connect-text">{isConnecting ? 'Conectando...' : 'Conectar'}</span>
            </Button>
          )}
        </div>

        {/* Mobile: Wallet status indicator + Hamburger */}
        <div className="mobile-header-actions">
          {isConnected && (
            <span className="mobile-wallet-indicator">
              <span className="network-dot"></span>
              <MetaMaskIcon size={18} />
            </span>
          )}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
          >
            <HamburgerIcon isOpen={mobileMenuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Wallet Section in Mobile Menu */}
        <div className="mobile-wallet-section">
          {isConnected ? (
            <>
              <div className="mobile-wallet-info">
                <span className="network-badge">
                  <span className="network-dot"></span>
                  {currentNetwork?.name || 'Red'}
                </span>
                <span className="mobile-wallet-address">
                  <MetaMaskIcon size={18} />
                  {formatAddress(account)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
                fullWidth
              >
                Desconectar Wallet
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => {
                connectWallet();
                setMobileMenuOpen(false);
              }}
              disabled={isConnecting}
              fullWidth
            >
              <MetaMaskIcon />
              {isConnecting ? 'Conectando...' : 'Conectar MetaMask'}
            </Button>
          )}
        </div>

        {/* Mobile Navigation Links */}
        <nav className="mobile-nav-links">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-nav-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Additional Links */}
        <div className="mobile-footer-links">
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>Como Funciona</Link>
          <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
          <Link to="/legal/rules" onClick={() => setMobileMenuOpen(false)}>Reglas</Link>
        </div>
      </div>
    </header>
  );
}

export default MainNav;
