import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../components/layout/Layout.css';

function FairnessPage() {
  const { t } = useTranslation('common');

  return (
    <div className="info-page">
      <h1>{t('fairness.title')}</h1>
      <p className="page-subtitle">
        {t('fairness.subtitle')}
      </p>

      <div className="info-box">
        <p dangerouslySetInnerHTML={{ __html: t('fairness.vrf_intro') }} />
      </div>

      <h2>{t('fairness.what_is_vrf')}</h2>
      <p>{t('fairness.vrf_desc')}</p>
      <p>{t('fairness.key_properties')}</p>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t('fairness.prop_unpredictable') }} />
        <li dangerouslySetInnerHTML={{ __html: t('fairness.prop_verifiable') }} />
        <li dangerouslySetInnerHTML={{ __html: t('fairness.prop_tamperproof') }} />
        <li dangerouslySetInnerHTML={{ __html: t('fairness.prop_onchain') }} />
      </ul>

      <h2>{t('fairness.how_it_works')}</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>{t('fairness.step1_title')}</h3>
          <p>{t('fairness.step1_desc')}</p>
        </div>
        <div className="info-card">
          <h3>{t('fairness.step2_title')}</h3>
          <p>{t('fairness.step2_desc')}</p>
        </div>
        <div className="info-card">
          <h3>{t('fairness.step3_title')}</h3>
          <p>{t('fairness.step3_desc')}</p>
        </div>
        <div className="info-card">
          <h3>{t('fairness.step4_title')}</h3>
          <p>{t('fairness.step4_desc')}</p>
        </div>
      </div>

      <h2>{t('fairness.why_no_manipulate')}</h2>
      <ul>
        <li dangerouslySetInnerHTML={{ __html: t('fairness.no_admin') }} />
        <li dangerouslySetInnerHTML={{ __html: t('fairness.immutable') }} />
        <li dangerouslySetInnerHTML={{ __html: t('fairness.decentralized') }} />
        <li dangerouslySetInnerHTML={{ __html: t('fairness.crypto_proof') }} />
      </ul>

      <h2>{t('fairness.verify_title')}</h2>
      <p>{t('fairness.verify_desc')}</p>

      <h3>{t('fairness.verify_step1')}</h3>
      <p dangerouslySetInnerHTML={{ __html: t('fairness.verify_step1_desc') }} />

      <h3>{t('fairness.verify_step2')}</h3>
      <p>{t('fairness.verify_step2_desc')}</p>
      <ul>
        <li><code>serverSeed</code>: The server-generated seed used for the draw</li>
        <li><code>clientSeed</code>: Your unique client seed</li>
        <li><code>nonce</code>: Atomic counter ensuring unique results</li>
      </ul>

      <h3>{t('fairness.verify_step3')}</h3>
      <p>
        {t('fairness.verify_step3_desc')}
      </p>

      <h3>{t('fairness.verify_step4')}</h3>
      <p>{t('fairness.verify_step4_desc')}</p>

      <h2>{t('fairness.technical')}</h2>

      <h3>How to Verify a Keno Game</h3>
      <p>
        After each game, you receive a <code>gameId</code>. Use the verification endpoint to check the result:
      </p>
      <div className="contract-address">
        <div>
          <span className="label">Verification Endpoint</span>
          <span className="address">GET /api/keno/verify/:gameId</span>
        </div>
      </div>
      <p>
        The endpoint returns the server seed, client seed, nonce, and the SHA-256 hash used to generate the drawn numbers. You can independently recompute the hash to confirm the result was not tampered with.
      </p>

      <h3>Roadmap: On-Chain VRF</h3>
      <p>
        We are working on migrating to Chainlink VRF for fully on-chain verifiable randomness. This will be available in a future update.
      </p>

      <h2>{t('fairness.commitment')}</h2>
      <p>{t('fairness.commitment_desc')}</p>
      <ul>
        <li>{t('fairness.commit1')}</li>
        <li>{t('fairness.commit2')}</li>
        <li>{t('fairness.commit3')}</li>
        <li>{t('fairness.commit4')}</li>
      </ul>

      <div className="highlight-box">
        <p dangerouslySetInnerHTML={{ __html: t('fairness.scam_warning') }} />
      </div>

      <h2>{t('fairness.learn_more')}</h2>
      <ul>
        <li>
          <a href="https://en.wikipedia.org/wiki/SHA-2" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
            {t('fairness.chainlink_docs')}
          </a>
        </li>
        <li>
          <a href="https://en.wikipedia.org/wiki/Provably_fair" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
            {t('fairness.vrf_reference')}
          </a>
        </li>
        <li>
          <Link to="/transparency" style={{ color: '#FFD700' }}>
            {t('fairness.view_contracts')}
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default FairnessPage;
