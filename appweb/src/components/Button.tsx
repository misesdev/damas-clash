'use client';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

export function Button({
  label,
  onClick,
  loading,
  disabled,
  variant = 'primary',
  type = 'button',
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--text)',
          color: 'var(--bg)',
          border: 'none',
        }
      : variant === 'ghost'
      ? {
          background: 'transparent',
          color: 'var(--text)',
          border: '1.5px solid var(--border)',
        }
      : {
          background: 'transparent',
          color: 'var(--danger)',
          border: '1.5px solid rgba(255,69,58,0.4)',
        };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: fullWidth ? '100%' : undefined,
        height: 52,
        padding: '0 24px',
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: 0.2,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.45 : 1,
        transition: 'opacity 0.15s',
        ...variantStyle,
      }}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-block',
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: '2.5px solid currentColor',
            borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      ) : (
        label
      )}
    </button>
  );
}
