import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

// Blinking dots background component
const BlinkingDots = () => {
    const dots = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 8 + 4,
        delay: Math.random() * 3,
        duration: Math.random() * 2 + 2
    }));

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0
        }}>
            {dots.map(dot => (
                <div
                    key={dot.id}
                    style={{
                        position: 'absolute',
                        left: `${dot.left}%`,
                        top: `${dot.top}%`,
                        width: `${dot.size}px`,
                        height: `${dot.size}px`,
                        borderRadius: '50%',
                        backgroundColor: '#4f46e5',
                        opacity: 0.3,
                        animation: `blink ${dot.duration}s ease-in-out ${dot.delay}s infinite`
                    }}
                />
            ))}
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 0.1; transform: scale(0.8); }
                    50% { opacity: 0.5; transform: scale(1.2); }
                }
            `}</style>
        </div>
    );
};

const SearchPage = () => {
    const [searchId, setSearchId] = useState('');
    const navigate = useNavigate();

    const handleSearch = () => {
        if (!searchId) return;
        navigate(`/student/${searchId}`);
    };

    return (
        <div className="min-h-screen p-4 md:p-12 max-w-6xl mx-auto" style={{ position: 'relative' }}>
            <BlinkingDots />

            <div style={{ position: 'relative', zIndex: 10 }}>
                <header className="mb-12 text-center">
                    <h1 className="text-5xl font-extrabold mb-4 text-[#2d368e]">
                        Examination Portal
                    </h1>
                    <p className="text-xl text-gray-500">Check your exam details, dates, and room assignments</p>
                </header>

                <main>
                    <div className="glass-card bg-white p-10 max-w-4xl mx-auto flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Enter your College ID"
                            className="input-field w-full border-[#e2e8f0]"
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button onClick={handleSearch} className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-1/2 mx-auto py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all">
                            <Search size={11} strokeWidth={2.5} /> Search
                        </button>
                        <p className="text-sm text-gray-400 text-center">
                            Demo IDs: CS2024001, EC2024002, ME2024003
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SearchPage;
