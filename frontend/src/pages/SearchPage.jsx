import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import logo from '../assets/logo.png';
import { api } from '../services/api';
import { Button, Card, Skeleton, PageLayout, DecorativeCircle } from '../components';

const SearchPage = () => {
    const [searchId, setSearchId] = useState('');
    const [verification, setVerification] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const verificationInputRef = useRef(null);

    // Simulate loading effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 400);
        return () => clearTimeout(timer);
    }, []);

    const handleSearch = async () => {
        if (!searchId || !verification) {
            setError('Please enter both Student ID and verification');
            triggerShake();
            return;
        }

        setSearching(true);
        setError('');

        try {
            const data = await api.verifyStudent(searchId, verification);
            if (data.error || !data.name) {
                setError(data.error || 'Verification failed! Please check your details.');
                triggerShake();
            } else {
                navigate(`/student/${searchId}`);
            }
        } catch (err) {
            setError('Verification failed! Please check your details.');
            triggerShake();
        } finally {
            setSearching(false);
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 650);
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
                        <Skeleton height="3rem" width="100%" className="mb-4 rounded-lg" />
                        <Skeleton height="3rem" width="100%" className="bg-blue-100 rounded-lg" />
                    </Card>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout centerContent>
            <DecorativeCircle
                bottom="-50px"
                right="-150px"
                width="300px"
                height="300px"
                gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                shadow="0 10px 25px -5px rgba(16, 185, 129, 0.5)"
                opacity={0.9}
                zIndex={5}
            />

            <DecorativeCircle
                bottom="-40px"
                right="100px"
                width="160px"
                height="160px"
                gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                shadow="0 8px 16px -4px rgba(59, 130, 246, 0.4)"
                opacity={0.8}
                zIndex={4}
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

                <Card
                    padding="32px 24px"
                    style={{
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        animation: shake ? 'shake 0.6s cubic-bezier(.36,.07,.19,.97) both' : 'none',
                    }}
                >
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

                    {/* Student ID Input */}
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
                            marginBottom: '16px',
                            boxSizing: 'border-box',
                            outline: 'none',
                            backgroundColor: error ? '#fef2f2' : 'white',
                        }}
                        value={searchId}
                        onChange={(e) => {
                            let val = e.target.value.toUpperCase();
                            const prevVal = searchId;

                            // Allow free deletion - if user is deleting, just accept it
                            if (val.length < prevVal.length) {
                                setSearchId(val);
                                setError('');
                                setShake(false);
                                return;
                            }

                            // Only apply smart formatting when adding characters
                            // Step 1: Ensure it starts with JIS
                            if (!val.startsWith('JIS')) {
                                if (val.length <= 3) {
                                    val = 'JIS'.substring(0, val.length);
                                } else {
                                    return; // Reject if doesn't start with JIS
                                }
                            }

                            // Step 2: Auto-add first slash after JIS
                            if (val.length === 3 && !val.includes('/')) {
                                val = 'JIS/';
                            }

                            // Step 3: After 'JIS/', only allow 4 digits
                            if (val.length > 4 && val.startsWith('JIS/')) {
                                const afterFirstSlash = val.substring(4);

                                // Extract only digits
                                const digits = afterFirstSlash.replace(/[^0-9]/g, '');

                                // Limit to 4 digits
                                const first4Digits = digits.substring(0, 4);

                                if (first4Digits.length === 4) {
                                    // Auto-add second slash after 4 digits
                                    if (val.length === 8 && !val.includes('/', 4)) {
                                        val = `JIS/${first4Digits}/`;
                                    } else if (val.length > 8) {
                                        const afterSecondSlash = val.substring(9);
                                        const secondDigits = afterSecondSlash.replace(/[^0-9]/g, '');
                                        const last4Digits = secondDigits.substring(0, 4);
                                        val = `JIS/${first4Digits}/${last4Digits}`;

                                        // Auto-focus to verification input when complete
                                        if (last4Digits.length === 4 && verificationInputRef.current) {
                                            setTimeout(() => verificationInputRef.current.focus(), 0);
                                        }
                                    } else {
                                        val = `JIS/${first4Digits}`;
                                    }
                                } else {
                                    val = `JIS/${first4Digits}`;
                                }
                            }

                            setSearchId(val);
                            setError('');
                            setShake(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchId.trim() && verification.trim()) handleSearch();
                            }
                        }}
                        aria-label="Student ID Input"
                    />

                    {/* Verification Input */}
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
                        LAST 3 DIGITS OF ROLL NUMBER
                    </label>
                    <input
                        ref={verificationInputRef}
                        type="text"
                        placeholder="e.g., 111"
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
                        value={verification}
                        onChange={(e) => {
                            // Only allow numbers and max 3 digits
                            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
                            setVerification(val);
                            setError('');
                            setShake(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                if (searchId.trim() && verification.trim()) handleSearch();
                            }
                        }}
                        aria-label="Verification Input"
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
                            if (!searchId.trim() || !verification.trim()) {
                                setError('Please enter both Student ID and verification');
                                triggerShake();
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
