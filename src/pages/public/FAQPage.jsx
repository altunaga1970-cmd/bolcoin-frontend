import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../components/layout/Layout.css';

function FAQPage() {
  const { t } = useTranslation('common');
  const [openItems, setOpenItems] = useState({});

  const FAQ_DATA = useMemo(() => [
    {
      category: t('faq.cat_getting_started'),
      questions: [
        { q: t('faq.q_what_need'), a: t('faq.a_what_need') },
        { q: t('faq.q_get_usdt'), a: t('faq.a_get_usdt') },
        { q: t('faq.q_min_deposit'), a: t('faq.a_min_deposit') },
        { q: t('faq.q_non_custodial'), a: t('faq.a_non_custodial') }
      ]
    },
    {
      category: t('faq.cat_games'),
      questions: [
        { q: t('faq.q_what_games'), a: t('faq.a_what_games') },
        { q: t('faq.q_when_draws'), a: t('faq.a_when_draws') },
        { q: t('faq.q_max_bets'), a: t('faq.a_max_bets') },
        { q: t('faq.q_multiple_numbers'), a: t('faq.a_multiple_numbers') }
      ]
    },
    {
      category: t('faq.cat_prizes'),
      questions: [
        { q: t('faq.q_how_know_won'), a: t('faq.a_how_know_won') },
        { q: t('faq.q_claim_winnings'), a: t('faq.a_claim_winnings') },
        { q: t('faq.q_claim_deadline'), a: t('faq.a_claim_deadline') },
        { q: t('faq.q_jackpot_cap'), a: t('faq.a_jackpot_cap') }
      ]
    },
    {
      category: t('faq.cat_fairness'),
      questions: [
        { q: t('faq.q_results_fair'), a: t('faq.a_results_fair') },
        { q: t('faq.q_manipulate'), a: t('faq.a_manipulate') },
        { q: t('faq.q_audited'), a: t('faq.a_audited') },
        { q: t('faq.q_wallet_safe'), a: t('faq.a_wallet_safe') }
      ]
    },
    {
      category: t('faq.cat_technical'),
      questions: [
        { q: t('faq.q_wallets_supported'), a: t('faq.a_wallets_supported') },
        { q: t('faq.q_why_matic'), a: t('faq.a_why_matic') },
        { q: t('faq.q_tx_stuck'), a: t('faq.a_tx_stuck') },
        { q: t('faq.q_website_down'), a: t('faq.a_website_down') }
      ]
    },
    {
      category: t('faq.cat_legal'),
      questions: [
        { q: t('faq.q_is_legal'), a: t('faq.a_is_legal') },
        { q: t('faq.q_restricted_countries'), a: t('faq.a_restricted_countries') },
        { q: t('faq.q_vpn'), a: t('faq.a_vpn') },
        { q: t('faq.q_min_age'), a: t('faq.a_min_age') }
      ]
    }
  ], [t]);

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="info-page">
      <h1>{t('faq.title')}</h1>
      <p className="page-subtitle">
        {t('faq.subtitle')}
      </p>

      {FAQ_DATA.map((category, catIndex) => (
        <div key={catIndex} style={{ marginBottom: '2rem' }}>
          <h2>{category.category}</h2>
          {category.questions.map((item, qIndex) => {
            const key = `${catIndex}-${qIndex}`;
            const isOpen = openItems[key];
            return (
              <div key={qIndex} className="faq-item">
                <div
                  className="faq-question"
                  onClick={() => toggleItem(catIndex, qIndex)}
                >
                  <span>{item.q}</span>
                  <span style={{ color: '#FFD700' }}>{isOpen ? '−' : '+'}</span>
                </div>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <h2>{t('faq.still_questions')}</h2>
      <p>
        {t('faq.still_questions_desc')}{' '}
        <Link to="/contact" style={{ color: '#FFD700' }}>Contact</Link>
        {' | '}
        <a href="https://t.me/labolita" target="_blank" rel="noopener noreferrer" style={{ color: '#FFD700' }}>Telegram</a>
      </p>
    </div>
  );
}

export default FAQPage;
