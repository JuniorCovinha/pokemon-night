# Pokémon Night — Notas do Projeto

> Este arquivo existe para retomar o contexto rapidamente em uma nova sessão
> (ex: ao migrar do claude.ai para o Claude Code). Resume decisões de
> arquitetura já tomadas e o que falta implementar.

## Stack

React 19 + TypeScript + Vite + Tailwind CSS v4 (plugin nativo do Vite, sem
`tailwind.config.js`) + React Router + ESLint (flat config) + Prettier +
Vitest.

## Arquitetura geral

Separação estrita entre **domínio/regras de negócio** e **interface**:

```
src/
  types/       → tipos do domínio (Player, Deck, Match, Round, Bracket,
                 Tournament, Champion) — nenhuma lógica, só shape de dados
  utils/       → funções genéricas, sem conhecimento do domínio
                 (shuffle, generateId, isPowerOfTwo)
  services/    → regras de negócio puras e testadas e integrações externas
                 (sorteio, bracket, rodadas, resultados, classificação, catálogo)
  contexts/    → ponte entre services e React (TournamentContext,
                 tournamentReducer) — NUNCA contém lógica de sorteio,
                 só traduz ações em chamadas de service
  hooks/       → useTournament() para consumir o contexto
  data/        → mocks iniciais (players.ts, decks.ts)
  constants/   → valores nomeados (nomes de rodada, tamanhos suportados)
  pages/       → seleção de modo, Sorteio e Campeonato
  components/  → inscrições, decks, rodadas, classificação e campeão
  layouts/     → estruturas compartilhadas das páginas (ex: menu/guia responsivo)
  styles/      → estilos globais e de componentes estruturais não cobertos só por Tailwind
```

## Decisões importantes já tomadas (não reabrir sem motivo forte)

1. **Bracket é genérico**, não fixo em "semifinal/final". `gerarBracket()`
   cria todas as rodadas de uma vez (a partir da 2ª rodada em diante, com
   vagas de jogador vazias) e o nome de cada rodada é derivado da
   quantidade de partidas restantes (`ROUND_NAMES_BY_MATCHES_REMAINING`).
   Isso é o que permite suportar 8/16 jogadores no futuro sem reescrever
   a modelagem.

2. **`Match` guarda apenas IDs** (`player1Id`, `player2Id`, `winnerId`),
   nunca objetos completos. Única fonte de verdade: `Tournament.players` /
   `Tournament.decks`. Evita duplicação e dados divergentes.

3. **`registrarVencedor()` propaga automaticamente** o vencedor para a
   vaga certa da próxima rodada (ver `services/bracketService.ts`,
   função interna `avancarFase`). Validações: não deixa registrar vencedor
   sem os dois jogadores definidos, nem alguém que não está na partida.

4. **`Deck` já nasce com o modelo completo** (dificuldade, matchups, lista
   de cartas, links úteis, vídeo...) — todos os campos além de `id`/`nome`
   são opcionais. Não deve precisar de migração para as v2+.

5. **`TournamentStatus`** é uma máquina de estados simples:
   `registrando-jogadores → decks-sorteados → chave-gerada → em-andamento
→ finalizado`. `gerarChaveDoTorneio()` lança erro se chamado fora de
   ordem.

6. **Reducer nunca contém lógica de negócio** — só despacha para os
   services (que são testados isoladamente, sem precisar renderizar
   React). Erros de transição inválida viram `error: string | null` no
   estado em vez de derrubar a árvore de componentes.

7. **Contexto React separado em dois arquivos**
   (`tournamentContextDefinition.ts` + `TournamentContext.tsx`) para não
   quebrar o Fast Refresh do Vite — um arquivo que exporta componente E
   não-componente (`createContext`) impede hot-reload eficiente.

8. Alias de import `@/` aponta para `src/` (configurado em
   `vite.config.ts`, `tsconfig.app.json` e `vitest.config.ts`).

