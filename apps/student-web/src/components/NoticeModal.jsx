
const NoticeModal = ({ notice, onClose }) => {
    const hasNotice = notice && notice.trim() !== '';
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
                animation: 'fadeInOverlay 0.2s ease',
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: hasNotice ? '#fffdf0' : '#f0f9ff',
                    border: hasNotice ? '2px solid #e6e2c8' : '2px solid #bae6fd',
                    borderRadius: '12px', padding: '2rem',
                    maxWidth: '480px', width: '90%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    position: 'relative',
                    animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: 'none', border: 'none', fontSize: '1.4rem',
                        cursor: 'pointer', color: '#888', lineHeight: 1,
                        padding: '2px 6px', borderRadius: '4px',
                    }}
                >×</button>

                {hasNotice ? (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        </div>
                        <h3 style={{
                            textAlign: 'center', fontSize: '1.15rem', fontWeight: 700,
                            color: '#374151', marginBottom: '1rem',
                            textDecoration: 'underline', textDecorationStyle: 'wavy',
                            textDecorationColor: '#e6e2c8',
                        }}>Examination Cell Notice</h3>
                        <div style={{
                            background: '#fff',
                            border: '1px solid #f1f5f9',
                            borderRadius: '8px',
                            padding: '1.25rem',
                            boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
                            margin: '0.5rem 0',
                            overflow: 'hidden'
                        }}>
                            <p style={{
                                color: '#374151', lineHeight: '1.7',
                                whiteSpace: 'pre-wrap', 
                                textAlign: 'center',
                                fontWeight: 500, fontSize: '0.97rem',
                                margin: 0,
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word'
                            }}>{notice}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        </div>
                        <p style={{ textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
                            No active notices at this time.
                        </p>
                    </>
                )}

                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 24px', borderRadius: '20px',
                            border: 'none', background: '#4f46e5',
                            color: '#fff', fontWeight: 600,
                            fontSize: '0.9rem', cursor: 'pointer',
                        }}
                    >Close</button>
                </div>
            </div>
            <style>{`
                @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default NoticeModal;
