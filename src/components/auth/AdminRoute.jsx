import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

function AdminRoute({ children, requiredPermission }) {
    const { isAdmin, loading, hasPermission } = useAdminAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0D0D0D', color: '#FFD700' }}>
                Cargando admin…
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/admin/ops" replace />;
    }

    return children;
}

export default AdminRoute;
