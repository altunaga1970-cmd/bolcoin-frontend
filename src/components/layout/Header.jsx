import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ConnectWallet } from '../web3';
import './Layout.css';

function Header({ variant = 'default' }) {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="header-logo">LA BOLITA</Link>

        <nav className="header-nav">
          <NavLink to="/web3" className={({ isActive }) => isActive ? 'active' : ''}>
            La Bolita
          </NavLink>
          <NavLink to="/lottery" className={({ isActive }) => isActive ? 'active' : ''}>
            La Fortuna
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => isActive ? 'active' : ''}>
            Results
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => isActive ? 'active' : ''}>
            How It Works
          </NavLink>
          <NavLink to="/transparency" className={({ isActive }) => isActive ? 'active' : ''}>
            Transparency
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
