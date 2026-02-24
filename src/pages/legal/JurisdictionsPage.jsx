import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

// List of restricted jurisdictions
const RESTRICTED_COUNTRIES = [
  { name: 'United States', code: 'US', reason: 'Federal and state gambling regulations' },
  { name: 'Spain', code: 'ES', reason: 'DGOJ licensing requirements' },
  { name: 'United Kingdom', code: 'GB', reason: 'UKGC licensing requirements' },
  { name: 'France', code: 'FR', reason: 'ANJ licensing requirements' },
  { name: 'Germany', code: 'DE', reason: 'Interstate Treaty on Gambling' },
  { name: 'Italy', code: 'IT', reason: 'ADM licensing requirements' },
  { name: 'Netherlands', code: 'NL', reason: 'KSA licensing requirements' },
  { name: 'Belgium', code: 'BE', reason: 'Gaming Commission requirements' },
  { name: 'Portugal', code: 'PT', reason: 'SRIJ licensing requirements' },
  { name: 'Canada', code: 'CA', reason: 'Provincial gambling regulations' },
  { name: 'Australia', code: 'AU', reason: 'Interactive Gambling Act' },
  { name: 'Japan', code: 'JP', reason: 'Gambling prohibition laws' },
  { name: 'South Korea', code: 'KR', reason: 'Gambling prohibition laws' },
  { name: 'Singapore', code: 'SG', reason: 'Remote Gambling Act' },
  { name: 'Turkey', code: 'TR', reason: 'Gambling prohibition laws' },
  { name: 'China', code: 'CN', reason: 'Gambling prohibition laws' },
  { name: 'Hong Kong', code: 'HK', reason: 'Gambling Ordinance' },
  { name: 'Macau', code: 'MO', reason: 'DICJ licensing requirements' },
  { name: 'Israel', code: 'IL', reason: 'Gambling prohibition laws' },
  { name: 'United Arab Emirates', code: 'AE', reason: 'Gambling prohibition laws' },
  { name: 'Saudi Arabia', code: 'SA', reason: 'Gambling prohibition laws' },
  { name: 'Iran', code: 'IR', reason: 'Gambling prohibition laws' },
  { name: 'North Korea', code: 'KP', reason: 'International sanctions' },
  { name: 'Cuba', code: 'CU', reason: 'International sanctions' },
  { name: 'Syria', code: 'SY', reason: 'International sanctions' },
  { name: 'Russia', code: 'RU', reason: 'Gambling restrictions' },
  { name: 'Belarus', code: 'BY', reason: 'Gambling restrictions' },
  { name: 'Ukraine', code: 'UA', reason: 'Licensing requirements' },
];

function JurisdictionsPage() {
  return (
    <div className="legal-page">
      <h1>Restricted Jurisdictions</h1>
      <p className="last-updated">Last updated: January 20, 2026</p>

      <div className="warning-box">
        <p><strong>Access Restriction:</strong> Bolcoin is not available to residents of or persons located in the jurisdictions listed below. Attempting to access the Platform from these locations is strictly prohibited.</p>
      </div>

      <h2>Why Are Some Countries Restricted?</h2>
      <p>
        Bolcoin operates as a decentralized cryptocurrency gambling platform. Due to varying gambling regulations, licensing requirements, and legal frameworks around the world, we are unable to offer our services in certain jurisdictions.
      </p>
      <p>
        These restrictions exist to:
      </p>
      <ul>
        <li>Comply with local gambling laws and regulations</li>
        <li>Respect licensing requirements in regulated markets</li>
        <li>Adhere to international sanctions and trade restrictions</li>
        <li>Protect users in jurisdictions with consumer protection concerns</li>
      </ul>

      <h2>List of Restricted Countries</h2>
      <p>
        Users from the following countries and territories are prohibited from using Bolcoin:
      </p>

      <div className="countries-grid">
        {RESTRICTED_COUNTRIES.map((country) => (
          <div key={country.code} className="country-item">
            {country.name}
          </div>
        ))}
      </div>

      <h2>Detailed Restrictions</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Country</th>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#FFD700' }}>Reason</th>
          </tr>
        </thead>
        <tbody>
          {RESTRICTED_COUNTRIES.map((country) => (
            <tr key={country.code} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>{country.name}</td>
              <td style={{ padding: '0.75rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>{country.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Geolocation and Access Control</h2>
      <p>
        We implement geolocation technology to detect and block access from restricted jurisdictions. This includes:
      </p>
      <ul>
        <li>IP address geolocation checks</li>
        <li>Blocking of connections from restricted regions</li>
        <li>Regular updates to our restriction lists</li>
      </ul>

      <div className="warning-box">
        <p><strong>VPN Usage:</strong> We do not encourage, support, or condone the use of VPNs or other tools to circumvent geographic restrictions. Users who attempt to bypass our access controls may have their accounts suspended and any winnings forfeited.</p>
      </div>

      <h2>Your Responsibility</h2>
      <p>
        It is your responsibility to ensure that your use of Bolcoin complies with all applicable laws in your jurisdiction. By using the Platform, you represent and warrant that:
      </p>
      <ul>
        <li>You are not located in a restricted jurisdiction</li>
        <li>You are not a citizen or resident of a restricted jurisdiction</li>
        <li>You are not accessing the Platform on behalf of any person in a restricted jurisdiction</li>
        <li>You will not use any tools to misrepresent your location</li>
      </ul>

      <h2>Changes to Restricted List</h2>
      <p>
        The list of restricted jurisdictions may change at any time due to regulatory developments, legal requirements, or other factors. It is your responsibility to check this page regularly for updates.
      </p>

      <h2>Questions</h2>
      <p>
        If you have questions about whether you can legally use Bolcoin in your jurisdiction, we recommend consulting with a local legal professional. For general inquiries, please visit our <Link to="/contact">Contact</Link> page.
      </p>

      <div className="info-box">
        <p>By using Bolcoin, you confirm that you are not located in or a resident of any restricted jurisdiction listed above.</p>
      </div>
    </div>
  );
}

export default JurisdictionsPage;
