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
  services/    → toda a regra de negócio, funções puras e testadas
                 (deckAssignmentService, bracketService, tournamentService)
  contexts/    → ponte entre services e React (TournamentContext,
                 tournamentReducer) — NUNCA contém lógica de sorteio,
                 só traduz ações em chamadas de service
  hooks/       → useTournament() para consumir o contexto
  data/        → mocks iniciais (players.ts, decks.ts)
  constants/   → valores nomeados (nomes de rodada, tamanhos suportados)
  pages/       → só a HomePage provisória por enquanto
  components/  → VAZIO — próxima etapa
  layouts/     → VAZIO — ainda não usado
  styles/      → VAZIO — ainda não usado
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

9. **Mídia da PokéAPI:** a busca e a escolha de decks exibem artwork estática. O
   `dexId` da TCGdex ou o retorno da PokéAPI podem preencher `imagemSprite` e
   `imagemAnimada`. Imagens pequenas, como inscrições e chaves, usam sprites; GIFs do
   Pokémon Showdown ficam restritos aos decks sorteados e ao campeão. O componente
   `DeckPokemonImage` centraliza essas variantes e seus fallbacks.

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

Próxima etapa: calcular e exibir a classificação por pontos a partir dos resultados
confirmados, incluindo o bye e os primeiros critérios de desempate.

Depois de concluir todo o fluxo das rodadas Suíças — resultados, classificação,
rodadas seguintes e correções — implementar um menu lateral responsivo. A primeira
versão será informativa, explicando os modos Campeonato e Sorteio de decks, o sistema
Suíço e todas as opções configuráveis. No desktop será uma barra recolhível; no celular,
um painel deslizante. O conteúdo deverá vir de uma fonte central para não duplicar
explicações entre telas.

## Testes

87 testes com Vitest, cobrindo:

- `services/deckAssignmentService.test.ts` — sorteio de decks
- `services/bracketService.test.ts` — geração de chave e propagação de
  vencedor (inclusive imutabilidade)
- `services/swissPairingService.test.ts` — primeira rodada e bye
- `services/roundService.test.ts` — criação e transição da rodada Suíça
- `services/matchResultService.test.ts` — resultados por jogo, empates, correções e
  validações dos formatos melhor de 1 e melhor de 3
- `contexts/tournamentReducer.test.ts` — fluxo completo do reducer

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

**Próxima etapa (em andamento):** componentes de UI reais —
`Header`, `PlayerCard`, `DeckCard`, `DeckGrid`, `TournamentBracket`,
`MatchCard`, `ChampionCard`, `Button`, `Modal`, `Input`, `EmptyState`,
`Loading`. Design minimalista: muito espaço em branco, cards
arredondados, sombras suaves, animações discretas, tipografia moderna,
excelente responsividade. Fluxo de tela: Header → Jogadores → Decks
Sorteados → Chave → Campeão. Interações-chave: revelar deck sorteado com
animação, destacar jogador, animar entrada dos confrontos, avançar
vencedor automaticamente na chave, comemoração ao surgir o campeão.

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
