import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav, Footer } from '../../components/layout';
import './HomePage.css';

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

  // Cargar ultimos resultados
  const loadResults = useCallback(async () => {
    setLoading(true);
    try {
      // Cargar sorteos de La Bolita
      const allDraws = await getAllDraws();
      const completedBolita = allDraws
        .filter(d => d.status === 'completed')
        .slice(0, 3);
      setLatestBolitaResults(completedBolita);

      // Cargar info del Jackpot
      const jackpot = await getJackpotInfo();
      setJackpotInfo(jackpot);

      // Para La Fortuna, intentar obtener sorteos completados
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

  return (
    <div className="home-page">
      <MainNav />

      <main className="home-main">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="home-hero-content">
            <h1 className="home-hero-title">{t('home.hero_title')}</h1>
            <p className="home-hero-subtitle">
              {t('home.hero_subtitle')}
            </p>
            <div className="home-hero-actions">
              {isConnected ? (
                <>
                  <Link to="/keno">
                    <Button size="lg" variant="primary" className="keno-btn">{t('home.keno', 'Keno')}</Button>
                  </Link>
                  <Link to="/bingo">
                    <Button size="lg" variant="secondary" className="bingo-btn">{t('home.bingo', 'Bingo')}</Button>
                  </Link>
                  <Link to="/bet">
                    <Button size="lg" variant="outline">{t('home.la_bolita')}</Button>
                  </Link>
                  <Link to="/fortuna">
                    <Button size="lg" variant="outline">{t('home.la_fortuna')}</Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? t('home.connect_wallet') + '...' : t('home.connect_wallet')}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Ultimos Resultados */}
        <section className="home-results">
          <h2 className="section-title">{t('home.latest_results')}</h2>

          {loading ? (
            <div className="results-loading">
              <Spinner size="md" />
              <p>{t('home.loading_results')}</p>
            </div>
          ) : (
            <div className="results-container">
              {/* La Bolita Results */}
              <div className="results-column">
                <h3 className="results-game-title">{t('home.la_bolita')}</h3>
                {latestBolitaResults.length > 0 ? (
                  <div className="results-list">
                    {latestBolitaResults.map(draw => (
                      <div key={draw.id} className="result-item">
                        <div className="result-date">
                          {new Date(draw.scheduled_time).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="result-numbers-bolita">
                          {draw.winning_fijos && (
                            <div className="result-number-group">
                              <span className="number-label">{t('home.fijo')}:</span>
                              <span className="number-value">{draw.winning_fijos}</span>
                            </div>
                          )}
                          {draw.winning_centenas && (
                            <div className="result-number-group">
                              <span className="number-label">{t('home.centena')}:</span>
                              <span className="number-value">{draw.winning_centenas}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">{t('home.no_recent_results')}</p>
                )}
                <Link to="/results" className="view-all-link">
                  {t('home.view_all_results')}
                </Link>
              </div>

              {/* La Fortuna Results */}
              <div className="results-column fortuna">
                <h3 className="results-game-title fortuna-title">{t('home.la_fortuna')}</h3>
                {jackpotInfo && (
                  <div className="jackpot-display">
                    <span className="jackpot-label">{t('home.current_jackpot')}</span>
                    <span className="jackpot-amount">
                      ${parseFloat(jackpotInfo.jackpot || 0).toLocaleString()} USDT
                    </span>
                  </div>
                )}
                {latestFortunaResults.length > 0 ? (
                  <div className="results-list">
                    {latestFortunaResults.map(draw => (
                      <div key={draw.id} className="result-item fortuna">
                        <div className="result-date">
                          {new Date(draw.scheduledTime).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                        <div className="result-numbers-fortuna">
                          {draw.winningNumbers.map((num, idx) => (
                            <span key={idx} className="fortuna-ball">{num}</span>
                          ))}
                          <span className="fortuna-plus">+</span>
                          <span className="fortuna-ball key">{draw.keyNumber}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">{t('home.next_draw')}</p>
                )}
                <Link to="/results" className="view-all-link">
                  {t('home.view_all_results')}
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Horarios de Sorteo */}
        <section className="home-schedule">
          <h2 className="section-title">{t('home.draw_schedule')}</h2>
          <div className="schedule-grid">
            <div className="schedule-card">
              <h3>{t('home.la_bolita')}</h3>
              <div className="schedule-times">
                <span className="time-badge">08:00</span>
                <span className="time-badge">12:00</span>
                <span className="time-badge">20:00</span>
              </div>
              <p className="schedule-frequency">{t('home.every_day')}</p>
            </div>
            <div className="schedule-card fortuna">
              <h3>{t('home.la_fortuna')}</h3>
              <div className="schedule-times">
                <span className="time-badge">21:00</span>
              </div>
              <p className="schedule-frequency">{t('home.wed_sat')}</p>
            </div>
            <div className="schedule-card keno">
              <h3>{t('home.keno', 'Keno')}</h3>
              <div className="schedule-times">
                <span className="time-badge instant">{t('home.instant', 'Instant')}</span>
              </div>
              <p className="schedule-frequency">{t('home.play_anytime', 'Play anytime')}</p>
            </div>
            <div className="schedule-card bingo">
              <h3>{t('home.bingo', 'Bingo')}</h3>
              <div className="schedule-times">
                <span className="time-badge instant">{t('home.every_45s', 'Every 45s')}</span>
              </div>
              <p className="schedule-frequency">{t('home.four_rooms', '4 rooms, 24/7')}</p>
            </div>
          </div>
        </section>

        {/* Juegos Disponibles */}
        <section className="home-games">
          <h2 className="section-title">{t('home.available_games')}</h2>

          {/* La Bolita */}
          <div className="game-block">
            <div className="game-header">
              <h3>{t('home.la_bolita')}</h3>
              <p>{t('home.traditional_lottery')}</p>
            </div>
            <div className="game-types-grid">
              <div className="game-type-card">
                <span className="game-type-name">{t('home.fijo')}</span>
                <span className="game-type-desc">{t('home.fijo_desc')}</span>
              </div>
              <div className="game-type-card">
                <span className="game-type-name">{t('home.centena')}</span>
                <span className="game-type-desc">{t('home.centena_desc')}</span>
              </div>
              <div className="game-type-card">
                <span className="game-type-name">{t('home.parle')}</span>
                <span className="game-type-desc">{t('home.parle_desc')}</span>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/bet">
                <Button variant="primary">{t('home.play_la_bolita')}</Button>
              </Link>
              <Link to="/how-it-works" className="learn-more">
                {t('home.how_it_works')}
              </Link>
            </div>
          </div>

          {/* La Fortuna */}
          <div className="game-block fortuna">
            <div className="game-header">
              <h3 className="fortuna-title">{t('home.la_fortuna')}</h3>
              <p>{t('home.lottery_5_54')}</p>
            </div>
            <div className="fortuna-info">
              <p dangerouslySetInnerHTML={{ __html: t('home.choose_numbers') }} />
              <div className="fortuna-prizes">
                <div className="prize-tier jackpot">
                  <span className="tier-name">{t('home.five_plus_key')}</span>
                  <span className="tier-prize">{t('home.jackpot_tier')}</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">{t('home.five_numbers')}</span>
                  <span className="tier-prize">{t('home.second_tier')}</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">{t('home.four_plus_key')}</span>
                  <span className="tier-prize">{t('home.third_tier')}</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">{t('home.four_numbers')}</span>
                  <span className="tier-prize">{t('home.fourth_tier')}</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">{t('home.three_plus_key')}</span>
                  <span className="tier-prize">{t('home.fifth_tier')}</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">{t('home.three_numbers')}</span>
                  <span className="tier-prize">{t('home.sixth_tier')}</span>
                </div>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/lottery">
                <Button variant="secondary">{t('home.play_la_fortuna')}</Button>
              </Link>
              <Link to="/how-it-works" className="learn-more">
                {t('home.how_it_works')}
              </Link>
            </div>
          </div>

          {/* Keno */}
          <div className="game-block keno">
            <div className="game-header">
              <h3 className="keno-title">{t('home.keno')}</h3>
              <p>{t('home.instant_result')}</p>
            </div>
            <div className="keno-info">
              <p dangerouslySetInnerHTML={{ __html: t('home.keno_choose') }} />
              <div className="keno-how-it-works">
                <div className="keno-step">
                  <span className="step-number">1</span>
                  <span className="step-text">{t('home.keno_step1')}</span>
                </div>
                <div className="keno-step">
                  <span className="step-number">2</span>
                  <span className="step-text">{t('home.keno_step2')}</span>
                </div>
                <div className="keno-step">
                  <span className="step-number">3</span>
                  <span className="step-text">{t('home.keno_step3')}</span>
                </div>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/keno">
                <Button variant="outline" className="keno-btn">{t('home.play_keno')}</Button>
              </Link>
              <Link to="/how-it-works" className="learn-more">
                {t('home.how_it_works')}
              </Link>
            </div>
          </div>

          {/* Bingo */}
          <div className="game-block bingo">
            <div className="game-header">
              <h3 className="bingo-title">{t('home.bingo', 'Bingo')}</h3>
              <p>{t('home.bingo_subtitle', 'Multiplayer bingo with 4 rooms')}</p>
            </div>
            <div className="bingo-info">
              <p>{t('home.bingo_desc', 'Buy cards, watch the draw live, and win line or full bingo prizes. Jackpot available!')}</p>
              <div className="keno-how-it-works">
                <div className="keno-step">
                  <span className="step-number">1</span>
                  <span className="step-text">{t('home.bingo_step1', 'Buy 1-4 cards')}</span>
                </div>
                <div className="keno-step">
                  <span className="step-number">2</span>
                  <span className="step-text">{t('home.bingo_step2', 'Watch the draw')}</span>
                </div>
                <div className="keno-step">
                  <span className="step-number">3</span>
                  <span className="step-text">{t('home.bingo_step3', 'Win line or bingo')}</span>
                </div>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/bingo">
                <Button variant="outline" className="bingo-cta-btn">{t('home.play_bingo', 'Play Bingo')}</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Caracteristicas */}
        <section className="home-features">
          <h2 className="section-title">{t('home.secure_platform')}</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4>{t('home.non_custodial')}</h4>
              <p>{t('home.non_custodial_desc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4>{t('home.on_chain')}</h4>
              <p>{t('home.on_chain_desc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h4>{t('home.chainlink_vrf')}</h4>
              <p>{t('home.chainlink_vrf_desc')}</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h4>{t('home.instant_payouts')}</h4>
              <p>{t('home.instant_payouts_desc')}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
