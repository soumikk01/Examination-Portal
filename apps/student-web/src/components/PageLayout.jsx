import DecorativeCircle from './DecorativeCircle';

const PageLayout = ({ children, centerContent = false, style = {}, showDots = false }) => {
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
            {/* Background Dot Systems - Only shown if showDots is true */}
            {showDots && (
                <>
                    {/* 1. Base White Dots (Global) */}
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1.5px, transparent 1.5px)', 
                            backgroundSize: '30px 30px', 
                            zIndex: 0,
                            pointerEvents: 'none',
                            opacity: 0.6
                        }} 
                    />
                    
                    {/* 2. Top-Left Blue Dots */}
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            backgroundImage: 'radial-gradient(#3b82f6 1.8px, transparent 1.8px)', 
                            backgroundSize: '30px 30px', 
                            zIndex: 0,
                            pointerEvents: 'none',
                            WebkitMaskImage: 'radial-gradient(circle at 0% 0%, black 0%, transparent 50%)',
                            maskImage: 'radial-gradient(circle at 0% 0%, black 0%, transparent 50%)',
                        }} 
                    />

                    {/* 3. Bottom-Right Green Dots */}
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            backgroundImage: 'radial-gradient(#10b981 1.8px, transparent 1.8px)', 
                            backgroundSize: '30px 30px', 
                            zIndex: 0,
                            pointerEvents: 'none',
                            WebkitMaskImage: 'radial-gradient(circle at 100% 100%, black 0%, transparent 55%)',
                            maskImage: 'radial-gradient(circle at 100% 100%, black 0%, transparent 55%)',
                        }} 
                    />

                    {/* 4. Bottom-Right Blue Dots (Matching the overlapping blue circle) */}
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            backgroundImage: 'radial-gradient(#3b82f6 1.8px, transparent 1.8px)', 
                            backgroundSize: '30px 30px', 
                            zIndex: 0,
                            pointerEvents: 'none',
                            WebkitMaskImage: 'radial-gradient(circle at 75% 100%, black 0%, transparent 45%)',
                            maskImage: 'radial-gradient(circle at 75% 100%, black 0%, transparent 45%)',
                        }} 
                    />
                </>
            )}
            
            <DecorativeCircle
                top="-150px"
                left="-150px"
                width="400px"
                height="400px"
                gradient="radial-gradient(circle, #86bafa4d 0%, #5c8cf533 100%)"
                blur="80px"
                opacity={1}
            />

            <DecorativeCircle
                top="-50px"
                left="-150px"
                width="300px"
                height="300px"
                gradient="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                shadow="0 10px 25px -5px rgba(59, 130, 246, 0.5)"
                opacity={1}
                zIndex={5}
            />

            <DecorativeCircle
                bottom="-150px"
                right="-150px"
                width="400px"
                height="400px"
                gradient="radial-gradient(circle, hsla(158, 87%, 73%, 0.30) 0%, #72f1c933 100%)"
                blur="80px"
                opacity={1}
            />

            {children}
        </div>
    );
};

export default PageLayout;
