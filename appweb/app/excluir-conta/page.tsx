import type { Metadata } from 'next';
import { BoardMark } from '../../src/components/BoardMark';

export const metadata: Metadata = {
  title: 'Como excluir sua conta — Damas Clash',
  description: 'Passo a passo para excluir sua conta no aplicativo Damas Clash.',
};

export default function DeleteAccountPage() {
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
      </header>

      <main
        style={{
          flex: 1,
          maxWidth: 680,
          width: '100%',
          margin: '0 auto',
          padding: '48px 24px 64px',
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>
          Como excluir sua conta
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 48 }}>
          A exclusão é permanente e remove todos os seus dados do Damas Clash, incluindo histórico de partidas e foto de perfil. Siga os passos abaixo pelo aplicativo Android.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Step
            number={1}
            title="Abra o aplicativo e faça login"
            description="Certifique-se de estar conectado à sua conta no app Damas Clash."
          />
          <Step
            number={2}
            title="Acesse a aba Perfil"
            description='Na barra inferior, toque no ícone da direita para abrir a aba "Perfil".'
          />
          <Step
            number={3}
            title='Toque em "Excluir Conta"'
            description='Role a tela até o final. Na última seção, toque no botão vermelho "Excluir Conta".'
          />
          <Step
            number={4}
            title="Confirme a exclusão"
            description="Um aviso de confirmação será exibido. Confirme para prosseguir. A ação é irreversível."
          />
        </div>

        <div
          style={{
            marginTop: 48,
            padding: '20px 24px',
            background: 'var(--surface)',
            borderRadius: 12,
            borderLeft: '3px solid var(--danger)',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Atenção:</strong> ao excluir sua conta, todos os seus dados são removidos permanentemente dos nossos servidores — nome de usuário, e-mail, foto de perfil e histórico de partidas. Essa ação não pode ser desfeita.
          </p>
        </div>

        <div style={{ marginTop: 48 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Caso encontre dificuldades ou não consiga acessar o aplicativo, entre em contato pelo endereço de e-mail disponível na página do app na Google Play Store.
          </p>
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

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 20,
        padding: '20px 24px',
        background: 'var(--surface)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {number}
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          {title}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>
          {description}
        </p>
      </div>
    </div>
  );
}
