import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminAuthContext = createContext(null);

const ADMIN_JWT_KEY = 'admin_jwt';

function decodeJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export function AdminAuthProvider({ children }) {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al montar: leer JWT de localStorage y decodificar
    useEffect(() => {
        const token = localStorage.getItem(ADMIN_JWT_KEY);
        if (!token) {
            setAdmin(null);
            setLoading(false);
            return;
        }

        const decoded = decodeJwtPayload(token);
        if (!decoded || !decoded.exp || Date.now() >= decoded.exp * 1000) {
            localStorage.removeItem(ADMIN_JWT_KEY);
            setAdmin(null);
            setLoading(false);
            return;
        }

        setAdmin({
            address: decoded.address,
            permissions: decoded.permissions || [],
            role: decoded.role,
            exp: decoded.exp
        });
        setLoading(false);
    }, []);

    const isAdmin = !!admin;

    const loginAdmin = useCallback((token) => {
        const decoded = decodeJwtPayload(token);
        if (!decoded || !decoded.exp || Date.now() >= decoded.exp * 1000) {
            return false;
        }
        localStorage.setItem(ADMIN_JWT_KEY, token);
        setAdmin({
            address: decoded.address,
            permissions: decoded.permissions || [],
            role: decoded.role,
            exp: decoded.exp
        });
        return true;
    }, []);

    const logoutAdmin = useCallback(() => {
        localStorage.removeItem(ADMIN_JWT_KEY);
        setAdmin(null);
    }, []);

    const hasPermission = useCallback((perm) => {
        if (!perm) return true;
        if (!admin) return false;
        return admin.permissions.includes(perm);
    }, [admin]);

    const value = {
        admin,
        loading,
        isAdmin,
        loginAdmin,
        logoutAdmin,
        hasPermission
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
}

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
    }
    return context;
}

export default AdminAuthContext;
