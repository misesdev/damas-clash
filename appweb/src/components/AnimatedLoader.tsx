'use client';

export default function AnimatedLoader() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative h-16 w-16">
        <div
          className="absolute inset-0 rounded-full border-4 border-white/10"
        />
        <div
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-white"
          style={{ animationDuration: '1.2s' }}
        />
      </div>
    </div>
  );
}