9. **Mídia da PokéAPI:** a busca e os decks sorteados exibem artwork estática. Depois
   da escolha, o card compacto do deck usa a sprite, assim como inscrições e chaves.
   O `dexId` da TCGdex ou o retorno da PokéAPI podem preencher `imagemSprite` e
   `imagemAnimada`; GIFs do Pokémon Showdown ficam restritos ao `ChampionCard`. O
   componente `DeckPokemonImage` centraliza essas variantes e seus fallbacks.

10. **Fundo do campeão:** a cidade permanece neutra durante toda a aplicação. Vídeos
    temáticos em loop são aplicados somente dentro do `ChampionCard`, atrás do Pokémon.
    Os primeiros assets são `public/backgrounds/fogo-campeao-loop.mp4`,
    `public/backgrounds/agua-campeao-loop.mp4`,
    `public/backgrounds/eletrico-campeao-loop.mp4`,
    `public/backgrounds/grama-campeao-loop.mp4`,
    `public/backgrounds/psiquico-campeao-loop.mp4`,
    `public/backgrounds/lutador-campeao-loop.mp4`,
    `public/backgrounds/sombrio-campeao-loop.mp4`,
    `public/backgrounds/metalico-campeao-loop.mp4`,
    `public/backgrounds/dragao-campeao-loop.mp4`,
    `public/backgrounds/fada-campeao-loop.mp4` e
    `public/backgrounds/incolor-campeao-loop.mp4`, usados respectivamente por campeões
    dos tipos Fogo, Água, Elétrico, Grama, Psíquico, Lutador, Sombrio, Metálico, Dragão,
    Fada e Incolor. As 11 tipagens TCG planejadas têm vídeo; tipos sem mapeamento ou
    ausentes mantêm o fundo claro.

11. **Efeitos inspirados no React Bits:** cinco efeitos locais em
    `src/components/effects` preservam a identidade pixel art sem novas dependências.
    A revelação dos decks sorteados usa Pixel Swap uma única vez; o clique válido de
    vencedor usa Click Spark vermelho nas rodadas e dourado na final; o Glare Hover
    fica restrito à artwork estática dos decks revelados (nunca à busca); o Star Border
    substitui o antigo glow do campeão e usa a cor da tipagem; e os cards do menu
    recebem pixels decorativos sem ocultar título ou descrição. Todos respeitam
    `prefers-reduced-motion`, e os efeitos de hover exigem um dispositivo com hover
    preciso.

12. **Marca e navegação contextual:** todas as aparições visuais de “Pokémon Night”
    usam o componente `BrandTitle`, com amarelo claro e contorno pixelado escuro. No
    modo Sorteio, a criação da chave move foco e rolagem para a seção do bracket apenas
    na transição sem chave → com chave; a revelação do campeão continua levando ao topo.

13. **Busca de cartas:** TCGdex `/pt` primeiro, `/en` como alternativa quando a busca
    falhar ou vier vazia, depois PokéAPI e catálogo local. O filtro de categoria é
    `Pokémon` em `/pt` e `Pokemon` em `/en`; o idioma da busca acompanha os detalhes.
    Em 06/09/2026, a consulta real de Xerneas com `/pt` e categoria localizada retornou
    16 cartas na primeira página. Apenas mudar a rota mantendo `Pokemon` retornava vazio.

