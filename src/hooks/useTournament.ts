import { useContext } from 'react';
import { TournamentContext } from '@/contexts/tournamentContextDefinition';

/**
 * Hook de acesso ao estado e às ações do campeonato.
 * Lança erro claro se usado fora de <TournamentProvider> — evita um
 * `undefined` silencioso se propagando pelos componentes.
 */
export function useTournament() {
  const context = useContext(TournamentContext);

  if (!context) {
    throw new Error('useTournament precisa ser usado dentro de <TournamentProvider>.');
  }

  return context;
}
