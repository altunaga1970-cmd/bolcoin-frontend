import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import Header from './Header';
import Footer from './Footer';
import { GeoBlock } from '../common';
import { Button, Spinner } from '../common';
import './Layout.css';

/**
 * AppLayout - Layout for authenticated user pages
 * Requires wallet connection and correct network
 */
function AppLayout({ requireWallet = true }) {
  const { isConnected, isCorrectNetwork, connectWallet, switchNetwork, isLoading } = useWeb3();

  // Show loading while checking connection
  if (isLoading) {
    return (
      <GeoBlock>
        <div className="public-layout">
          <Header />
          <main className="main-content">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <Spinner size="lg" />
            </div>
          </main>
          <Footer />
        </div>
      </GeoBlock>
    );
  }

  // If wallet required but not connected
  if (requireWallet && !isConnected) {
    return (
      <GeoBlock>
        <div className="public-layout">
          <Header />
          <main className="main-content">
            <div className="info-page">
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h1>Connect Your Wallet</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>
                  Please connect your wallet to access this page.
                </p>
                <Button onClick={connectWallet} size="lg">
                  Connect Wallet
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </GeoBlock>
    );
  }

  // If connected but wrong network
  if (requireWallet && isConnected && !isCorrectNetwork) {
    return (
      <GeoBlock>
        <div className="public-layout">
          <Header />
          <main className="main-content">
            <div className="info-page">
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h1>Wrong Network</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                  Please switch to Polygon network to use this platform.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                  La Bolita operates on Polygon for low fees and fast transactions.
                </p>
                <Button onClick={switchNetwork} size="lg">
                  Switch to Polygon
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </GeoBlock>
    );
  }

  return (
    <GeoBlock>
      <div className="app-layout">
        <Header variant="app" />
        <main className="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </GeoBlock>
  );
}

export default AppLayout;
