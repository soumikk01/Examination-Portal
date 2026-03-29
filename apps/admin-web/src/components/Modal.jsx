import React from 'react';

const Modal = ({ isOpen, title, message, type = 'alert', onConfirm, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '90%',
        width: '400px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1f2937', fontSize: '1.25rem' }}>
          {title || (type === 'confirm' ? 'Confirm' : 'Alert')}
        </h3>
        <p style={{ color: '#4b5563', marginBottom: '2rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          {type === 'confirm' && (
            <button 
              onClick={onClose}
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: '500' }}
            >
              Cancel
            </button>
          )}
          <button 
            onClick={async () => {
              if (onConfirm) await onConfirm();
              onClose();
            }}
            style={{ 
              padding: '0.5rem 1rem', 
              border: 'none', 
              borderRadius: '4px', 
              backgroundColor: type === 'confirm' ? '#ef4444' : '#3b82f6', 
              color: 'white', 
              cursor: 'pointer', 
              fontWeight: '500' 
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
