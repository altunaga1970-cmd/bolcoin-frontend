import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './Web3Context';
import * as adminAuthApi from '../api/adminAuthApi';

/**
 * AdminAuthContext
 *
 * Gestiona la autenticación de administradores usando SIWE.
 * Separado del AuthContext normal para mayor seguridad.
 */

const AdminAuthContext = createContext(null);

const ADMIN_TOKEN_KEY = 'admin_session_token';

export function AdminAuthProvider({ children }) {
    const { account, signer, isConnected } = useWeb3();

    const [isAdmin, setIsAdmin] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [sessionToken, setSessionToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verificar si la wallet conectada es admin
    const checkIsAdmin = useCallback(async () => {
        if (!account) {
            setIsAdmin(false);
            return false;
        }

        try {
            const result = await adminAuthApi.checkAdminWallet(account);
            setIsAdmin(result.data.isAdmin);
            return result.data.isAdmin;
        } catch (err) {
            console.error('Error verificando admin:', err);
            setIsAdmin(false);
            return false;
        }
    }, [account]);

    // Verificar sesión existente
    const checkSession = useCallback(async () => {
        const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);

        if (!storedToken) {
            setIsAuthenticated(false);
            setIsLoading(false);
            return false;
        }

        try {
            const result = await adminAuthApi.getSession(storedToken);

            // Verificar que la sesión corresponde a la wallet conectada
            if (account && result.data.address !== account.toLowerCase()) {
                // Wallet diferente, limpiar sesión
                localStorage.removeItem(ADMIN_TOKEN_KEY);
                setIsAuthenticated(false);
                setIsLoading(false);
                return false;
            }

            setSessionToken(storedToken);
            setAdminRole(result.data.role);
            setPermissions(result.data.permissions || []);
            setIsAuthenticated(true);
            setIsLoading(false);
            return true;
        } catch (err) {
            // Sesión inválida o expirada
            localStorage.removeItem(ADMIN_TOKEN_KEY);
            setIsAuthenticated(false);
            setSessionToken(null);
            setIsLoading(false);
            return false;
        }
    }, [account]);

    // Login con SIWE
    const login = useCallback(async () => {
        if (!account || !signer) {
            setError('Wallet no conectada');
            return { success: false, error: 'Wallet no conectada' };
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Verificar que es admin
            const isAdminWallet = await checkIsAdmin();
            if (!isAdminWallet) {
                setError('Esta wallet no tiene permisos de administrador');
                setIsLoading(false);
                return { success: false, error: 'No es admin' };
            }

            // 2. Obtener nonce
            const nonceResult = await adminAuthApi.getNonce(account);
            const { message } = nonceResult.data;

            // 3. Firmar mensaje
            let signature;
            try {
                signature = await signer.signMessage(message);
            } catch (signError) {
                if (signError.code === 'ACTION_REJECTED' || signError.code === 4001) {
                    setError('Firma rechazada por el usuario');
                    setIsLoading(false);
                    return { success: false, error: 'Firma rechazada' };
                }
                throw signError;
            }

            // 4. Verificar y crear sesión
            const verifyResult = await adminAuthApi.verifySiwe(account, signature, message);

            // 5. Guardar sesión
            const { token, role, expiresIn } = verifyResult.data;
            localStorage.setItem(ADMIN_TOKEN_KEY, token);

            setSessionToken(token);
            setAdminRole(role);
            setIsAuthenticated(true);

            // Obtener permisos
            try {
                const sessionResult = await adminAuthApi.getSession(token);
                setPermissions(sessionResult.data.permissions || []);
            } catch {
                // Ignorar error de permisos
            }

            setIsLoading(false);
            return { success: true, role };
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Error de autenticación';
            setError(message);
            setIsLoading(false);
            return { success: false, error: message };
        }
    }, [account, signer, checkIsAdmin]);

    // Logout
    const logout = useCallback(async () => {
        try {
            if (sessionToken) {
                await adminAuthApi.logout(sessionToken);
            }
        } catch (err) {
            console.error('Error en logout:', err);
        }

        localStorage.removeItem(ADMIN_TOKEN_KEY);
        setSessionToken(null);
        setIsAuthenticated(false);
        setAdminRole(null);
        setPermissions([]);
    }, [sessionToken]);

    // Verificar permiso
    const hasPermission = useCallback((permission) => {
        return permissions.includes(permission);
    }, [permissions]);

    // Efectos - solo ejecutar cuando cambia account o isConnected
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            if (!isConnected || !account) {
                setIsAdmin(false);
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            try {
                // Verificar si es admin
                const result = await adminAuthApi.checkAdminWallet(account);
                if (isMounted) {
                    setIsAdmin(result.data.isAdmin);
                }

                // Verificar sesión existente
                const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
                if (storedToken && isMounted) {
                    try {
                        const sessionResult = await adminAuthApi.getSession(storedToken);
                        if (sessionResult.data.address === account.toLowerCase()) {
                            setSessionToken(storedToken);
                            setAdminRole(sessionResult.data.role);
                            setPermissions(sessionResult.data.permissions || []);
                            setIsAuthenticated(true);
                        } else {
                            localStorage.removeItem(ADMIN_TOKEN_KEY);
                            setIsAuthenticated(false);
                        }
                    } catch {
                        localStorage.removeItem(ADMIN_TOKEN_KEY);
                        setIsAuthenticated(false);
                    }
                }
            } catch (err) {
                console.error('Error inicializando admin:', err);
                if (isMounted) {
                    setIsAdmin(false);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [isConnected, account]);

    const value = {
        // Estado
        isAdmin,
        isAuthenticated,
        adminRole,
        permissions,
        sessionToken,
        isLoading,
        error,

        // Funciones
        login,
        logout,
        hasPermission,
        checkIsAdmin,
        checkSession,

        // Helpers
        clearError: () => setError(null)
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
