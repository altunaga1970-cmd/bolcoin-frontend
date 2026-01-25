import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function PrivacyPage() {
  return (
    <div className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="last-updated">Last updated: January 20, 2026</p>

      <div className="info-box">
        <p>La Bolita is designed with privacy in mind. As a non-custodial, blockchain-based platform, we collect minimal personal data.</p>
      </div>

      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy explains how La Bolita ("we", "us", "our") collects, uses, and protects information when you use our decentralized lottery platform ("Platform").
      </p>
      <p>
        By using the Platform, you agree to the collection and use of information in accordance with this policy.
      </p>

      <h2>2. Information We Collect</h2>

      <h3>2.1 Blockchain Data (Public)</h3>
      <p>When you interact with our smart contracts, the following information is recorded on the public Polygon blockchain:</p>
      <ul>
        <li>Your wallet address</li>
        <li>Transaction hashes</li>
        <li>Bet details (numbers, amounts)</li>
        <li>Ticket purchases</li>
        <li>Prize claims</li>
      </ul>
      <p>
        <strong>Note:</strong> This data is inherently public and immutable as part of blockchain technology. We do not control or have the ability to delete blockchain data.
      </p>

      <h3>2.2 Automatically Collected Data</h3>
      <p>When you visit our website, we may automatically collect:</p>
      <ul>
        <li>IP address (for geolocation and security)</li>
        <li>Browser type and version</li>
        <li>Device information</li>
        <li>Pages visited and time spent</li>
        <li>Referring website</li>
      </ul>

      <h3>2.3 Data We Do NOT Collect</h3>
      <p>As a non-custodial platform, we do NOT collect:</p>
      <ul>
        <li>Your name or identity documents</li>
        <li>Email addresses (unless voluntarily provided for support)</li>
        <li>Phone numbers</li>
        <li>Banking or payment card information</li>
        <li>Private keys or seed phrases</li>
      </ul>

      <h2>3. How We Use Information</h2>
      <p>We use the collected information for:</p>
      <ul>
        <li><strong>Platform Operation:</strong> Processing bets, displaying results, enabling prize claims</li>
        <li><strong>Security:</strong> Preventing fraud, abuse, and unauthorized access</li>
        <li><strong>Compliance:</strong> Enforcing geographic restrictions</li>
        <li><strong>Analytics:</strong> Understanding usage patterns to improve the Platform</li>
        <li><strong>Legal:</strong> Complying with applicable laws and regulations</li>
      </ul>

      <h2>4. Geolocation</h2>
      <p>
        We use IP-based geolocation to enforce our <Link to="/legal/jurisdictions">geographic restrictions</Link>. This helps us comply with gambling regulations in various jurisdictions. We do not track your precise location.
      </p>

      <h2>5. Cookies and Tracking</h2>
      <p>We use cookies and similar technologies for:</p>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for Platform functionality (e.g., wallet connection state)</li>
        <li><strong>Analytics Cookies:</strong> To understand how visitors use the Platform</li>
        <li><strong>Security Cookies:</strong> To prevent fraud and protect your session</li>
      </ul>
      <p>
        For more details, see our <Link to="/legal/cookies">Cookie Policy</Link>.
      </p>

      <h2>6. Data Sharing</h2>
      <p>We may share information with:</p>
      <ul>
        <li><strong>Service Providers:</strong> Analytics providers, security services, infrastructure providers</li>
        <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
        <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, or sale of assets</li>
      </ul>
      <p>We do NOT sell your personal information to third parties.</p>

      <h2>7. Data Security</h2>
      <p>We implement security measures including:</p>
      <ul>
        <li>HTTPS encryption for all communications</li>
        <li>Regular security audits</li>
        <li>Access controls and authentication</li>
        <li>Secure smart contract development practices</li>
      </ul>
      <p>
        However, no method of transmission over the Internet is 100% secure. You are responsible for securing your wallet and private keys.
      </p>

      <h2>8. Data Retention</h2>
      <ul>
        <li><strong>Blockchain Data:</strong> Permanent (inherent to blockchain technology)</li>
        <li><strong>Server Logs:</strong> Retained for up to 90 days</li>
        <li><strong>Analytics Data:</strong> Aggregated and anonymized after 26 months</li>
        <li><strong>Support Communications:</strong> Retained for up to 2 years</li>
      </ul>

      <h2>9. Your Rights</h2>
      <p>Depending on your jurisdiction, you may have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data (where technically possible)</li>
        <li>Object to certain processing activities</li>
        <li>Data portability</li>
      </ul>
      <p>
        <strong>Note:</strong> Due to the nature of blockchain technology, we cannot modify or delete data recorded on the blockchain.
      </p>

      <h2>10. International Transfers</h2>
      <p>
        The Platform operates globally. Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
      </p>

      <h2>11. Children's Privacy</h2>
      <p>
        The Platform is not intended for individuals under 18 years of age (or the legal gambling age in your jurisdiction). We do not knowingly collect information from minors.
      </p>

      <h2>12. Third-Party Links</h2>
      <p>
        Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites.
      </p>

      <h2>13. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Platform after changes constitutes acceptance of the updated policy.
      </p>

      <h2>14. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy or wish to exercise your rights, please visit our <Link to="/contact">Contact</Link> page.
      </p>

      <div className="info-box">
        <p>By using La Bolita, you acknowledge that you have read and understood this Privacy Policy.</p>
      </div>
    </div>
  );
}

export default PrivacyPage;
