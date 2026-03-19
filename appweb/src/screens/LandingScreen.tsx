'use client';

import { useTranslation } from 'react-i18next';
import { BoardMark } from '../components/BoardMark';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import '../i18n';

interface Props {
  onPlay: () => void;
}

export function LandingScreen({ onPlay }: Props) {
  const { t } = useTranslation();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSwitcher />
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
            {t('landing_signIn')}
          </button>
        </div>
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
          {t('landing_tagline')}
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
            {t('landing_playNow')}
          </button>

          <a
            href="https://github.com/misesdev/damas-clash/releases/latest/download/app-release.apk"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 28px',
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              letterSpacing: 0.2,
            }}
          >
            <DownloadIcon />
            {t('landing_downloadApp')}
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
        <a href="/privacidade" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('landing_privacy')}</a>
        <a href="/termos" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{t('landing_terms')}</a>
      </footer>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13" />
      <path d="M7 13l5 5 5-5" />
      <path d="M4 20h16" />
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
