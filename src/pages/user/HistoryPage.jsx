import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWeb3 } from '../../contexts/Web3Context';
import { useContract } from '../../hooks/useContract';
import { Button, Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet } from '../../components/web3';
import './UserPages.css';
import './HistoryPage.css';

function HistoryPage() {
  const { t } = useTranslation(['games', 'common']);
  const { account, isConnected, connectWallet, formatAddress } = useWeb3();
  const {
    getUserBets,
    getContractBalance,
    getReferralStats,
    isLoading
  } = useContract();

  const [bets, setBets] = useState([]);
  const [balance, setBalance] = useState('0');
  const [referralStats, setReferralStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, won, lost, pending
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWagered: 0,
    totalWon: 0,
    totalLost: 0,
    netProfit: 0,
    winRate: 0
  });

  // Cargar datos
  const loadData = useCallback(async () => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [betsData, balanceData, refStats] = await Promise.all([
        getUserBets(),
        getContractBalance(),
        getReferralStats()
      ]);

      setBets(betsData || []);
      setBalance(balanceData);
      setReferralStats(refStats);

      // Calcular estadisticas
      if (betsData && betsData.length > 0) {
        const totalBets = betsData.length;
        const totalWagered = betsData.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);

        const wonBets = betsData.filter(bet =>
          bet.draw?.status === 'completed' && parseFloat(bet.payout) > 0
        );
        const lostBets = betsData.filter(bet =>
          bet.draw?.status === 'completed' && parseFloat(bet.payout) === 0
        );

        const totalWon = wonBets.reduce((sum, bet) => sum + parseFloat(bet.payout), 0);
        const totalLost = lostBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
        const netProfit = totalWon - totalWagered;
        const completedBets = wonBets.length + lostBets.length;
        const winRate = completedBets > 0 ? (wonBets.length / completedBets * 100) : 0;

        setStats({
          totalBets,
          totalWagered,
          totalWon,
          totalLost,
          netProfit,
          winRate
        });
      }
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, getUserBets, getContractBalance, getReferralStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar apuestas
  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'won') return bet.draw?.status === 'completed' && parseFloat(bet.payout) > 0;
    if (filter === 'lost') return bet.draw?.status === 'completed' && parseFloat(bet.payout) === 0;
    if (filter === 'pending') return bet.draw?.status !== 'completed' && bet.draw?.status !== 'cancelled';
    return true;
  });

  // Determinar estado de apuesta
  const getBetStatus = (bet) => {
    if (bet.draw?.status === 'cancelled') return { text: t('history.status.cancelled'), class: 'cancelled' };
    if (bet.draw?.status !== 'completed') return { text: t('history.status.pending'), class: 'pending' };
    if (parseFloat(bet.payout) > 0) return { text: t('history.status.won'), class: 'won' };
    return { text: t('history.status.lost'), class: 'lost' };
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isConnected) {
    return (
      <div className="user-page">
        <MainNav />
        <main className="user-main">
          <div className="connect-prompt">
            <h3>{t('common:common.connect_wallet')}</h3>
            <p>{t('history.connect_prompt')}</p>
            <ConnectWallet />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="user-page">
      <MainNav />

      <main className="user-main">
        <h1 className="page-title">{t('history.title')}</h1>

        {loading ? (
          <div className="loading-state">
            <Spinner size="lg" />
            <p>{t('history.loading')}</p>
          </div>
        ) : (
          <>
            {/* Balance actual */}
            <div className="current-balance-card">
              <div className="balance-info">
                <span className="balance-label">{t('history.current_balance')}</span>
                <span className="balance-value">${parseFloat(balance).toFixed(2)} USDT</span>
              </div>
              <div className="wallet-info">
                <code>{formatAddress(account)}</code>
              </div>
            </div>

            {/* Estadisticas generales */}
            <div className="stats-overview">
              <div className="stat-box">
                <div className="stat-icon bets">🎰</div>
                <div className="stat-content">
                  <span className="stat-number">{stats.totalBets}</span>
                  <span className="stat-text">{t('history.total_bets')}</span>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon wagered">💰</div>
                <div className="stat-content">
                  <span className="stat-number">${stats.totalWagered.toFixed(2)}</span>
                  <span className="stat-text">{t('history.total_wagered')}</span>
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-icon won">🏆</div>
                <div className="stat-content">
                  <span className="stat-number">${stats.totalWon.toFixed(2)}</span>
                  <span className="stat-text">{t('history.total_won')}</span>
                </div>
              </div>
              <div className={`stat-box ${stats.netProfit >= 0 ? 'profit' : 'loss'}`}>
                <div className="stat-icon">{stats.netProfit >= 0 ? '📈' : '📉'}</div>
                <div className="stat-content">
                  <span className="stat-number">
                    {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toFixed(2)}
                  </span>
                  <span className="stat-text">{t('history.net_profit')}</span>
                </div>
              </div>
            </div>

            {/* Tarjetas de resumen */}
            <div className="summary-cards">
              <div className="summary-card win-rate">
                <h4>{t('history.win_rate')}</h4>
                <div className="progress-ring">
                  <svg viewBox="0 0 36 36">
                    <path
                      className="progress-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="progress-fill"
                      strokeDasharray={`${stats.winRate}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="progress-text">{stats.winRate.toFixed(1)}%</span>
                </div>
              </div>

              {referralStats && (
                <div className="summary-card referral-earnings">
                  <h4>{t('history.referral_earnings')}</h4>
                  <div className="referral-info">
                    <div className="referral-stat">
                      <span className="value">{referralStats.totalReferred}</span>
                      <span className="label">{t('history.referrals')}</span>
                    </div>
                    <div className="referral-stat">
                      <span className="value">${referralStats.totalEarnings}</span>
                      <span className="label">{t('history.earned')}</span>
                    </div>
                    <div className="referral-stat highlight">
                      <span className="value">${referralStats.pendingEarnings}</span>
                      <span className="label">{t('history.pending')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtros */}
            <div className="history-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('history.filter_all')} ({bets.length})
              </button>
              <button
                className={`filter-btn ${filter === 'won' ? 'active' : ''}`}
                onClick={() => setFilter('won')}
              >
                {t('history.filter_won')}
              </button>
              <button
                className={`filter-btn ${filter === 'lost' ? 'active' : ''}`}
                onClick={() => setFilter('lost')}
              >
                {t('history.filter_lost')}
              </button>
              <button
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                {t('history.filter_pending')}
              </button>
            </div>

            {/* Lista de apuestas */}
            <div className="bets-history">
              <h3>{t('history.bet_history')}</h3>

              {filteredBets.length === 0 ? (
                <div className="empty-history">
                  <p>{t('history.no_bets')}</p>
                  <Link to="/web3">
                    <Button>{t('history.first_bet')}</Button>
                  </Link>
                </div>
              ) : (
                <div className="bets-table-container">
                  <table className="bets-table">
                    <thead>
                      <tr>
                        <th>{t('history.table.id')}</th>
                        <th>{t('history.table.draw')}</th>
                        <th>{t('history.table.type')}</th>
                        <th>{t('history.table.number')}</th>
                        <th>{t('history.table.bet')}</th>
                        <th>{t('history.table.prize')}</th>
                        <th>{t('history.table.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBets.map((bet) => {
                        const status = getBetStatus(bet);
                        return (
                          <tr key={bet.id} className={status.class}>
                            <td>#{bet.id}</td>
                            <td>
                              <span className="draw-number">{bet.draw?.draw_number || '-'}</span>
                              <span className="draw-date">{formatDate(bet.draw?.scheduled_time)}</span>
                            </td>
                            <td>
                              <span className={`bet-type ${bet.bet_type}`}>
                                {bet.bet_type?.toUpperCase()}
                              </span>
                            </td>
                            <td className="bet-numbers">{bet.numbers}</td>
                            <td className="bet-amount">${parseFloat(bet.amount).toFixed(2)}</td>
                            <td className={`bet-payout ${parseFloat(bet.payout) > 0 ? 'won' : ''}`}>
                              {parseFloat(bet.payout) > 0 ? `+$${parseFloat(bet.payout).toFixed(2)}` : '-'}
                            </td>
                            <td>
                              <span className={`status-badge ${status.class}`}>
                                {status.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Numeros ganadores (si hay apuestas completadas) */}
            {bets.some(bet => bet.draw?.status === 'completed') && (
              <div className="winning-numbers-section">
                <h3>{t('history.winning_numbers')}</h3>
                <div className="winning-draws">
                  {bets
                    .filter(bet => bet.draw?.status === 'completed')
                    .reduce((unique, bet) => {
                      if (!unique.find(u => u.draw?.id === bet.draw?.id)) {
                        unique.push(bet);
                      }
                      return unique;
                    }, [])
                    .slice(0, 5)
                    .map((bet) => (
                      <div key={bet.draw?.id} className="winning-draw-card">
                        <div className="draw-header">
                          <span className="draw-name">{bet.draw?.draw_number}</span>
                          <span className="draw-date">{formatDate(bet.draw?.scheduled_time)}</span>
                        </div>
                        <div className="winning-numbers">
                          <div className="number-group">
                            <span className="label">{t('history.fijo')}</span>
                            <span className="number">{bet.draw?.winning_fijos || '--'}</span>
                          </div>
                          <div className="number-group">
                            <span className="label">{t('history.centena')}</span>
                            <span className="number">{bet.draw?.winning_centenas || '---'}</span>
                          </div>
                          <div className="number-group">
                            <span className="label">{t('history.parle')}</span>
                            <span className="number">{bet.draw?.winning_parles || '----'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default HistoryPage;
