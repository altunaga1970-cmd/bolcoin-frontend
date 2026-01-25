import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function CookiesPage() {
  return (
    <div className="legal-page">
      <h1>Cookie Policy</h1>
      <p className="last-updated">Last updated: January 20, 2026</p>

      <h2>What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the website remember information about your visit, making your next visit easier and the site more useful to you.
      </p>

      <h2>How We Use Cookies</h2>
      <p>La Bolita uses the following types of cookies:</p>

      <h3>Essential Cookies</h3>
      <p>These cookies are necessary for the Platform to function properly:</p>
      <ul>
        <li><strong>Wallet Connection:</strong> Remembers your wallet connection state</li>
        <li><strong>Session Management:</strong> Maintains your session while using the Platform</li>
        <li><strong>Security:</strong> Helps protect against cross-site request forgery</li>
      </ul>
      <p>These cookies cannot be disabled as they are essential for Platform operation.</p>

      <h3>Functional Cookies</h3>
      <p>These cookies enhance your experience:</p>
      <ul>
        <li><strong>Language Preference:</strong> Remembers your preferred language</li>
        <li><strong>Display Settings:</strong> Remembers your viewing preferences</li>
        <li><strong>Recent Activity:</strong> Stores your recent bets for quick reference</li>
      </ul>

      <h3>Analytics Cookies</h3>
      <p>These cookies help us understand how visitors use the Platform:</p>
      <ul>
        <li><strong>Usage Statistics:</strong> Pages visited, time spent, navigation patterns</li>
        <li><strong>Performance:</strong> Page load times, error tracking</li>
        <li><strong>Demographics:</strong> General geographic and device information</li>
      </ul>
      <p>Analytics data is aggregated and anonymized.</p>

      <h2>Third-Party Cookies</h2>
      <p>We may use cookies from third-party services:</p>
      <ul>
        <li><strong>Analytics Providers:</strong> To understand Platform usage</li>
        <li><strong>Security Services:</strong> To detect and prevent fraud</li>
        <li><strong>CDN Providers:</strong> To deliver content efficiently</li>
      </ul>

      <h2>Managing Cookies</h2>
      <p>You can control cookies through your browser settings:</p>
      <ul>
        <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
        <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
        <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
        <li><strong>Edge:</strong> Settings → Privacy, search, and services → Cookies</li>
      </ul>
      <p>
        <strong>Note:</strong> Blocking essential cookies may prevent the Platform from functioning correctly.
      </p>

      <h2>Local Storage</h2>
      <p>
        In addition to cookies, we use browser local storage to store:
      </p>
      <ul>
        <li>Wallet connection preferences</li>
        <li>Geolocation cache (to reduce API calls)</li>
        <li>UI preferences</li>
      </ul>
      <p>Local storage can be cleared through your browser's developer tools or settings.</p>

      <h2>Updates to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time. Check this page periodically for changes.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about our use of cookies, please visit our <Link to="/contact">Contact</Link> page.
      </p>
    </div>
  );
}

export default CookiesPage;
