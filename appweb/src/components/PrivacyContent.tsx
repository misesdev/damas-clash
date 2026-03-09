'use client';

import { useTranslation } from 'react-i18next';
import '../i18n';

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section style={{ marginBottom: last ? 0 : 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 14, color: 'var(--text)' }}>
        {title}
      </h2>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {children}
      </div>
    </section>
  );
}

const content = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: March 2026',
    sections: [
      {
        title: '1. Who we are',
        body: (
          <p>
            Damas Clash is an online Brazilian Checkers gaming service available in web browsers
            and the Android app. By using the service, you agree to the collection and use of
            information described in this policy.
          </p>
        ),
      },
      {
        title: '2. Data collected',
        body: (
          <>
            <p>We collect the following information when creating and using an account:</p>
            <ul>
              <li><strong>Email address</strong> — used for authentication and service communications.</li>
              <li><strong>Username</strong> — public identifier displayed in matches.</li>
              <li><strong>Profile picture</strong> — optional image uploaded by the user.</li>
              <li><strong>Game data</strong> — game history, moves, and results.</li>
              <li><strong>Usage data</strong> — technical information such as access times and IP address, for security and stability purposes.</li>
            </ul>
          </>
        ),
      },
      {
        title: '3. How we use your data',
        body: (
          <>
            <p>Collected data is used exclusively to:</p>
            <ul>
              <li>Authenticate and identify your account;</li>
              <li>Display your profile and game history;</li>
              <li>Send verification codes by email (login and registration confirmation);</li>
              <li>Ensure the security and proper functioning of the service.</li>
            </ul>
            <p>We do not sell, rent, or share your personal data with third parties for commercial purposes.</p>
          </>
        ),
      },
      {
        title: '4. Third-party services',
        body: (
          <>
            <p>Damas Clash uses the following third-party services, each with their own privacy policy:</p>
            <ul>
              <li><strong>SendGrid (Twilio)</strong> — sending transactional emails (registration confirmation, access codes).</li>
              <li><strong>Cloudinary</strong> — storage and delivery of profile images.</li>
            </ul>
          </>
        ),
      },
      {
        title: '5. Storage and security',
        body: (
          <>
            <p>
              Your data is stored on secure servers. Passwords are not used —
              authentication occurs via one-time codes sent to your email.
              Session tokens are stored locally on your device and expire automatically.
            </p>
            <p>
              We adopt reasonable technical and organizational measures to protect your information
              against unauthorized access, loss, or alteration.
            </p>
          </>
        ),
      },
      {
        title: '6. Data retention',
        body: (
          <p>
            Your data is kept while your account is active. You can request deletion of your
            account and associated data at any time through the contact provided in section 8.
          </p>
        ),
      },
      {
        title: '7. Children',
        body: (
          <p>
            Damas Clash is not directed at children under 13. We do not intentionally collect
            information from children. If you believe a child has provided data without consent,
            please contact us for immediate removal.
          </p>
        ),
      },
      {
        title: '8. Your rights',
        body: (
          <>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you;</li>
              <li>Correct incorrect or outdated data;</li>
              <li>Request deletion of your account and data;</li>
              <li>Withdraw consent for use of your data.</li>
            </ul>
          </>
        ),
      },
      {
        title: '9. Changes to this policy',
        body: (
          <p>
            We may update this policy periodically. Significant changes will be communicated
            by email or through a notice in the service itself. Continued use of Damas Clash
            after changes implies acceptance of the new policy.
          </p>
        ),
      },
      {
        title: '10. Contact',
        body: (
          <p>
            Questions, requests, or complaints related to privacy can be sent to the email
            address provided in the app or on the app&apos;s Google Play Store page.
          </p>
        ),
        last: true,
      },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    lastUpdated: 'Última atualização: março de 2026',
    sections: [
      {
        title: '1. Quem somos',
        body: (
          <p>
            O Damas Clash é um serviço de jogo online de Damas Brasileiras disponível em
            navegadores web e no aplicativo Android. Ao utilizar o serviço, você concorda com
            a coleta e uso das informações descritas nesta política.
          </p>
        ),
      },
      {
        title: '2. Dados coletados',
        body: (
          <>
            <p>Coletamos as seguintes informações ao criar e utilizar uma conta:</p>
            <ul>
              <li><strong>Endereço de e-mail</strong> — usado para autenticação e comunicações do serviço.</li>
              <li><strong>Nome de usuário</strong> — identificador público exibido nas partidas.</li>
              <li><strong>Foto de perfil</strong> — imagem opcional enviada pelo usuário.</li>
              <li><strong>Dados de partidas</strong> — histórico de jogos, movimentos e resultados.</li>
              <li><strong>Dados de uso</strong> — informações técnicas como horários de acesso e endereço IP, para fins de segurança e estabilidade.</li>
            </ul>
          </>
        ),
      },
      {
        title: '3. Como usamos seus dados',
        body: (
          <>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul>
              <li>Autenticar e identificar sua conta;</li>
              <li>Exibir seu perfil e histórico de partidas;</li>
              <li>Enviar códigos de verificação por e-mail (login e confirmação de cadastro);</li>
              <li>Garantir a segurança e o bom funcionamento do serviço.</li>
            </ul>
            <p>Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
          </>
        ),
      },
      {
        title: '4. Serviços de terceiros',
        body: (
          <>
            <p>O Damas Clash utiliza os seguintes serviços de terceiros, cada um com sua própria política de privacidade:</p>
            <ul>
              <li><strong>SendGrid (Twilio)</strong> — envio de e-mails transacionais (confirmação de cadastro, códigos de acesso).</li>
              <li><strong>Cloudinary</strong> — armazenamento e entrega de imagens de perfil.</li>
            </ul>
          </>
        ),
      },
      {
        title: '5. Armazenamento e segurança',
        body: (
          <>
            <p>
              Seus dados são armazenados em servidores seguros. Senhas não são utilizadas —
              a autenticação ocorre por códigos de uso único enviados ao seu e-mail.
              Os tokens de sessão são armazenados localmente no seu dispositivo e expiram automaticamente.
            </p>
            <p>
              Adotamos medidas técnicas e organizacionais razoáveis para proteger suas informações
              contra acesso não autorizado, perda ou alteração.
            </p>
          </>
        ),
      },
      {
        title: '6. Retenção de dados',
        body: (
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Você pode solicitar a
            exclusão da sua conta e dados associados a qualquer momento através do contato
            indicado na seção 8.
          </p>
        ),
      },
      {
        title: '7. Crianças',
        body: (
          <p>
            O Damas Clash não é direcionado a menores de 13 anos. Não coletamos
            intencionalmente informações de crianças. Se você acredita que uma criança forneceu
            dados sem consentimento, entre em contato conosco para remoção imediata.
          </p>
        ),
      },
      {
        title: '8. Seus direitos',
        body: (
          <>
            <p>Você tem direito a:</p>
            <ul>
              <li>Acessar os dados pessoais que mantemos sobre você;</li>
              <li>Corrigir dados incorretos ou desatualizados;</li>
              <li>Solicitar a exclusão da sua conta e dados;</li>
              <li>Revogar o consentimento para uso dos seus dados.</li>
            </ul>
          </>
        ),
      },
      {
        title: '9. Alterações nesta política',
        body: (
          <p>
            Podemos atualizar esta política periodicamente. Alterações significativas serão
            comunicadas por e-mail ou mediante aviso no próprio serviço. O uso continuado do
            Damas Clash após as alterações implica aceitação da nova política.
          </p>
        ),
      },
      {
        title: '10. Contato',
        body: (
          <p>
            Dúvidas, solicitações ou reclamações relacionadas à privacidade podem ser enviadas
            para o endereço de e-mail disponibilizado no aplicativo ou no perfil do aplicativo
            na Google Play Store.
          </p>
        ),
        last: true,
      },
    ],
  },
};

export function PrivacyContent() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'pt' ? 'pt' : 'en';
  const c = content[lang];

  return (
    <main
      style={{
        flex: 1,
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        padding: '48px 24px 64px',
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, letterSpacing: -1 }}>
        {c.title}
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
        {c.lastUpdated}
      </p>
      {c.sections.map((s, i) => (
        <Section key={i} title={s.title} last={s.last}>
          {s.body}
        </Section>
      ))}
    </main>
  );
}
