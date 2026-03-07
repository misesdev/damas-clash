import type { Metadata } from 'next';
import { BoardMark } from '../../src/components/BoardMark';

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
          Termos de Uso
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
          Última atualização: março de 2026
        </p>

        <Section title="1. Aceitação dos termos">
          <p>
            Ao criar uma conta ou utilizar o Damas Clash — seja pelo aplicativo Android ou
            pelo site — você declara ter lido, entendido e concordado com estes Termos de Uso.
            Se não concordar com qualquer parte, não utilize o serviço.
          </p>
        </Section>

        <Section title="2. Descrição do serviço">
          <p>
            O Damas Clash é uma plataforma de jogo online de Damas Brasileiras (modalidade
            oficial, tabuleiro 8×8). O serviço permite que jogadores criem contas, disputem
            partidas em tempo real contra outros jogadores, consultem histórico de partidas e
            personalizem seu perfil.
          </p>
        </Section>

        <Section title="3. Elegibilidade">
          <p>
            O serviço é destinado a pessoas com 13 anos de idade ou mais. Ao criar uma conta,
            você confirma que atende a este requisito. Usuários entre 13 e 18 anos devem ter
            autorização de um responsável legal.
          </p>
        </Section>

        <Section title="4. Contas de usuário">
          <p>
            Cada usuário pode possuir uma única conta. Você é responsável por manter a
            segurança do acesso à sua conta e por todas as atividades realizadas através dela.
            Qualquer suspeita de uso não autorizado deve ser reportada imediatamente.
          </p>
          <p>
            É proibido compartilhar, vender ou transferir sua conta para terceiros.
          </p>
        </Section>

        <Section title="5. Conduta do usuário">
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
        </Section>

        <Section title="6. Regras do jogo">
          <p>
            As partidas seguem as regras oficiais das Damas Brasileiras (Confederação
            Brasileira de Damas), incluindo captura obrigatória e multicaptura. O Damas Clash
            reserva-se o direito de implementar variações de regras e de atualizar a mecânica
            do jogo sem aviso prévio.
          </p>
        </Section>

        <Section title="7. Propriedade intelectual">
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
        </Section>

        <Section title="8. Disponibilidade do serviço">
          <p>
            O Damas Clash é oferecido no estado em que se encontra, sem garantia de
            disponibilidade ininterrupta. Podemos realizar manutenções, atualizações ou
            suspender o serviço temporariamente a qualquer momento, sem aviso prévio, sempre
            que necessário para garantir a qualidade e a segurança da plataforma.
          </p>
        </Section>

        <Section title="9. Encerramento de conta">
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos,
            sem aviso prévio e sem direito a indenização. Você pode solicitar o encerramento
            da sua própria conta a qualquer momento através do suporte.
          </p>
        </Section>

        <Section title="10. Limitação de responsabilidade">
          <p>
            O Damas Clash não se responsabiliza por danos diretos, indiretos ou consequentes
            decorrentes do uso ou da impossibilidade de uso do serviço, incluindo perda de
            dados, interrupção de partidas ou falhas de comunicação.
          </p>
        </Section>

        <Section title="11. Alterações nos termos">
          <p>
            Podemos atualizar estes termos periodicamente. A continuidade do uso do serviço
            após publicação de novas versões implica aceitação automática das alterações.
            Mudanças significativas serão comunicadas por e-mail ou mediante aviso no
            aplicativo.
          </p>
        </Section>

        <Section title="12. Lei aplicável" last>
          <p>
            Estes Termos de Uso são regidos pela legislação brasileira. Eventuais disputas
            serão submetidas ao foro da comarca de domicílio do usuário, salvo disposição
            legal em contrário.
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
