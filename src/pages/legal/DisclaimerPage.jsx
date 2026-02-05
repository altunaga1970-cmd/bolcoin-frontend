import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function DisclaimerPage() {
  return (
    <div className="legal-page">
      <h1>Disclaimer</h1>
      <p className="last-updated">Last updated: January 20, 2026</p>

      <div className="warning-box">
        <p><strong>Risk Warning:</strong> Gambling involves significant risk. You may lose some or all of your funds. Only gamble with money you can afford to lose.</p>
      </div>

      <h2>No Investment Advice</h2>
      <p>
        La Bolita is a gambling platform. Nothing on this Platform should be construed as investment advice, financial advice, trading advice, or any other sort of advice. You are solely responsible for your decisions regarding the use of this Platform.
      </p>

      <h2>Gambling Risks</h2>
      <p>By using La Bolita, you acknowledge and accept that:</p>
      <ul>
        <li>Gambling is inherently risky and you may lose your entire stake</li>
        <li>Past results do not guarantee future outcomes</li>
        <li>Game outcomes are determined by random number generation</li>
        <li>The house has a mathematical edge in all games</li>
        <li>There is no system or strategy that guarantees winning</li>
      </ul>

      <h2>Cryptocurrency Risks</h2>
      <p>The Platform operates using cryptocurrency (USDT on Polygon). You acknowledge:</p>
      <ul>
        <li>Cryptocurrency values can be highly volatile</li>
        <li>Blockchain transactions are irreversible</li>
        <li>You are responsible for the security of your wallet and private keys</li>
        <li>Network congestion may affect transaction times</li>
        <li>Smart contracts may contain bugs despite auditing efforts</li>
        <li>We are not responsible for any losses due to blockchain issues</li>
      </ul>

      <h2>Smart Contract Risks</h2>
      <p>The Platform relies on smart contracts deployed on the Polygon blockchain:</p>
      <ul>
        <li>Smart contracts may contain undiscovered vulnerabilities</li>
        <li>Blockchain networks may experience technical issues</li>
        <li>Oracle services (Chainlink VRF) may experience delays or failures</li>
        <li>We cannot guarantee uninterrupted service</li>
      </ul>

      <h2>No Warranties</h2>
      <p>
        THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO:
      </p>
      <ul>
        <li>Warranties of merchantability</li>
        <li>Fitness for a particular purpose</li>
        <li>Non-infringement</li>
        <li>Accuracy or reliability of results</li>
        <li>Uninterrupted or error-free operation</li>
      </ul>

      <h2>Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LA BOLITA AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
      </p>
      <ul>
        <li>Any direct, indirect, incidental, special, consequential, or punitive damages</li>
        <li>Loss of profits, revenue, data, or use</li>
        <li>Business interruption</li>
        <li>Any losses arising from your use of or inability to use the Platform</li>
        <li>Any unauthorized access to or alteration of your data</li>
        <li>Any actions of third parties</li>
      </ul>

      <h2>Regulatory Compliance</h2>
      <p>
        You are solely responsible for ensuring that your use of the Platform complies with all applicable laws and regulations in your jurisdiction. Check our <Link to="/legal/jurisdictions">Restricted Jurisdictions</Link> page and consult local legal counsel if uncertain.
      </p>

      <h2>Third-Party Services</h2>
      <p>
        The Platform integrates with third-party services including:
      </p>
      <ul>
        <li>Polygon Network (blockchain infrastructure)</li>
        <li>Chainlink (VRF oracle)</li>
        <li>Wallet providers (MetaMask, etc.)</li>
      </ul>
      <p>
        We are not responsible for the availability, accuracy, or reliability of these third-party services.
      </p>

      <h2>Accuracy of Information</h2>
      <p>
        While we strive to provide accurate information, we make no guarantees regarding the accuracy, completeness, or timeliness of any information on the Platform. Always verify important information independently.
      </p>

      <h2>Changes to Platform</h2>
      <p>
        We reserve the right to modify, suspend, or discontinue any aspect of the Platform at any time without notice. We shall not be liable to you or any third party for any such modifications, suspension, or discontinuance.
      </p>

      <h2>Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless La Bolita and its affiliates from any claims, damages, losses, or expenses arising from your use of the Platform or violation of these terms.
      </p>

      <div className="highlight-box">
        <p><strong>By using La Bolita, you acknowledge that you have read, understood, and accepted this Disclaimer in its entirety.</strong></p>
      </div>
    </div>
  );
}

export default DisclaimerPage;
