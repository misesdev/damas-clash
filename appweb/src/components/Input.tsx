'use client';

import { useState } from 'react';

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  disabled?: boolean;
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  error,
  disabled,
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? 'var(--danger)'
    : focused
    ? 'rgba(255,255,255,0.35)'
    : 'var(--border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: error ? 'var(--danger)' : focused ? 'var(--text-muted)' : 'var(--text-faint)',
          transition: 'color 0.15s',
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--surface2)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 12,
          padding: '13px 16px',
          fontSize: 15,
          color: 'var(--text)',
          outline: 'none',
          transition: 'border-color 0.15s',
          opacity: disabled ? 0.4 : 1,
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: -2 }}>{error}</p>
      )}
    </div>
  );
}
