import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { Button } from '../common';

function Web3Route({ children }) {
  const { isConnected, isConnecting, connectWallet, isCorrectNetwork, switchNetwork } = useWeb3();
  const location = useLocation();

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
        color: '#FFD700'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
          Wallet Requerida
        </h2>
        <p style={{ marginBottom: '1.5rem', color: '#999' }}>
          Necesitas conectar tu wallet para acceder a esta página.
        </p>
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          size="lg"
          style={{ marginBottom: '1rem' }}
        >
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
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
        color: '#FFD700'
      }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>
          Red Incorrecta
        </h2>
        <p style={{ marginBottom: '1.5rem', color: '#999' }}>
          Por favor, cambia a la red correcta para continuar.
        </p>
        <Button
          onClick={switchNetwork}
          size="lg"
          style={{ marginBottom: '1rem' }}
        >
          Cambiar de Red
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