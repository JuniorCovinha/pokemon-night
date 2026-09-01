# Gerenciador de torneios locais

## Objetivo

Evoluir o modo Campeonato para operar torneios locais de Pokemon TCG com 4 a 16
jogadores, inspirados no fluxo do Tournament Operations Manager (TOM), sem tentar
substituir o reporte oficial do Play! Pokemon.

O primeiro formato-alvo é:

- rodadas Suíças;
- melhor de três como padrão configurável;
- três rodadas para 4 a 8 jogadores;
- quatro rodadas para 9 a 16 jogadores;
- classificação por pontos e desempates;
- Top 4 opcional, preenchido pela classificação Suíça.

## Fontes e validade das regras

Use como fontes primárias:

- TOM Guide: <https://assets.pokemon.com/tournament_software/tom_guide.pdf>
- Play! Pokemon Rules & Resources:
  <https://www.pokemon.com/us/play-pokemon/about/tournaments-rules-and-resources>
- Página atual de documentos:
  <https://play.pokemon.com/en-us/resources/documents/?filter=all>

Os documentos competitivos são revisados periodicamente. Antes de implementar ou
alterar uma regra oficial, consulte a versão atual do **Play! Pokemon Tournament Rules
Handbook** e do **Pokemon TCG Tournament Handbook**. Registre no domínio a versão ou
data do conjunto de regras usado pelo evento quando isso afetar cálculos.

## Regras de referência para o MVP

### Sistema Suíço

- A primeira rodada é pareada aleatoriamente.
- Rodadas posteriores aproximam jogadores com pontuações ou campanhas semelhantes.
- Um confronto já realizado não deve se repetir.
- Todos os jogadores ativos continuam participando até o fim das rodadas Suíças.
- Depois de iniciada uma rodada, seus pareamentos ficam bloqueados. Correções devem
  seguir um fluxo explícito e auditável.

### Pontuação e classificação

- Vitória: 3 pontos.
- Empate: 1 ponto.
- Derrota: 0 pontos.
- Ordenação inicial: pontos de partida.
- Primeiro desempate: porcentagem de vitórias dos adversários (`opponentWinRate`).
- Segundo desempate: média da porcentagem de vitórias dos adversários dos adversários
  (`opponentsOpponentWinRate`).
- Confronto direto só é aplicável quando restam exatamente dois jogadores empatados e
  eles já se enfrentaram.
- Um critério aleatório final deve ser reproduzível e auditável; armazene a semente ou
  o valor utilizado.

### Bye

- Surge quando há quantidade ímpar de jogadores ativos.
- Conta como vitória na campanha e concede 3 pontos.
- Não cria um adversário fictício nem entra normalmente nos cálculos de desempate.
- Deve ir, quando possível, para um jogador da menor faixa de pontuação.
- O mesmo jogador não deve receber mais de um bye no evento.

### Quantidade de rodadas

Para o formato TCG Suíço local inicial:

| Jogadores ativos | Rodadas Suíças |
| ---: | ---: |
| 4 a 8 | 3 |
| 9 a 16 | 4 |

Mantenha a quantidade configurável para torneios casuais, mas ofereça esses valores
como padrão recomendado.

### Top Cut

- É opcional e começa somente após o encerramento e a confirmação da classificação
  Suíça.
- Para o MVP, suporte Top 4.
- O bracket é preenchido por seed, sem novo sorteio: 1º x 4º e 2º x 3º.
- Reutilize `bracketService`; não incorpore a fase Suíça dentro do tipo `Bracket`.
- Partidas eliminatórias não podem terminar empatadas.

### Resultado de partida

Modele resultados além de um único `winnerId`:

- vitória;
- derrota;
- empate;
- bye;
- derrota dupla;
- vitória ou derrota administrativa;
- partida em andamento, reportada, confirmada ou corrigida.

Guarde o resultado individual de cada jogo (`player1-win`, `player2-win` ou `draw`) e
derive dele a vitória ou o empate do confronto. No melhor de um há uma caixa; no melhor
de três há até três, encerrando quando alguém alcançar duas vitórias. O resultado deve
ser confirmado antes de fechar a rodada. Uma alteração posterior deve gerar uma revisão
no histórico.