14. **Classificação Suíça local v1:** `standingsService` calcula uma projeção dos
    resultados confirmados/corrigidos de rodadas iniciadas, sem duplicá-la no reducer.
    Mostra campanha V–D–E, byes, pontos (3/1/0), Op. % e Op. Op. %. Bye dá vitória e
    pontos, mas não participa dos percentuais. O percentual individual exclui byes e
    usa vitórias/confrontos, com piso de 25% e teto de 75% para inscrições desistentes
    ou desclassificadas. Sem adversário real, o percentual aparece como `—`.
    Empates após os dois percentuais compartilham colocação; a ordem da inscrição é
    apenas visual e não define seed nem vaga no Top Cut. A tabela é parcial durante
    a rodada e recalculada após cada confirmação ou correção.

    O snapshot `config.standingsRules` identifica `local-standings-2026-09-v1`;
    configurações antigas sem snapshot usam esse padrão local. A referência histórica
    é o [Play! Pokémon Handbook de 06/10/2023, seções 4.4.2–4.4.3.2](https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-tournament-rules-handbook-10062023-en.pdf).
    A [página oficial atual de documentos](https://play.pokemon.com/en-us/resources/documents/)
    foi consultada em 06/09/2026, mas os PDFs atuais de regras gerais e TCG bloquearam
    o acesso. A validação contra o regulamento vigente continua pendente; esta versão
    é uma política local, não uma implementação certificada do regulamento atual.

15. **Navegação da busca no Campeonato:** escolher/alterar deck rola até o painel e
    foca o campo de busca. Selecionar ou fechar devolve foco e rolagem ao card do
    jogador correspondente, depois da atualização visual. A preferência por movimento
    reduzido é respeitada. Trocar de jogador reinicia a busca; fechar ou trocar cancela
    a consulta de detalhes pendente para impedir seleções tardias no painel anterior.

16. **Tipografia:** `Press Start 2P` permanece na marca, nos títulos e badges, enquanto
    `Pixelify Sans` é usada nos textos comuns. A tabela de classificação usa
    `Silkscreen` somente nas células numéricas — posição, pontos, campanha, byes e
    percentuais — para tornar especialmente o algarismo 5 mais legível sem perder a
    estética pixelada.

## Estado atual do gerenciador Suíço

Em 31/08/2026 foi concluída a primeira fatia do novo modo Campeonato:

- configuração do evento com nome, formato do TCG, melhor de 1/3, duração,
  quantidade de rodadas e Top 4 opcional;
- inscrições flexíveis de 4 a 16 jogadores, incluindo quantidades ímpares;
- confirmação das inscrições sem reutilizar o bracket eliminatório como rodada Suíça;
- tipos próprios para configuração, entradas e registros de deck;
- estado `inscricoes-confirmadas`, preparado para a geração da primeira rodada;
- primeira rodada Suíça com mesas numeradas, sorteio testável e bye confirmado sem
  adversário fictício;
- estado `rodada-suica-pareada` e painel visual dos confrontos;
- início da rodada e registro visual de cada jogo por vitória ou empate, sem campos
  numéricos de placar;
- correção de resultados antes do encerramento, com incremento de revisão;
- transição automática para revisão quando todas as mesas forem confirmadas;
- encerramento bloqueado até a confirmação completa dos resultados.

Em 06/09/2026 foi adicionada a classificação por pontos, bye e os dois primeiros
percentuais de desempate, com tabela responsiva e sprites dos decks. Naquela etapa,
o fluxo ainda impedia correções após encerrar a rodada.

Em 07/09/2026 foram adicionados os pareamentos das rodadas seguintes. O serviço usa
busca completa com memoização (até 16 jogadores), proíbe revanche e repetição de bye,
prioriza o bye na menor pontuação elegível que permita uma combinação completa e
minimiza a soma das diferenças de pontos entre adversários. Empates entre soluções
usam uma ordem sorteada, registrada em `SwissRound.pairingOrder` com a versão
`local-pairing-2026-09-v1`. Esta é uma política de pareamento local, não uma reprodução
certificada do algoritmo do TOM.

A próxima rodada exige que todas as anteriores estejam encerradas e confirmadas.
Partidas antigas são preservadas; IDs repetidos e históricos incompletos são rejeitados.
Se não existir combinação válida, o serviço mantém o evento intacto e mostra um erro;
não há revanche automática. Configurações longas (por exemplo, 4 rodadas com 4 jogadores)
podem esgotar os adversários disponíveis.

A interface mostra progresso, botão para gerar a próxima rodada e histórico somente
para consulta. A geração move foco e rolagem aos novos confrontos; a classificação da
rodada anterior continua visível até o início da nova. Ao terminar a última rodada,
o estado passa para `suico-concluido`, sem gerar rodada extra, campeão ou Top Cut
automaticamente.

Também em 07/09/2026 foi adicionada a reabertura da última rodada encerrada, inclusive
após a conclusão do Suíço, mediante justificativa obrigatória (até 500 caracteres).
Reabrir preserva partidas, resultados e bye, incrementa a revisão da rodada, remove
o encerramento atual e retorna para revisão. É necessário encerrar novamente antes
de gerar a próxima rodada. Uma rodada com pareamentos posteriores permanece protegida;
esta versão não descarta nem refaz rodadas posteriores automaticamente. A existência
de bracket ou campeão também bloqueia a reabertura.

O `auditLog` do evento registra confirmações e correções de resultados, encerramentos
e reaberturas, com sequência, horário e snapshots independentes de antes/depois.
Reaberturas incluem justificativa; correções identificam a revisão da rodada. Confirmar
novamente um resultado idêntico não gera revisão extra. O operador é identificado como
organizador local, sem login. Eventos antigos sem log são aceitos; iniciar outro evento
limpa o histórico. A interface permite consultar a linha do tempo de alterações.
O histórico ainda existe apenas no estado do evento aberto: persistência e exportação
continuam pendentes e são necessárias antes de uso real.

Em 09/09/2026 foi concluído o menu lateral informativo responsivo. No desktop, ele é
recolhível; no celular, abre como painel modal deslizante, com foco contido e fechamento
por Escape. O conteúdo vem de `constants/appGuide.ts`, que também fornece as mesmas
descrições usadas na tela inicial. O guia explica os dois modos, configuração, rodadas
Suíças, classificação, correções e limitações atuais. Os atalhos são contextuais e levam
somente a seções existentes na etapa atual, sem trocar de rota nem descartar o evento.
Movimento reduzido é respeitado. A interface informa explicitamente que o Top Cut ainda
não é gerado e que recarregar ou sair da tela ainda perde o evento.

Em 20/09/2026, o menu desktop passou a sobrepor a página, mantendo a posição e a
largura do conteúdo principal ao abrir ou recolher. Fechado, deixa apenas um botão
flutuante para reabertura. As áreas roláveis do guia têm barra própria em amarelo e
fundo escuro, isolada da rolagem da página e compatível com Firefox e navegadores
WebKit. A explicação da pesquisa foi simplificada para o usuário: busca cartas e, se
esse serviço estiver indisponível, busca o Pokémon, sem expor APIs ou idiomas internos.

Após os testes de uso, o guia desktop passou a iniciar sempre recolhido e só abre por
ação do usuário. No Campeonato, a lista separada de inscritos permanece disponível para
conferência até o início da primeira rodada; depois disso, é removida junto com seu
atalho contextual, pois a classificação passa a concentrar jogadores e decks.

Próxima etapa: persistência/recuperação e exportação/importação do evento. Em seguida,
completar os critérios de desempate antes do Top Cut: confronto direto quando aplicável,
sorteio final reproduzível e auditável, indicação visual do critério usado e confirmação
da classificação final e das seeds. A ordem de inscrição não será usada silenciosamente
como desempate. Só depois dessa etapa será gerado o Top Cut.

## Testes

179 testes com Vitest, cobrindo:

- `services/deckAssignmentService.test.ts` — sorteio de decks
- `services/bracketService.test.ts` — geração de chave e propagação de
  vencedor (inclusive imutabilidade)
- `services/swissPairingService.test.ts` — primeira rodada, pontos, busca de combinação
  completa, ausência de revanche, bye elegível e casos sem solução
- `services/swissProgression.test.ts` — torneios completos de 4 a 16 jogadores,
  preservação de histórico, correções, inscrições ativas, bloqueios e conclusão do Suíço
- `services/roundService.test.ts` — criação e transição da rodada Suíça
- `services/roundAudit.test.ts` — reabertura, justificativa, snapshots, correção com
  bye, rodada final, proteção de rodadas anteriores e confirmações sem mudança
- `services/matchResultService.test.ts` — resultados por jogo, empates, correções e
  validações dos formatos melhor de 1 e melhor de 3
- `contexts/tournamentReducer.test.ts` — fluxo completo do reducer
- `components/deckMediaUsage.test.tsx` — sprite no deck compacto, artwork nos decks
  sorteados e GIF reservado ao campeão
- `components/reactBitsEffects.test.tsx` — estrutura e semântica decorativa dos cinco
  efeitos visuais inspirados no React Bits
- `components/ChampionCard.typeBorder.test.tsx` — cor da tipagem e fallback dourado da
  borda do campeão
- `components/BrandTitle.test.tsx` — marca visual centralizada e semântica configurável
- `hooks/bracketScroll.test.ts` — transição, foco e rolagem até a chave
- `hooks/deckSearchNavigation.test.ts` — foco do campo de busca, retorno ao card e
  movimento reduzido
- `services/tcgdexService.test.ts` — rota `/pt`, categoria localizada, detalhes no
  mesmo idioma e alternativas de catálogo
- `services/standingsService.test.ts` — pontos, byes, dois desempates, correções,
  transições, resultados administrativos e snapshot de regras locais
- `components/SwissStandingsPanel.test.tsx` — tabela parcial/encerrada, percentuais,
  empates e uso de sprites
- `pages/ChampionshipPage.test.tsx` — acesso à próxima rodada, classificação anterior,
  histórico e conclusão sem rodada extra
- `layouts/AppGuideLayout.test.tsx` — conteúdo central, atalhos contextuais válidos nas
  etapas dos dois modos, limitações atuais, texto não técnico da busca, sobreposição no
  desktop e estrutura acessível do painel móvel

Rodar com `npm run test`.

## Comandos

| Comando          | O que faz                                  |
| ---------------- | ------------------------------------------ |
| `npm run dev`    | servidor local com hot-reload              |
| `npm run build`  | build de produção (`tsc -b && vite build`) |
| `npm run lint`   | ESLint                                     |
| `npm run format` | Prettier (escreve)                         |
| `npm run test`   | Vitest                                     |

## O que falta (roadmap combinado com o usuário)

**Próxima etapa do Campeonato:** persistência local com recuperação segura do evento e
exportação/importação, conforme a sequência em
`.agents/skills/pokemon-night/references/local-tournament-roadmap.md`. O menu lateral
informativo responsivo já está implementado. A interface do Sorteio e seus efeitos já
estão implementados. Os vídeos de fundo do campeão estão completos para as 11 tipagens
TCG planejadas, incluindo Incolor.

**Etapa seguinte:** completar o desempate da classificação Suíça. Pontos,
`opponentWinRate` e `opponentsOpponentWinRate` já estão implementados; ainda faltam o
confronto direto para exatamente dois jogadores que já tenham se enfrentado, o sorteio
final com valor persistido para reprodução e auditoria, a apresentação do critério que
desempatou cada posição e a confirmação das seeds antes de declarar campeão ou montar o
Top Cut.

**Depois (v2 em diante, conforme roadmap original do usuário):**

- v2: fotos dos decks, página individual de cada deck
- v3: histórico de campeonatos
- v4: ranking entre amigos, estatísticas, decks mais vencedores
- v5: login, banco de dados, persistência, compartilhamento por link
- v6: formatos diferentes (4/8/16 jogadores, suíço, todos-contra-todos)

## Forma de trabalhar combinada com o usuário

- Trabalhar em pequenas etapas, explicando a decisão de arquitetura antes
  de implementar, aguardando confirmação antes de prosseguir.
- Nunca colocar toda a aplicação em um único arquivo.
- Regra de negócio nunca na UI.
- Comportar-se como Tech Lead: questionar decisões, sugerir melhorias de
  UX/arquitetura, identificar problemas antes que aconteçam.
