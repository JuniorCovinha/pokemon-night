import type { Tournament, TournamentStatus } from '@/types';

export type AppMode = 'home' | 'campeonato' | 'sorteio';

/** Fonte única das descrições dos modos, usada na entrada e no menu. */
export const APP_MODES = [
  {
    id: 'campeonato',
    path: '/campeonato',
    title: 'Campeonato',
    description:
      'Cada jogador traz seu deck e participa de rodadas Suíças. Os confrontos seguintes consideram a pontuação acumulada.',
    action: 'Inscrever jogadores',
  },
  {
    id: 'sorteio',
    path: '/sorteio',
    title: 'Sorteio de decks',
    description:
      'Escolha vários decks e distribua um deles aleatoriamente para cada jogador. Depois, dispute uma chave eliminatória.',
    action: 'Escolher decks',
  },
] as const;

type GuideTopic = { id: string; title: string; paragraphs: readonly string[] };

export const CHAMPIONSHIP_GUIDE: readonly GuideTopic[] = [
  {
    id: 'setup',
    title: 'Configuração do campeonato',
    paragraphs: [
      'Nome do evento: identifica o campeonato. Formato do TCG: Padrão, Expandido ou Casual. A escolha registra o formato, mas o app ainda não verifica a legalidade das cartas nem a lista completa do deck.',
      'Melhor de 1: uma caixa de resultado. Melhor de 3: até três caixas; o confronto termina quando alguém alcança duas vitórias. Preencha cada jogo com vitória de um jogador ou empate.',
      'Duração da rodada: tempo planejado, em minutos. Esse campo ainda não inicia um cronômetro.',
      'Rodadas Suíças: o padrão local é de 3 rodadas para 4 a 8 jogadores e 4 para 9 a 16. Você pode escolher de 1 a 8, mas rodadas demais podem esgotar os adversários sem revanche.',
      'Top 4 após o Suíço: registra a intenção de disputar uma fase eliminatória, com 1º × 4º e 2º × 3º. A confirmação das vagas e a geração dessa fase ainda não estão disponíveis.',
      'Depois de confirmar as inscrições, a configuração fica bloqueada.',
    ],
  },
  {
    id: 'registration',
    title: 'Jogadores e decks',
    paragraphs: [
      'Inscreva de 4 a 16 jogadores, com nomes diferentes. Quantidades ímpares são permitidas. Cada jogador escolhe seu próprio deck; decks iguais entre jogadores são aceitos.',
      'O Pokémon principal representa o deck. Ao escolher ou alterar um deck, a página vai até a pesquisa e retorna ao card do jogador após a seleção.',
    ],
  },
  {
    id: 'swiss',
    title: 'Como funcionam as rodadas',
    paragraphs: [
      'Na primeira rodada, os confrontos são sorteados. Nas seguintes, o app aproxima pontuações e procura uma combinação sem repetir adversários. Os jogadores continuam participando mesmo após uma derrota.',
      'Com uma quantidade ímpar, um jogador recebe bye: vitória automática de 3 pontos, sem adversário. Nas próximas rodadas, ele é priorizado entre os elegíveis de menor pontuação; ninguém recebe bye duas vezes.',
      'Gere os confrontos, inicie a rodada, registre os jogos e confirme cada mesa. Encerre a rodada somente após revisar todos os resultados. Se não existir pareamento válido, o app explica o impedimento e mantém o evento intacto.',
    ],
  },
  {
    id: 'standings',
    title: 'Pontos e classificação',
    paragraphs: [
      'Vitória vale 3 pontos; empate, 1; derrota, 0. A campanha V–D–E mostra vitórias, derrotas e empates de confrontos. O bye já está incluído nas vitórias.',
      'Em igualdade de pontos, são usados Op. % (percentual dos adversários) e Op. Op. % (dos adversários dos adversários). Byes não entram nesses cálculos. Veja os detalhes na própria tabela.',
      'Durante a rodada, a tabela é parcial e considera somente resultados confirmados. O símbolo = indica igualdade nos critérios disponíveis; a ordem visual não define uma vaga no Top 4.',
    ],
  },
  {
    id: 'corrections',
    title: 'Correções e histórico',
    paragraphs: [
      'Durante a rodada ou sua revisão, clique nas caixas para corrigir os jogos e confirme o novo resultado.',
      'A última rodada encerrada pode ser reaberta com uma justificativa. Corrija as mesas e encerre novamente antes de avançar. Rodadas com confrontos posteriores já gerados ficam protegidas.',
      'O histórico mostra confirmações, correções, encerramentos e reaberturas, com horário e valores antes e depois. Não há login para identificar o operador.',
    ],
  },
];

