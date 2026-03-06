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
  const base =
    'flex items-center justify-center rounded-xl py-3 px-6 text-sm font-semibold transition-opacity disabled:opacity-40';

  const styles: Record<string, string> = {
    primary: 'bg-white text-black hover:opacity-90',
    ghost: 'bg-transparent text-white border border-white/20 hover:bg-white/5',
    danger: 'bg-transparent text-red-500 border border-red-500/50 hover:bg-red-500/10',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        label
      )}
    </button>
  );
}
