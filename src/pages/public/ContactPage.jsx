import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function ContactPage() {
  return (
    <div className="info-page">
      <h1>Contact Us</h1>
      <p className="page-subtitle">
        Have questions or need assistance? Here's how to reach us.
      </p>

      <h2>Community Channels</h2>
      <p>Join our community for support, updates, and discussions:</p>

      <div className="info-cards">
        <div className="info-card">
          <h3>Telegram</h3>
          <p>Join our official Telegram group for real-time support and community chat.</p>
          <a
            href="https://t.me/labolita"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FFD700', textDecoration: 'none' }}
          >
            t.me/labolita →
          </a>
        </div>

        <div className="info-card">
          <h3>Twitter / X</h3>
          <p>Follow us for announcements, draw results, and jackpot updates.</p>
          <a
            href="https://twitter.com/labolita"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FFD700', textDecoration: 'none' }}
          >
            @labolita →
          </a>
        </div>

        <div className="info-card">
          <h3>Discord</h3>
          <p>Join our Discord server for detailed discussions and support tickets.</p>
          <a
            href="https://discord.gg/labolita"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#FFD700', textDecoration: 'none' }}
          >
            discord.gg/labolita →
          </a>
        </div>
      </div>

      <h2>Email Support</h2>
      <p>
        For issues that require private communication or cannot be resolved through community channels:
      </p>
      <div className="contract-address">
        <div>
          <span className="label">General Support</span>
          <span className="address">support@labolita.io</span>
        </div>
      </div>
      <div className="contract-address">
        <div>
          <span className="label">Security Issues</span>
          <span className="address">security@labolita.io</span>
        </div>
      </div>

      <div className="info-box">
        <p>
          <strong>Response Time:</strong> We aim to respond to all inquiries within 24-48 hours.
          Community channels typically have faster response times.
        </p>
      </div>

      <h2>Before Contacting Us</h2>
      <p>Please check these resources first - your question may already be answered:</p>
      <ul>
        <li><Link to="/faq" style={{ color: '#FFD700' }}>Frequently Asked Questions</Link></li>
        <li><Link to="/how-it-works" style={{ color: '#FFD700' }}>How It Works</Link></li>
        <li><Link to="/legal/rules" style={{ color: '#FFD700' }}>Game Rules</Link></li>
        <li><Link to="/fairness" style={{ color: '#FFD700' }}>Provably Fair</Link></li>
      </ul>

      <h2>Security Notice</h2>
      <div className="warning-box">
        <p>
          <strong>Beware of Scams!</strong> La Bolita staff will NEVER:
        </p>
        <ul style={{ marginTop: '0.5rem', marginBottom: '0' }}>
          <li>Ask for your private keys or seed phrase</li>
          <li>Ask you to send funds to verify your account</li>
          <li>Contact you first via DM about "winning" something</li>
          <li>Offer guaranteed wins or insider information</li>
        </ul>
      </div>
      <p>
        Always verify you're communicating through official channels.
        See our <Link to="/official-links" style={{ color: '#FFD700' }}>Official Links</Link> page for verified accounts and domains.
      </p>

      <h2>Bug Reports & Feedback</h2>
      <p>
        Found a bug or have suggestions for improvement? We appreciate your feedback!
        Please report technical issues with as much detail as possible:
      </p>
      <ul>
        <li>What you were trying to do</li>
        <li>What happened instead</li>
        <li>Your wallet address (if relevant)</li>
        <li>Transaction hash (if applicable)</li>
        <li>Browser and wallet you're using</li>
      </ul>

      <h2>Partnerships & Business</h2>
      <p>
        For partnership inquiries, integration requests, or business development:
      </p>
      <div className="contract-address">
        <div>
          <span className="label">Business Inquiries</span>
          <span className="address">business@labolita.io</span>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
