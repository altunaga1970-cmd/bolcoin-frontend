import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Alert } from '../common';
import { validateRegisterForm } from '../../utils/validators';
import './AuthForms.css';

function RegisterForm({ onSubmit, isLoading, error }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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
    const validation = validateRegisterForm(
      formData.username,
      formData.email,
      formData.password,
      formData.confirmPassword
    );

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSubmit(formData.username, formData.email, formData.password);
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="auth-form-header">
        <h1 className="auth-form-title">Crear Cuenta</h1>
        <p className="auth-form-subtitle">Unete a La Bolita y empieza a ganar</p>
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
          placeholder="Elige un nombre de usuario"
          error={errors.username}
          autoComplete="username"
          required
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          error={errors.email}
          autoComplete="email"
          required
        />

        <Input
          label="Contrasena"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimo 6 caracteres"
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirmar Contrasena"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repite tu contrasena"
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />
      </div>

      <Button
        type="submit"
        fullWidth
        loading={isLoading}
        size="lg"
      >
        Crear Cuenta
      </Button>

      <p className="auth-form-footer">
        Ya tienes cuenta?{' '}
        <Link to="/login">Inicia sesion</Link>
      </p>
    </form>
  );
}

export default RegisterForm;
