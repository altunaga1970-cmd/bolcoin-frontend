import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ConnectWallet } from '../web3';
import './Layout.css';

// Logo Bolcoin
const BolcoinLogo = () => (
  <svg viewBox="0 0 100 100" className="bolcoin-logo" width="28" height="28">
    <circle cx="50" cy="50" r="44" fill="none" stroke="#22c55e" strokeWidth="6"/>
    <circle cx="50" cy="50" r="12" fill="#22c55e"/>
  </svg>
);

function Header({ variant = 'default' }) {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <BolcoinLogo />
          <span>BOLCOIN</span>
        </Link>

        <nav className="header-nav">
          <NavLink to="/bet" className={({ isActive }) => isActive ? 'active' : ''}>
            La Bolita
          </NavLink>
          <NavLink to="/lottery" className={({ isActive }) => isActive ? 'active' : ''}>
            La Fortuna
          </NavLink>
          <NavLink to="/keno" className={({ isActive }) => isActive ? 'active' : ''}>
            Keno
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => isActive ? 'active' : ''}>
            Resultados
          </NavLink>
          <NavLink to="/referrals" className={({ isActive }) => isActive ? 'active' : ''}>
            Referidos
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'active' : ''}>
            Como Funciona
          </NavLink>
        </nav>

        <div className="header-actions">
          <ConnectWallet variant="header" showBalance />
        </div>
      </div>
    </header>
  );
}

export default Header;
