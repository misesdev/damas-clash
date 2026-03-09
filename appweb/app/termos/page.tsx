import type { Metadata } from 'next';
import { BoardMark } from '../../src/components/BoardMark';
import { LanguageSwitcher } from '../../src/components/LanguageSwitcher';
import { TermsContent } from '../../src/components/TermsContent';

export const metadata: Metadata = {
  title: 'Termos de Uso — Damas Clash',
  description: 'Termos de uso do Damas Clash.',
};

export default function TermsPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'var(--text)',
          }}
        >
          <BoardMark size={22} />
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 3 }}>DAMAS CLASH</span>
        </a>
        <LanguageSwitcher />
      </header>

      <TermsContent />

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
