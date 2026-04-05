/**
 * Skeleton Loading Component
 * Displays animated shimmer placeholder while content is loading.
 * Props:
 *   width    – CSS width  (default '100%')
 *   height   – CSS height (default '1rem')
 *   rounded  – border-radius (default '6px')
 *   className – extra class names
 */
const Skeleton = ({ width = '100%', height = '1rem', rounded = '6px', className = '' }) => {
  return (
    <div
      className={`skeleton-wave ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        flexShrink: 0,
      }}
    />
  );
};

export default Skeleton;

