import React, { useState } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import ConnectWallet from '../web3/ConnectWallet';

/**
 * Componente de Login con SIWE para Admin
 */
function SIWELogin({ onSuccess }) {
    const { isConnected, account, formatAddress } = useWeb3();
    const { isAdmin, isAuthenticated, login, error, isLoading, clearError } = useAdminAuth();
    const [localError, setLocalError] = useState(null);

    const handleLogin = async () => {
        setLocalError(null);
        clearError();

        const result = await login();

        if (result.success) {
            if (onSuccess) {
                onSuccess(result);
            }
        } else {
            setLocalError(result.error);
        }
    };

    const displayError = localError || error;

    // Si no hay wallet conectada
    if (!isConnected) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.icon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                        </svg>
                    </div>
                    <h2 style={styles.title}>Panel de Administracion</h2>
                    <p style={styles.subtitle}>
                        Conecta tu wallet de administrador para acceder
                    </p>
                    <div style={styles.walletContainer}>
                        <ConnectWallet />
                    </div>
                </div>
            </div>
        );
    }

    // Wallet conectada pero no es admin
    if (!isAdmin) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.icon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                    </div>
                    <h2 style={styles.title}>Acceso Denegado</h2>
                    <p style={styles.subtitle}>
                        Esta wallet no tiene permisos de administrador
                    </p>
                    <div style={styles.addressBox}>
                        <span style={styles.addressLabel}>Wallet conectada:</span>
                        <span style={styles.address}>{formatAddress(account)}</span>
                    </div>
                    <div style={styles.walletContainer}>
                        <ConnectWallet />
                    </div>
                </div>
            </div>
        );
    }

    // Ya autenticado
    if (isAuthenticated) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.icon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22,4 12,14.01 9,11.01"/>
                        </svg>
                    </div>
                    <h2 style={styles.title}>Sesion Activa</h2>
                    <p style={styles.subtitle}>
                        Ya tienes una sesion de administrador activa
                    </p>
                    <div style={styles.addressBox}>
                        <span style={styles.addressLabel}>Wallet:</span>
                        <span style={styles.address}>{formatAddress(account)}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Wallet admin lista para autenticar
    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.icon}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <h2 style={styles.title}>Autenticacion Admin</h2>
                <p style={styles.subtitle}>
                    Firma un mensaje con tu wallet para verificar tu identidad
                </p>

                <div style={styles.addressBox}>
                    <span style={styles.addressLabel}>Wallet admin:</span>
                    <span style={styles.address}>{formatAddress(account)}</span>
                </div>

                {displayError && (
                    <div style={styles.errorBox}>
                        {displayError}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    style={{
                        ...styles.button,
                        ...(isLoading ? styles.buttonDisabled : {})
                    }}
                >
                    {isLoading ? (
                        <>
                            <span style={styles.spinner}></span>
                            Verificando...
                        </>
                    ) : (
                        <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                                <polyline points="10 17 15 12 10 7"/>
                                <line x1="15" y1="12" x2="3" y2="12"/>
                            </svg>
                            Firmar y Acceder
                        </>
                    )}
                </button>

                <p style={styles.hint}>
                    Se abrira tu wallet para firmar un mensaje de verificacion.
                    Esto no realiza ninguna transaccion ni gasta gas.
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
        padding: '2rem'
    },
    card: {
        backgroundColor: '#1A1A1A',
        borderRadius: '12px',
        padding: '2.5rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid #333'
    },
    icon: {
        marginBottom: '1.5rem'
    },
    title: {
        color: '#FFD700',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
    },
    subtitle: {
        color: '#B0B0B0',
        fontSize: '0.9rem',
        marginBottom: '1.5rem'
    },
    addressBox: {
        backgroundColor: '#252525',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem'
    },
    addressLabel: {
        display: 'block',
        color: '#888',
        fontSize: '0.75rem',
        marginBottom: '0.25rem'
    },
    address: {
        color: '#FFF',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
    },
    errorBox: {
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid #FF6B6B',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        color: '#FF6B6B',
        fontSize: '0.875rem'
    },
    button: {
        width: '100%',
        padding: '1rem 1.5rem',
        backgroundColor: '#FFD700',
        color: '#000',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s'
    },
    buttonDisabled: {
        backgroundColor: '#666',
        cursor: 'not-allowed'
    },
    hint: {
        color: '#666',
        fontSize: '0.75rem',
        marginTop: '1rem'
    },
    walletContainer: {
        marginTop: '1rem'
    },
    spinner: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        border: '2px solid #333',
        borderTopColor: '#FFD700',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '8px'
    }
};

export default SIWELogin;
