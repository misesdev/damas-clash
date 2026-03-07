'use client';

import { BoardMark } from '../components/BoardMark';

interface Props {
  onPlay: () => void;
}

export function LandingScreen({ onPlay }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 60,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BoardMark size={24} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 3 }}>Damas Clash</span>
        </div>
        <button
          onClick={onPlay}
          style={{
            padding: '7px 20px',
            background: 'var(--text)',
            color: 'var(--bg)',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Entrar
        </button>
      </header>

      {/* Hero */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 36 }}>
          <MiniBoard />
        </div>

        <h1
          style={{
            fontSize: 'clamp(52px, 10vw, 100px)',
            fontWeight: 900,
            letterSpacing: -3,
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          Damas Clash
        </h1>
        <p
          style={{
            fontSize: 'clamp(15px, 2.5vw, 19px)',
            color: 'var(--text-muted)',
            maxWidth: 440,
            lineHeight: 1.65,
            marginBottom: 44,
          }}
        >
          Damas Brasileiras online. Jogue no navegador ou baixe o aplicativo no seu celular.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onPlay}
            style={{
              padding: '14px 40px',
              background: 'var(--text)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: 0.2,
            }}
          >
            Jogar agora
          </button>

          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 24px',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            <GooglePlayIcon />
            <span>
              <span
                style={{
                  display: 'block',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 400,
                  marginBottom: 1,
                  textAlign: 'left',
                }}
              >
                Disponível no
              </span>
              Google Play
            </span>
          </a>
        </div>
      </main>

      <footer
        style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-faint)',
          flexShrink: 0,
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span>© {new Date().getFullYear()} Damas Clash</span>
        <a href="/privacidade" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacidade</a>
        <a href="/termos" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Termos de Uso</a>
      </footer>
    </div>
  );
}

function GooglePlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3.18 23.76c.34.19.74.2 1.1.03L19.1 12 4.28.21C3.92.04 3.52.05 3.18.24 2.78.47 2.5.9 2.5 1.4v21.2c0 .5.28.93.68 1.16z"
        fill="#4CAF50"
      />
      <path
        d="M22.16 10.63l-3.06-1.71L15.56 12l3.54 3.08 3.06-1.71c.87-.49.87-2.25 0-2.74z"
        fill="#FFD600"
      />
      <path d="M4.28.21L15.56 12 19.1 8.46 4.28.21z" fill="#FF3D00" />
      <path d="M4.28 23.79L19.1 15.54 15.56 12 4.28 23.79z" fill="#0097A7" />
    </svg>
  );
}

function MiniBoard() {
  const SIZE = 5;
  const pieces: Record<string, 'black' | 'white'> = {
    '0-1': 'black', '0-3': 'black',
    '1-0': 'black', '1-2': 'black', '1-4': 'black',
    '3-0': 'white', '3-2': 'white', '3-4': 'white',
    '4-1': 'white', '4-3': 'white',
  };

  const cellSize = 48;

  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `repeat(${SIZE}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${SIZE}, ${cellSize}px)`,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: '0 12px 60px rgba(0,0,0,0.7)',
      }}
    >
      {Array.from({ length: SIZE }, (_, r) =>
        Array.from({ length: SIZE }, (_, c) => {
          const isDark = (r + c) % 2 === 1;
          const piece = pieces[`${r}-${c}`];
          return (
            <div
              key={`${r}-${c}`}
              style={{
                width: cellSize,
                height: cellSize,
                background: isDark ? '#181818' : '#242424',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {piece && (
                <div
                  style={{
                    width: cellSize * 0.62,
                    height: cellSize * 0.62,
                    borderRadius: '50%',
                    background: piece === 'black' ? '#101010' : '#f0f0f0',
                    border: `2px solid ${piece === 'black' ? '#3a3a3a' : '#b0b0b0'}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
