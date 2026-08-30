import { Navigate, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { HomePage } from '@/pages/HomePage';
import { ModeSelectionPage } from '@/pages/ModeSelectionPage';
import { ChampionshipPage } from '@/pages/ChampionshipPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ModeSelectionPage />} />
      <Route
        path="/campeonato"
        element={
          <TournamentProvider initialPlayers={[]}>
            <ChampionshipPage />
          </TournamentProvider>
        }
      />
      <Route
        path="/sorteio"
        element={
          <TournamentProvider>
            <HomePage />
          </TournamentProvider>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
