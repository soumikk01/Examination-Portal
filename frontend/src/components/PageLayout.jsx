import React from 'react';

const PageLayout = ({ children, centerContent = false, style = {} }) => {
    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: centerContent ? 'center' : 'flex-start',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                backgroundColor: '#cbd5e1',
                margin: 0,
                ...style,
            }}
        >
            {/* Top Left Gradient Blob */}
            <div
                style={{
                    position: 'absolute',
                    top: '-150px',
                    left: '-150px',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, #86bafa4d 0%, #5c8cf533 100%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0,
                }}
            />

            {/* Decorative Blue Round Design */}
            <div
                style={{
                    position: 'absolute',
                    top: '-50px',
                    left: '-150px',
                    width: '300px',
                    height: '300px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
                    zIndex: 5,
                    opacity: 0.9,
                }}
            />

            {/* Bottom Right Gradient Blob */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '-150px',
                    right: '-150px',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, hsla(158, 87%, 73%, 0.30) 0%, #72f1c933 100%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0,
                }}
            />

            {children}
        </div>
    );
};

export default PageLayout;
