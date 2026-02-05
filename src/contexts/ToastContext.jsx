import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToastById = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();

    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remover despues de la duracion
    if (duration > 0) {
      setTimeout(() => {
        removeToastById(id);
      }, duration);
    }

    return id;
  }, [removeToastById]);

  const removeToast = removeToastById;

  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);

  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);

  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);

  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
}

// Componente contenedor de toasts
function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

// Componente individual de toast
function Toast({ message, type, onClose }) {
  const typeStyles = {
    success: { backgroundColor: '#4CAF50', borderColor: '#388E3C' },
    error: { backgroundColor: '#F44336', borderColor: '#D32F2F' },
    warning: { backgroundColor: '#FF9800', borderColor: '#F57C00' },
    info: { backgroundColor: '#2196F3', borderColor: '#1976D2' }
  };

  const icons = {
    success: '\u2713',
    error: '\u2717',
    warning: '\u26A0',
    info: '\u2139'
  };

  return (
    <div style={{ ...styles.toast, ...typeStyles[type] }}>
      <span style={styles.icon}>{icons[type]}</span>
      <span style={styles.message}>{message}</span>
      <button style={styles.closeBtn} onClick={onClose}>
        \u00D7
      </button>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: '80px',
    right: '20px',
    zIndex: 500,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '400px'
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s ease',
    borderLeft: '4px solid'
  },
  icon: {
    marginRight: '12px',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  message: {
    flex: 1,
    fontSize: '14px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '20px',
    cursor: 'pointer',
    marginLeft: '12px',
    opacity: 0.8,
    padding: '0 4px'
  }
};

export default ToastContext;
