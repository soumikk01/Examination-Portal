import React, { useState, useEffect } from 'react';

const Modal = ({ isOpen, title, message, type = 'alert', onConfirm, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Reset loading state when modal visibility cycles
  useEffect(() => {
    if (!isOpen) setIsLoading(false);
  }, [isOpen]);
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
              disabled={isLoading}
              style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white', color: '#374151', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: isLoading ? 0.7 : 1 }}
            >
              Cancel
            </button>
          )}
          <button
            disabled={isLoading}
            onClick={async () => {
              if (onConfirm) {
                 setIsLoading(true);
                 try {
                     // If onConfirm returns exactly false, we skip closing the modal automatically 
                     // (useful if onConfirm is transitioning the modal to another state like an Alert)
                     const shouldClose = await onConfirm();
                     if (shouldClose !== false) onClose();
                 } catch (err) {
                     // Ensure modal stays open on error unless handled
                 } finally {
                     setIsLoading(false);
                 }
              } else {
                 onClose();
              }
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: type === 'confirm' ? '#ef4444' : '#3b82f6',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading && (
               <svg style={{ animation: 'spin 1s linear infinite', height: '1rem', width: '1rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            )}
            {type === 'confirm' && isLoading ? 'Processing...' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
