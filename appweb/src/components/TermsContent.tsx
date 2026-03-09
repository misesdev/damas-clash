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
    title: 'Terms of Use',
    lastUpdated: 'Last updated: March 2026',
    sections: [
      {
        title: '1. Acceptance of terms',
        body: (
          <p>
            By creating an account or using Damas Clash — whether through the Android app or
            the website — you declare that you have read, understood, and agreed to these Terms
            of Use. If you disagree with any part, do not use the service.
          </p>
        ),
      },
      {
        title: '2. Description of service',
        body: (
          <p>
            Damas Clash is an online Brazilian Checkers (official rules, 8×8 board) gaming
            platform. The service allows players to create accounts, compete in real-time
            matches against other players, view game history, and customize their profile.
          </p>
        ),
      },
      {
        title: '3. Eligibility',
        body: (
          <p>
            The service is intended for people aged 13 or older. By creating an account, you
            confirm you meet this requirement. Users between 13 and 18 must have authorization
            from a legal guardian.
          </p>
        ),
      },
      {
        title: '4. User accounts',
        body: (
          <>
            <p>
              Each user may have a single account. You are responsible for maintaining the
              security of access to your account and for all activities carried out through it.
              Any suspicion of unauthorized use must be reported immediately.
            </p>
            <p>
              Sharing, selling, or transferring your account to third parties is prohibited.
            </p>
          </>
        ),
      },
      {
        title: '5. User conduct',
        body: (
          <>
            <p>When using Damas Clash, you agree not to:</p>
            <ul>
              <li>Use automated programs, bots, or any assistance software during matches;</li>
              <li>Deliberately abandon matches repeatedly to harm other players;</li>
              <li>Attempt to exploit technical flaws to gain unfair advantage;</li>
              <li>Harass, insult, or threaten other players;</li>
              <li>Create fake accounts or impersonate other people;</li>
              <li>Attempt to access restricted system areas or other users&apos; data;</li>
              <li>Use the service for illegal purposes or contrary to applicable law.</li>
            </ul>
          </>
        ),
      },
      {
        title: '6. Game rules',
        body: (
          <p>
            Matches follow the official Brazilian Checkers rules, including mandatory captures
            and multi-captures. Damas Clash reserves the right to implement rule variations and
            update game mechanics without prior notice.
          </p>
        ),
      },
      {
        title: '7. Intellectual property',
        body: (
          <>
            <p>
              All Damas Clash content — including source code, design, logos, graphics, and
              texts — is the exclusive property of the service and is protected by copyright
              laws. Reproduction, modification, or distribution without express authorization
              is prohibited.
            </p>
            <p>
              By uploading a profile picture, you declare having the necessary rights to the
              image and grant Damas Clash a limited license to display it in the service.
            </p>
          </>
        ),
      },
      {
        title: '8. Service availability',
        body: (
          <p>
            Damas Clash is offered as-is, without guarantee of uninterrupted availability. We
            may perform maintenance, updates, or temporarily suspend the service at any time
            without prior notice, whenever necessary to ensure the quality and security of
            the platform.
          </p>
        ),
      },
      {
        title: '9. Account termination',
        body: (
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms,
            without prior notice and without right to compensation. You may request termination
            of your own account at any time through support.
          </p>
        ),
      },
      {
        title: '10. Limitation of liability',
        body: (
          <p>
            Damas Clash is not responsible for direct, indirect, or consequential damages
            arising from use or inability to use the service, including data loss, game
            interruptions, or communication failures.
          </p>
        ),
      },
      {
        title: '11. Changes to terms',
        body: (
          <p>
            We may update these terms periodically. Continued use of the service after
            publishing new versions implies automatic acceptance of the changes. Significant
            changes will be communicated by email or through a notice in the app.
          </p>
        ),
      },
      {
        title: '12. Applicable law',
        body: (
          <p>
            These Terms of Use are governed by applicable law. Any disputes will be submitted
            to the competent court of the user&apos;s domicile, unless otherwise provided by law.
          </p>
        ),
        last: true,
      },
    ],
  },
  pt: {
    title: 'Termos de Uso',
    lastUpdated: 'Última atualização: março de 2026',
    sections: [
      {
        title: '1. Aceitação dos termos',
        body: (
          <p>
            Ao criar uma conta ou utilizar o Damas Clash — seja pelo aplicativo Android ou
            pelo site — você declara ter lido, entendido e concordado com estes Termos de Uso.
            Se não concordar com qualquer parte, não utilize o serviço.
          </p>
        ),
      },
      {
        title: '2. Descrição do serviço',
        body: (
          <p>
            O Damas Clash é uma plataforma de jogo online de Damas Brasileiras (modalidade
            oficial, tabuleiro 8×8). O serviço permite que jogadores criem contas, disputem
            partidas em tempo real contra outros jogadores, consultem histórico de partidas e
            personalizem seu perfil.
          </p>
        ),
      },
      {
        title: '3. Elegibilidade',
        body: (
          <p>
            O serviço é destinado a pessoas com 13 anos de idade ou mais. Ao criar uma conta,
            você confirma que atende a este requisito. Usuários entre 13 e 18 anos devem ter
            autorização de um responsável legal.
          </p>
        ),
      },
      {
        title: '4. Contas de usuário',
        body: (
          <>
            <p>
              Cada usuário pode possuir uma única conta. Você é responsável por manter a
              segurança do acesso à sua conta e por todas as atividades realizadas através dela.
              Qualquer suspeita de uso não autorizado deve ser reportada imediatamente.
            </p>
            <p>
              É proibido compartilhar, vender ou transferir sua conta para terceiros.
            </p>
          </>
        ),
      },
      {
        title: '5. Conduta do usuário',
        body: (
          <>
            <p>Ao utilizar o Damas Clash, você concorda em não:</p>
            <ul>
              <li>Usar programas automáticos, bots ou qualquer software de assistência durante as partidas;</li>
              <li>Deliberadamente abandonar partidas repetidamente para prejudicar outros jogadores;</li>
              <li>Tentar explorar falhas técnicas para obter vantagem indevida;</li>
              <li>Assediar, insultar ou ameaçar outros jogadores;</li>
              <li>Criar contas falsas ou se passar por outras pessoas;</li>
              <li>Tentar acessar áreas restritas do sistema ou dados de outros usuários;</li>
              <li>Utilizar o serviço para fins ilegais ou contrários à legislação brasileira.</li>
            </ul>
          </>
        ),
      },
      {
        title: '6. Regras do jogo',
        body: (
          <p>
            As partidas seguem as regras oficiais das Damas Brasileiras (Confederação
            Brasileira de Damas), incluindo captura obrigatória e multicaptura. O Damas Clash
            reserva-se o direito de implementar variações de regras e de atualizar a mecânica
            do jogo sem aviso prévio.
          </p>
        ),
      },
      {
        title: '7. Propriedade intelectual',
        body: (
          <>
            <p>
              Todo o conteúdo do Damas Clash — incluindo código-fonte, design, logotipos,
              gráficos e textos — é de propriedade exclusiva do serviço e está protegido por
              leis de direito autoral. É vedada a reprodução, modificação ou distribuição sem
              autorização expressa.
            </p>
            <p>
              Ao enviar uma foto de perfil, você declara ter os direitos necessários sobre a
              imagem e concede ao Damas Clash licença limitada para exibi-la no serviço.
            </p>
          </>
        ),
      },
      {
        title: '8. Disponibilidade do serviço',
        body: (
          <p>
            O Damas Clash é oferecido no estado em que se encontra, sem garantia de
            disponibilidade ininterrupta. Podemos realizar manutenções, atualizações ou
            suspender o serviço temporariamente a qualquer momento, sem aviso prévio, sempre
            que necessário para garantir a qualidade e a segurança da plataforma.
          </p>
        ),
      },
      {
        title: '9. Encerramento de conta',
        body: (
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos,
            sem aviso prévio e sem direito a indenização. Você pode solicitar o encerramento
            da sua própria conta a qualquer momento através do suporte.
          </p>
        ),
      },
      {
        title: '10. Limitação de responsabilidade',
        body: (
          <p>
            O Damas Clash não se responsabiliza por danos diretos, indiretos ou consequentes
            decorrentes do uso ou da impossibilidade de uso do serviço, incluindo perda de
            dados, interrupção de partidas ou falhas de comunicação.
          </p>
        ),
      },
      {
        title: '11. Alterações nos termos',
        body: (
          <p>
            Podemos atualizar estes termos periodicamente. A continuidade do uso do serviço
            após publicação de novas versões implica aceitação automática das alterações.
            Mudanças significativas serão comunicadas por e-mail ou mediante aviso no
            aplicativo.
          </p>
        ),
      },
      {
        title: '12. Lei aplicável',
        body: (
          <p>
            Estes Termos de Uso são regidos pela legislação brasileira. Eventuais disputas
            serão submetidas ao foro da comarca de domicílio do usuário, salvo disposição
            legal em contrário.
          </p>
        ),
        last: true,
      },
    ],
  },
};

export function TermsContent() {
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
