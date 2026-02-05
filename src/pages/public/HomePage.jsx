import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav, Footer } from '../../components/layout';
import './HomePage.css';

function HomePage() {
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
      // (esto dependera de la implementacion del contrato)
      try {
        const openLottery = await getOpenLotteryDraws();
        // Obtener los ultimos completados si hay funcion disponible
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
            <h1 className="home-hero-title">LA BOLITA</h1>
            <p className="home-hero-subtitle">
              Loteria descentralizada en Polygon.
              Resultados verificables con Chainlink VRF.
            </p>
            <div className="home-hero-actions">
              {isConnected ? (
                <>
                  <Link to="/bet">
                    <Button size="lg" variant="primary">La Bolita</Button>
                  </Link>
                  <Link to="/lottery">
                    <Button size="lg" variant="secondary">La Fortuna</Button>
                  </Link>
                  <Link to="/keno">
                    <Button size="lg" variant="outline">Keno</Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="lg"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Ultimos Resultados */}
        <section className="home-results">
          <h2 className="section-title">Ultimos Resultados</h2>

          {loading ? (
            <div className="results-loading">
              <Spinner size="md" />
              <p>Cargando resultados...</p>
            </div>
          ) : (
            <div className="results-container">
              {/* La Bolita Results */}
              <div className="results-column">
                <h3 className="results-game-title">La Bolita</h3>
                {latestBolitaResults.length > 0 ? (
                  <div className="results-list">
                    {latestBolitaResults.map(draw => (
                      <div key={draw.id} className="result-item">
                        <div className="result-date">
                          {new Date(draw.scheduled_time).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="result-numbers-bolita">
                          {draw.winning_fijos && (
                            <div className="result-number-group">
                              <span className="number-label">Fijo:</span>
                              <span className="number-value">{draw.winning_fijos}</span>
                            </div>
                          )}
                          {draw.winning_centenas && (
                            <div className="result-number-group">
                              <span className="number-label">Centena:</span>
                              <span className="number-value">{draw.winning_centenas}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">Sin resultados recientes</p>
                )}
                <Link to="/results" className="view-all-link">
                  Ver todos los resultados
                </Link>
              </div>

              {/* La Fortuna Results */}
              <div className="results-column fortuna">
                <h3 className="results-game-title fortuna-title">La Fortuna</h3>
                {jackpotInfo && (
                  <div className="jackpot-display">
                    <span className="jackpot-label">Jackpot Actual</span>
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
                          {new Date(draw.scheduledTime).toLocaleDateString('es-ES', {
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
                  <p className="no-results">Proximo sorteo: Miercoles y Sabados</p>
                )}
                <Link to="/results" className="view-all-link">
                  Ver todos los resultados
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Horarios de Sorteo */}
        <section className="home-schedule">
          <h2 className="section-title">Horarios de Sorteo</h2>
          <div className="schedule-grid">
            <div className="schedule-card">
              <h3>La Bolita</h3>
              <div className="schedule-times">
                <span className="time-badge">08:00</span>
                <span className="time-badge">12:00</span>
                <span className="time-badge">20:00</span>
              </div>
              <p className="schedule-frequency">Todos los dias</p>
            </div>
            <div className="schedule-card fortuna">
              <h3>La Fortuna</h3>
              <div className="schedule-times">
                <span className="time-badge">21:00</span>
              </div>
              <p className="schedule-frequency">Miercoles y Sabados</p>
            </div>
            <div className="schedule-card keno">
              <h3>Keno</h3>
              <div className="schedule-times">
                <span className="time-badge instant">INSTANTANEO</span>
              </div>
              <p className="schedule-frequency">Juega cuando quieras</p>
            </div>
          </div>
        </section>

        {/* Juegos Disponibles */}
        <section className="home-games">
          <h2 className="section-title">Juegos Disponibles</h2>

          {/* La Bolita */}
          <div className="game-block">
            <div className="game-header">
              <h3>La Bolita</h3>
              <p>Loteria tradicional de numeros</p>
            </div>
            <div className="game-types-grid">
              <div className="game-type-card">
                <span className="game-type-name">Fijo</span>
                <span className="game-type-desc">2 digitos (00-99)</span>
              </div>
              <div className="game-type-card">
                <span className="game-type-name">Centena</span>
                <span className="game-type-desc">3 digitos (000-999)</span>
              </div>
              <div className="game-type-card">
                <span className="game-type-name">Parle</span>
                <span className="game-type-desc">2 Fijos combinados</span>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/bet">
                <Button variant="primary">Jugar La Bolita</Button>
              </Link>
              <Link to="/how-it-works" className="learn-more">
                Como funciona
              </Link>
            </div>
          </div>

          {/* La Fortuna */}
          <div className="game-block fortuna">
            <div className="game-header">
              <h3 className="fortuna-title">La Fortuna</h3>
              <p>Loteria 5/54 + Clave</p>
            </div>
            <div className="fortuna-info">
              <p>
                Elige <strong>5 numeros</strong> del 1 al 54 y <strong>1 numero clave</strong> del 0 al 9.
                Mientras mas numeros aciertes, mayor es tu premio.
              </p>
              <div className="fortuna-prizes">
                <div className="prize-tier jackpot">
                  <span className="tier-name">5 + Clave</span>
                  <span className="tier-prize">JACKPOT</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">5 numeros</span>
                  <span className="tier-prize">2da Categoria</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">4 + Clave</span>
                  <span className="tier-prize">3ra Categoria</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">4 numeros</span>
                  <span className="tier-prize">4ta Categoria</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">3 + Clave</span>
                  <span className="tier-prize">5ta Categoria</span>
                </div>
                <div className="prize-tier">
                  <span className="tier-name">3 numeros</span>
                  <span className="tier-prize">6ta Categoria</span>
                </div>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/lottery">
                <Button variant="secondary">Jugar La Fortuna</Button>
              </Link>
              <Link to="/how-it-works" className="learn-more">
                Como funciona
              </Link>
            </div>
          </div>

          {/* Keno */}
          <div className="game-block keno">
            <div className="game-header">
              <h3 className="keno-title">Keno</h3>
              <p>Resultado instantaneo - Juega cuando quieras</p>
            </div>
            <div className="keno-info">
              <p>
                Elige de <strong>1 a 10 numeros</strong> del 1 al 80.
                Se extraen <strong>10 numeros</strong> al instante. Mientras mas aciertes, mayor es tu premio.
              </p>
              <div className="keno-how-it-works">
                <div className="keno-step">
                  <span className="step-number">1</span>
                  <span className="step-text">Elige tus numeros (1-10)</span>
                </div>
                <div className="keno-step">
                  <span className="step-number">2</span>
                  <span className="step-text">Selecciona tu apuesta</span>
                </div>
                <div className="keno-step">
                  <span className="step-number">3</span>
                  <span className="step-text">Resultado instantaneo via VRF</span>
                </div>
              </div>
            </div>
            <div className="game-cta">
              <Link to="/keno">
                <Button variant="outline" className="keno-btn">Jugar Keno</Button>
              </Link>
              <Link to="/how-it-works" className="learn-more">
                Como funciona
              </Link>
            </div>
          </div>
        </section>

        {/* Caracteristicas */}
        <section className="home-features">
          <h2 className="section-title">Plataforma Segura y Transparente</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h4>Sin Custodia</h4>
              <p>Tu controlas tus fondos. Deposita y retira cuando quieras.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4>100% On-Chain</h4>
              <p>Todas las apuestas y resultados registrados en Polygon.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h4>Chainlink VRF</h4>
              <p>Numeros aleatorios verificables e imposibles de manipular.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h4>Pagos Instantaneos</h4>
              <p>Los premios se acreditan automaticamente via smart contract.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