### Decks

Separe a apresentação casual do registro competitivo:

- `Deck`: identidade visual reutilizável, como Pokemon principal, imagem e tipo.
- `TournamentDeckRegistration`: snapshot do deck inscrito naquele evento.

O Pokemon principal continua suficiente para torneios casuais. A lista completa de 60
cartas pode ser opcional no primeiro MVP, mas a modelagem deve permitir adicioná-la e
bloqueá-la depois do início do evento.

## Diferenças do estado atual

O modo Campeonato atual:

- aceita somente quantidades em potência de dois;
- gera imediatamente uma chave de eliminação simples;
- representa a decisão da partida apenas por `winnerId`;
- não possui empate, bye, mesas, classificação ou histórico de rodadas;
- termina assim que a chave encontra um campeão.

Não adapte `bracketService` para fingir que uma rodada Suíça é uma chave. Introduza
tipos e serviços próprios e mantenha compatibilidade com o fluxo eliminatório atual.

## Modelo de domínio proposto

Os nomes finais podem ser ajustados durante a implementação, preservando as
responsabilidades abaixo.

### TournamentConfig

- `gameType`: inicialmente `tcg`;
- `structure`: `swiss`, `single-elimination` ou `swiss-top-cut`;
- `tcgFormat`: `standard`, `expanded` ou `casual`;
- `matchFormat`: `best-of-one` ou `best-of-three`;
- `roundDurationMinutes`;
- `swissRoundCount`;
- `topCutSize` opcional;
- `rulesVersion`;
- política de divisões etárias configurável.

### TournamentEntry

- `playerId`;
- `deckRegistrationId`;
- divisão opcional;
- status de inscrição, check-in, desistência ou desclassificação;
- rodadas a partir das quais o jogador está ativo.

### SwissRound

- número da rodada;
- status `draft`, `paired`, `active`, `awaiting-results`, `completed`;
- IDs das partidas;
- horários de início e encerramento;
- versão/revisão dos pareamentos.

### TournamentMatch

- rodada e mesa;
- IDs dos dois jogadores, permitindo ausência apenas para bye;
- resultados individuais dos jogos;
- resultado tipado;
- status e confirmação;
- timestamps e revisão.

### Standing

Pode ser calculado sob demanda e apresentado como projeção:

- vitórias, derrotas, empates e byes;
- pontos;
- porcentagem de vitórias dos adversários;
- porcentagem de vitórias dos adversários dos adversários;
- seed e colocação.

Não mantenha classificação editável como segunda fonte de verdade. Recalcule-a a
partir das inscrições, partidas e resultados confirmados.

### AuditEntry

Registre mudanças relevantes:

- resultado criado, confirmado ou corrigido;
- jogador adicionado, desistente, reinserido ou desclassificado;
- rodada pareada, iniciada, reaberta ou encerrada;
- operador, momento, valor anterior e valor novo.

## Serviços de domínio esperados

Mantenha-os puros e independentes de React:

- `swissPairingService`: grupos por pontuação, restrição de revanche, pair up/down e
  bye;
- `standingsService`: pontos e desempates;
- `roundService`: criação, início, confirmação e fechamento da rodada;
- `matchResultService`: validação e correção de resultados;
- `topCutService`: seeds Suíços para o bracket eliminatório;
- `tournamentPersistenceService`: serialização versionada, importação e migrações.

O algoritmo de pareamento deve aceitar uma fonte de aleatoriedade ou semente injetada
para permitir testes determinísticos.

## Máquina de estados sugerida

Não force o fluxo novo nos status atuais sem revisar as transições. O gerenciador pode
usar estados equivalentes a:

1. `configuring`
2. `registration`
3. `ready`
4. `swiss-round-active`
5. `swiss-round-review`
6. `swiss-complete`
7. `top-cut-active` quando aplicável
8. `finalized`

