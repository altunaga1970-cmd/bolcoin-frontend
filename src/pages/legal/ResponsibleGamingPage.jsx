import React from 'react';
import '../../components/layout/Layout.css';

function ResponsibleGamingPage() {
  return (
    <div className="legal-page">
      <h1>Responsible Gaming</h1>
      <p className="last-updated">Last updated: January 20, 2026</p>

      <div className="warning-box">
        <p><strong>Important:</strong> Gambling should be entertainment, not a way to make money. If gambling stops being fun, it's time to stop.</p>
      </div>

      <h2>Our Commitment</h2>
      <p>
        La Bolita is committed to promoting responsible gambling. We believe that gambling should be an enjoyable form of entertainment, conducted in a safe environment. We encourage all our users to gamble responsibly.
      </p>

      <h2>Know the Signs</h2>
      <p>Problem gambling can affect anyone. Warning signs include:</p>
      <ul>
        <li>Spending more money or time gambling than you can afford</li>
        <li>Gambling to escape problems or relieve feelings of anxiety or depression</li>
        <li>Chasing losses - trying to win back money you've lost</li>
        <li>Borrowing money or selling possessions to fund gambling</li>
        <li>Neglecting work, family, or personal needs because of gambling</li>
        <li>Lying about how much time or money you spend gambling</li>
        <li>Feeling restless or irritable when trying to cut down on gambling</li>
        <li>Failed attempts to control, cut back, or stop gambling</li>
      </ul>

      <h2>Tips for Responsible Gambling</h2>
      <ul>
        <li><strong>Set a budget:</strong> Only gamble with money you can afford to lose. Never use money meant for essentials.</li>
        <li><strong>Set time limits:</strong> Decide in advance how much time you'll spend gambling and stick to it.</li>
        <li><strong>Don't chase losses:</strong> Accept losses as part of the game. Trying to win back losses usually leads to bigger losses.</li>
        <li><strong>Balance gambling with other activities:</strong> Don't let gambling become your only form of entertainment.</li>
        <li><strong>Don't gamble when emotional:</strong> Avoid gambling when you're stressed, depressed, or under the influence of alcohol or drugs.</li>
        <li><strong>Take breaks:</strong> Regular breaks help you stay in control and make better decisions.</li>
        <li><strong>Never borrow to gamble:</strong> If you need to borrow money to gamble, it's a sign you should stop.</li>
      </ul>

      <h2>Self-Assessment</h2>
      <p>Ask yourself these questions:</p>
      <ol>
        <li>Do you spend more time or money on gambling than you intended?</li>
        <li>Have people criticized your gambling or told you that you have a problem?</li>
        <li>Have you felt guilty about the way you gamble or what happens when you gamble?</li>
        <li>Have you tried to win back money you've lost (chasing losses)?</li>
        <li>Have you borrowed money or sold anything to finance gambling?</li>
        <li>Do you feel like you might have a problem with gambling?</li>
      </ol>
      <p>If you answered "yes" to any of these questions, you may want to seek help.</p>

      <h2>Getting Help</h2>
      <p>If you or someone you know has a gambling problem, help is available:</p>

      <div className="info-cards" style={{ marginTop: '1rem' }}>
        <div className="info-card">
          <h3>Gamblers Anonymous</h3>
          <p>A fellowship of men and women who share their experience, strength and hope with each other.</p>
          <p><a href="https://www.gamblersanonymous.org" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>www.gamblersanonymous.org</a></p>
        </div>

        <div className="info-card">
          <h3>National Council on Problem Gambling</h3>
          <p>Provides resources, support, and referrals for problem gamblers and their families.</p>
          <p><a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>www.ncpgambling.org</a></p>
        </div>

        <div className="info-card">
          <h3>BeGambleAware</h3>
          <p>Free, confidential help and support for anyone affected by gambling.</p>
          <p><a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>www.begambleaware.org</a></p>
        </div>

        <div className="info-card">
          <h3>GamCare</h3>
          <p>Offers free information, support, and counseling for problem gamblers.</p>
          <p><a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>www.gamcare.org.uk</a></p>
        </div>
      </div>

      <h2>Platform Limits</h2>
      <p>La Bolita enforces the following limits to promote responsible gambling:</p>
      <ul>
        <li><strong>Bet Limits:</strong> Maximum bet of 1,000 USDT per number in La Bolita games</li>
        <li><strong>Ticket Limits:</strong> Maximum 8 tickets per transaction in La Fortuna</li>
        <li><strong>No Credit:</strong> All bets require immediate payment from your wallet</li>
      </ul>

      <h2>Taking a Break</h2>
      <p>
        If you feel you need a break from gambling, simply disconnect your wallet and step away from the platform. Since La Bolita is non-custodial, there are no accounts to close - you simply stop interacting with the smart contracts.
      </p>

      <h2>Underage Gambling</h2>
      <p>
        La Bolita is strictly for adults. You must be at least 18 years old (or the legal gambling age in your jurisdiction) to use our platform. We encourage parents to:
      </p>
      <ul>
        <li>Keep wallet credentials secure and away from minors</li>
        <li>Use parental control software to block gambling websites</li>
        <li>Educate children about the risks of gambling</li>
      </ul>

      <div className="highlight-box">
        <p><strong>Remember:</strong> Gambling should be fun. If it's not fun anymore, take a break. Your wellbeing is more important than any game.</p>
      </div>
    </div>
  );
}

export default ResponsibleGamingPage;
