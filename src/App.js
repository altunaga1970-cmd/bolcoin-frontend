import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { Web3Provider } from './contexts/Web3Context';
import { BalanceProvider } from './contexts/BalanceContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { GeoBlock } from './components/common';
import { AdminRoute, Web3Route } from './components/auth';

// MVP: Componentes ComingSoon para juegos deshabilitados
const BolitaComingSoon = React.lazy(() =>
  import('./components/common/ComingSoon').then(m => ({ default: m.BolitaComingSoon }))
);
const FortunaComingSoon = React.lazy(() =>
  import('./components/common/ComingSoon').then(m => ({ default: m.FortunaComingSoon }))
);

// Estilos globales
import './styles/global.css';

// Paginas publicas
const HomePage = React.lazy(() => import('./pages/public/HomePage'));
const ResultsPage = React.lazy(() => import('./pages/public/ResultsPage'));
const HowItWorksPage = React.lazy(() => import('./pages/public/HowItWorksPage'));
const TransparencyPage = React.lazy(() => import('./pages/public/TransparencyPage'));
const FairnessPage = React.lazy(() => import('./pages/public/FairnessPage'));
const StatisticsPage = React.lazy(() => import('./pages/public/StatisticsPage'));
const FAQPage = React.lazy(() => import('./pages/public/FAQPage'));
const ContactPage = React.lazy(() => import('./pages/public/ContactPage'));
const OfficialLinksPage = React.lazy(() => import('./pages/public/OfficialLinksPage'));

// Paginas legales
const TermsPage = React.lazy(() => import('./pages/legal/TermsPage'));
const RulesPage = React.lazy(() => import('./pages/legal/RulesPage'));
const PrivacyPage = React.lazy(() => import('./pages/legal/PrivacyPage'));
const CookiesPage = React.lazy(() => import('./pages/legal/CookiesPage'));
const ResponsibleGamingPage = React.lazy(() => import('./pages/legal/ResponsibleGamingPage'));
const JurisdictionsPage = React.lazy(() => import('./pages/legal/JurisdictionsPage'));
const DisclaimerPage = React.lazy(() => import('./pages/legal/DisclaimerPage'));

// Paginas Web3 (usuario)
const Web3WalletPage = React.lazy(() => import('./pages/user/Web3WalletPage'));
const Web3BettingPage = React.lazy(() => import('./pages/user/Web3BettingPage'));
const ReferralsPage = React.lazy(() => import('./pages/user/ReferralsPage'));
const HistoryPage = React.lazy(() => import('./pages/user/HistoryPage'));
const LotteryPage = React.lazy(() => import('./pages/user/LotteryPage'));
const KenoPage = React.lazy(() => import('./pages/user/KenoPage'));
const ClaimsPage = React.lazy(() => import('./pages/user/ClaimsPage'));

// Paginas de admin
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const ManageDrawsPage = React.lazy(() => import('./pages/admin/ManageDrawsPage'));
const ManageUsersPage = React.lazy(() => import('./pages/admin/ManageUsersPage'));
const WithdrawalsPage = React.lazy(() => import('./pages/admin/WithdrawalsPage'));
const AuditLogsPage = React.lazy(() => import('./pages/admin/AuditLogsPage'));
const Web3AdminPage = React.lazy(() => import('./pages/admin/Web3AdminPage'));
const BankrollDashboard = React.lazy(() => import('./pages/admin/BankrollDashboard'));
const KenoPoolDashboard = React.lazy(() => import('./pages/admin/KenoPoolDashboard'));

// Loading fallback
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0D0D0D',
      color: '#FFD700'
    }}>
      <div>Cargando...</div>
    </div>
  );
}

// Componente wrapper para geoblocking condicional
function GeoBlockWrapper({ children }) {
  const enableGeoblock = import.meta.env.PROD ||
                         import.meta.env.VITE_ENABLE_GEOBLOCK === 'true';

  if (enableGeoblock) {
    return <GeoBlock>{children}</GeoBlock>;
  }
  return children;
}

