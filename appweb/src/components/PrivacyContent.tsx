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
            and the Android app. The service includes optional features such as a Lightning Network
            wallet for depositing, withdrawing, and wagering Bitcoin satoshis. By using the service,
            you agree to the collection and use of information described in this policy.
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
              <li><strong>Game data</strong> — game history, moves, results, and bet amounts.</li>
              <li><strong>Financial data</strong> — Lightning wallet balance (in satoshis) and full transaction history (deposits, withdrawals, bets, winnings, refunds), including invoice identifiers and payment amounts. This data is required for wallet operation and dispute resolution.</li>
              <li><strong>Nostr public key</strong> — if you choose to authenticate via Nostr, your public key (npub) is stored and associated with your account. Your private key is never transmitted to or stored on our servers.</li>
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
              <li>Process Lightning Network wallet deposits, withdrawals, and bet transactions;</li>
              <li>Maintain an accurate record of your wallet balance and transaction history;</li>
              <li>Resolve disputes related to wallet operations or match outcomes;</li>
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
              <li><strong>Lightning Network gateway (LND)</strong> — processing Bitcoin Lightning Network payments. Invoice data and payment hashes are shared with this service to execute deposits and withdrawals. No personally identifiable information is transmitted beyond what is required for payment routing.</li>
              <li><strong>Google Sign-In</strong> — optional authentication via Google account. If used, Google&apos;s privacy policy governs the data exchanged during that authentication flow.</li>
            </ul>
          </>
        ),
      },
      {
        title: '5. Storage and security',
        body: (
          <>
            <p>
              Your data is stored on secure servers. Passwords are not used — authentication
              occurs via one-time codes sent to your email, Google Sign-In, or Nostr key signing.
              Session tokens are stored locally on your device and expire automatically.
            </p>
            <p>
              Wallet balances and transaction records are stored in an encrypted database.
              We adopt reasonable technical and organizational measures to protect your information
              against unauthorized access, loss, or alteration.
            </p>
            <p>
              Lightning Network transactions are irreversible by nature. Once a withdrawal payment
              is sent to a Lightning invoice or address you provide, it cannot be reversed.
              You are solely responsible for providing correct withdrawal details.
            </p>
          </>
        ),
      },
      {
        title: '6. Data retention',
        body: (
          <>
            <p>
              Your personal data (username, email, profile picture, game history) is kept while
              your account is active. You can request deletion of your account at any time through
              the app settings or via the contact provided in section 10.
            </p>
            <p>
              <strong>Financial records</strong> (transaction history, bet logs, wallet movements)
              are retained for a minimum of 5 years after the transaction date, even following
              account deletion, to comply with applicable financial record-keeping obligations
              and to enable dispute resolution.
            </p>
          </>
        ),
      },
      {
        title: '7. Children and age restrictions',
        body: (
          <>
            <p>
              Damas Clash is not directed at children under 13. We do not intentionally collect
              information from children. If you believe a child has provided data without consent,
              please contact us for immediate removal.
            </p>
            <p>
              The Lightning wallet and betting features are available only to users who are at
              least 18 years of age, or the minimum legal gambling age in their jurisdiction,
              whichever is higher. By using these features you confirm that you meet this requirement.
            </p>
          </>
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
              <li>Request deletion of your account and personal data (subject to financial record retention obligations described in section 6);</li>
              <li>Withdraw consent for use of your data.</li>
            </ul>
          </>
        ),
      },
      {
        title: '9. Cookies and local storage',
        body: (
          <p>
            Damas Clash uses browser local storage and, on mobile, device storage to persist your
            session token and language preference. No advertising or tracking cookies are used.
            This data is stored only on your device and is not transmitted to third parties.
          </p>
        ),
      },
      {
        title: '10. Changes to this policy',
        body: (
          <p>
            We may update this policy periodically. Significant changes will be communicated
            by email or through a notice in the service itself. Changes affecting wallet or
            financial data handling will be communicated at least 7 days in advance.
            Continued use of Damas Clash after changes implies acceptance of the new policy.
          </p>
        ),
      },
      {
        title: '11. Contact',
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
    title: 'Politica de Privacidade',
    lastUpdated: 'Ultima atualizacao: marco de 2026',
    sections: [
      {
        title: '1. Quem somos',
        body: (
          <p>
            O Damas Clash e um servico de jogo online de Damas Brasileiras disponivel em
            navegadores web e no aplicativo Android. O servico inclui funcionalidades opcionais
            como uma carteira Lightning Network para depositar, sacar e apostar satoshis de Bitcoin.
            Ao utilizar o servico, voce concorda com a coleta e uso das informacoes descritas
            nesta politica.
          </p>
        ),
      },
      {
        title: '2. Dados coletados',
        body: (
          <>
            <p>Coletamos as seguintes informacoes ao criar e utilizar uma conta:</p>
            <ul>
              <li><strong>Endereco de e-mail</strong> — usado para autenticacao e comunicacoes do servico.</li>
              <li><strong>Nome de usuario</strong> — identificador publico exibido nas partidas.</li>
              <li><strong>Foto de perfil</strong> — imagem opcional enviada pelo usuario.</li>
              <li><strong>Dados de partidas</strong> — historico de jogos, movimentos, resultados e valores apostados.</li>
              <li><strong>Dados financeiros</strong> — saldo da carteira Lightning (em satoshis) e historico completo de transacoes (depositos, saques, apostas, ganhos, reembolsos), incluindo identificadores de invoice e valores. Esses dados sao necessarios para o funcionamento da carteira e resolucao de disputas.</li>
              <li><strong>Chave publica Nostr</strong> — se voce optar por autenticar via Nostr, sua chave publica (npub) e armazenada e associada a sua conta. Sua chave privada nunca e transmitida nem armazenada em nossos servidores.</li>
              <li><strong>Dados de uso</strong> — informacoes tecnicas como horarios de acesso e endereco IP, para fins de seguranca e estabilidade.</li>
            </ul>
          </>
        ),
      },
      {
        title: '3. Como usamos seus dados',
        body: (
          <>
            <p>Os dados coletados sao utilizados exclusivamente para:</p>
            <ul>
              <li>Autenticar e identificar sua conta;</li>
              <li>Exibir seu perfil e historico de partidas;</li>
              <li>Enviar codigos de verificacao por e-mail (login e confirmacao de cadastro);</li>
              <li>Processar depositos, saques e apostas via Lightning Network;</li>
              <li>Manter registro preciso do seu saldo e historico de transacoes;</li>
              <li>Resolver disputas relacionadas a operacoes da carteira ou resultados de partidas;</li>
              <li>Garantir a seguranca e o bom funcionamento do servico.</li>
            </ul>
            <p>Nao vendemos, alugamos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
          </>
        ),
      },
      {
        title: '4. Servicos de terceiros',
        body: (
          <>
            <p>O Damas Clash utiliza os seguintes servicos de terceiros, cada um com sua propria politica de privacidade:</p>
            <ul>
              <li><strong>SendGrid (Twilio)</strong> — envio de e-mails transacionais (confirmacao de cadastro, codigos de acesso).</li>
              <li><strong>Cloudinary</strong> — armazenamento e entrega de imagens de perfil.</li>
              <li><strong>Gateway Lightning Network (LND)</strong> — processamento de pagamentos Bitcoin Lightning. Dados de invoice e hashes de pagamento sao compartilhados com esse servico para executar depositos e saques. Nenhuma informacao pessoal identificavel e transmitida alem do necessario para o roteamento do pagamento.</li>
              <li><strong>Google Sign-In</strong> — autenticacao opcional via conta Google. Se utilizado, a politica de privacidade do Google rege os dados trocados durante esse fluxo de autenticacao.</li>
            </ul>
          </>
        ),
      },
      {
        title: '5. Armazenamento e seguranca',
        body: (
          <>
            <p>
              Seus dados sao armazenados em servidores seguros. Senhas nao sao utilizadas — a
              autenticacao ocorre por codigos de uso unico enviados ao seu e-mail, login com Google
              ou assinatura de chave Nostr. Os tokens de sessao sao armazenados localmente no seu
              dispositivo e expiram automaticamente.
            </p>
            <p>
              Os saldos e registros de transacoes da carteira sao armazenados em banco de dados
              criptografado. Adotamos medidas tecnicas e organizacionais razoaveis para proteger
              suas informacoes contra acesso nao autorizado, perda ou alteracao.
            </p>
            <p>
              As transacoes Lightning Network sao irreversiveis por natureza. Uma vez que um
              saque e enviado para o endereco ou invoice que voce forneceu, nao e possivel
              revertê-lo. Voce e o unico responsavel por fornecer dados de saque corretos.
            </p>
          </>
        ),
      },
      {
        title: '6. Retencao de dados',
        body: (
          <>
            <p>
              Seus dados pessoais (nome de usuario, e-mail, foto de perfil, historico de partidas)
              sao mantidos enquanto sua conta estiver ativa. Voce pode solicitar a exclusao da sua
              conta a qualquer momento pelas configuracoes do aplicativo ou pelo contato indicado
              na secao 10.
            </p>
            <p>
              <strong>Registros financeiros</strong> (historico de transacoes, logs de apostas,
              movimentacoes da carteira) sao retidos por no minimo 5 anos apos a data da transacao,
              mesmo apos a exclusao da conta, para cumprir obrigacoes legais de registro financeiro
              e permitir a resolucao de disputas.
            </p>
          </>
        ),
      },
      {
        title: '7. Criancas e restricoes de idade',
        body: (
          <>
            <p>
              O Damas Clash nao e direcionado a menores de 13 anos. Nao coletamos intencionalmente
              informacoes de criancas. Se voce acredita que uma crianca forneceu dados sem
              consentimento, entre em contato conosco para remocao imediata.
            </p>
            <p>
              A carteira Lightning e as funcionalidades de apostas estao disponiveis apenas para
              usuarios com pelo menos 18 anos de idade, ou a idade minima legal para jogos de
              azar na sua jurisdicao, o que for maior. Ao usar essas funcionalidades, voce
              confirma que atende a esse requisito.
            </p>
          </>
        ),
      },
      {
        title: '8. Seus direitos',
        body: (
          <>
            <p>Voce tem direito a:</p>
            <ul>
              <li>Acessar os dados pessoais que mantemos sobre voce;</li>
              <li>Corrigir dados incorretos ou desatualizados;</li>
              <li>Solicitar a exclusao da sua conta e dados pessoais (sujeito as obrigacoes de retencao de registros financeiros descritas na secao 6);</li>
              <li>Revogar o consentimento para uso dos seus dados.</li>
            </ul>
          </>
        ),
      },
      {
        title: '9. Cookies e armazenamento local',
        body: (
          <p>
            O Damas Clash utiliza armazenamento local do navegador e, no celular, armazenamento
            do dispositivo para manter seu token de sessao e preferencia de idioma. Nenhum cookie
            de publicidade ou rastreamento e utilizado. Esses dados ficam apenas no seu dispositivo
            e nao sao transmitidos a terceiros.
          </p>
        ),
      },
      {
        title: '10. Alteracoes nesta politica',
        body: (
          <p>
            Podemos atualizar esta politica periodicamente. Alteracoes significativas serao
            comunicadas por e-mail ou mediante aviso no proprio servico. Alteracoes que afetem
            o tratamento de dados financeiros ou da carteira serao comunicadas com pelo menos
            7 dias de antecedencia. O uso continuado do Damas Clash apos as alteracoes implica
            aceitacao da nova politica.
          </p>
        ),
      },
      {
        title: '11. Contato',
        body: (
          <p>
            Duvidas, solicitacoes ou reclamacoes relacionadas a privacidade podem ser enviadas
            para o endereco de e-mail disponibilizado no aplicativo ou no perfil do aplicativo
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
