import React from 'react';
import './Alert.css';

function Alert({
  children,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  className = ''
}) {
  const icons = {
    success: '\u2713',
    error: '\u2717',
    warning: '\u26A0',
    info: '\u2139'
  };

  const classNames = [
    'alert',
    `alert-${type}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <span className="alert-icon">{icons[type]}</span>
      <div className="alert-content">
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-message">{children}</div>
      </div>
      {dismissible && (
        <button className="alert-dismiss" onClick={onDismiss}>
          \u00D7
        </button>
      )}
    </div>
  );
}

export default Alert;
