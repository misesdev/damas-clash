'use client';

import { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  length?: number;
}

export function OtpInput({ value, onChange, error, length = 6 }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focus = (i: number) => refs.current[i]?.focus();

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    next[i] = digit;
    // fill gaps with empty string
    const result = Array.from({ length }, (_, k) => next[k] ?? '').join('').replace(/\s/g, '');
    onChange(result.slice(0, length));
    if (digit && i < length - 1) focus(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = value.split('');
        next[i] = '';
        onChange(next.join('').slice(0, length));
      } else if (i > 0) {
        focus(i - 1);
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      focus(i - 1);
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      focus(i + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pasted);
    focus(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="flex justify-center gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          autoFocus={i === 0}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          className="h-14 w-12 rounded-xl text-center text-xl font-bold text-white outline-none transition-colors focus:border-white"
          style={{
            background: 'var(--surface)',
            border: `2px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
            caretColor: 'transparent',
          }}
        />
      ))}
    </div>
  );
}
