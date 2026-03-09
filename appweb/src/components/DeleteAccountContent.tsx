'use client';

import { useTranslation } from 'react-i18next';
import '../i18n';

function Step({ number, title, description }: { number: number; title: string; description: string }) {
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

const content = {
  en: {
    title: 'How to delete your account',
    subtitle: 'Deletion is permanent and removes all your data from Damas Clash, including game history and profile picture. Follow the steps below through the Android app.',
    steps: [
      {
        title: 'Open the app and sign in',
        description: 'Make sure you are signed in to your account in the Damas Clash app.',
      },
      {
        title: 'Go to the Profile tab',
        description: 'In the bottom bar, tap the icon on the right to open the "Profile" tab.',
      },
      {
        title: 'Tap "Delete Account"',
        description: 'Scroll to the bottom of the screen. In the last section, tap the red "Delete Account" button.',
      },
      {
        title: 'Confirm deletion',
        description: 'A confirmation warning will be shown. Confirm to proceed. This action is irreversible.',
      },
    ],
    warningStrong: 'Warning:',
    warningText: 'when you delete your account, all your data is permanently removed from our servers — username, email, profile picture, and game history. This action cannot be undone.',
    contactText: 'If you have difficulties or cannot access the app, contact us at the email address available on the app\'s Google Play Store page.',
  },
  pt: {
    title: 'Como excluir sua conta',
    subtitle: 'A exclusão é permanente e remove todos os seus dados do Damas Clash, incluindo histórico de partidas e foto de perfil. Siga os passos abaixo pelo aplicativo Android.',
    steps: [
      {
        title: 'Abra o aplicativo e faça login',
        description: 'Certifique-se de estar conectado à sua conta no app Damas Clash.',
      },
      {
        title: 'Acesse a aba Perfil',
        description: 'Na barra inferior, toque no ícone da direita para abrir a aba "Perfil".',
      },
      {
        title: 'Toque em "Excluir Conta"',
        description: 'Role a tela até o final. Na última seção, toque no botão vermelho "Excluir Conta".',
      },
      {
        title: 'Confirme a exclusão',
        description: 'Um aviso de confirmação será exibido. Confirme para prosseguir. A ação é irreversível.',
      },
    ],
    warningStrong: 'Atenção:',
    warningText: 'ao excluir sua conta, todos os seus dados são removidos permanentemente dos nossos servidores — nome de usuário, e-mail, foto de perfil e histórico de partidas. Essa ação não pode ser desfeita.',
    contactText: 'Caso encontre dificuldades ou não consiga acessar o aplicativo, entre em contato pelo endereço de e-mail disponível na página do app na Google Play Store.',
  },
};

export function DeleteAccountContent() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'pt' ? 'pt' : 'en';
  const c = content[lang];

  return (
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
        {c.title}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 48 }}>
        {c.subtitle}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {c.steps.map((step, i) => (
          <Step key={i} number={i + 1} title={step.title} description={step.description} />
        ))}
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
          <strong style={{ color: 'var(--text)' }}>{c.warningStrong}</strong> {c.warningText}
        </p>
      </div>

      <div style={{ marginTop: 48 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {c.contactText}
        </p>
      </div>
    </main>
  );
}
