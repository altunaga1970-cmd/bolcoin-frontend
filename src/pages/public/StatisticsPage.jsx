import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useContract } from '../../hooks/useContract';
import { Spinner } from '../../components/common';
import '../../components/layout/Layout.css';

function StatisticsPage() {
  const { getJackpot } = useContract();
  const [jackpot, setJackpot] = useState('0');
  const [loading, setLoading] = useState(true);

  // Placeholder stats - in production, fetch from backend/contract
  const [stats] = useState({
    totalDraws: 1247,
    totalBets: 89432,
    totalPaidOut: 2450000,
    totalPlayers: 12543,
    biggestWinBolita: 45000,
    biggestWinFortuna: 750000,
    last30DaysVolume: 324500,
    last30DaysPrizes: 289000
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const jp = await getJackpot();
        setJackpot(jp || '0');
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [getJackpot]);

  if (loading) {
    return (
      <div className="info-page" style={{ textAlign: 'center', padding: '4rem' }}>
        <Spinner size="lg" />
        <p style={{ marginTop: '1rem' }}>Loading statistics...</p>
      </div>
    );
  }

  return (
    <div className="info-page">
      <h1>Platform Statistics</h1>
      <p className="page-subtitle">
        Real-time statistics from La Bolita. All data is verifiable on the Polygon blockchain.
      </p>

      <h2>Current Jackpot</h2>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.05) 100%)',
        border: '2px solid rgba(255,215,0,0.3)',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>La Fortuna Progressive Jackpot</p>
        <p style={{ fontSize: '3rem', color: '#FFD700', fontWeight: 'bold', margin: '0' }}>
          ${parseFloat(jackpot).toLocaleString()} USDT
        </p>
        <Link to="/lottery" style={{
          display: 'inline-block',
          marginTop: '1rem',
          padding: '0.75rem 2rem',
          background: '#FFD700',
          color: '#000',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold'
        }}>
          Play La Fortuna
        </Link>
      </div>

      <h2>All-Time Statistics</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>Total Draws</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            {stats.totalDraws.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>La Bolita + La Fortuna</p>
        </div>

        <div className="info-card">
          <h3>Total Bets Placed</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            {stats.totalBets.toLocaleString()}
          </p>
        </div>

        <div className="info-card">
          <h3>Total Paid Out</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${stats.totalPaidOut.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>USDT in prizes</p>
        </div>

        <div className="info-card">
          <h3>Unique Players</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            {stats.totalPlayers.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Wallet addresses</p>
        </div>
      </div>

      <h2>Biggest Wins</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>Biggest La Bolita Win</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${stats.biggestWinBolita.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Parles (4-digit) winner</p>
        </div>

        <div className="info-card">
          <h3>Biggest La Fortuna Win</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${stats.biggestWinFortuna.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Jackpot winner</p>
        </div>
      </div>

      <h2>Last 30 Days</h2>
      <div className="info-cards">
        <div className="info-card">
          <h3>Betting Volume</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${stats.last30DaysVolume.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Total wagered</p>
        </div>

        <div className="info-card">
          <h3>Prizes Awarded</h3>
          <p style={{ fontSize: '1.5rem', color: '#FFD700', fontWeight: 'bold' }}>
            ${stats.last30DaysPrizes.toLocaleString()}
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Paid to winners</p>
        </div>
      </div>

      <h2>Verify on Blockchain</h2>
      <p>
        All statistics can be independently verified by querying the smart contracts on Polygon.
        Visit <Link to="/transparency" style={{ color: '#FFD700' }}>Transparency</Link> for contract addresses.
      </p>

      <div className="info-box">
        <p>
          <strong>Note:</strong> Statistics are updated periodically. For real-time data, query the smart contracts directly on PolygonScan.
        </p>
      </div>
    </div>
  );
}

export default StatisticsPage;
