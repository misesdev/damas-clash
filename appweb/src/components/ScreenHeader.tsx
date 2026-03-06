'use client';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
}

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
        >
          ←
        </button>
      )}
      <h2 className="text-base font-semibold text-white">{title}</h2>
    </div>
  );
}
