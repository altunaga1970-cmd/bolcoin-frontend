import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function RulesPage() {
  return (
    <div className="legal-page">
      <h1>Game Rules</h1>
      <p className="last-updated">Last updated: January 20, 2026</p>

      <div className="info-box">
        <p>Keno on Bolcoin uses a SHA-256 provably fair system for random number generation. Each game result can be independently verified via the verification endpoint. On-chain VRF is planned for future games.</p>
      </div>

      <h2>Bolcoin - Number Games</h2>
      <p>
        Bolcoin offers three types of number-based betting games. Each draw has winning numbers for all three game types generated simultaneously.
      </p>

      <h3>Fijos (2-Digit Game)</h3>
      <ul>
        <li><strong>Selection:</strong> Choose any 2-digit number from 00 to 99</li>
        <li><strong>Stake:</strong> 1 to 1,000 USDT per number</li>
        <li><strong>Multiplier:</strong> 80x your stake</li>
        <li><strong>Win Condition:</strong> Your number exactly matches the winning 2-digit number</li>
        <li><strong>Example:</strong> Bet 10 USDT on "47" → Win 800 USDT if "47" is drawn</li>
      </ul>

      <h3>Centenas (3-Digit Game)</h3>
      <ul>
        <li><strong>Selection:</strong> Choose any 3-digit number from 000 to 999</li>
        <li><strong>Stake:</strong> 1 to 1,000 USDT per number</li>
        <li><strong>Multiplier:</strong> 500x your stake</li>
        <li><strong>Win Condition:</strong> Your number exactly matches the winning 3-digit number</li>
        <li><strong>Example:</strong> Bet 10 USDT on "247" → Win 5,000 USDT if "247" is drawn</li>
      </ul>

      <h3>Parles (4-Digit Game)</h3>
      <ul>
        <li><strong>Selection:</strong> Choose any 4-digit number from 0000 to 9999</li>
        <li><strong>Stake:</strong> 1 to 1,000 USDT per number</li>
        <li><strong>Multiplier:</strong> 900x your stake</li>
        <li><strong>Win Condition:</strong> Your number exactly matches the winning 4-digit number</li>
        <li><strong>Example:</strong> Bet 10 USDT on "1247" → Win 9,000 USDT if "1247" is drawn</li>
      </ul>

      <h3>Draw Schedule</h3>
      <p>Bolcoin draws occur three times daily:</p>
      <ul>
        <li><strong>Morning (Mañana):</strong> 10:00 UTC</li>
        <li><strong>Afternoon (Tarde):</strong> 15:00 UTC</li>
        <li><strong>Night (Noche):</strong> 21:00 UTC</li>
      </ul>
      <p>Betting closes 1 hour before each draw.</p>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

      <h2>La Fortuna - Lottery Game</h2>
      <p>
        La Fortuna is a lottery-style game with a progressive jackpot and multiple prize categories.
      </p>

      <h3>How to Play</h3>
      <ul>
        <li><strong>Selection:</strong> Choose 6 numbers from 1 to 49</li>
        <li><strong>Key Number:</strong> Choose 1 key number from 0 to 9</li>
        <li><strong>Ticket Price:</strong> 1 USDT per ticket</li>
        <li><strong>Tickets per Transaction:</strong> 1 to 8 tickets</li>
      </ul>

      <h3>Prize Categories</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Category</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Match</th>
            <th style={{ textAlign: 'right', padding: '0.75rem', color: '#FFD700' }}>Min. Prize</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,215,0,0.1)' }}>
            <td style={{ padding: '0.75rem', color: '#FFD700', fontWeight: 'bold' }}>1st (Jackpot)</td>
            <td style={{ padding: '0.75rem', color: '#FFD700' }}>6 numbers + Key</td>
            <td style={{ padding: '0.75rem', color: '#FFD700', textAlign: 'right', fontWeight: 'bold' }}>JACKPOT</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>2nd</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>6 numbers</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$100,000</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3rd</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>5 numbers + Key</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$10,000</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4th</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>5 numbers</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$1,000</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>5th</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4 numbers + Key</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$100</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>6th</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>4 numbers</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$50</td>
          </tr>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>7th</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3 numbers + Key</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$10</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>8th</td>
            <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>3 numbers</td>
            <td style={{ padding: '0.75rem', color: '#22c55e', textAlign: 'right', fontWeight: 'bold' }}>$5</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
        * These are minimum guaranteed prizes. Actual prizes may be higher based on ticket sales and pool size.
      </p>

      <h3>Progressive Jackpot</h3>
      <ul>
        <li>The jackpot starts at a minimum of <strong>$10,000 USDT</strong></li>
        <li><strong>40%</strong> of each ticket sale contributes to the jackpot</li>
        <li>The jackpot has a <strong>CAP of $1,000,000 USDT</strong></li>
        <li>When the jackpot reaches the CAP, additional contributions go to the prize pool, increasing prizes for all categories</li>
        <li>If the jackpot is won, it resets to the minimum amount ($10,000)</li>
        <li>If no one wins the jackpot, it rolls over to the next draw</li>
      </ul>

      <h3>Draw Schedule</h3>
      <p>La Fortuna draws occur twice weekly:</p>
      <ul>
        <li><strong>Wednesday:</strong> 20:00 UTC</li>
        <li><strong>Saturday:</strong> 20:00 UTC</li>
      </ul>
      <p>Ticket sales close 1 hour before each draw.</p>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

      <h2>Prize Distribution</h2>
      <p>For detailed information about how prizes are calculated and distributed, including:</p>
      <ul>
        <li>Operator fees</li>
        <li>Jackpot contribution percentages</li>
        <li>Prize pool allocation</li>
        <li>Multiple winner scenarios</li>
      </ul>
      <p>Please visit our <Link to="/transparency">Transparency</Link> page.</p>

      <h2>Claiming Prizes</h2>
      <ul>
        <li><strong>Bolcoin:</strong> Prizes are automatically calculated when results are published. Winners can claim directly from the smart contract.</li>
        <li><strong>La Fortuna:</strong> Winners are verified through a Merkle tree claim system. Each winner receives a cryptographic proof to claim their prize on-chain.</li>
        <li><strong>Claim Period:</strong> Prizes must be claimed within <strong>30 days</strong> of the draw</li>
        <li><strong>Unclaimed Prizes:</strong> Unclaimed prizes after 30 days return to the prize pool</li>
        <li><strong>How to Claim:</strong> Visit the <Link to="/claims">My Prizes</Link> page to view and claim your pending prizes</li>
      </ul>

      <h2>Fairness Verification</h2>
      <p>
        All results can be independently verified. See our <Link to="/fairness">Provably Fair</Link> page for details on how to verify results using the SHA-256 provably fair system.
      </p>

      <div className="highlight-box">
        <p><strong>Remember:</strong> Gambling involves risk. Only play with funds you can afford to lose. If you need help, please visit our <Link to="/legal/responsible-gaming">Responsible Gaming</Link> page.</p>
      </div>
    </div>
  );
}

export default RulesPage;
