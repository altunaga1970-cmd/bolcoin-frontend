import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function TermsPage() {
  return (
    <div className="legal-page">
      <h1>Terms of Service</h1>
      <p className="last-updated">Last updated: February 16, 2026</p>

      <div className="warning-box">
        <p><strong>Important:</strong> By using Bolcoin, you acknowledge that you are participating in cryptocurrency-based gambling activities. Please read these terms carefully before using our platform.</p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using the Bolcoin platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the Platform.
      </p>
      <p>
        These Terms constitute a legally binding agreement between you and Bolcoin regarding your use of the Platform and participation in any games offered.
      </p>

      <h2>2. Eligibility</h2>
      <p>To use the Platform, you must:</p>
      <ul>
        <li>Be at least 18 years of age or the legal gambling age in your jurisdiction, whichever is higher</li>
        <li>Not be a resident of or located in a <Link to="/legal/jurisdictions">restricted jurisdiction</Link></li>
        <li>Have the legal capacity to enter into this agreement</li>
        <li>Not be prohibited from participating in gambling activities by any applicable law</li>
        <li>Own and control a compatible cryptocurrency wallet</li>
      </ul>

      <h2>3. Platform Description</h2>
      <p>
        Bolcoin is a decentralized gaming platform operating on the Polygon blockchain. The Platform currently offers:
      </p>
      <ul>
        <li><strong>Keno:</strong> Instant number-matching game. Select 1-10 numbers from 1-80. Fixed bet of 1 USDT per play. Payout is dynamically capped based on the pool balance (max 10% of pool per win).</li>
      </ul>
      <p>Coming soon:</p>
      <ul>
        <li><strong>La Bolita:</strong> Number-based betting games (2, 3, and 4 digit numbers)</li>
        <li><strong>La Fortuna:</strong> Lottery-style game (5 numbers plus a key number)</li>
      </ul>
      <p>
        Keno uses a SHA-256 provably fair system with server seed, client seed, and nonce. Each game result can be independently verified via the verification endpoint. On-chain VRF integration is planned for a future update.
      </p>

      <h2>4. Non-Custodial Nature</h2>
      <p>
        Bolcoin operates as a non-custodial platform. This means:
      </p>
      <ul>
        <li>You maintain full control of your cryptocurrency wallet and private keys</li>
        <li>All transactions occur directly on the Polygon blockchain via smart contracts</li>
        <li>We do not hold, store, or have access to your funds at any time</li>
        <li>Prize payouts are executed automatically by the smart contract</li>
        <li>You are solely responsible for the security of your wallet</li>
      </ul>

      <h2>5. Cryptocurrency and USDT</h2>
      <p>
        The Platform exclusively uses USDT (Tether) on the Polygon network for all transactions. You acknowledge that:
      </p>
      <ul>
        <li>Cryptocurrency values are volatile and may fluctuate</li>
        <li>You are responsible for any network fees (gas) required for transactions</li>
        <li>Transactions on the blockchain are irreversible</li>
        <li>We are not responsible for any losses due to cryptocurrency price changes</li>
      </ul>

      <h2>6. Game Rules and Odds</h2>
      <p>
        Complete game rules, odds, and prize structures are detailed in our <Link to="/legal/rules">Game Rules</Link> page. By participating in any game, you confirm that you have read and understood the applicable rules.
      </p>

      <h2>7. Fair Play and Fraud Prevention</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use any automated systems, bots, or scripts to interact with the Platform</li>
        <li>Attempt to manipulate or exploit any game outcome</li>
        <li>Engage in any form of collusion with other users</li>
        <li>Create multiple accounts to circumvent any Platform rules</li>
        <li>Use the Platform for money laundering or any illegal activity</li>
      </ul>

      <h2>8. Responsible Gaming</h2>
      <p>
        We encourage responsible gambling practices. Please review our <Link to="/legal/responsible-gaming">Responsible Gaming</Link> policy. If you feel you may have a gambling problem, please seek help immediately.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law:
      </p>
      <ul>
        <li>The Platform is provided "as is" without warranties of any kind</li>
        <li>We are not liable for any losses arising from your use of the Platform</li>
        <li>We are not responsible for smart contract bugs or blockchain issues</li>
        <li>We are not liable for any losses due to user error or wallet security breaches</li>
        <li>Our total liability shall not exceed the amount you paid in fees to the Platform</li>
      </ul>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Bolcoin, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these Terms.
      </p>

      <h2>11. Modifications to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Platform after any changes constitutes acceptance of the new Terms.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with applicable international arbitration rules. Any disputes shall be resolved through binding arbitration.
      </p>

      <h2>13. Severability</h2>
      <p>
        If any provision of these Terms is found to be unenforceable, the remaining provisions shall continue in full force and effect.
      </p>

      <h2>14. Contact</h2>
      <p>
        For questions about these Terms, please visit our <Link to="/contact">Contact</Link> page.
      </p>

      <div className="info-box">
        <p>By using Bolcoin, you confirm that you have read, understood, and agree to be bound by these Terms of Service.</p>
      </div>
    </div>
  );
}

export default TermsPage;
