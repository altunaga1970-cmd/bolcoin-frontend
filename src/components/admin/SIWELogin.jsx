import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import * as adminAuthApi from '../../api/adminAuthApi';
import ConnectWallet from '../web3/ConnectWallet';

function SIWELogin({ onSuccess }) {
    const { isConnected, account, signer, formatAddress } = useWeb3();
    const { loginAdmin, isAdmin } = useAdminAuth();

    const [walletIsAdmin, setWalletIsAdmin] = useState(null); // null=loading, true/false
    const [signing, setSigning] = useState(false);
    const [error, setError] = useState(null);

    // Verificar si la wallet es admin cuando se conecta
    useEffect(() => {
        if (!isConnected || !account) {
            setWalletIsAdmin(null);
            return;
        }

        let cancelled = false;
        setWalletIsAdmin(null);
        setError(null);

        adminAuthApi.checkAdminWallet(account)
            .then(result => {
                if (!cancelled) setWalletIsAdmin(result.data.isAdmin);
            })
            .catch((err) => {
                if (cancelled) return;
                // Distinguish network/API errors from "not admin"
                const status = err.status || err.response?.status;
                if (status === 403) {
                    setWalletIsAdmin(false);
                } else {
                    setError(err.message || 'Error conectando con el servidor. Verifica que el backend este corriendo.');
                    setWalletIsAdmin(false);
                }
            });

        return () => { cancelled = true; };
    }, [isConnected, account]);

    // Si ya tiene JWT valido, redirigir
    useEffect(() => {
        if (isAdmin && onSuccess) {
            onSuccess();
        }
    }, [isAdmin, onSuccess]);

    const handleLogin = async () => {
        if (!account || !signer) return;

        setSigning(true);
        setError(null);

        try {
            // 1. Obtener nonce
            const nonceResult = await adminAuthApi.getNonce(account);
            const { message } = nonceResult.data;

            // 2. Firmar mensaje con wallet
            let signature;
            try {
                signature = await signer.signMessage(message);
            } catch (signError) {
                if (signError.code === 'ACTION_REJECTED' || signError.code === 4001) {
                    setError('Firma rechazada por el usuario');
                    setSigning(false);
                    return;
                }
                throw signError;
            }

            // 3. Verificar firma y obtener JWT
            const verifyResult = await adminAuthApi.verifySiwe(account, signature, message);
            const { token } = verifyResult.data;

            // 4. Guardar JWT en contexto
            const success = loginAdmin(token);
            if (!success) {
                setError('Token recibido es invalido');
            } else if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            const msg = err.data?.message || err.message || 'Error de autenticacion';
            setError(msg);
        } finally {
            setSigning(false);
        }
    };

    // Sin wallet conectada
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

    // Verificando si es admin...
    if (walletIsAdmin === null) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>Verificando wallet...</h2>
                </div>
            </div>
        );
    }

    // No es admin
    if (!walletIsAdmin) {
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
                        {error || 'Esta wallet no tiene permisos de administrador'}
                    </p>
                    <div style={styles.addressBox}>
                        <span style={styles.addressLabel}>Wallet conectada:</span>
                        <span style={styles.address}>{formatAddress(account)}</span>
                    </div>
                    {error && (
                        <div style={styles.errorBox}>
                            {error}
                        </div>
                    )}
                    <div style={styles.walletContainer}>
                        <ConnectWallet />
                    </div>
                </div>
            </div>
        );
    }

    // Es admin, mostrar boton de firma
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

                {error && (
                    <div style={styles.errorBox}>
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={signing}
                    style={{
                        ...styles.button,
                        ...(signing ? styles.buttonDisabled : {})
                    }}
                >
                    {signing ? 'Verificando...' : 'Firmar y Acceder'}
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
        justifyContent: 'center'
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
    }
};

export default SIWELogin;
