import React, { useState, useEffect, useCallback } from 'react';
import '../../components/layout/Layout.css';

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '0x...';
const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const VRF_COORDINATOR = '0xAE975071Be8F8eE67addBC1A82488F1C24858067';

// Official domains - these are the ONLY legitimate domains
const OFFICIAL_DOMAINS = [
  'labolita.io',
  'www.labolita.io',
  'app.labolita.io'
];

// Known scam patterns to warn about
const SCAM_PATTERNS = [
  'la-bolita', 'labolita.net', 'labolita.com', 'labolita.org',
  'labol1ta', 'lab0lita', 'labolita-', '-labolita',
  'labolita.xyz', 'labolita.app'
];

function OfficialLinksPage() {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isOfficialSite, setIsOfficialSite] = useState(null);
  const [copiedItem, setCopiedItem] = useState(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  // Check if current site is official
  useEffect(() => {
    const hostname = window.location.hostname;
    setCurrentUrl(window.location.href);
    setIsOfficialSite(OFFICIAL_DOMAINS.includes(hostname) || hostname === 'localhost');
  }, []);

  // Copy to clipboard function
  const copyToClipboard = useCallback(async (text, itemId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // URL verification function
  const verifyUrl = useCallback((url) => {
    try {
      const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;

      // Check if it's an official domain
      if (OFFICIAL_DOMAINS.includes(hostname)) {
        setVerifyResult({ isOfficial: true, message: 'This is an OFFICIAL La Bolita domain.' });
        return;
      }

      // Check for scam patterns
      const lowerHostname = hostname.toLowerCase();
      const matchedScam = SCAM_PATTERNS.find(pattern => lowerHostname.includes(pattern));
      if (matchedScam) {
        setVerifyResult({
          isOfficial: false,
          isScam: true,
          message: `WARNING: This looks like a SCAM site! (matches pattern: ${matchedScam})`
        });
        return;
      }

      // Unknown domain
      setVerifyResult({
        isOfficial: false,
        message: 'This is NOT an official La Bolita domain. Proceed with extreme caution.'
      });
    } catch (e) {
      setVerifyResult({ isOfficial: false, message: 'Invalid URL format.' });
    }
  }, []);

  // Render copy button
  const CopyButton = ({ text, itemId }) => (
    <button
      onClick={() => copyToClipboard(text, itemId)}
      className="copy-btn"
      title={copiedItem === itemId ? 'Copied!' : 'Copy to clipboard'}
      aria-label={`Copy ${text} to clipboard`}
    >
      {copiedItem === itemId ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="info-page official-links-page">
      <h1>Official Links</h1>
      <p className="page-subtitle">
        Verify you're using official La Bolita channels. Scammers often create fake websites and accounts.
      </p>

      {/* Current site verification banner */}
      <div className={`site-verification-banner ${isOfficialSite ? 'verified' : 'warning'}`} role="alert">
        {isOfficialSite ? (
          <>
            <span className="verification-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 12 15 16 10" />
              </svg>
            </span>
            <div>
              <strong>You are on the OFFICIAL La Bolita website</strong>
              <span className="current-url">{currentUrl}</span>
            </div>
          </>
        ) : (
          <>
            <span className="verification-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <div>
              <strong>WARNING: Verify this is the official site!</strong>
              <span className="current-url">{currentUrl}</span>
            </div>
          </>
        )}
      </div>

      {/* URL Verification Tool */}
      <div className="url-verify-tool">
        <h2>URL Verification Tool</h2>
        <p>Paste any URL to check if it's an official La Bolita site:</p>
        <div className="verify-input-group">
          <input
            type="text"
            value={verifyInput}
            onChange={(e) => setVerifyInput(e.target.value)}
            placeholder="e.g., labolita.io or https://example.com"
            className="verify-input"
            aria-label="URL to verify"
          />
          <button
            onClick={() => verifyUrl(verifyInput)}
            className="verify-btn"
            disabled={!verifyInput.trim()}
          >
            Verify URL
          </button>
        </div>
        {verifyResult && (
          <div className={`verify-result ${verifyResult.isOfficial ? 'official' : verifyResult.isScam ? 'scam' : 'unknown'}`} role="alert">
            {verifyResult.isOfficial ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={verifyResult.isScam ? '#ef4444' : '#f59e0b'} strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
            <span>{verifyResult.message}</span>
          </div>
        )}
      </div>

      <div className="warning-box">
        <p>
          <strong>Anti-Phishing Warning:</strong> Always double-check URLs before connecting your wallet.
          Bookmark this page for easy reference.
        </p>
      </div>

      <h2>Official Website</h2>
      <div className="official-link-card verified">
        <div className="link-header">
          <span className="verified-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            OFFICIAL
          </span>
        </div>
        <div className="link-content">
          <span className="label">Main Website</span>
          <div className="address-row">
            <span className="address">https://labolita.io</span>
            <CopyButton text="https://labolita.io" itemId="website" />
          </div>
        </div>
      </div>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
        Always ensure you see "https://" and the correct domain in your browser's address bar.
      </p>

      <h2>Smart Contracts (Polygon Mainnet)</h2>
      <p>
        All contracts are verified and open source. Always verify contract addresses before interacting:
      </p>

      <div className="official-link-card contract">
        <div className="link-header">
          <span className="contract-badge">SMART CONTRACT</span>
        </div>
        <div className="link-content">
          <span className="label">La Bolita Main Contract</span>
          <div className="address-row">
            <code className="contract-address-code">{CONTRACT_ADDRESS}</code>
            <CopyButton text={CONTRACT_ADDRESS} itemId="main-contract" />
          </div>
          <a
            href={`https://polygonscan.com/address/${CONTRACT_ADDRESS}#code`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Verify on PolygonScan
          </a>
        </div>
      </div>

      <div className="official-link-card contract">
        <div className="link-header">
          <span className="contract-badge">TOKEN</span>
        </div>
        <div className="link-content">
          <span className="label">USDT Token (Polygon)</span>
          <div className="address-row">
            <code className="contract-address-code">{TOKEN_ADDRESS}</code>
            <CopyButton text={TOKEN_ADDRESS} itemId="token" />
          </div>
          <a
            href={`https://polygonscan.com/token/${TOKEN_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Verify on PolygonScan
          </a>
        </div>
      </div>

      <div className="official-link-card contract">
        <div className="link-header">
          <span className="contract-badge">CHAINLINK VRF</span>
        </div>
        <div className="link-content">
          <span className="label">VRF Coordinator (Polygon)</span>
          <div className="address-row">
            <code className="contract-address-code">{VRF_COORDINATOR}</code>
            <CopyButton text={VRF_COORDINATOR} itemId="vrf" />
          </div>
          <a
            href={`https://polygonscan.com/address/${VRF_COORDINATOR}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Verify on PolygonScan
          </a>
        </div>
      </div>

      <h2>Official Social Media</h2>
      <div className="social-links-grid">
        <div className="official-link-card social telegram">
          <div className="link-content">
            <span className="social-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </span>
            <span className="label">Telegram</span>
            <span className="handle">t.me/labolita</span>
            <a href="https://t.me/labolita" target="_blank" rel="noopener noreferrer" className="social-link-btn">
              Join Community
            </a>
          </div>
        </div>

        <div className="official-link-card social twitter">
          <div className="link-content">
            <span className="social-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </span>
            <span className="label">Twitter / X</span>
            <span className="handle">@labolita</span>
            <a href="https://twitter.com/labolita" target="_blank" rel="noopener noreferrer" className="social-link-btn">
              Follow Us
            </a>
          </div>
        </div>

        <div className="official-link-card social discord">
          <div className="link-content">
            <span className="social-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
              </svg>
            </span>
            <span className="label">Discord</span>
            <span className="handle">discord.gg/labolita</span>
            <a href="https://discord.gg/labolita" target="_blank" rel="noopener noreferrer" className="social-link-btn">
              Join Server
            </a>
          </div>
        </div>
      </div>

      <h2>Official Email Addresses</h2>
      <div className="email-grid">
        <div className="email-card">
          <span className="email-type">Support</span>
          <div className="email-row">
            <span className="email-address">support@labolita.io</span>
            <CopyButton text="support@labolita.io" itemId="email-support" />
          </div>
        </div>
        <div className="email-card">
          <span className="email-type">Security</span>
          <div className="email-row">
            <span className="email-address">security@labolita.io</span>
            <CopyButton text="security@labolita.io" itemId="email-security" />
          </div>
        </div>
        <div className="email-card">
          <span className="email-type">Business</span>
          <div className="email-row">
            <span className="email-address">business@labolita.io</span>
            <CopyButton text="business@labolita.io" itemId="email-business" />
          </div>
        </div>
      </div>

      <h2>How to Identify Scams</h2>
      <p>La Bolita will NEVER:</p>
      <ul>
        <li>Ask for your seed phrase or private keys</li>
        <li>Ask you to send funds to "verify" your account</li>
        <li>Contact you first about prizes or winnings</li>
        <li>Offer guaranteed wins or investment opportunities</li>
        <li>Ask you to install special software or browser extensions</li>
        <li>Request remote access to your computer</li>
      </ul>

      <h2>Red Flags to Watch For</h2>
      <ul>
        <li>URLs that look similar but aren't exact (e.g., "la-bolita.io", "labolita.net")</li>
        <li>Social media accounts with slightly different names</li>
        <li>Unsolicited DMs claiming you've won something</li>
        <li>Pressure to act quickly or "limited time" offers</li>
        <li>Requests to share your screen</li>
        <li>Any promise of guaranteed returns</li>
      </ul>

      <h2>If You Think You've Been Scammed</h2>
      <ol>
        <li>Stop all communication with the scammer immediately</li>
        <li>Do NOT send any more funds</li>
        <li>If you shared your seed phrase, transfer funds to a new wallet immediately</li>
        <li>Report the scam to our official channels</li>
        <li>Report fake accounts/websites to the platform hosting them</li>
      </ol>

      <div className="highlight-box">
        <p>
          <strong>When in doubt, ask in our official Telegram group.</strong> Community moderators can verify if communication is legitimate.
        </p>
      </div>
    </div>
  );
}

export default OfficialLinksPage;
