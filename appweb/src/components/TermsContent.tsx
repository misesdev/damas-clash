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
          <>
            <p>
              Damas Clash is an online Brazilian Checkers (official rules, 8x8 board) gaming
              platform. The service allows players to create accounts, compete in real-time
              matches against other players, view game history, and customize their profile.
            </p>
            <p>
              The platform also offers an optional Lightning Network wallet that allows players
              to deposit and withdraw satoshis (fractions of Bitcoin) and participate in bet
              matches where the winner receives the combined stake of both players. Use of the
              wallet and bet matches is entirely optional — all features of the game are
              accessible without depositing any funds by choosing the friendly (no-bet) mode.
            </p>
          </>
        ),
      },
      {
        title: '3. Eligibility',
        body: (
          <>
            <p>
              The service is intended for people aged 13 or older. By creating an account, you
              confirm that you meet this requirement. Users between 13 and 18 years of age must
              have authorization from a legal guardian.
            </p>
            <p>
              Use of the Lightning wallet and participation in bet matches is exclusively
              permitted for users who are 18 years of age or older, or the minimum legal age
              required in your jurisdiction for activities involving monetary stakes. By
              depositing funds or entering a bet match, you confirm that you meet this age
              requirement.
            </p>
          </>
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
              You are solely responsible for all transactions and wagers placed from your
              account.
            </p>
          </>
        ),
      },
      {
        title: '5. Lightning wallet',
        body: (
          <>
            <p>
              Damas Clash provides an internal Lightning Network wallet to facilitate
              deposits, withdrawals, and bet settlement. By using the wallet, you acknowledge
              and accept the following:
            </p>
            <ul>
              <li>
                <strong>Deposits</strong> — funds are credited after on-chain Lightning payment
                confirmation. Damas Clash is not responsible for delays or failures caused by
                the Lightning Network or your external wallet.
              </li>
              <li>
                <strong>Withdrawals</strong> — processed to a Lightning Address registered in
                your profile. You are responsible for providing a valid and operational address.
                Damas Clash is not responsible for funds sent to an incorrect address provided
                by you.
              </li>
              <li>
                <strong>Fees</strong> — Lightning Network routing fees may apply to deposits
                and withdrawals. Damas Clash may charge a platform fee on bet match payouts,
                which will be disclosed at the time of the transaction.
              </li>
              <li>
                <strong>Volatility</strong> — the value of satoshis in fiat currency fluctuates.
                Damas Clash is not responsible for any gains or losses resulting from exchange
                rate variations.
              </li>
              <li>
                <strong>Minimum amounts</strong> — minimum deposit and withdrawal amounts may
                be enforced and are displayed in the wallet interface.
              </li>
            </ul>
            <p>
              Damas Clash is not a financial institution, payment processor, or exchange. The
              wallet is a utility feature designed solely to facilitate the betting mechanic
              within the game.
            </p>
          </>
        ),
      },
      {
        title: '6. Bet matches',
        body: (
          <>
            <p>
              Bet matches are matches where both players stake an equal amount of satoshis. The
              winner receives the combined total, minus any applicable platform fee. By
              participating in a bet match, you acknowledge and accept the following:
            </p>
            <ul>
              <li>Stakes are locked at the start of the match and are non-refundable once the
              match begins, except in the case of a technical cancellation initiated by Damas
              Clash.</li>
              <li>If a player resigns or loses all pieces, the opponent receives the full payout.</li>
              <li>In the event of a draw, stakes are returned to each player minus any fees.</li>
              <li>Deliberately disconnecting or abandoning a match to avoid losing a bet may
              result in automatic forfeiture of the stake and account suspension.</li>
              <li>Bet matches are a game feature and do not constitute gambling under any
              particular jurisdiction. You are solely responsible for complying with the laws
              applicable in your country or region regarding monetary stakes in online games.</li>
            </ul>
          </>
        ),
      },
      {
        title: '7. User conduct',
        body: (
          <>
            <p>When using Damas Clash, you agree not to:</p>
            <ul>
              <li>Use automated programs, bots, or any assistance software during matches;</li>
              <li>Deliberately abandon bet matches to avoid losing funds;</li>
              <li>Collude with another player to manipulate the outcome of a bet match;</li>
              <li>Attempt to exploit technical flaws to gain unfair advantage or obtain funds
              without authorization;</li>
              <li>Harass, insult, or threaten other players;</li>
              <li>Create fake accounts or impersonate other people;</li>
              <li>Attempt to access restricted system areas or other users&apos; data;</li>
              <li>Use the service for money laundering, fraud, or any illegal financial activity;</li>
              <li>Use the service for any purpose contrary to applicable law in your jurisdiction.</li>
            </ul>
          </>
        ),
      },
      {
        title: '8. Game rules',
        body: (
          <p>
            Matches follow the official Brazilian Checkers rules, including mandatory captures
            and multi-captures. Damas Clash reserves the right to implement rule variations and
            update game mechanics without prior notice. Rule updates do not entitle any user to
            a refund of funds held in the wallet.
          </p>
        ),
      },
      {
        title: '9. Intellectual property',
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
        title: '10. Service availability',
        body: (
          <p>
            Damas Clash is offered as-is, without guarantee of uninterrupted availability. We
            may perform maintenance, updates, or temporarily suspend the service at any time
            without prior notice. In the event of a planned or unplanned outage, Damas Clash
            will make reasonable efforts to return funds locked in active bet matches within a
            reasonable time.
          </p>
        ),
      },
      {
        title: '11. Account termination',
        body: (
          <>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms,
              without prior notice. In the case of termination due to policy violation,
              any remaining balance may be forfeited if the violation involved fraudulent
              activity or manipulation of the betting system.
            </p>
            <p>
              You may request termination of your own account at any time. Prior to deletion,
              any positive balance must be withdrawn. Damas Clash is not responsible for funds
              that are abandoned in a deleted account.
            </p>
          </>
        ),
      },
      {
        title: '12. Limitation of liability',
        body: (
          <p>
            Damas Clash is not responsible for direct, indirect, or consequential damages
            arising from use or inability to use the service, including loss of funds due to
            Lightning Network failures, incorrect withdrawal addresses provided by users, game
            interruptions, or communication failures. The total liability of Damas Clash toward
            any user shall not exceed the balance held in that user&apos;s wallet at the time
            of the claim.
          </p>
        ),
      },
      {
        title: '13. Changes to terms',
        body: (
          <p>
            We may update these terms periodically. Continued use of the service after
            publishing new versions implies automatic acceptance of the changes. Significant
            changes will be communicated by email or through a notice in the app. Changes
            affecting the wallet or betting features will include a minimum notice period of
            7 days before taking effect.
          </p>
        ),
      },
      {
        title: '14. Applicable law',
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
    lastUpdated: 'Ultima atualizacao: marco de 2026',
    sections: [
      {
        title: '1. Aceitacao dos termos',
        body: (
          <p>
            Ao criar uma conta ou utilizar o Damas Clash — seja pelo aplicativo Android ou
            pelo site — voce declara ter lido, entendido e concordado com estes Termos de Uso.
            Se nao concordar com qualquer parte, nao utilize o servico.
          </p>
        ),
      },
      {
        title: '2. Descricao do servico',
        body: (
          <>
            <p>
              O Damas Clash e uma plataforma de jogo online de Damas Brasileiras (modalidade
              oficial, tabuleiro 8x8). O servico permite que jogadores criem contas, disputem
              partidas em tempo real contra outros jogadores, consultem historico de partidas e
              personalizem seu perfil.
            </p>
            <p>
              A plataforma tambem oferece uma carteira Lightning Network opcional que permite
              depositar e sacar satoshis (fracoes de Bitcoin) e participar de partidas com
              aposta, onde o vencedor recebe a soma das apostas dos dois jogadores. O uso da
              carteira e das partidas com aposta e inteiramente opcional — todos os recursos do
              jogo sao acessiveis sem depositar qualquer valor, escolhendo o modo amigavel.
            </p>
          </>
        ),
      },
      {
        title: '3. Elegibilidade',
        body: (
          <>
            <p>
              O servico e destinado a pessoas com 13 anos ou mais. Ao criar uma conta, voce
              confirma que atende a este requisito. Usuarios entre 13 e 18 anos devem ter
              autorizacao de um responsavel legal.
            </p>
            <p>
              O uso da carteira Lightning e a participacao em partidas com aposta sao
              permitidos exclusivamente para usuarios com 18 anos completos ou a idade minima
              exigida pela legislacao de sua jurisdicao para atividades envolvendo apostas
              em dinheiro. Ao depositar fundos ou entrar em uma partida com aposta, voce
              confirma que atende a este requisito.
            </p>
          </>
        ),
      },
      {
        title: '4. Contas de usuario',
        body: (
          <>
            <p>
              Cada usuario pode possuir uma unica conta. Voce e responsavel por manter a
              seguranca do acesso a sua conta e por todas as atividades realizadas atraves dela.
              Qualquer suspeita de uso nao autorizado deve ser reportada imediatamente.
            </p>
            <p>
              E proibido compartilhar, vender ou transferir sua conta para terceiros. Voce e
              o unico responsavel por todas as transacoes e apostas realizadas a partir da
              sua conta.
            </p>
          </>
        ),
      },
      {
        title: '5. Carteira Lightning',
        body: (
          <>
            <p>
              O Damas Clash disponibiliza uma carteira interna na rede Lightning Network para
              facilitar depositos, saques e liquidacao de apostas. Ao utilizar a carteira,
              voce reconhece e aceita o seguinte:
            </p>
            <ul>
              <li>
                <strong>Depositos</strong> — os fundos sao creditados apos a confirmacao do
                pagamento na rede Lightning. O Damas Clash nao se responsabiliza por atrasos
                ou falhas causados pela rede Lightning ou pela sua carteira externa.
              </li>
              <li>
                <strong>Saques</strong> — processados para um Endereco Lightning cadastrado
                no seu perfil. Voce e responsavel por fornecer um endereco valido e operacional.
                O Damas Clash nao se responsabiliza por fundos enviados a um endereco incorreto
                fornecido por voce.
              </li>
              <li>
                <strong>Taxas</strong> — taxas de roteamento da rede Lightning podem incidir
                sobre depositos e saques. O Damas Clash pode cobrar uma taxa de plataforma sobre
                o pagamento de partidas com aposta, que sera informada no momento da transacao.
              </li>
              <li>
                <strong>Volatilidade</strong> — o valor dos satoshis em moeda fiduciaria oscila.
                O Damas Clash nao se responsabiliza por ganhos ou perdas decorrentes de variacoes
                da taxa de cambio.
              </li>
              <li>
                <strong>Valores minimos</strong> — valores minimos de deposito e saque podem
                ser aplicados e sao exibidos na interface da carteira.
              </li>
            </ul>
            <p>
              O Damas Clash nao e uma instituicao financeira, processador de pagamentos ou
              corretora. A carteira e um recurso utilitario destinado exclusivamente a
              viabilizar a mecanica de apostas dentro do jogo.
            </p>
          </>
        ),
      },
      {
        title: '6. Partidas com aposta',
        body: (
          <>
            <p>
              Partidas com aposta sao partidas em que ambos os jogadores apostam uma quantia
              igual em satoshis. O vencedor recebe o total combinado, descontadas eventuais
              taxas de plataforma. Ao participar de uma partida com aposta, voce reconhece e
              aceita o seguinte:
            </p>
            <ul>
              <li>As apostas sao bloqueadas no inicio da partida e nao sao reembolsaveis apos
              o inicio da partida, exceto em caso de cancelamento tecnico iniciado pelo Damas
              Clash.</li>
              <li>Se um jogador desistir ou perder todas as pecas, o adversario recebe o
              pagamento integral.</li>
              <li>Em caso de empate, as apostas sao devolvidas a cada jogador, descontadas
              eventuais taxas.</li>
              <li>Desconectar-se ou abandonar deliberadamente uma partida com aposta para
              evitar a derrota pode resultar em perda automatica da aposta e suspensao
              da conta.</li>
              <li>As partidas com aposta sao um recurso do jogo e nao constituem jogo de azar
              sob nenhuma jurisdicao especifica. Voce e o unico responsavel por cumprir as leis
              aplicaveis em seu pais ou regiao em relacao a apostas financeiras em jogos online.</li>
            </ul>
          </>
        ),
      },
      {
        title: '7. Conduta do usuario',
        body: (
          <>
            <p>Ao utilizar o Damas Clash, voce concorda em nao:</p>
            <ul>
              <li>Usar programas automaticos, bots ou qualquer software de assistencia durante as partidas;</li>
              <li>Abandonar deliberadamente partidas com aposta para evitar a perda de fundos;</li>
              <li>Combinar resultados com outro jogador para manipular o desfecho de uma partida com aposta;</li>
              <li>Tentar explorar falhas tecnicas para obter vantagem indevida ou fundos sem autorizacao;</li>
              <li>Assediar, insultar ou ameacar outros jogadores;</li>
              <li>Criar contas falsas ou se passar por outras pessoas;</li>
              <li>Tentar acessar areas restritas do sistema ou dados de outros usuarios;</li>
              <li>Usar o servico para lavagem de dinheiro, fraude ou qualquer atividade financeira ilegal;</li>
              <li>Utilizar o servico para fins contrarios a legislacao aplicavel na sua jurisdicao.</li>
            </ul>
          </>
        ),
      },
      {
        title: '8. Regras do jogo',
        body: (
          <p>
            As partidas seguem as regras oficiais das Damas Brasileiras, incluindo captura
            obrigatoria e multicaptura. O Damas Clash reserva-se o direito de implementar
            variacoes de regras e de atualizar a mecanica do jogo sem aviso previo. Atualizacoes
            de regras nao dao direito a nenhum usuario a reembolso de fundos mantidos na
            carteira.
          </p>
        ),
      },
      {
        title: '9. Propriedade intelectual',
        body: (
          <>
            <p>
              Todo o conteudo do Damas Clash — incluindo codigo-fonte, design, logotipos,
              graficos e textos — e de propriedade exclusiva do servico e esta protegido por
              leis de direito autoral. E vedada a reproducao, modificacao ou distribuicao sem
              autorizacao expressa.
            </p>
            <p>
              Ao enviar uma foto de perfil, voce declara ter os direitos necessarios sobre a
              imagem e concede ao Damas Clash licenca limitada para exibi-la no servico.
            </p>
          </>
        ),
      },
      {
        title: '10. Disponibilidade do servico',
        body: (
          <p>
            O Damas Clash e oferecido no estado em que se encontra, sem garantia de
            disponibilidade ininterrupta. Podemos realizar manutencoes, atualizacoes ou
            suspender o servico temporariamente a qualquer momento, sem aviso previo. Em caso
            de interrupcao planejada ou nao planejada, o Damas Clash envidara esforcos
            razoaveis para devolver os fundos bloqueados em partidas com aposta ativas dentro
            de prazo razoavel.
          </p>
        ),
      },
      {
        title: '11. Encerramento de conta',
        body: (
          <>
            <p>
              Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos,
              sem aviso previo. Em caso de encerramento por violacao de politica envolvendo
              atividade fraudulenta ou manipulacao do sistema de apostas, o saldo remanescente
              pode ser confiscado.
            </p>
            <p>
              Voce pode solicitar o encerramento da sua propria conta a qualquer momento. Antes
              da exclusao, qualquer saldo positivo deve ser sacado. O Damas Clash nao se
              responsabiliza por fundos abandonados em uma conta excluida.
            </p>
          </>
        ),
      },
      {
        title: '12. Limitacao de responsabilidade',
        body: (
          <p>
            O Damas Clash nao se responsabiliza por danos diretos, indiretos ou consequentes
            decorrentes do uso ou da impossibilidade de uso do servico, incluindo perda de
            fundos por falhas da rede Lightning, enderecos de saque incorretos fornecidos
            pelo usuario, interrupcao de partidas ou falhas de comunicacao. A responsabilidade
            total do Damas Clash perante qualquer usuario nao excedera o saldo mantido na
            carteira desse usuario no momento da reclamacao.
          </p>
        ),
      },
      {
        title: '13. Alteracoes nos termos',
        body: (
          <p>
            Podemos atualizar estes termos periodicamente. A continuidade do uso do servico
            apos publicacao de novas versoes implica aceitacao automatica das alteracoes.
            Mudancas significativas serao comunicadas por e-mail ou mediante aviso no
            aplicativo. Alteracoes que afetem a carteira ou as funcionalidades de apostas
            incluirao um prazo minimo de aviso de 7 dias antes de entrar em vigor.
          </p>
        ),
      },
      {
        title: '14. Lei aplicavel',
        body: (
          <p>
            Estes Termos de Uso sao regidos pela legislacao brasileira. Eventuais disputas
            serao submetidas ao foro da comarca de domicilio do usuario, salvo disposicao
            legal em contrario.
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
