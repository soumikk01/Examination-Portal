/**
 * Reusable Card Component with glass morphism effect
 */
const Card = ({ children, className = '', style = {}, padding = '32px' }) => {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'white',
        padding,
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
