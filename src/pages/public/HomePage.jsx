import React from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../../components/common';
import './HomePage.css';

function HomePage() {
  const { isConnected, account, connectWallet, disconnectWallet, formatAddress, isConnecting } = useWeb3();

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-content">
          <h1 className="home-logo">LA BOLITA</h1>
          <nav className="home-nav">
            <Link to="/results">Resultados</Link>
            {isConnected ? (
              <>
                <span className="wallet-address">{formatAddress(account)}</span>
                <Link to="/bet">
                  <Button variant="primary" size="sm">Apostar</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={disconnectWallet}>
                  Desconectar
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <div className="home-hero-content">
            <h2 className="home-hero-title">Tu Suerte Te Espera</h2>
            <p className="home-hero-subtitle">
              La plataforma de loteria descentralizada en Polygon.
              100% transparente, verificable en blockchain.
            </p>
            <div className="home-hero-actions">
              {isConnected ? (
                <Link to="/bet">
                  <Button size="lg">Apostar Ahora</Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={connectWallet}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Conectando...' : 'Conectar Wallet para Jugar'}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* La Bolita */}
        <section className="home-games">
          <div className="game-section-header">
            <h3 className="home-section-title">La Bolita</h3>
            <p className="home-section-subtitle">Loteria tradicional de numeros - Sorteos cada hora</p>
          </div>
          <div className="home-games-grid">
            <div className="home-game-card" data-tooltip="Apuesta a 2 digitos (00-99). Si tu numero coincide con los ultimos 2 digitos del resultado, ganas 80 veces tu apuesta.">
              <div className="home-game-multiplier">80x</div>
              <h4>Fijos</h4>
              <p>2 digitos (00-99)</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card" data-tooltip="Apuesta a 3 digitos (000-999). Si tu numero coincide con los ultimos 3 digitos del resultado, ganas 500 veces tu apuesta.">
              <div className="home-game-multiplier">500x</div>
              <h4>Centenas</h4>
              <p>3 digitos (000-999)</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card" data-tooltip="Apuesta a 4 digitos (0000-9999). Si tu numero coincide exactamente con el resultado, ganas 900 veces tu apuesta.">
              <div className="home-game-multiplier">900x</div>
              <h4>Parle</h4>
              <p>4 digitos (0000-9999)</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card" data-tooltip="Tu apuesta se divide en 2 Fijos consecutivos. Por ejemplo: 25 genera apuestas a 25 y 26. Si cualquiera acierta, ganas.">
              <div className="home-game-multiplier">30x</div>
              <h4>Corrido</h4>
              <p>2 apuestas en 1</p>
              <span className="game-tooltip-icon">?</span>
            </div>
          </div>
          <div className="game-section-cta">
            <Link to="/bet">
              <Button variant="primary">Jugar La Bolita</Button>
            </Link>
          </div>
        </section>

        {/* La Fortuna */}
        <section className="home-games fortuna-section">
          <div className="game-section-header">
            <h3 className="home-section-title fortuna-title">La Fortuna</h3>
            <p className="home-section-subtitle">Loteria 6/49 + Clave - Jackpot acumulado</p>
          </div>
          <div className="fortuna-description">
            <p>Elige 6 numeros del 1 al 49, mas 1 numero clave del 1 al 10. Mientras mas numeros aciertes, mayor es tu premio.</p>
          </div>
          <div className="home-games-grid fortuna-grid">
            <div className="home-game-card fortuna-card" data-tooltip="Acierta los 6 numeros + la clave para ganar el Jackpot acumulado. El premio crece con cada sorteo sin ganador.">
              <div className="home-game-multiplier jackpot">JACKPOT</div>
              <h4>6 + Clave</h4>
              <p>Premio mayor acumulado</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card fortuna-card" data-tooltip="Acierta los 6 numeros sin la clave. Ganas el 20% del pozo de premios de la categoria.">
              <div className="home-game-multiplier">20%</div>
              <h4>6 Numeros</h4>
              <p>Segundo premio</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card fortuna-card" data-tooltip="Acierta 5 numeros + la clave. Ganas el 10% del pozo de premios de la categoria.">
              <div className="home-game-multiplier">10%</div>
              <h4>5 + Clave</h4>
              <p>Tercer premio</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card fortuna-card" data-tooltip="Acierta 5 numeros sin la clave. Ganas el 8% del pozo de premios de la categoria.">
              <div className="home-game-multiplier">8%</div>
              <h4>5 Numeros</h4>
              <p>Cuarto premio</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card fortuna-card" data-tooltip="Acierta 4 numeros + la clave. Ganas el 5% del pozo de premios de la categoria.">
              <div className="home-game-multiplier">5%</div>
              <h4>4 + Clave</h4>
              <p>Quinto premio</p>
              <span className="game-tooltip-icon">?</span>
            </div>
            <div className="home-game-card fortuna-card" data-tooltip="Acierta 3 numeros + la clave. Premio fijo proporcional al pozo.">
              <div className="home-game-multiplier">2%</div>
              <h4>3 + Clave</h4>
              <p>Sexto premio</p>
              <span className="game-tooltip-icon">?</span>
            </div>
          </div>
          <div className="game-section-cta">
            <Link to="/lottery">
              <Button variant="secondary">Jugar La Fortuna</Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="home-features">
          <h3 className="home-section-title">Por que La Bolita?</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h4>100% On-Chain</h4>
              <p>Todas las apuestas y resultados en blockchain Polygon</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎲</div>
              <h4>Chainlink VRF</h4>
              <p>Numeros aleatorios verificables e imposibles de manipular</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h4>Sin Custodia</h4>
              <p>Tu controlas tus fondos. Retira cuando quieras.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h4>Pagos Instantaneos</h4>
              <p>Premios automaticos via smart contract</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-links">
          <Link to="/how-it-works">Como Funciona</Link>
          <Link to="/transparency">Transparencia</Link>
          <Link to="/legal/rules">Reglas</Link>
          <Link to="/faq">FAQ</Link>
        </div>
        <p>La Bolita - Juega responsablemente</p>
      </footer>
    </div>
  );
}

export default HomePage;
