import React from 'react';
import { Link } from 'react-router-dom';
import '../../components/layout/Layout.css';

function FairnessPage() {
  return (
    <div className="info-page">
      <h1>Provably Fair</h1>
      <p className="page-subtitle">
        Every result on La Bolita is verifiably random and cannot be manipulated by anyone - not even us.
      </p>

      <div className="info-box">
        <p><strong>Chainlink VRF:</strong> We use Chainlink's Verifiable Random Function, the industry standard for provably fair randomness on blockchain.</p>
      </div>

      <h2>What is Chainlink VRF?</h2>
      <p>
        Chainlink VRF (Verifiable Random Function) is a provably fair and verifiable random number generator (RNG) that enables smart contracts to access random values without compromising security or usability.
      </p>
      <p>Key properties:</p>
      <ul>
        <li><strong>Unpredictable:</strong> No one can predict the outcome before it's generated</li>
        <li><strong>Verifiable:</strong> Anyone can verify that the result wasn't manipulated</li>
        <li><strong>Tamper-proof:</strong> Neither the operator nor miners can influence the outcome</li>
        <li><strong>On-chain:</strong> The entire process is recorded on the blockchain</li>
      </ul>

      <h2>How It Works</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>1. Draw Closes</h3>
          <p>When betting closes, our smart contract requests a random number from Chainlink VRF.</p>
        </div>
        <div className="info-card">
          <h3>2. VRF Generates</h3>
          <p>Chainlink oracles generate a verifiable random number using their secure, decentralized process.</p>
        </div>
        <div className="info-card">
          <h3>3. Proof Provided</h3>
          <p>The random number comes with a cryptographic proof that it was generated fairly.</p>
        </div>
        <div className="info-card">
          <h3>4. Results Set</h3>
          <p>Our contract uses the random number to determine winning numbers - this is automatic and cannot be overridden.</p>
        </div>
      </div>

      <h2>Why Can't Results Be Manipulated?</h2>
      <ul>
        <li>
          <strong>No Admin Override:</strong> The smart contract automatically processes VRF results. There is no function to manually set or change winning numbers.
        </li>
        <li>
          <strong>Immutable Code:</strong> The contract logic is verified on PolygonScan and cannot be changed after deployment.
        </li>
        <li>
          <strong>Decentralized Oracles:</strong> Chainlink VRF uses multiple independent oracle nodes, preventing single points of failure or manipulation.
        </li>
        <li>
          <strong>Cryptographic Proof:</strong> Each random number comes with a proof that can be verified against the Chainlink oracle's public key.
        </li>
      </ul>

      <h2>How to Verify Results</h2>
      <p>Anyone can verify that a draw result was fairly generated:</p>

      <h3>Step 1: Find the Draw Transaction</h3>
      <p>
        Go to <a href="https://polygonscan.com" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>PolygonScan</a> and find the transaction where results were submitted.
        Look for the <code>ResultsSubmitted</code> or <code>LotteryResultsGenerated</code> event.
      </p>

      <h3>Step 2: Check the VRF Request</h3>
      <p>
        In the transaction, you'll find:
      </p>
      <ul>
        <li><code>vrfRequestId</code>: The unique ID for the randomness request</li>
        <li><code>vrfRandomWord</code>: The random number provided by Chainlink</li>
      </ul>

      <h3>Step 3: Verify on Chainlink</h3>
      <p>
        You can verify the VRF request on the{' '}
        <a href="https://vrf.chain.link" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
          Chainlink VRF Explorer
        </a>
        {' '}to confirm the random number was legitimately generated.
      </p>

      <h3>Step 4: Check the Math</h3>
      <p>
        The winning numbers are derived from the VRF random word using deterministic functions in the smart contract.
        You can verify this by reading the contract source code on PolygonScan.
      </p>

      <h2>Technical Details</h2>
      <div className="contract-address">
        <div>
          <span className="label">VRF Coordinator (Polygon)</span>
          <span className="address">0xAE975071Be8F8eE67addBC1A82488F1C24858067</span>
        </div>
        <a href="https://polygonscan.com/address/0xAE975071Be8F8eE67addBC1A82488F1C24858067" target="_blank" rel="noopener noreferrer">
          View Contract →
        </a>
      </div>

      <h3>VRF Configuration</h3>
      <ul>
        <li><strong>Network:</strong> Polygon Mainnet</li>
        <li><strong>Confirmations:</strong> 3 blocks</li>
        <li><strong>Key Hash:</strong> Used to identify which oracle serves the request</li>
      </ul>

      <h2>Transparency Commitment</h2>
      <p>We commit to:</p>
      <ul>
        <li>Never implementing any function to manually set or override results</li>
        <li>Keeping all contracts verified and open source</li>
        <li>Providing clear documentation for verification</li>
        <li>Using only industry-standard randomness solutions</li>
      </ul>

      <div className="highlight-box">
        <p>
          <strong>Important:</strong> If anyone claims to know winning numbers in advance or offers to manipulate results, they are scammers.
          Results are mathematically impossible to predict or change.
        </p>
      </div>

      <h2>Learn More</h2>
      <ul>
        <li>
          <a href="https://chain.link/vrf" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
            Chainlink VRF Documentation
          </a>
        </li>
        <li>
          <a href="https://docs.chain.link/vrf/v2/introduction" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>
            VRF Technical Reference
          </a>
        </li>
        <li>
          <Link to="/transparency" style={{ color: '#FFD700' }}>
            View Our Contract Addresses
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default FairnessPage;
