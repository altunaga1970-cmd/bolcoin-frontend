import React from 'react';
import './Checkbox.css';

const Checkbox = ({ id, checked, onChange, label, disabled = false, className = '' }) => {
  return (
    <div className={`checkbox-wrapper ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="checkbox-input"
      />
      <label htmlFor={id} className="checkbox-label">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;