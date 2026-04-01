import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'exam_portal_theme';

function applyTheme(choice) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = choice === 'dark' || (choice === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setAndPersist = useCallback((choice) => setTheme(choice), []);
  return [theme, setAndPersist];
}
