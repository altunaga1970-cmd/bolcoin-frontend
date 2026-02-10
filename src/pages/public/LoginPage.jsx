import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../../components/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import '../../components/auth/AuthForms.css';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isAdmin, isLoading, error, clearError } = useAuth();
  const { success } = useToast();

  // Redirigir si ya esta autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Admins siempre van a /admin
      if (isAdmin) {
        navigate('/admin/ops', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate, location]);

  // Limpiar errores al desmontar
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (username, password) => {
    const result = await login(username, password);

    if (result.success) {
      success('Bienvenido de vuelta!');
      // Redirigir segun rol - admins siempre van a /admin
      const isUserAdmin = result.user?.role === 'admin';
      if (isUserAdmin) {
        navigate('/admin/ops', { replace: true });
      } else {
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <h2>LA BOLITA</h2>
          <p>Tu suerte te espera</p>
        </div>
        <LoginForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}

export default LoginPage;
