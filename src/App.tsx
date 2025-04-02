import React from 'react';
import { UserProvider } from './contexts/UserContext';
import { GameProvider } from './contexts/GameContext';
import { AchievementsProvider } from './contexts/AchievementsContext';
import TotemGallery from './components/pages/TotemGallery';
import ShopInterface from './components/pages/ShopInterface';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './components/layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './components/pages/Home';
import Rewards from './components/pages/Rewards';
import Challenges from './components/pages/Challenges';
import Expeditions from './components/pages/Expeditions';
import Achievements from './components/pages/Achievements';
import AccountSettings from './components/pages/AccountSettings';
import ApiKeySignup from './components/ApiKeySignup';
import PremiumSignup from './components/PremiumSignup';
import PremiumSuccess from './components/PremiumSuccess';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />

        {/* Protected routes */}
        <Route path="account">
          <Route index element={<Navigate to="/account/settings" replace />} />
          <Route path="settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="api-key" element={
            <ProtectedRoute>
              <ApiKeySignup />
            </ProtectedRoute>
          } />
          <Route path="premium" element={
            <ProtectedRoute>
              <PremiumSignup />
            </ProtectedRoute>
          } />
          <Route path="success" element={
            <ProtectedRoute>
              <PremiumSuccess/>
            </ProtectedRoute>
          } />
        </Route>
        <Route path="totems" element={
          <ProtectedRoute>
            <TotemGallery />
          </ProtectedRoute>
        } />
        <Route path="challenges" element={
          <ProtectedRoute>
            <Challenges />
          </ProtectedRoute>
        } />
        <Route path="expeditions" element={
          <ProtectedRoute>
            <Expeditions />
          </ProtectedRoute>
        } />
        <Route path="achievements" element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        } />
        <Route path="rewards" element={
          <ProtectedRoute>
            <Rewards />
          </ProtectedRoute>
        } />
        <Route path="shop" element={
          <ProtectedRoute>
            <ShopInterface />
          </ProtectedRoute>
        } />

        {/* 404 Route - Always last */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UserProvider>
          <GameProvider>
            <AchievementsProvider>
              <AppRoutes />
            </AchievementsProvider>
          </GameProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;