import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { LoadingScreen } from '../common/Spinner/Spinner';
import ConnectWallet from '../web3/ConnectWallet';

/**
 * ProtectedRoute - Web3 Only
 *
 * Verifica que el usuario tenga su wallet conectada.
 * Si no esta conectada, muestra el componente de conexion.
 * No hay login tradicional con email/password.
 */
function ProtectedRoute({ children }) {
  const { isConnected, isConnecting, isCorrectNetwork } = useWeb3();
  const location = useLocation();

  // Mostrar loading mientras se conecta
  if (isConnecting) {
    return <LoadingScreen message="Conectando wallet..." />;
  }

  // Si no hay wallet conectada, mostrar pantalla de conexion
  if (!isConnected) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
        padding: '2rem'
      }}>
        <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>
          Conecta tu Wallet
        </h2>
        <p style={{ color: '#B0B0B0', marginBottom: '2rem', textAlign: 'center' }}>
          Para acceder a esta seccion necesitas conectar tu wallet.
        </p>
        <ConnectWallet />
      </div>
    );
  }

  // Si esta conectado pero en red incorrecta, mostrar advertencia
  if (!isCorrectNetwork) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
        padding: '2rem'
      }}>
        <h2 style={{ color: '#FF6B6B', marginBottom: '1rem' }}>
          Red Incorrecta
        </h2>
        <p style={{ color: '#B0B0B0', marginBottom: '2rem', textAlign: 'center' }}>
          Por favor cambia a la red Polygon para continuar.
        </p>
        <ConnectWallet />
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
