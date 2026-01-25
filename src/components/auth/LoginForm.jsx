import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Alert } from '../common';
import { validateLoginForm } from '../../utils/validators';
import './AuthForms.css';

function LoginForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar formulario
    const validation = validateLoginForm(formData.username, formData.password);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(formData.username, formData.password);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-header">
        <h1 className="auth-form-title">Iniciar Sesion</h1>
        <p className="auth-form-subtitle">Ingresa a tu cuenta de La Bolita</p>
      </div>

      {error && (
        <Alert type="error" className="auth-form-alert">
          {error}
        </Alert>
      )}

      <div className="auth-form-fields">
        <Input
          label="Usuario"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Tu nombre de usuario"
          error={errors.username}
          autoComplete="username"
          required
        />

        <Input
          label="Contrasena"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Tu contrasena"
          error={errors.password}
          autoComplete="current-password"
          required
        />
      </div>

      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        size="lg"
      >
        Iniciar Sesion
      </Button>

      <p className="auth-form-footer">
        No tienes cuenta?{' '}
        <Link to="/register">Registrate aqui</Link>
      </p>
    </form>
  );
}

export default LoginForm;
