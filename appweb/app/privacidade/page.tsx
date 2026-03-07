import type { Metadata } from 'next';
import { BoardMark } from '../../src/components/BoardMark';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Damas Clash',
  description: 'Política de privacidade do Damas Clash.',
};

export default function PrivacyPage() {
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
      </header>

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
          Política de Privacidade
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
          Última atualização: março de 2026
        </p>

        <Section title="1. Quem somos">
          <p>
            O Damas Clash é um serviço de jogo online de Damas Brasileiras disponível em
            navegadores web e no aplicativo Android. Ao utilizar o serviço, você concorda com
            a coleta e uso das informações descritas nesta política.
          </p>
        </Section>

        <Section title="2. Dados coletados">
          <p>Coletamos as seguintes informações ao criar e utilizar uma conta:</p>
          <ul>
            <li><strong>Endereço de e-mail</strong> — usado para autenticação e comunicações do serviço.</li>
            <li><strong>Nome de usuário</strong> — identificador público exibido nas partidas.</li>
            <li><strong>Foto de perfil</strong> — imagem opcional enviada pelo usuário.</li>
            <li><strong>Dados de partidas</strong> — histórico de jogos, movimentos e resultados.</li>
            <li><strong>Dados de uso</strong> — informações técnicas como horários de acesso e endereço IP, para fins de segurança e estabilidade.</li>
          </ul>
        </Section>

        <Section title="3. Como usamos seus dados">
          <p>Os dados coletados são utilizados exclusivamente para:</p>
          <ul>
            <li>Autenticar e identificar sua conta;</li>
            <li>Exibir seu perfil e histórico de partidas;</li>
            <li>Enviar códigos de verificação por e-mail (login e confirmação de cadastro);</li>
            <li>Garantir a segurança e o bom funcionamento do serviço.</li>
          </ul>
          <p>Não vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
        </Section>

        <Section title="4. Serviços de terceiros">
          <p>O Damas Clash utiliza os seguintes serviços de terceiros, cada um com sua própria política de privacidade:</p>
          <ul>
            <li><strong>SendGrid (Twilio)</strong> — envio de e-mails transacionais (confirmação de cadastro, códigos de acesso).</li>
            <li><strong>Cloudinary</strong> — armazenamento e entrega de imagens de perfil.</li>
          </ul>
        </Section>

        <Section title="5. Armazenamento e segurança">
          <p>
            Seus dados são armazenados em servidores seguros. Senhas não são utilizadas —
            a autenticação ocorre por códigos de uso único enviados ao seu e-mail.
            Os tokens de sessão são armazenados localmente no seu dispositivo e expiram automaticamente.
          </p>
          <p>
            Adotamos medidas técnicas e organizacionais razoáveis para proteger suas informações
            contra acesso não autorizado, perda ou alteração.
          </p>
        </Section>

        <Section title="6. Retenção de dados">
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Você pode solicitar a
            exclusão da sua conta e dados associados a qualquer momento através do contato
            indicado na seção 8.
          </p>
        </Section>

        <Section title="7. Crianças">
          <p>
            O Damas Clash não é direcionado a menores de 13 anos. Não coletamos
            intencionalmente informações de crianças. Se você acredita que uma criança forneceu
            dados sem consentimento, entre em contato conosco para remoção imediata.
          </p>
        </Section>

        <Section title="8. Seus direitos">
          <p>Você tem direito a:</p>
          <ul>
            <li>Acessar os dados pessoais que mantemos sobre você;</li>
            <li>Corrigir dados incorretos ou desatualizados;</li>
            <li>Solicitar a exclusão da sua conta e dados;</li>
            <li>Revogar o consentimento para uso dos seus dados.</li>
          </ul>
        </Section>

        <Section title="9. Alterações nesta política">
          <p>
            Podemos atualizar esta política periodicamente. Alterações significativas serão
            comunicadas por e-mail ou mediante aviso no próprio serviço. O uso continuado do
            Damas Clash após as alterações implica aceitação da nova política.
          </p>
        </Section>

        <Section title="10. Contato" last>
          <p>
            Dúvidas, solicitações ou reclamações relacionadas à privacidade podem ser enviadas
            para o endereço de e-mail disponibilizado no aplicativo ou no perfil do aplicativo
            na Google Play Store.
          </p>
        </Section>
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
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 14,
          color: 'var(--text)',
        }}
      >
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
