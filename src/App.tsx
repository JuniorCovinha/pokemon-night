import { Routes, Route } from 'react-router-dom';
import { TournamentProvider } from '@/contexts/TournamentContext';
import { HomePage } from '@/pages/HomePage';

export function App() {
  return (
    <TournamentProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </TournamentProvider>
  );
}
