import React from 'react';
import './Input.css';

function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  id,
  name,
  autoComplete,
  maxLength,
  min,
  max,
  step,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`input-wrapper ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
}

export default Input;
