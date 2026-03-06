'use client';

type TabName = 'home' | 'profile';

interface BottomTabBarProps {
  active: TabName;
  onPress: (tab: TabName) => void;
  onNewGame: () => void;
  creating?: boolean;
}

export function BottomTabBar({ active, onPress, onNewGame, creating }: BottomTabBarProps) {
  return (
    <div
      className="flex items-center justify-around px-2 py-2"
      style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        minHeight: 64,
      }}
    >
      {/* Home tab */}
      <button
        onClick={() => onPress('home')}
        className="flex flex-1 flex-col items-center gap-1 py-2 transition-opacity hover:opacity-80"
        style={{ color: active === 'home' ? 'var(--text)' : 'var(--text-muted)' }}
      >
        <span className="text-xl">⊞</span>
        <span className="text-[10px] font-medium">Partidas</span>
      </button>

      {/* New game button (center) */}
      <div className="flex flex-1 justify-center">
        <button
          onClick={onNewGame}
          disabled={creating}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black text-xl font-bold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {creating ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            '+'
          )}
        </button>
      </div>

      {/* Profile tab */}
      <button
        onClick={() => onPress('profile')}
        className="flex flex-1 flex-col items-center gap-1 py-2 transition-opacity hover:opacity-80"
        style={{ color: active === 'profile' ? 'var(--text)' : 'var(--text-muted)' }}
      >
        <span className="text-xl">◉</span>
        <span className="text-[10px] font-medium">Perfil</span>
      </button>
    </div>
  );
}
