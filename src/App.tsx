import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { supabase } from './lib/supabase';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { ProfilePage } from './pages/ProfilePage';
import { RacePage } from './pages/RacePage';
import { ResultsPage } from './pages/ResultsPage';
import { SetupPage } from './pages/SetupPage';
import { fetchPlayerProfile } from './services/auth';
import { useGameStore } from './store/gameStore';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { player, authInitialized } = useGameStore();

  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-[#090b10] flex items-center justify-center">
        <div className="font-display font-bold text-sm uppercase tracking-widest text-[#00f0ff] animate-pulse">
          Loading Zain Super Race...
        </div>
      </div>
    );
  }

  if (!player) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  const { player, authInitialized, setPlayer, setAuthInitialized } =
    useGameStore();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchPlayerProfile(
          session.user.id,
          session.user.user_metadata?.username || 'Driver'
        );
        if (mounted) setPlayer(profile);
      } else {
        setPlayer(null);
      }
      if (mounted) setAuthInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        const profile = await fetchPlayerProfile(
          session.user.id,
          session.user.user_metadata?.username || 'Driver'
        );
        if (mounted) setPlayer(profile);
      } else {
        setPlayer(null);
      }
      if (mounted) setAuthInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setPlayer, setAuthInitialized]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authInitialized && player ? <Navigate to="/" replace /> : <LoginPage />
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute>
              <SetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/race"
          element={
            <ProtectedRoute>
              <RacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