function App() {
  return (
    <GeoBlockWrapper>
      <Router>
        <ToastProvider>
          <ConfigProvider>
            <Web3Provider>
              <BalanceProvider>
                <AdminAuthProvider>
                  <React.Suspense fallback={<LoadingFallback />}>
                  <Routes>
                  {/* MVP: Keno es la pagina principal */}
                  <Route path="/" element={<Web3Route><KenoPage /></Web3Route>} />

                  {/* Paginas de juego Web3 - Protegidas */}
                  {/* MVP: La Bolita deshabilitado - muestra ComingSoon */}
                  <Route path="/bet" element={<BolitaComingSoon />} />
                  <Route path="/bet/:drawId" element={<BolitaComingSoon />} />

                  <Route path="/wallet" element={<Web3Route><Web3WalletPage /></Web3Route>} />
                  <Route path="/history" element={<Web3Route><HistoryPage /></Web3Route>} />
                  <Route path="/referrals" element={<Web3Route><ReferralsPage /></Web3Route>} />

                  {/* MVP: La Fortuna deshabilitado - muestra ComingSoon */}
                  <Route path="/lottery" element={<FortunaComingSoon />} />
                  <Route path="/fortuna" element={<FortunaComingSoon />} />

                  {/* MVP: Keno habilitado */}
                  <Route path="/keno" element={<Web3Route><KenoPage /></Web3Route>} />
                  <Route path="/claims" element={<Web3Route><ClaimsPage /></Web3Route>} />
                  <Route path="/results" element={<ResultsPage />} />

                  {/* Paginas de informacion */}
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/transparency" element={<TransparencyPage />} />
                  <Route path="/fairness" element={<FairnessPage />} />
                  <Route path="/statistics" element={<StatisticsPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/official-links" element={<OfficialLinksPage />} />

                  {/* Paginas legales */}
                  <Route path="/legal/terms" element={<TermsPage />} />
                  <Route path="/legal/rules" element={<RulesPage />} />
                  <Route path="/legal/privacy" element={<PrivacyPage />} />
                  <Route path="/legal/cookies" element={<CookiesPage />} />
                  <Route path="/legal/responsible-gaming" element={<ResponsibleGamingPage />} />
                  <Route path="/legal/jurisdictions" element={<JurisdictionsPage />} />
                  <Route path="/legal/disclaimer" element={<DisclaimerPage />} />

                  {/* Rutas de admin - protegidas con AdminRoute */}
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/draws" element={<AdminRoute requiredPermission="draws:manage"><ManageDrawsPage /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute requiredPermission="users:read"><ManageUsersPage /></AdminRoute>} />
                  <Route path="/admin/withdrawals" element={<AdminRoute requiredPermission="withdrawals:manage"><WithdrawalsPage /></AdminRoute>} />
                  <Route path="/admin/audit-logs" element={<AdminRoute requiredPermission="audit:read"><AuditLogsPage /></AdminRoute>} />
                  <Route path="/admin/web3" element={<AdminRoute><Web3AdminPage /></AdminRoute>} />
                  <Route path="/admin/bankroll" element={<AdminRoute><BankrollDashboard /></AdminRoute>} />
                  <Route path="/admin/keno-pool" element={<AdminRoute><KenoPoolDashboard /></AdminRoute>} />

                  {/* Redirecciones de compatibilidad */}
                  <Route path="/web3" element={<Navigate to="/bet" replace />} />
                  <Route path="/web3/bet" element={<Navigate to="/bet" replace />} />
                  <Route path="/web3/wallet" element={<Navigate to="/wallet" replace />} />
                  <Route path="/web3-wallet" element={<Navigate to="/wallet" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/my-bets" element={<Navigate to="/history" replace />} />
                  <Route path="/profile" element={<Navigate to="/wallet" replace />} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/register" element={<Navigate to="/" replace />} />

                  {/* Redireccion por defecto */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  </React.Suspense>
                </AdminAuthProvider>
              </BalanceProvider>
            </Web3Provider>
          </ConfigProvider>
        </ToastProvider>
      </Router>
    </GeoBlockWrapper>
  );
}

export default App;
