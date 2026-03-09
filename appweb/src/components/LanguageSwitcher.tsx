'use client';

import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../hooks/useLanguage';

const OPTIONS: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'pt', label: 'PT' },
];

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setLanguage(opt.value)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: currentLanguage === opt.value ? 'var(--surface2)' : 'transparent',
            color: currentLanguage === opt.value ? 'var(--text)' : 'var(--text-faint)',
            letterSpacing: 0.5,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
