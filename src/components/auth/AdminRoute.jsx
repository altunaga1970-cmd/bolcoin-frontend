import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../../contexts/Web3Context';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { LoadingScreen } from '../common/Spinner/Spinner';
import SIWELogin from '../admin/SIWELogin';

/**
 * AdminRoute - Protege rutas de administrador con SIWE
 *
 * Verifica:
 * 1. Wallet conectada
 * 2. Wallet en lista de admins
 * 3. Sesion SIWE activa
 */
function AdminRoute({ children, requiredPermission = null }) {
    const { isConnected, isConnecting } = useWeb3();
    const {
        isAdmin,
        isAuthenticated,
        isLoading,
        hasPermission
    } = useAdminAuth();
    const location = useLocation();

    // Loading mientras se verifica
    if (isConnecting || isLoading) {
        return <LoadingScreen message="Verificando permisos de administrador..." />;
    }

    // No hay wallet conectada o no es admin
    if (!isConnected || !isAdmin) {
        return <SIWELogin />;
    }

    // Wallet admin pero sin sesion SIWE activa
    if (!isAuthenticated) {
        return <SIWELogin />;
    }

    // Verificar permiso especifico si se requiere
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.icon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                    </div>
                    <h2 style={styles.title}>Permiso Requerido</h2>
                    <p style={styles.subtitle}>
                        No tienes el permiso necesario para acceder a esta seccion.
                    </p>
                    <div style={styles.permissionBox}>
                        <span style={styles.permissionLabel}>Permiso requerido:</span>
                        <code style={styles.permissionCode}>{requiredPermission}</code>
                    </div>
                    <a href="/admin" style={styles.backLink}>
                        Volver al panel
                    </a>
                </div>
            </div>
        );
    }

    return children;
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
        color: '#FF6B6B',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
    },
    subtitle: {
        color: '#B0B0B0',
        fontSize: '0.9rem',
        marginBottom: '1.5rem'
    },
    permissionBox: {
        backgroundColor: '#252525',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem'
    },
    permissionLabel: {
        display: 'block',
        color: '#888',
        fontSize: '0.75rem',
        marginBottom: '0.5rem'
    },
    permissionCode: {
        color: '#FFD700',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
    },
    backLink: {
        color: '#888',
        textDecoration: 'none',
        fontSize: '0.875rem'
    }
};

export default AdminRoute;
