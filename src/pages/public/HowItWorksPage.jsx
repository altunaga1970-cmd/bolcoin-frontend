import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function HowItWorksPage() {
  return (
    <div className="info-page">
      <h1>How It Works</h1>
      <p className="page-subtitle">
        La Bolita is a decentralized lottery platform on Polygon. Here's everything you need to know to get started.
      </p>

      <h2>Getting Started</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>1. Connect Your Wallet</h3>
          <p>Install MetaMask or any compatible wallet. Connect to the Polygon network to get started.</p>
        </div>
        <div className="info-card">
          <h3>2. Get USDT on Polygon</h3>
          <p>You'll need USDT on Polygon to play. Bridge from other networks or buy directly on exchanges.</p>
        </div>
        <div className="info-card">
          <h3>3. Choose Your Game</h3>
          <p>Pick between La Bolita (number betting) or La Fortuna (lottery). Each has different odds and prizes.</p>
        </div>
        <div className="info-card">
          <h3>4. Place Your Bet</h3>
          <p>Select your numbers and amount. Confirm the transaction in your wallet. That's it!</p>
        </div>
      </div>

      <h2>Our Games</h2>

      <h3>La Bolita - Number Betting</h3>
      <p>
        Classic number betting with three game types. Draws happen three times daily.
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', marginBottom: '2rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Game</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#FFD700' }}>Digits</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#FFD700' }}>Multiplier</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>Max Bet</th>
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
      <p><Link to="/web3" style={{ color: '#FFD700' }}>Play La Bolita →</Link></p>

      <h3>La Fortuna - Lottery</h3>
      <p>
        Pick 6 numbers (1-49) plus a key number (0-9). Match all 6 + key to win the progressive jackpot!
        Draws happen twice weekly (Wednesday and Saturday).
      </p>
      <ul>
        <li>Ticket price: 1 USDT</li>
        <li>Buy up to 8 tickets per transaction</li>
        <li>8 prize categories</li>
        <li>Progressive jackpot that grows until won</li>
      </ul>
      <p><Link to="/lottery" style={{ color: '#FFD700' }}>Play La Fortuna →</Link></p>

      <h2>How Results Work</h2>
      <p>
        All results are generated using <strong>Chainlink VRF</strong> (Verifiable Random Function).
        This means:
      </p>
      <ul>
        <li>Results are provably random and cannot be predicted</li>
        <li>No one - not even us - can manipulate outcomes</li>
        <li>Every result can be independently verified on the blockchain</li>
      </ul>
      <p><Link to="/fairness" style={{ color: '#FFD700' }}>Learn about Provably Fair →</Link></p>

      <h2>Claiming Prizes</h2>
      <p>
        If you win, prizes are credited to your smart contract balance. You can claim them to your wallet at any time.
        For large lottery draws with many winners, we use a Merkle tree claim system for efficiency.
      </p>

      <h2>Why Polygon?</h2>
      <p>We chose Polygon for:</p>
      <ul>
        <li><strong>Low fees:</strong> Transactions cost fractions of a cent</li>
        <li><strong>Fast confirmations:</strong> Results in seconds, not minutes</li>
        <li><strong>Ethereum security:</strong> Secured by Ethereum's validator network</li>
        <li><strong>Wide support:</strong> Compatible with MetaMask and most wallets</li>
      </ul>

      <h2>Important Notes</h2>
      <div className="warning-box">
        <p>
          <strong>Non-custodial:</strong> You always control your funds. We never have access to your wallet or private keys.
          Make sure to keep your wallet secure!
        </p>
      </div>

      <div className="info-box">
        <p>
          <strong>Gas fees:</strong> You'll need a small amount of MATIC for transaction fees on Polygon.
          Typical transactions cost less than $0.01.
        </p>
      </div>

      <h2>Need Help?</h2>
      <ul>
        <li><Link to="/faq" style={{ color: '#FFD700' }}>Frequently Asked Questions</Link></li>
        <li><Link to="/legal/rules" style={{ color: '#FFD700' }}>Complete Game Rules</Link></li>
        <li><Link to="/contact" style={{ color: '#FFD700' }}>Contact Support</Link></li>
      </ul>
    </div>
  );
}

export default HowItWorksPage;
