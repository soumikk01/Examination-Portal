import { useTheme } from '../utils/useTheme';
import { Sun, Moon, Monitor } from 'lucide-react';

const OPTIONS = [
  { value: 'light',  label: 'Light',  Icon: Sun },
  { value: 'dark',   label: 'Dark',   Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        background: 'var(--toggle-track)',
        borderRadius: 999,
        padding: '3px 4px',
        border: '1px solid var(--border-color)',
      }}
      title="Toggle theme"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            title={label}
            aria-label={`Switch to ${label} mode`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'var(--text-muted)',
              transition: 'background 0.18s, color 0.18s',
            }}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
}
