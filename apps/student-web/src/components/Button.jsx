/**
 * Reusable Button Component
 * Supports primary (blue) and danger (red) variants with hover animations
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon: Icon,
  fullWidth = false,
  type = 'button',
}) => {
  const variants = {
    primary: {
      bg: '#2563eb',
      bgHover: '#1d4ed8',
      bgDisabled: '#93c5fd',
      shadow: 'rgba(37, 99, 235, 0.1)',
      shadowHover: 'rgba(37, 99, 235, 0.2)',
    },
    danger: {
      bg: '#ef4444',
      bgHover: '#dc2626',
      bgDisabled: '#fca5a5',
      shadow: 'rgba(239, 68, 68, 0.1)',
      shadowHover: 'rgba(239, 68, 68, 0.2)',
      color: 'white',
      border: 'none',
    },
    logout: {
      bg: 'transparent',
      bgHover: '#ef4444',
      bgDisabled: '#f8fafc',
      shadow: 'rgba(0, 0, 0, 0.05)',
      shadowHover: 'rgba(239, 68, 68, 0.2)',
      color: '#ef4444',
      colorHover: '#ffffff',
      border: '1px solid #fee2e2',
      borderHover: '#ef4444',
    },
    secondary: {
      bg: 'transparent',
      bgHover: '#4f46e5',
      bgDisabled: '#f8fafc',
      shadow: 'rgba(0, 0, 0, 0.05)',
      shadowHover: 'rgba(79, 70, 229, 0.2)',
      color: '#4f46e5',
      colorHover: '#ffffff',
      border: '1px solid #e0e7ff',
      borderHover: '#4f46e5',
    },
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = `0 10px 20px ${v.shadowHover}`;
          e.currentTarget.style.backgroundColor = v.bgHover;
          e.currentTarget.style.color = v.colorHover || v.color;
          if (v.borderHover) e.currentTarget.style.borderColor = v.borderHover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = `0 4px 6px ${v.shadow}`;
        e.currentTarget.style.backgroundColor = disabled || loading ? v.bgDisabled : v.bg;
        e.currentTarget.style.color = v.color;
        if (v.border) e.currentTarget.style.borderColor = v.border.split(' ')[2] || 'transparent';
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = `0 10px 20px ${v.shadowHover}`;
        }
      }}
      style={{
        width: fullWidth ? '100%' : 'auto',
        backgroundColor: disabled || loading ? v.bgDisabled : v.bg,
        color: v.color || 'white',
        padding: (variant === 'logout' || variant === 'secondary') ? '6px 14px' : '14px 20px',
        borderRadius: (variant === 'logout' || variant === 'secondary') ? '20px' : '8px',
        fontWeight: 600,
        fontSize: (variant === 'logout' || variant === 'secondary') ? '12px' : '1rem',
        border: v.border || 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: (variant === 'logout' || variant === 'secondary') ? 'none' : `0 4px 6px ${v.shadow}`,
      }}
    >
      {Icon && <Icon size={(variant === 'logout' || variant === 'secondary') ? 14 : 18} strokeWidth={2.5} />}
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;
