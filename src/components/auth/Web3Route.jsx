import React from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../common';

// Pantalla mostrada mientras wagmi reconecta la sesion guardada o confirma conexion
function ConnectingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#0D0D0D',
      color: '#FFD700',
      gap: '1.5rem',
    }}>
      {/* Spinner animado */}
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: '3px solid rgba(255,215,0,0.15)',
        borderTopColor: '#FFD700',
        animation: 'web3-spin 0.9s linear infinite',
      }} />

      <div>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 600 }}>
          Conectando wallet…
        </h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.9rem', maxWidth: '280px' }}>
          Confirma la conexión en tu wallet y vuelve a esta ventana.
        </p>
      </div>

      <style>{`
        @keyframes web3-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function Web3Route({ children }) {
  const { isConnected, isConnecting, isReconnecting, connectWallet, isCorrectNetwork, switchNetwork } = useWeb3();

  // Mientras wagmi resuelve la sesion (reconexion automatica o conexion en curso)
  // no mostrar el panel de "Wallet Requerida" — evita confusion en movil
  if (isConnecting || isReconnecting) {
    return <ConnectingScreen />;
  }

  if (!isConnected) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#0D0D0D',
        color: '#FFD700',
        gap: '1rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
          Wallet Requerida
        </h2>
        <p style={{ margin: 0, color: '#999' }}>
          Necesitas conectar tu wallet para acceder a esta página.
        </p>
        <Button
          onClick={connectWallet}
          size="lg"
          style={{ marginTop: '0.5rem' }}
        >
          Conectar Wallet
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          size="sm"
        >
          Volver
        </Button>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#0D0D0D',
        color: '#FFD700',
        gap: '1rem',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
          Red Incorrecta
        </h2>
        <p style={{ margin: 0, color: '#999' }}>
          Por favor, cambia a la red Polygon para continuar.
        </p>
        <Button
          onClick={switchNetwork}
          size="lg"
          style={{ marginTop: '0.5rem' }}
        >
          Cambiar a Polygon
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          size="sm"
        >
          Volver
        </Button>
      </div>
    );
  }

  return children;
}

export default Web3Route;
