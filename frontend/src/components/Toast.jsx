import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />,
    error: <AlertCircle size={18} style={{ color: 'var(--danger)' }} />,
    info: <Info size={18} style={{ color: 'var(--accent)' }} />,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '420px',
      }}
    >
      {icons[type] || icons.info}
      <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', flex: 1 }}>
        {message}
      </span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '2px',
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
