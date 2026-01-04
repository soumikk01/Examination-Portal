import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';



const SearchPage = () => {
    const [searchId, setSearchId] = useState('');
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);

    // Simulate loading effect
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = () => {
        if (!searchId) return;
        navigate(`/student/${searchId}`);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                backgroundColor: '#cbd5e1',
                margin: 0
            }}>
                {/* Background Blobs */}
                <div style={{
                    position: 'absolute',
                    top: '-150px',
                    left: '-150px',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, #86bafa4d 0%, #5c8cf533 100%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-150px',
                    right: '-150px',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, hsla(158, 87%, 73%, 0.30) 0%, #72f1c933 100%)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
                    <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div className="skeleton skeleton-text h-12 w-64 mx-auto bg-gray-200"></div>
                    </header>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '32px 24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        width: '100%',
                        boxSizing: 'border-box'
                    }}>
                        <div className="skeleton skeleton-text h-8 w-40 mb-4 bg-gray-100"></div>
                        <div className="skeleton skeleton-text h-4 w-56 mb-6 bg-gray-100"></div>
                        <div className="skeleton skeleton-text h-12 w-full mb-4 bg-gray-100 rounded-lg"></div>
                        <div className="skeleton skeleton-text h-12 w-full bg-blue-100 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            backgroundColor: '#cbd5e1',
            margin: 0
        }}>

            {/* Top Left Gradient Blob */}
            <div style={{
                position: 'absolute',
                top: '-150px',
                left: '-150px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, #86bafa4d 0%, #5c8cf533 100%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            {/* Bottom Right Gradient Blob */}
            <div style={{
                position: 'absolute',
                bottom: '-150px',
                right: '-150px',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, hsla(158, 87%, 73%, 0.30) 0%, #72f1c933 100%)',
                borderRadius: '50%',
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
                {/* Website Name */}
                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{
                        fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                        fontWeight: 800,
                        color: '#000000',
                        letterSpacing: '-0.02em'
                    }}>
                        Examination Portal
                    </h1>
                </header>

                {/* Login Card */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '32px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#000000',
                        marginBottom: '16px'
                    }}>
                        Student Login
                    </h2>
                    <label style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'block',
                        marginBottom: '8px'
                    }}>
                        ENTER STUD. ID NO. ON PHOTO I-CARD
                    </label>
                    <input
                        type="text"
                        placeholder="***/***/****"
                        style={{
                            width: '100%',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '14px 16px',
                            fontSize: '1rem',
                            marginBottom: '16px',
                            boxSizing: 'border-box',
                            outline: 'none'
                        }}
                        value={searchId}
                        onChange={(e) => {
                            setSearchId(e.target.value);
                            e.target.style.borderColor = '#e5e7eb'; // Reset border on typing
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchId.trim()) handleSearch();
                            }
                        }}
                        aria-label="Student ID Input"
                    />
                    <button
                        onClick={(e) => {
                            if (!searchId.trim()) {
                                // Add shake effect if empty
                                const input = e.currentTarget.previousSibling;
                                input.style.borderColor = 'red';
                                input.animate([
                                    { transform: 'translateX(0)' },
                                    { transform: 'translateX(-5px)' },
                                    { transform: 'translateX(5px)' },
                                    { transform: 'translateX(0)' }
                                ], { duration: 300 });
                                return;
                            }
                            handleSearch();
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(37, 99, 235, 0.2)';
                            e.currentTarget.style.backgroundColor = '#1d4ed8';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.backgroundColor = '#2563eb';
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(37, 99, 235, 0.2)';
                        }}
                        style={{
                            width: '100%',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            padding: '14px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '1rem',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.1)'
                        }}
                    >
                        <Search size={18} strokeWidth={2.5} /> Search
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SearchPage;
