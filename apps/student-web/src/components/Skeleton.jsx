/**
 * Skeleton Loading Component
 * Displays animated placeholder while content is loading
 */
const Skeleton = ({ width = '100%', height = '1rem', rounded = '4px', className = '' }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        animation: 'shimmer 2s infinite linear',
        background: 'linear-gradient(to right, #eff6ff 4%, #e0e7ff 25%, #eff6ff 36%)',
        backgroundSize: '1000px 100%',
      }}
    />
  );
};

export default Skeleton;
