// src/pages/user/HistoryPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useWeb3 } from '../../contexts/Web3Context';
import { Spinner } from '../../components/common';
import { MainNav } from '../../components/layout';
import { ConnectWallet } from '../../components/web3';

import betApi from '../../api/betApi';
import kenoApi from '../../api/kenoApi';
import bingoApi from '../../api/bingoApi';

import '../user/UserPages.css';
import './HistoryPage.css';

function HistoryPage() {
  const { t } = useTranslation(['games', 'common']);
  const { isConnected, account } = useWeb3();

  const [tab, setTab] = useState('bolita');

  // ── La Bolita ──────────────────────────────────────────────────────────────
  const [bolitaBets, setBolitaBets] = useState([]);
  const [bolitaLoading, setBolitaLoading] = useState(true);
  const [bolitaError, setBolitaError] = useState(false);

  // ── Keno ───────────────────────────────────────────────────────────────────
  const [kenoGames, setKenoGames] = useState([]);
  const [kenoLoading, setKenoLoading] = useState(true);
  const [kenoError, setKenoError] = useState(false);

  // ── Bingo ──────────────────────────────────────────────────────────────────
  const [bingoRounds, setBingoRounds] = useState([]);
  const [bingoLoading, setBingoLoading] = useState(true);
  const [bingoError, setBingoError] = useState(false);

  // Load all three histories in parallel, fail independently
  const loadAll = useCallback(() => {
    if (!isConnected) return;

    setBolitaLoading(true);
    setBolitaError(false);
    betApi.getMyBets(1, 50)
      .then(data => setBolitaBets(data?.bets || []))
      .catch(() => setBolitaError(true))
      .finally(() => setBolitaLoading(false));

    setKenoLoading(true);
    setKenoError(false);
    kenoApi.getHistory(50)
      .then(data => setKenoGames(Array.isArray(data) ? data : []))
      .catch(() => setKenoError(true))
      .finally(() => setKenoLoading(false));

    setBingoLoading(true);
    setBingoError(false);
    bingoApi.getHistory(50)
      .then(data => setBingoRounds(Array.isArray(data) ? data : []))
      .catch(() => setBingoError(true))
      .finally(() => setBingoLoading(false));
  }, [isConnected]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Aggregate stats (La Bolita + Keno — Bingo has no wager amount in history)
  const stats = useMemo(() => {
    let totalWagered = 0;
    let totalWon = 0;

    for (const bet of bolitaBets) {
      totalWagered += parseFloat(bet.amount) || 0;
      totalWon += parseFloat(bet.payout_amount || bet.actual_payout || 0);
    }
    for (const game of kenoGames) {
      totalWagered += game.betAmount || 0;
      totalWon += game.payout || 0;
    }

    return {
      totalGames: bolitaBets.length + kenoGames.length + bingoRounds.length,
      totalWagered,
      totalWon,
      netProfit: totalWon - totalWagered,
    };
  }, [bolitaBets, kenoGames, bingoRounds]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getBolitaStatus = (bet) => {
    if (bet.status === 'won') return { text: t('history.status.won'), cls: 'won' };
    if (bet.status === 'lost') return { text: t('history.status.lost'), cls: 'lost' };
    if (bet.status === 'cancelled') return { text: t('history.status.cancelled'), cls: 'cancelled' };
    return { text: t('history.status.pending'), cls: 'pending' };
  };

  const getBetNumber = (bet) => {
    const digits = bet.game_type === 'parles' ? 4 : bet.game_type === 'centenas' ? 3 : 2;
    return String(bet.bet_number ?? '').padStart(digits, '0');
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

        {/* ── Aggregate stats ────────────────────────────────────────────────── */}
        <div className="stats-overview">
          <div className="stat-box">
            <div className="stat-icon">🎰</div>
            <div className="stat-content">
              <span className="stat-number">{stats.totalGames}</span>
              <span className="stat-text">{t('history.total_bets')}</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <span className="stat-number">${stats.totalWagered.toFixed(2)}</span>
              <span className="stat-text">{t('history.total_wagered')}</span>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon">🏆</div>
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

        {/* ── Tab bar ────────────────────────────────────────────────────────── */}
        <div className="history-tabs">
          <button
            className={`history-tab ${tab === 'bolita' ? 'active' : ''}`}
            onClick={() => setTab('bolita')}
          >
            🎱 {t('history.tab_bolita')}
            {!bolitaLoading && <span className="tab-count">{bolitaBets.length}</span>}
          </button>
          <button
            className={`history-tab ${tab === 'keno' ? 'active' : ''}`}
            onClick={() => setTab('keno')}
          >
            🎲 {t('history.tab_keno')}
            {!kenoLoading && <span className="tab-count">{kenoGames.length}</span>}
          </button>
          <button
            className={`history-tab ${tab === 'bingo' ? 'active' : ''}`}
            onClick={() => setTab('bingo')}
          >
            🎴 {t('history.tab_bingo')}
            {!bingoLoading && <span className="tab-count">{bingoRounds.length}</span>}
          </button>
        </div>

        {/* ── La Bolita ──────────────────────────────────────────────────────── */}
        {tab === 'bolita' && (
          <div className="bets-history">
            <h3>🎱 {t('history.tab_bolita')}</h3>

            {bolitaLoading ? (
              <div className="loading-state"><Spinner /><p>{t('history.loading')}</p></div>
            ) : bolitaError ? (
              <div className="empty-history"><p>{t('history.error_loading')}</p></div>
            ) : bolitaBets.length === 0 ? (
              <div className="empty-history">
                <p>{t('history.no_bets')}</p>
                <Link to="/web3" className="btn-link">{t('history.first_bet')}</Link>
              </div>
            ) : (
              <div className="bets-table-container">
                <table className="bets-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('history.table.draw')}</th>
                      <th>{t('history.table.type')}</th>
                      <th>{t('history.table.number')}</th>
                      <th>{t('history.table.bet')}</th>
                      <th>{t('history.table.prize')}</th>
                      <th>{t('history.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bolitaBets.map(bet => {
                      const s = getBolitaStatus(bet);
                      const payout = parseFloat(bet.payout_amount || bet.actual_payout || 0);
                      return (
                        <tr key={bet.id} className={s.cls}>
                          <td>#{bet.id}</td>
                          <td>
                            <span className="draw-number">{bet.draw_number || '-'}</span>
                            <span className="draw-date">{formatDate(bet.scheduled_time || bet.created_at)}</span>
                          </td>
                          <td>
                            <span className={`bet-type ${bet.game_type}`}>
                              {bet.game_type?.toUpperCase()}
                            </span>
                          </td>
                          <td className="bet-numbers">{getBetNumber(bet)}</td>
                          <td className="bet-amount">${parseFloat(bet.amount).toFixed(2)}</td>
                          <td className={`bet-payout ${payout > 0 ? 'won' : ''}`}>
                            {payout > 0 ? `+$${payout.toFixed(2)}` : '-'}
                          </td>
                          <td>
                            <span className={`status-badge ${s.cls}`}>{s.text}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Keno ───────────────────────────────────────────────────────────── */}
        {tab === 'keno' && (
          <div className="bets-history">
            <h3>🎲 {t('history.tab_keno')}</h3>

            {kenoLoading ? (
              <div className="loading-state"><Spinner /><p>{t('history.loading')}</p></div>
            ) : kenoError ? (
              <div className="empty-history"><p>{t('history.error_loading')}</p></div>
            ) : kenoGames.length === 0 ? (
              <div className="empty-history">
                <p>{t('history.no_keno_history')}</p>
                <Link to="/keno" className="btn-link">{t('history.first_keno')}</Link>
              </div>
            ) : (
              <div className="bets-table-container">
                <table className="bets-table">
                  <thead>
                    <tr>
                      <th>{t('history.table.date')}</th>
                      <th>{t('history.table.numbers')}</th>
                      <th>{t('history.table.hits')}</th>
                      <th>{t('history.table.bet')}</th>
                      <th>{t('history.table.prize')}</th>
                      <th>{t('history.table.result')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kenoGames.map(game => (
                      <tr key={game.gameId} className={game.isWin ? 'won' : 'lost'}>
                        <td>
                          <span className="draw-date">{formatDate(game.timestamp)}</span>
                        </td>
                        <td className="keno-numbers-cell">
                          {(game.selectedNumbers || []).join(', ')}
                        </td>
                        <td>
                          <span className={`status-badge ${game.hits > 0 ? 'won' : 'lost'}`}>
                            {game.hits}/{game.spots}
                          </span>
                        </td>
                        <td className="bet-amount">${(game.betAmount || 0).toFixed(2)}</td>
                        <td className={`bet-payout ${game.payout > 0 ? 'won' : ''}`}>
                          {game.payout > 0 ? `+$${game.payout.toFixed(2)}` : '-'}
                        </td>
                        <td>
                          <span className={`status-badge ${game.isWin ? 'won' : 'lost'}`}>
                            {game.isWin ? t('history.status.won') : t('history.status.lost')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Bingo ──────────────────────────────────────────────────────────── */}
        {tab === 'bingo' && (
          <div className="bets-history">
            <h3>🎴 {t('history.tab_bingo')}</h3>

            {bingoLoading ? (
              <div className="loading-state"><Spinner /><p>{t('history.loading')}</p></div>
            ) : bingoError ? (
              <div className="empty-history"><p>{t('history.error_loading')}</p></div>
            ) : bingoRounds.length === 0 ? (
              <div className="empty-history">
                <p>{t('history.no_bingo_history')}</p>
                <Link to="/bingo" className="btn-link">{t('history.first_bingo')}</Link>
              </div>
            ) : (
              <div className="bets-table-container">
                <table className="bets-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('history.table.room')}</th>
                      <th>{t('history.table.status')}</th>
                      <th>{t('history.table.prize')}</th>
                      <th>{t('history.table.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bingoRounds.map(round => {
                      const isWinner = round.winner_address?.toLowerCase() === account?.toLowerCase();
                      const rowCls = round.status === 'resolved'
                        ? (isWinner ? 'won' : 'lost')
                        : 'pending';
                      return (
                        <tr key={round.round_id} className={rowCls}>
                          <td>#{round.round_id}</td>
                          <td>
                            <span className="draw-number">{t('history.table.room')} {round.room_number}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${rowCls}`}>
                              {round.status === 'resolved'
                                ? (isWinner ? t('history.status.won') : t('history.status.lost'))
                                : t('history.status.pending')}
                            </span>
                          </td>
                          <td className={`bet-payout ${isWinner ? 'won' : ''}`}>
                            {isWinner && round.prize_pool
                              ? `+$${parseFloat(round.prize_pool).toFixed(2)}`
                              : '-'}
                          </td>
                          <td>
                            <span className="draw-date">
                              {formatDate(round.resolved_at || round.scheduled_close)}
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
        )}
      </main>
    </div>
  );
}

export default HistoryPage;
