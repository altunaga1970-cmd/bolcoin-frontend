import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav, Footer } from '../../components/layout';
import './HomePage.css';

/* ── Intersection Observer hook for scroll animations ── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

/* ── Animated section wrapper ── */
function AnimSection({ children, className = '', delay = 0 }) {
  const [ref, isVisible] = useInView();
  return (
    <section
      ref={ref}
      className={`anim-section ${isVisible ? 'anim-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

/* ── Game Card Icons (SVG) ── */
const GameIcons = {
  bolita: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <circle cx="24" cy="24" r="12" fill="currentColor" opacity="0.15"/>
      <text x="24" y="29" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="700">42</text>
    </svg>
  ),
  fortuna: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,4 29,18 44,18 32,27 36,42 24,33 12,42 16,27 4,18 19,18" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.15"/>
    </svg>
  ),
  keno: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="14" height="14" rx="3" fill="currentColor" opacity="0.25"/>
      <rect x="28" y="6" width="14" height="14" rx="3" fill="currentColor" opacity="0.15"/>
      <rect x="6" y="28" width="14" height="14" rx="3" fill="currentColor" opacity="0.15"/>
      <rect x="28" y="28" width="14" height="14" rx="3" fill="currentColor" opacity="0.35"/>
    </svg>
  ),
  bingo: (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
      <circle cx="18" cy="18" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="30" cy="18" r="3" fill="currentColor" opacity="0.2"/>
      <circle cx="18" cy="30" r="3" fill="currentColor" opacity="0.2"/>
      <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.4"/>
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
};

/* ── Feature Icons ── */
const FeatureIcons = {
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  random: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
};

function HomePage() {
  const { t } = useTranslation('games');
  const { isConnected, connectWallet, isConnecting } = useWeb3();
  const {
    getAllDraws,
    getOpenLotteryDraws,
    getLotteryDraw,
    getJackpotInfo,
    isConnected: contractReady
  } = useContract();

  const [latestBolitaResults, setLatestBolitaResults] = useState([]);
  const [latestFortunaResults, setLatestFortunaResults] = useState([]);
  const [jackpotInfo, setJackpotInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      const allDraws = await getAllDraws();
      const completedBolita = allDraws
        .filter(d => d.status === 'completed')
        .slice(0, 3);
      setLatestBolitaResults(completedBolita);

      const jackpot = await getJackpotInfo();
      setJackpotInfo(jackpot);

      try {
        const openLottery = await getOpenLotteryDraws();
        setLatestFortunaResults([]);
      } catch (err) {
        console.log('La Fortuna results not available:', err);
      }
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  }, [getAllDraws, getJackpotInfo, getOpenLotteryDraws]);

  useEffect(() => {
    if (contractReady) {
      loadResults();
    } else {
      setLoading(false);
    }
  }, [contractReady, loadResults]);

  /* Game card data */
  const games = [
    {
      key: 'bolita',
      title: t('home.la_bolita'),
      subtitle: t('home.traditional_lottery'),
      color: 'var(--color-bolita)',
      path: '/bet',
      cta: t('home.play_la_bolita'),
      icon: GameIcons.bolita,
    },
    {
      key: 'fortuna',
      title: t('home.la_fortuna'),
      subtitle: t('home.lottery_5_54'),
      color: 'var(--color-fortuna)',
      path: '/fortuna',
      cta: t('home.play_la_fortuna'),
      icon: GameIcons.fortuna,
    },
    {
      key: 'keno',
      title: t('home.keno', 'Keno'),
      subtitle: t('home.instant_result'),
      color: 'var(--color-keno)',
      path: '/keno',
      cta: t('home.play_keno'),
      icon: GameIcons.keno,
    },
    {
      key: 'bingo',
      title: t('home.bingo', 'Bingo'),
      subtitle: t('home.bingo_subtitle', 'Multiplayer bingo with 4 rooms'),
      color: 'var(--color-bingo)',
      path: '/bingo',
      cta: t('home.play_bingo', 'Play Bingo'),
      icon: GameIcons.bingo,
    },
  ];

  const features = [
    { icon: FeatureIcons.shield, title: t('home.non_custodial'), desc: t('home.non_custodial_desc') },
    { icon: FeatureIcons.cube, title: t('home.on_chain'), desc: t('home.on_chain_desc') },
    { icon: FeatureIcons.random, title: t('home.chainlink_vrf'), desc: t('home.chainlink_vrf_desc') },
    { icon: FeatureIcons.bolt, title: t('home.instant_payouts'), desc: t('home.instant_payouts_desc') },
  ];

  return (
    <div className="home-page">
      <MainNav />

      <main className="home-main">
        {/* ── Hero ── */}
        <section className="home-hero">
          <div className="hero-glow" aria-hidden="true" />
          <div className="home-hero-content">
            <h1 className="home-hero-title">{t('home.hero_title')}</h1>
            <p className="home-hero-subtitle">{t('home.hero_subtitle')}</p>

            {!isConnected ? (
              <div className="hero-connect">
                <Button
                  size="lg"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? t('home.connect_wallet') + '...' : t('home.connect_wallet')}
                </Button>
              </div>
            ) : (
              <div className="hero-games-grid">
                {games.map((game, i) => (
                  <Link
                    key={game.key}
                    to={game.path}
                    className={`hero-game-card hero-game-card--${game.key}`}
                    style={{ '--accent': game.color, animationDelay: `${i * 80}ms` }}
                  >
                    <div className="hero-game-card__icon">{game.icon}</div>
                    <div className="hero-game-card__info">
                      <span className="hero-game-card__title">{game.title}</span>
                      <span className="hero-game-card__sub">{game.subtitle}</span>
                    </div>
                    <svg className="hero-game-card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Latest Results ── */}
        <AnimSection className="home-results">
          <div className="section-container">
            <h2 className="section-heading">{t('home.latest_results')}</h2>

            {loading ? (
              <div className="results-loading">
                <Spinner size="md" />
                <p>{t('home.loading_results')}</p>
              </div>
            ) : (
              <div className="results-grid">
                {/* La Bolita */}
                <div className="results-card">
                  <div className="results-card__header">
                    <span className="results-card__dot" style={{ background: 'var(--color-bolita)' }} />
                    <h3>{t('home.la_bolita')}</h3>
                  </div>
                  {latestBolitaResults.length > 0 ? (
                    <div className="results-card__list">
                      {latestBolitaResults.map(draw => (
                        <div key={draw.id} className="result-row">
                          <span className="result-row__date">
                            {new Date(draw.scheduled_time).toLocaleDateString(undefined, {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <div className="result-row__numbers">
                            {draw.winning_fijos && (
                              <span className="result-chip">{draw.winning_fijos}</span>
                            )}
                            {draw.winning_centenas && (
                              <span className="result-chip result-chip--dim">{draw.winning_centenas}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="results-card__empty">{t('home.no_recent_results')}</p>
                  )}
                  <Link to="/results" className="results-card__link">
                    {t('home.view_all_results')}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>

                {/* La Fortuna */}
                <div className="results-card results-card--fortuna">
                  <div className="results-card__header">
                    <span className="results-card__dot" style={{ background: 'var(--color-fortuna)' }} />
                    <h3>{t('home.la_fortuna')}</h3>
                  </div>
                  {jackpotInfo && (
                    <div className="jackpot-banner">
                      <span className="jackpot-banner__label">{t('home.current_jackpot')}</span>
                      <span className="jackpot-banner__amount">
                        ${parseFloat(jackpotInfo.jackpot || 0).toLocaleString()} USDT
                      </span>
                    </div>
                  )}
                  {latestFortunaResults.length > 0 ? (
                    <div className="results-card__list">
                      {latestFortunaResults.map(draw => (
                        <div key={draw.id} className="result-row">
                          <span className="result-row__date">
                            {new Date(draw.scheduledTime).toLocaleDateString(undefined, {
                              day: 'numeric', month: 'short'
                            })}
                          </span>
                          <div className="result-row__numbers">
                            {draw.winningNumbers.map((num, idx) => (
                              <span key={idx} className="fortuna-ball">{num}</span>
                            ))}
                            <span className="fortuna-sep">+</span>
                            <span className="fortuna-ball fortuna-ball--key">{draw.keyNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="results-card__empty">{t('home.next_draw')}</p>
                  )}
                  <Link to="/results" className="results-card__link">
                    {t('home.view_all_results')}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </AnimSection>

        {/* ── Schedule ── */}
        <AnimSection className="home-schedule">
          <div className="section-container">
            <h2 className="section-heading">{t('home.draw_schedule')}</h2>
            <div className="schedule-grid">
              {[
                { key: 'bolita', name: t('home.la_bolita'), times: ['08:00', '12:00', '20:00'], freq: t('home.every_day'), color: 'var(--color-bolita)' },
                { key: 'fortuna', name: t('home.la_fortuna'), times: ['21:00'], freq: t('home.wed_sat'), color: 'var(--color-fortuna)' },
                { key: 'keno', name: t('home.keno', 'Keno'), times: [t('home.instant', 'Instant')], freq: t('home.play_anytime', 'Play anytime'), color: 'var(--color-keno)', instant: true },
                { key: 'bingo', name: t('home.bingo', 'Bingo'), times: [t('home.every_45s', 'Every 45s')], freq: t('home.four_rooms', '4 rooms, 24/7'), color: 'var(--color-bingo)', instant: true },
              ].map((s, i) => (
                <div
                  key={s.key}
                  className="schedule-tile"
                  style={{ '--tile-accent': s.color }}
                >
                  <span className="schedule-tile__accent" />
                  <h3 className="schedule-tile__name">{s.name}</h3>
                  <div className="schedule-tile__times">
                    {s.times.map((t, j) => (
                      <span key={j} className={`schedule-tile__badge ${s.instant ? 'schedule-tile__badge--live' : ''}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="schedule-tile__freq">{s.freq}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimSection>

        {/* ── Games Detail ── */}
        <AnimSection className="home-games">
          <div className="section-container">
            <h2 className="section-heading">{t('home.available_games')}</h2>

            {/* La Bolita */}
            <div className="game-detail game-detail--bolita">
              <div className="game-detail__header">
                <div className="game-detail__icon-wrap" style={{ '--gd-accent': 'var(--color-bolita)' }}>
                  {GameIcons.bolita}
                </div>
                <div>
                  <h3>{t('home.la_bolita')}</h3>
                  <p>{t('home.traditional_lottery')}</p>
                </div>
              </div>
              <div className="game-detail__types">
                <div className="game-type-pill">
                  <span className="game-type-pill__name">{t('home.fijo')}</span>
                  <span className="game-type-pill__desc">{t('home.fijo_desc')}</span>
                </div>
                <div className="game-type-pill">
                  <span className="game-type-pill__name">{t('home.centena')}</span>
                  <span className="game-type-pill__desc">{t('home.centena_desc')}</span>
                </div>
                <div className="game-type-pill">
                  <span className="game-type-pill__name">{t('home.parle')}</span>
                  <span className="game-type-pill__desc">{t('home.parle_desc')}</span>
                </div>
              </div>
              <div className="game-detail__cta">
                <Link to="/bet"><Button variant="primary">{t('home.play_la_bolita')}</Button></Link>
                <Link to="/how-it-works" className="game-detail__learn">{t('home.how_it_works')}</Link>
              </div>
            </div>

            {/* La Fortuna */}
            <div className="game-detail game-detail--fortuna">
              <div className="game-detail__header">
                <div className="game-detail__icon-wrap" style={{ '--gd-accent': 'var(--color-fortuna)' }}>
                  {GameIcons.fortuna}
                </div>
                <div>
                  <h3 style={{ color: 'var(--color-fortuna)' }}>{t('home.la_fortuna')}</h3>
                  <p>{t('home.lottery_5_54')}</p>
                </div>
              </div>
              <div className="fortuna-prizes-grid">
                <p className="fortuna-intro" dangerouslySetInnerHTML={{ __html: t('home.choose_numbers') }} />
                <div className="fortuna-tiers">
                  {[
                    { tier: t('home.five_plus_key'), prize: t('home.jackpot_tier'), highlight: true },
                    { tier: t('home.five_numbers'), prize: t('home.second_tier') },
                    { tier: t('home.four_plus_key'), prize: t('home.third_tier') },
                    { tier: t('home.four_numbers'), prize: t('home.fourth_tier') },
                    { tier: t('home.three_plus_key'), prize: t('home.fifth_tier') },
                    { tier: t('home.three_numbers'), prize: t('home.sixth_tier') },
                  ].map((p, i) => (
                    <div key={i} className={`fortuna-tier ${p.highlight ? 'fortuna-tier--jackpot' : ''}`}>
                      <span className="fortuna-tier__name">{p.tier}</span>
                      <span className="fortuna-tier__prize">{p.prize}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="game-detail__cta">
                <Link to="/lottery"><Button variant="secondary">{t('home.play_la_fortuna')}</Button></Link>
                <Link to="/how-it-works" className="game-detail__learn">{t('home.how_it_works')}</Link>
              </div>
            </div>

            {/* Keno */}
            <div className="game-detail game-detail--keno">
              <div className="game-detail__header">
                <div className="game-detail__icon-wrap" style={{ '--gd-accent': 'var(--color-keno)' }}>
                  {GameIcons.keno}
                </div>
                <div>
                  <h3 style={{ color: 'var(--color-keno)' }}>{t('home.keno')}</h3>
                  <p>{t('home.instant_result')}</p>
                </div>
              </div>
              <div className="game-steps">
                <p className="game-steps__intro" dangerouslySetInnerHTML={{ __html: t('home.keno_choose') }} />
                <div className="game-steps__list">
                  {[t('home.keno_step1'), t('home.keno_step2'), t('home.keno_step3')].map((step, i) => (
                    <div key={i} className="game-step" style={{ '--step-accent': 'var(--color-keno)' }}>
                      <span className="game-step__num">{i + 1}</span>
                      <span className="game-step__text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="game-detail__cta">
                <Link to="/keno"><Button variant="secondary">{t('home.play_keno')}</Button></Link>
                <Link to="/how-it-works" className="game-detail__learn">{t('home.how_it_works')}</Link>
              </div>
            </div>

            {/* Bingo */}
            <div className="game-detail game-detail--bingo">
              <div className="game-detail__header">
                <div className="game-detail__icon-wrap" style={{ '--gd-accent': 'var(--color-bingo)' }}>
                  {GameIcons.bingo}
                </div>
                <div>
                  <h3 style={{ color: 'var(--color-bingo)' }}>{t('home.bingo', 'Bingo')}</h3>
                  <p>{t('home.bingo_subtitle', 'Multiplayer bingo with 4 rooms')}</p>
                </div>
              </div>
              <div className="game-steps">
                <p className="game-steps__intro">{t('home.bingo_desc', 'Buy cards, watch the draw live, and win line or full bingo prizes. Jackpot available!')}</p>
                <div className="game-steps__list">
                  {[
                    t('home.bingo_step1', 'Buy 1-4 cards'),
                    t('home.bingo_step2', 'Watch the draw'),
                    t('home.bingo_step3', 'Win line or bingo'),
                  ].map((step, i) => (
                    <div key={i} className="game-step" style={{ '--step-accent': 'var(--color-bingo)' }}>
                      <span className="game-step__num">{i + 1}</span>
                      <span className="game-step__text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="game-detail__cta">
                <Link to="/bingo"><Button variant="secondary">{t('home.play_bingo', 'Play Bingo')}</Button></Link>
              </div>
            </div>
          </div>
        </AnimSection>

        {/* ── Features ── */}
        <AnimSection className="home-features">
          <div className="section-container">
            <h2 className="section-heading">{t('home.secure_platform')}</h2>
            <div className="features-grid">
              {features.map((f, i) => (
                <div key={i} className="feature-card" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="feature-card__icon">{f.icon}</div>
                  <h4 className="feature-card__title">{f.title}</h4>
                  <p className="feature-card__desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimSection>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
