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
import LegalDocument from './components/LegalDocument';
import About from './components/pages/About';
import Plans from './components/pages/Plans';
import { SignupForm } from './components/SignupForm';
import { usePageViews } from './hooks/usePageViews';
import ServiceWorkerDialog from './components/ServiceWorkerDialog';
import Guides from './components/pages/Guides';
import Tutorial from './components/guides/Tutorial';
import HowToGuides from './components/guides/HowToGuides';
import TotemCodex from './components/guides/TotemCodex';
import LoreArchives from './components/guides/LoreArchives';
import Totems from './components/guides/codex/Totems';
import OwlTotem from './components/guides/codex/OwlTotem';
import BearTotem from './components/guides/codex/BearTotem';
import BeaverTotem from './components/guides/codex/BeaverTotem';
import DeerTotem from './components/guides/codex/DeerTotem';
import FalconTotem from './components/guides/codex/FalconTotem';
import GooseTotem from './components/guides/codex/GooseTotem';
import OtterTotem from './components/guides/codex/OtterTotem';
import RavenTotem from './components/guides/codex/RavenTotem';
import SnakeTotem from './components/guides/codex/SnakeTotem';
import TurtleTotem from './components/guides/codex/TurtleTotem';
import WolfTotem from './components/guides/codex/WolfTotem';
import WoodpeckerTotem from './components/guides/codex/WoodpeckerTotem';
import Domains from './components/guides/codex/Domains';
import Habitats from './components/guides/codex/Habitats';
import Runes from './components/guides/codex/Runes';
import TotemGears from './components/guides/codex/TotemGears';
import AirDomain from './components/guides/codex/AirDomain';
import EarthDomain from './components/guides/codex/EarthDomain';
import WaterDomain from './components/guides/codex/WaterDomain';
import FireDomain from './components/guides/codex/FireDomain';
import SpiritDomain from './components/guides/codex/SpiritDomain';
import ShadowDomain from './components/guides/codex/ShadowDomain';
import WorldMap from './components/guides/codex/WorldMap';

const AppRoutes: React.FC = () => {
  usePageViews();

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route path="/about" element={<About/>} />
        <Route path="/plans" element={<Plans/>} />
        <Route path="/signup" element={<SignupForm/>} />
        <Route path="/terms" element={<LegalDocument doc="terms" />} />
        <Route path="/privacy" element={<LegalDocument doc="privacy" />} />
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
        <Route path="guides">
            <Route index element={
              <ProtectedRoute>
                <Guides />
              </ProtectedRoute>
            } />
            <Route path="tutorial" element={
              <Tutorial />
            } />
            <Route path="how-to" element={
              <HowToGuides />
            } />
            <Route path="codex">
              <Route index element={
                <TotemCodex />
              } />
              <Route path="totems">
                <Route index element={
                  <Totems />
                } />
                <Route path="goose" element={
                  <GooseTotem />
                } />
                <Route path="otter" element={
                  <OtterTotem />
                } />
                <Route path="wolf" element={
                  <WolfTotem />
                } />
                <Route path="falcon" element={
                  <FalconTotem />
                } />
                <Route path="beaver" element={
                  <BeaverTotem />
                } />
                <Route path="deer" element={
                  <DeerTotem />
                } />
                <Route path="woodpecker" element={
                  <WoodpeckerTotem />
                } />
                <Route path="turtle" element={
                  <TurtleTotem />
                } />
                <Route path="bear" element={
                  <BearTotem />
                } />
                <Route path="raven" element={
                  <RavenTotem />
                } />
                <Route path="snake" element={
                  <SnakeTotem />
                } />
                <Route path="owl" element={
                  <OwlTotem />
                } />
              </Route>
              <Route path="domains">
                <Route index element={
                  <Domains />
                } />
                <Route path="air" element={
                  <AirDomain/>
                } />
                <Route path="earth" element={
                  <EarthDomain/>
                } />
                <Route path="water" element={
                  <WaterDomain/>
                } />
                <Route path="fire" element={
                  <FireDomain/>
                } />
                <Route path="spirit" element={
                  <SpiritDomain/>
                } />
                <Route path="shadow" element={
                  <ShadowDomain/>
                } />
              </Route>
              
              <Route path="habitats" element={
                <Habitats />
              } />
              <Route path="gears" element={
                <TotemGears />
              } />
              <Route path="runes" element={
                <Runes />
              } />
              <Route path="map" element={
                <WorldMap />
              } />
            </Route>

            <Route path="lore" element={
              <ProtectedRoute>
                <LoreArchives />
              </ProtectedRoute>
            } />
        </Route>
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
              <ServiceWorkerDialog/>
            </AchievementsProvider>
          </GameProvider>
        </UserProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;