import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const CURRENT_YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">LA BOLITA</Link>
            <p className="footer-tagline">
              Decentralized lottery platform on Polygon.
              Verifiable randomness. Non-custodial. Transparent.
            </p>
            <div className="footer-network">
              <span className="network-badge">
                <span className="network-dot"></span>
                Polygon Network
              </span>
            </div>
          </div>

          {/* Games Section */}
          <div className="footer-section">
            <h4 className="footer-title">Games</h4>
            <ul className="footer-links">
              <li><Link to="/web3">La Bolita (2/3/4 digits)</Link></li>
              <li><Link to="/lottery">La Fortuna (6/49 + Key)</Link></li>
              <li><Link to="/claims">My Prizes</Link></li>
              <li><Link to="/results">Latest Results</Link></li>
              <li><Link to="/statistics">Statistics</Link></li>
            </ul>
          </div>

          {/* Platform Section */}
          <div className="footer-section">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/transparency">Transparency</Link></li>
              <li><Link to="/fairness">Provably Fair (VRF)</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/official-links">Official Links</Link></li>
            </ul>
          </div>

          {/* Legal Section */}
          <div className="footer-section">
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              <li><Link to="/legal/terms">Terms of Service</Link></li>
              <li><Link to="/legal/rules">Game Rules</Link></li>
              <li><Link to="/legal/privacy">Privacy Policy</Link></li>
              <li><Link to="/legal/cookies">Cookie Policy</Link></li>
              <li><Link to="/legal/responsible-gaming">Responsible Gaming</Link></li>
              <li><Link to="/legal/jurisdictions">Restricted Jurisdictions</Link></li>
              <li><Link to="/legal/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-links">
              <li><Link to="/contact">Contact Us</Link></li>
              <li>
                <a href="https://t.me/labolita" target="_blank" rel="noopener noreferrer">
                  Telegram Community
                </a>
              </li>
              <li>
                <a href="https://twitter.com/labolita" target="_blank" rel="noopener noreferrer">
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="footer-trust">
          <div className="trust-item">
            <span className="trust-icon">🔒</span>
            <span>Non-Custodial</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">🎲</span>
            <span>Chainlink VRF</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">📜</span>
            <span>Open Source Contracts</span>
          </div>
          <div className="trust-item">
            <span className="trust-icon">⛓️</span>
            <span>On-Chain Settlements</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; {CURRENT_YEAR} La Bolita. All rights reserved.</p>
            <p className="footer-disclaimer-short">
              Gambling involves risk. Only play with funds you can afford to lose.
              This platform is not available in restricted jurisdictions.
            </p>
          </div>
          <div className="footer-contracts">
            <span className="contract-label">Contracts verified on</span>
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
