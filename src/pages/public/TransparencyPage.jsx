import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContract } from '../../hooks/useContract';
import '../../components/layout/Layout.css';

// Contract addresses - should match .env
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x...';
const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const VRF_COORDINATOR = '0xAE975071Be8F8eE67addBC1A82488F1C24858067'; // Polygon Mainnet

function TransparencyPage() {
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
      <h1>Transparency</h1>
      <p className="page-subtitle">
        Complete transparency is a core principle of La Bolita. All smart contracts are verified and open source.
      </p>

      <h2>Smart Contract Addresses</h2>
      <p>All contracts are deployed on Polygon (MATIC) and verified on PolygonScan:</p>

      <div className="contract-address">
        <div>
          <span className="label">La Bolita Main Contract</span>
          <span className="address">{CONTRACT_ADDRESS}</span>
        </div>
        <a href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}#code`} target="_blank" rel="noopener noreferrer">
          View on PolygonScan →
        </a>
      </div>

      <div className="contract-address">
        <div>
          <span className="label">USDT Token (Polygon)</span>
          <span className="address">{TOKEN_ADDRESS}</span>
        </div>
        <a href={`https://polygonscan.com/token/${TOKEN_ADDRESS}`} target="_blank" rel="noopener noreferrer">
          View on PolygonScan →
        </a>
      </div>

      <div className="contract-address">
        <div>
          <span className="label">Chainlink VRF Coordinator</span>
          <span className="address">{VRF_COORDINATOR}</span>
        </div>
        <a href={`https://polygonscan.com/address/${VRF_COORDINATOR}`} target="_blank" rel="noopener noreferrer">
          View on PolygonScan →
        </a>
      </div>

      <h2>Current Platform Parameters</h2>

      <div className="info-cards">
        <div className="info-card">
          <h3>Current Jackpot</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${parseFloat(jackpot).toLocaleString()} USDT
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>La Fortuna progressive jackpot</p>
        </div>

        <div className="info-card">
          <h3>Jackpot Cap</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            $1,000,000 USDT
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Maximum jackpot before overflow</p>
        </div>

        <div className="info-card">
          <h3>Operations Fee</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            15%
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Platform operational costs</p>
        </div>

        <div className="info-card">
          <h3>Jackpot Contribution</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            40%
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>From each La Fortuna ticket</p>
        </div>
      </div>

      <h2>La Bolita Multipliers</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Game Type</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Digits</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>Multiplier</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>Odds</th>
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

      <h2>La Fortuna Prize Distribution</h2>
      <p>How ticket sales are distributed:</p>
      <ul>
        <li><strong>40%</strong> → Jackpot Fund (until CAP reached)</li>
        <li><strong>40%</strong> → Prize Pool (for categories 2-8)</li>
        <li><strong>15%</strong> → Operations</li>
        <li><strong>5%</strong> → Reserve Fund</li>
      </ul>
      <p>
        When the jackpot reaches the CAP ($1,000,000 USDT), additional contributions flow to the prize pool instead,
        increasing prizes for all winning categories.
      </p>

      <h3>Prize Categories</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Matches</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>Min Prize</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>Odds</th>
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
        * Minimum guaranteed prizes. Actual prizes may be higher based on ticket sales and pool size.
      </p>

      <h2>Referral Program</h2>
      <ul>
        <li><strong>Referral Bonus:</strong> 5% of referee's net bets</li>
        <li>Bonuses are credited automatically on-chain</li>
        <li>Can be claimed at any time</li>
      </ul>

      <h2>Audit & Security</h2>
      <p>Our smart contracts follow best practices:</p>
      <ul>
        <li>Built with OpenZeppelin contracts</li>
        <li>Reentrancy protection on all external calls</li>
        <li>Access control for admin functions</li>
        <li>Emergency pause functionality</li>
        <li>Verified source code on PolygonScan</li>
      </ul>

      <div className="info-box">
        <p>
          All transactions and results are permanently recorded on the Polygon blockchain and can be independently verified by anyone.
          Visit our <Link to="/fairness">Provably Fair</Link> page to learn how to verify results.
        </p>
      </div>
    </div>
  );
}

export default TransparencyPage;
