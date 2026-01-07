import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import logo from '../assets/logo.png';
import { api } from '../services/api';
import { Button, Card, Skeleton, PageLayout } from '../components';

const SearchPage = () => {
    const [searchId, setSearchId] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');

    // Simulate loading effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = async () => {
        if (!searchId) return;

        setSearching(true);
        setError('');

        try {
            const data = await api.getStudentByCollegeId(searchId);
            if (data.error || !data.name) {
                setError('Student not found! Please check the ID.');
            } else {
                navigate(`/student/${searchId}`);
            }
        } catch (err) {
            setError('Student not found! Please check the ID.');
        } finally {
            setSearching(false);
        }
    };

    if (loading) {
        return (
            <PageLayout centerContent>
                <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
                    <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <Skeleton height="3rem" width="16rem" className="mx-auto" />
                    </header>
                    <Card padding="32px 24px">
                        <Skeleton height="2rem" width="10rem" className="mb-4" />
                        <Skeleton height="1rem" width="14rem" className="mb-6" />
                        <Skeleton height="3rem" width="100%" className="mb-4 rounded-lg" />
                        <Skeleton height="3rem" width="100%" className="bg-blue-100 rounded-lg" />
                    </Card>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout centerContent>
            {/* Decorative Green Round Design */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '-50px',
                    right: '-150px',
                    width: '300px',
                    height: '300px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5)',
                    zIndex: 5,
                    opacity: 0.9,
                }}
            />

            {/* Decorative Small Blue Round Design */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '-40px',
                    right: '100px',
                    width: '160px',
                    height: '160px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    borderRadius: '50%',
                    boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
                    zIndex: 4,
                    opacity: 0.8,
                }}
            />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '400px' }}>
                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1
                        style={{
                            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                            fontWeight: 800,
                            color: '#000000',
                            letterSpacing: '-0.02em',
                            marginBottom: '12px',
                        }}
                    >
                        Examination Portal
                    </h1>
                    <p
                        style={{
                            fontSize: '1rem',
                            color: '#4b5563',
                            maxWidth: '280px',
                            margin: '0 auto',
                            lineHeight: '1.5',
                        }}
                    >
                        Check your exam details, dates, and room assignments
                    </p>
                </header>

                <Card padding="32px 24px" style={{ border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <img
                            src={logo}
                            alt="College Logo"
                            style={{
                                width: '80px',
                                height: '80px',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: '#000000',
                            marginBottom: '16px',
                        }}
                    >
                        Student Login
                    </h2>
                    <label
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            marginBottom: '8px',
                        }}
                    >
                        ENTER STUD. ID NO. ON PHOTO I-CARD
                    </label>
                    <input
                        type="text"
                        placeholder="JIS/****/****"
                        style={{
                            width: '100%',
                            border: error ? '2px solid #ef4444' : '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '14px 16px',
                            fontSize: '1rem',
                            marginBottom: error ? '8px' : '16px',
                            boxSizing: 'border-box',
                            outline: 'none',
                            backgroundColor: error ? '#fef2f2' : 'white',
                        }}
                        value={searchId}
                        onChange={(e) => {
                            let val = e.target.value.toUpperCase();
                            const prevVal = searchId;

                            // Smart format for JIS/xxxx/xxxx pattern
                            if (val.length === 3 && val === 'JIS' && prevVal.length < 3) {
                                val = val + '/';
                            } else if (val.startsWith('JIS/') && !val.includes('/', 4)) {
                                const afterJIS = val.substring(4);
                                if (
                                    afterJIS.length === 4 &&
                                    /^\d+$/.test(afterJIS) &&
                                    prevVal.length < val.length
                                ) {
                                    val = val + '/';
                                }
                            }

                            setSearchId(val);
                            setError('');
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchId.trim()) handleSearch();
                            }
                        }}
                        aria-label="Student ID Input"
                    />
                    {error && (
                        <p
                            style={{
                                color: '#ef4444',
                                fontSize: '0.875rem',
                                marginBottom: '16px',
                                textAlign: 'center',
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <Button
                        onClick={() => {
                            if (!searchId.trim()) {
                                // Manual shake handling if needed, or rely on input error state
                                setError('Please enter a student ID');
                                return;
                            }
                            handleSearch();
                        }}
                        loading={searching}
                        fullWidth
                        icon={Search}
                    >
                        Search
                    </Button>

                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <a
                            href="#"
                            style={{
                                fontSize: '0.85rem',
                                color: '#6b7280',
                                textDecoration: 'none',
                                fontWeight: 500,
                                transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.target.style.color = '#2563eb')}
                            onMouseLeave={(e) => (e.target.style.color = '#6b7280')}
                        >
                            Need Help?
                        </a>
                    </div>
                </Card>
            </div>
        </PageLayout>
    );
};

export default SearchPage;