export const DRAW_GUIDE: readonly GuideTopic[] = [
  {
    id: 'draw-decks',
    title: 'Selecionar e sortear decks',
    paragraphs: [
      'Escolha pelo menos um deck por participante, até o limite de 10 opções. Você pode retirar um deck antes do sorteio.',
      'Edite os nomes dos participantes e clique em Sortear Decks. Cada jogador recebe um deck aleatório; se houver opções extras, nem todas serão usadas.',
    ],
  },
  {
    id: 'draw-bracket',
    title: 'Confrontos e campeão',
    paragraphs: [
      'Depois da distribuição, clique em Sortear Confrontos. A página leva você até a chave. Selecione o vencedor de cada partida para fazê-lo avançar.',
      'Este modo usa eliminação simples, sem pontos, empates ou rodadas Suíças. Antes da definição do campeão, o resultado pode ser desfeito pela opção da partida.',
      'Ao decidir a final, a página sobe para mostrar o campeão com o Pokémon animado e o fundo da sua tipagem.',
    ],
  },
];

export const COMMON_GUIDE: readonly GuideTopic[] = [
  {
    id: 'search',
    title: 'Pesquisa de Pokémon',
    paragraphs: [
      'Digite ao menos duas letras do nome. O app busca pelas cartas e, se esse serviço estiver indisponível, busca pelo Pokémon.',
    ],
  },
  {
    id: 'saving',
    title: 'Antes de sair do evento',
    paragraphs: [
      'Mantenha esta aba aberta. Recarregar a página, voltar à seleção de modos ou iniciar outro campeonato descarta o evento atual. Salvamento e exportação ainda não estão disponíveis.',
    ],
  },
  {
    id: 'local-events',
    title: 'Eventos locais',
    paragraphs: [
      'Pokémon Night usa regras locais para encontros e campeonatos pequenos. Não substitui o TOM nem os sistemas e procedimentos oficiais do Play! Pokémon em eventos sancionados.',
    ],
  },
];

const STATUS_LABELS: Record<TournamentStatus, string> = {
  'registrando-jogadores': 'Configuração e inscrições',
  'inscricoes-confirmadas': 'Inscrições confirmadas',
  'rodada-suica-pareada': 'Confrontos prontos para iniciar',
  'rodada-suica-ativa': 'Rodada em andamento',
  'rodada-suica-revisao': 'Revisão dos resultados',
  'rodada-suica-concluida': 'Rodada encerrada',
  'suico-concluido': 'Fase Suíça concluída',
  'decks-sorteados': 'Decks distribuídos',
  'chave-gerada': 'Confrontos definidos',
  'em-andamento': 'Partidas em andamento',
  finalizado: 'Campeão definido',
};

export type GuideShortcut = { targetId: string; label: string };

/** Projeção de navegação: expõe somente seções que existem na tela atual. */
export function getGuideContext(
  mode: AppMode,
  tournament?: Tournament,
): { stage: string; shortcuts: GuideShortcut[] } {
  if (mode === 'home' || !tournament)
    return {
      stage: 'Escolha seu modo',
      shortcuts: [{ targetId: 'mode-selection', label: 'Escolher modo' }],
    };
  const shortcuts: GuideShortcut[] = [];
  if (mode === 'sorteio') {
    if (tournament.status === 'registrando-jogadores')
      shortcuts.push({ targetId: 'draw-deck-selection', label: 'Escolher decks' });
    shortcuts.push({ targetId: 'draw-players', label: 'Participantes' });
    if (tournament.status !== 'registrando-jogadores')
      shortcuts.push({ targetId: 'draw-results', label: 'Decks sorteados' });
    if (tournament.bracket)
      shortcuts.push({ targetId: 'draw-bracket', label: 'Chave dos confrontos' });
    if (tournament.championId)
      shortcuts.push({ targetId: 'draw-champion', label: 'Campeão' });
    return {
      stage:
        tournament.status === 'registrando-jogadores'
          ? 'Escolha de decks e participantes'
          : STATUS_LABELS[tournament.status],
      shortcuts,
    };
  }
  if (tournament.status === 'registrando-jogadores') {
    shortcuts.push(
      { targetId: 'championship-settings', label: 'Configuração' },
      { targetId: 'championship-registrations', label: 'Inscrições' },
    );
  } else {
    if (tournament.status === 'inscricoes-confirmadas')
      shortcuts.push({ targetId: 'championship-setup', label: 'Resumo do evento' });
    const round = tournament.swissRounds.at(-1);
    if (round)
      shortcuts.push({ targetId: 'championship-round', label: `Rodada ${round.number}` });
    if (round && (round.status !== 'paired' || tournament.swissRounds.length > 1))
      shortcuts.push({ targetId: 'swiss-standings-heading', label: 'Classificação' });
    if (tournament.swissRounds.length > 1)
      shortcuts.push({ targetId: 'championship-history', label: 'Rodadas anteriores' });
    if (tournament.auditLog?.length)
      shortcuts.push({
        targetId: 'championship-audit',
        label: 'Histórico de alterações',
      });
    const championshipStarted = tournament.swissRounds.some(
      (item) => item.status !== 'paired' || Boolean(item.startedAt),
    );
    if (!championshipStarted) {
      shortcuts.push({ targetId: 'championship-players', label: 'Inscritos' });
    }
  }
  return { stage: STATUS_LABELS[tournament.status], shortcuts };
}
