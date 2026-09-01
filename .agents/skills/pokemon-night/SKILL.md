---
name: pokemon-night
description: Evoluir o aplicativo Pokemon Night neste repositorio, preservando sua arquitetura e a separacao entre o modo casual de sorteio e o gerenciador de torneios locais. Use para planejar, implementar ou revisar funcionalidades deste projeto.
---

# Pokemon Night

Antes de alterar o projeto, leia `PROJECT_NOTES.md` na raiz. Ele registra a stack, a
arquitetura existente e decisões que não devem ser reabertas sem um motivo concreto.

## Direção do produto

Mantenha dois fluxos independentes:

- **Sorteio de decks:** experiência casual, com seleção e distribuição aleatória de
  decks entre os jogadores.
- **Gerenciador de torneio:** inscrições, rodadas Suíças, resultados, classificação e
  Top Cut opcional para campeonatos pequenos e locais.

Não misture regras competitivas no modo Sorteio. Não apresente o aplicativo como
substituto do Tournament Operations Manager (TOM) em eventos sancionados; nesses
eventos, o organizador ainda precisa seguir os sistemas e procedimentos oficiais do
Play! Pokemon.

Ao trabalhar em pareamentos, rodadas, resultados, classificação, cadastro competitivo
de decks ou persistência do evento, leia
[`references/local-tournament-roadmap.md`](references/local-tournament-roadmap.md).

## Invariantes de arquitetura

- Tipos do domínio permanecem em `src/types` e não contêm lógica.
- Regras de negócio permanecem em funções puras e testadas de `src/services`.
- Contextos e reducers apenas conectam serviços ao React e convertem falhas em estado
  de erro; não implementam algoritmos de torneio.
- Componentes e páginas apresentam o estado e coletam ações; não calculam
  pareamentos, classificação ou desempates.
- Entidades referenciam jogadores, decks, rodadas e partidas por ID. Evite duplicar
  objetos completos em resultados ou pareamentos.
- O bracket eliminatório existente deve ser preservado e reutilizado como motor do
  Top Cut. A fase Suíça deve ser modelada separadamente.
- Regras que mudam por temporada ou trimestre devem ser configuráveis e verificadas
  nas fontes oficiais antes de serem codificadas. Não fixe no código divisões etárias,
  formatos legais ou procedimentos temporais sem uma versão de regra associada.

## Forma de evolução

Implemente o gerenciador de torneios em fatias pequenas e testáveis. Antes de alterar
tipos centrais, identifique como a mudança afeta serviços, reducer, persistência e
interface. Preserve o modo eliminatório atual enquanto o motor Suíço é introduzido.

Para cada regra de torneio adicionada, cubra pelo menos os casos normais, quantidade
ímpar de jogadores, correção de resultado e restrições de transição entre rodadas.
