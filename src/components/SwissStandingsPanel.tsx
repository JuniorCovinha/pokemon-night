import { ListOrdered } from 'lucide-react';
import type { Deck, Player, PlayerDeckAssignment, Standing, SwissRound } from '@/types';
import { DeckPokemonImage } from './DeckPokemonImage';
import { hasDeckPokemonImage } from './deckMedia';

type SwissStandingsPanelProps = {
  standings: Standing[];
  players: Player[];
  decks: Deck[];
  assignments: PlayerDeckAssignment[];
  round: SwissRound;
};

function percentage(value: number | null): string {
  return value === null
    ? '—'
    : `${(value * 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`;
}

export function SwissStandingsPanel({
  standings,
  players,
  decks,
  assignments,
  round,
}: SwissStandingsPanelProps) {
  const completed = round.status === 'completed';

  return (
    <section aria-labelledby="swiss-standings-heading" className="flex flex-col gap-4">
      <div>
        <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-widest text-brand">
          <ListOrdered size={14} />
          {completed
            ? `Após a rodada ${round.number}`
            : `Parcial da rodada ${round.number}`}
        </p>
        <h2
          id="swiss-standings-heading"
          tabIndex={-1}
          data-guide-section
          className="mt-2 font-display text-lg uppercase tracking-wide text-ink-soft"
        >
          Classificação
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          {completed
            ? 'Resultados da rodada encerrada incluídos na classificação.'
            : 'Somente resultados confirmados entram na tabela. Mesas pendentes ainda podem mudar a ordem.'}
        </p>
      </div>

      <div className="light-card overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div
          role="region"
          aria-label="Tabela de classificação com rolagem horizontal"
          tabIndex={0}
          className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand"
        >
          <table className="w-full min-w-[640px] text-left text-sm text-ink">
            <caption className="sr-only">
              Classificação Suíça por pontos e desempates. Campanha: vitórias, derrotas e
              empates.
            </caption>
            <thead className="border-b border-line bg-surface-alt text-xs">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Pos.
                </th>
                <th scope="col" className="px-4 py-3">
                  Jogador / deck
                </th>
                <th scope="col" className="px-3 py-3 text-center">
                  Pontos
                </th>
                <th scope="col" className="px-3 py-3 text-center">
                  V–D–E
                </th>
                <th scope="col" className="px-3 py-3 text-center">
                  Byes
                </th>
                <th scope="col" className="px-3 py-3 text-right">
                  <abbr title="Porcentagem de vitórias dos adversários">Op. %</abbr>
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  <abbr title="Média dos percentuais dos adversários dos adversários">
                    Op. Op. %
                  </abbr>
                </th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => {
                const player = players.find((item) => item.id === standing.playerId);
                const assignment = assignments.find(
                  (item) => item.playerId === standing.playerId,
                );
                const deck = decks.find((item) => item.id === assignment?.deckId);
                return (
                  <tr
                    key={standing.playerId}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-3 font-numeric font-semibold tabular-nums">
                      {standing.position}º
                      {standing.tied && <span aria-label="empatado"> =</span>}
                    </td>
                    <th scope="row" className="px-4 py-3 font-normal">
                      <div className="flex items-center gap-3">
                        {deck && hasDeckPokemonImage(deck) && (
                          <DeckPokemonImage
                            deck={deck}
                            variant="sprite"
                            alt=""
                            className="h-12 w-12 shrink-0 object-contain"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="break-words font-semibold">
                            {player?.name ?? 'Jogador não encontrado'}
                          </p>
                          <p className="break-words text-xs text-ink-soft">
                            {deck?.nome ?? 'Deck não informado'}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="px-3 py-3 text-center font-numeric text-base font-bold tabular-nums">
                      {standing.points}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-center font-numeric tabular-nums">
                      {standing.wins}–{standing.losses}–{standing.draws}
                    </td>
                    <td className="px-3 py-3 text-center font-numeric tabular-nums">
                      {standing.byes}
                    </td>
                    <td className="px-3 py-3 text-right font-numeric tabular-nums">
                      {percentage(standing.opponentWinRate)}
                    </td>
                    <td className="px-4 py-3 text-right font-numeric tabular-nums">
                      {percentage(standing.opponentsOpponentWinRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <details className="border-t border-line px-4 py-3 text-sm text-ink">
          <summary className="cursor-pointer font-semibold">
            Como ler a classificação
          </summary>
          <div className="mt-3 space-y-2 leading-relaxed">
            <p>
              Vitória: 3 pontos. Empate: 1 ponto. Derrota: 0 pontos. V–D–E significa
              vitórias, derrotas e empates de confrontos, não de jogos individuais.
            </p>
            <p>
              O bye já está incluído nas vitórias e nos pontos. Ele não entra nos
              percentuais de desempate.
            </p>
            <p>
              Em igualdade de pontos, vale primeiro Op. % (média das porcentagens de
              vitórias dos adversários), depois Op. Op. % (média dos Op. % desses
              adversários). Cada adversário contribui com no mínimo 25%. Empates não
              contam como vitórias nesses percentuais.
            </p>
            <p>
              O símbolo = indica igualdade nos critérios disponíveis. A ordem visual entre
              esses jogadores não define uma vaga no Top 4. — indica que ainda não houve
              adversário real.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