O estado deve impedir iniciar uma nova rodada com resultados pendentes, mudar
configurações estruturais depois do início e gerar Top Cut antes de confirmar a
classificação.

## Fluxo de interface

### Configuração

- nome e formato do evento;
- quantidade de rodadas recomendada automaticamente;
- melhor de um ou melhor de três;
- duração;
- Top Cut opcional.

### Inscrição e check-in

- cadastro de jogador e deck;
- lista de presentes;
- validação antes da primeira rodada;
- participantes não precisam formar potência de dois.

### Painel da rodada

- número da rodada e cronômetro público;
- mesas e confrontos;
- filtro de pendentes/finalizados;
- entrada rápida de resultado;
- revisão antes de encerrar.

### Classificação

- campanha, pontos e desempates visíveis;
- publicação ao final de cada fase;
- indicação clara dos classificados para o Top Cut.

### Top Cut e campeão

- bracket preenchido por seed;
- uso dos componentes visuais existentes;
- revelação do campeão continua sendo o encerramento visual do evento.

### Menu lateral de ajuda e navegação

Implementar depois que o fluxo completo das rodadas Suíças estiver funcionando,
incluindo resultados, classificação, rodadas seguintes e correções.

Na primeira versão, o menu será principalmente explicativo e deverá reunir:

- diferença entre os modos **Campeonato** e **Sorteio de decks**;
- explicação do formato Suíço, mesas, bye, pontos e desempates;
- descrição de todas as opções configuráveis do campeonato, como formato do TCG,
  melhor de 1/3, duração, quantidade de rodadas e Top Cut;
- indicação da etapa atual do evento e acesso às áreas já disponíveis;
- aviso de que o aplicativo não substitui o TOM em eventos oficiais sancionados.

No desktop, usar uma barra lateral recolhível. Em telas menores, apresentar o mesmo
conteúdo como painel deslizante. O conteúdo explicativo deve ficar centralizado para
não ser duplicado diretamente em várias páginas e divergir com o tempo.

## Persistência mínima antes de uso real

Um torneio presencial não pode depender apenas de estado React em memória. Antes de
considerar o modo utilizável:

- salve automaticamente depois de cada alteração relevante;
- restaure um torneio após fechar ou recarregar o navegador;
- exporte e importe um JSON versionado;
- mantenha backup antes de iniciar e depois de encerrar cada rodada;
- valide a integridade do arquivo importado.

Comece com IndexedDB ou armazenamento local encapsulado por um serviço. Mantenha o
domínio independente da tecnologia para permitir um banco remoto no futuro.

## Ordem de implementação

1. Tipos e configuração do torneio Suíço, sem remover o fluxo atual.
2. Inscrição/check-in com 4 a 16 participantes de qualquer quantidade.
3. Geração determinística da primeira rodada e suporte a bye.
4. Registro visual dos jogos, empate e confirmação de resultados.
5. Classificação com pontos e desempates.
6. Pareamentos das rodadas seguintes, evitando revanche.
7. Bloqueio, revisão e correção de rodadas com histórico.
8. Menu lateral responsivo com explicações dos modos, regras e opções disponíveis.
9. Persistência, recuperação e exportação/importação.
10. Top 4 por seed usando o bracket existente.
11. Tela pública de pareamentos, classificação e cronômetro.

Relatórios impressos, match slips, QR code, divisões etárias completas e listas de 60
cartas ficam para iterações posteriores.

## Critérios para o primeiro MVP utilizável

- Executar um torneio com 4 a 16 participantes sem exigir potência de dois.
- Completar 3 ou 4 rodadas Suíças sem repetir confrontos quando existir alternativa.
- Conceder no máximo um bye por participante.
- Registrar vitórias, derrotas e empates a partir dos resultados individuais dos jogos.
- Impedir o fechamento de uma rodada com resultados pendentes.
- Recalcular classificação e desempates após uma correção.
- Restaurar todo o evento depois de recarregar a página.
- Gerar Top 4 opcional a partir das seeds corretas.
- Preservar o modo Sorteio sem regressões.
