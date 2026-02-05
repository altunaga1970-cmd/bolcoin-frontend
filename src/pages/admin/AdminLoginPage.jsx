import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import SIWELogin from '../../components/admin/SIWELogin';

/**
 * Pagina de Login para Administradores
 * Usa SIWE (Sign-In with Ethereum)
 */
function AdminLoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAdminAuth();

    // Redirigir si ya esta autenticado
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate('/admin');
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleLoginSuccess = () => {
        navigate('/admin');
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.logo}>La Bolita</h1>
                <span style={styles.badge}>Admin</span>
            </div>

            <SIWELogin onSuccess={handleLoginSuccess} />

            <div style={styles.footer}>
                <a href="/" style={styles.link}>Volver al sitio</a>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        padding: '1.5rem',
        borderBottom: '1px solid #222'
    },
    logo: {
        color: '#FFD700',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        margin: 0
    },
    badge: {
        backgroundColor: '#333',
        color: '#FFD700',
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    footer: {
        padding: '1.5rem',
        textAlign: 'center',
        borderTop: '1px solid #222',
        marginTop: 'auto'
    },
    link: {
        color: '#888',
        textDecoration: 'none',
        fontSize: '0.875rem'
    }
};

export default AdminLoginPage;
