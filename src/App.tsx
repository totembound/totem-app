import React from 'react';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { AchievementsProvider } from './contexts/AchievementsContext';
import TotemGallery from './components/pages/TotemGallery';
import ShopInterface from './components/pages/ShopInterface';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ThemeProvider } from './contexts/ThemeContext';
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import VerifyEmail from './components/pages/VerifyEmail';
import Rewards from './components/pages/Rewards';
import Challenges from './components/pages/Challenges';
import Expeditions from './components/pages/Expeditions';
import Achievements from './components/pages/Achievements';
import AccountSettings from './components/pages/AccountSettings';
import LegalDocument from './components/LegalDocument';
import About from './components/pages/About';
import PublicPlayerProfile from './components/pages/PublicPlayerProfile';
import Plans from './components/pages/Plans';
import Roadmap from './components/pages/Roadmap';
import ForgotPassword from './components/pages/ForgotPassword';
import OAuthCallback from './components/pages/OAuthCallback';
// SignupForm removed, using email/password Signup only
import { usePageViews } from './hooks/usePageViews';
import { useIoTCommands } from './hooks/useIoTCommands';
import { useUser } from './contexts/UserContext';
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
import Traits from './components/guides/codex/Traits';
import TotemGear from './components/guides/codex/TotemGear';
import AirDomain from './components/guides/codex/AirDomain';
import EarthDomain from './components/guides/codex/EarthDomain';
import WaterDomain from './components/guides/codex/WaterDomain';
import FireDomain from './components/guides/codex/FireDomain';
import SpiritDomain from './components/guides/codex/SpiritDomain';
import ShadowDomain from './components/guides/codex/ShadowDomain';
import WorldMap from './components/guides/codex/WorldMap';
import TutorialWizard from './components/guides/TutorialWizard';
import DailyQuestWizard from './components/quests/DailyQuestWizard';
import DailyQuestsCelebration from './components/quests/DailyQuestsCelebration';
import { TutorialClaimsProvider } from './components/guides/useTutorialClaims';
import TotemForge from './components/forge/TotemForge';
import ElderSanctum from './components/sanctum/ElderSanctum';
import KeepersVillage from './components/village/KeepersVillage';
import VillageModalShell from './components/village/VillageModalShell';

// Email/password auth only - wallet auth removed
const AppRoutes: React.FC = () => {
  usePageViews();
  const { updateBalances, fetchTotems } = useUser();
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  useIoTCommands({
    onBalanceUpdate: () => { updateBalances(); },
    onSync: () => { updateBalances(); fetchTotems(); },
    // Admin-triggered force logout (per-user or global). The toast is shown
    // by the hook itself; this callback performs the actual session clear
    // and redirect. Short delay so the user sees the reason before redirect.
    onForceLogout: () => {
      if (!isAuthenticated) return;
      setTimeout(() => {
        logout().finally(() => navigate('/login', { replace: true }));
      }, 1500);
    },
  });

  const Layout = MainLayout;
  const Protected = ProtectedRoute;

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route path="/about" element={<About/>} />
        <Route path="/plans" element={<Plans/>} />
        <Route path="/roadmap" element={<Roadmap/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/verify-email" element={<VerifyEmail/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        <Route path="/auth/callback" element={<OAuthCallback/>} />
        <Route path="/terms" element={<LegalDocument doc="terms" />} />
        <Route path="/privacy" element={<LegalDocument doc="privacy" />} />
        <Route index element={<Home />} />
        <Route path="/keepers-village" element={
          // Village hub assumes a signed-in player (badges, balances, claim
          // flows). Anonymous users hitting /keepers-village or any modal
          // route under it get redirected to login. Standalone routes
          // (/guides, /shop, etc.) keep their own access rules unchanged.
          <Protected>
            <KeepersVillage />
          </Protected>
        }>
          {/* Modal-over-village routes — each leaf is wrapped in VillageModalShell
              with its atmosphere preset + accessible label. Standalone routes
              (e.g. /guides, /shop, /forge) remain unchanged below for direct
              deep-link entry (bookmarks, marketing emails, post-Stripe redirects). */}
          {/* Library — full guides subtree mirrored under village. SidebarContent
              + Sidebar use withVillagePrefix() to rewrite NavItems' absolute
              /guides/codex/* paths into /keepers-village/guides/codex/* when
              the user is in this trunk, so internal nav stays inside the modal. */}
          <Route path="guides" element={<VillageModalShell atmosphere="soft" modalTitle="Library" />}>
            <Route index element={<Guides />} />
            <Route path="tutorial" element={<Tutorial />} />
            <Route path="how-to" element={<HowToGuides />} />
            <Route path="codex">
              <Route index element={<TotemCodex />} />
              <Route path="totems">
                <Route index element={<Totems />} />
                <Route path="goose" element={<GooseTotem />} />
                <Route path="otter" element={<OtterTotem />} />
                <Route path="wolf" element={<WolfTotem />} />
                <Route path="falcon" element={<FalconTotem />} />
                <Route path="beaver" element={<BeaverTotem />} />
                <Route path="deer" element={<DeerTotem />} />
                <Route path="woodpecker" element={<WoodpeckerTotem />} />
                <Route path="turtle" element={<TurtleTotem />} />
                <Route path="bear" element={<BearTotem />} />
                <Route path="raven" element={<RavenTotem />} />
                <Route path="snake" element={<SnakeTotem />} />
                <Route path="owl" element={<OwlTotem />} />
              </Route>
              <Route path="domains">
                <Route index element={<Domains />} />
                <Route path="air" element={<AirDomain />} />
                <Route path="earth" element={<EarthDomain />} />
                <Route path="water" element={<WaterDomain />} />
                <Route path="fire" element={<FireDomain />} />
                <Route path="spirit" element={<SpiritDomain />} />
                <Route path="shadow" element={<ShadowDomain />} />
              </Route>
              <Route path="habitats" element={<Habitats />} />
              <Route path="gear" element={<TotemGear />} />
              <Route path="runes" element={<Runes />} />
              <Route path="traits" element={<Traits />} />
              <Route path="map" element={<WorldMap />} />
            </Route>
            <Route path="lore" element={<LoreArchives />} />
          </Route>
          <Route path="achievements" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Hall of Legends">
                <Achievements />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="rewards" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Shrine">
                <Rewards />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="shop" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Bazaar">
                <ShopInterface />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="totems" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Sanctuary">
                <TotemGallery />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="profile" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Hearthstone">
                <AccountSettings />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="forge" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Totem Forge">
                <TotemForge />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="sanctum" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Elder Tower">
                <ElderSanctum />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="challenges" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Arena">
                <Challenges />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="expeditions" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Trailhead">
                <Expeditions />
              </VillageModalShell>
            </Protected>
          } />
          <Route path="players/:userId" element={
            <Protected>
              <VillageModalShell atmosphere="soft" modalTitle="Player Profile" maxWidth="3xl">
                <PublicPlayerProfile />
              </VillageModalShell>
            </Protected>
          } />

          {/* Marketing + legal — mirrored from standalone routes so UserMenu's
              footer-row links open as modals when the user is in village. The
              standalone /about, /roadmap, /terms, /privacy still serve as the
              canonical URLs for sharing. */}
          <Route path="about" element={
            <VillageModalShell atmosphere="soft" modalTitle="About TotemBound">
              <About />
            </VillageModalShell>
          } />
          <Route path="roadmap" element={
            <VillageModalShell atmosphere="soft" modalTitle="Roadmap">
              <Roadmap />
            </VillageModalShell>
          } />
          <Route path="terms" element={
            <VillageModalShell atmosphere="soft" modalTitle="Terms of Service">
              <LegalDocument doc="terms" />
            </VillageModalShell>
          } />
          <Route path="privacy" element={
            <VillageModalShell atmosphere="soft" modalTitle="Privacy Policy">
              <LegalDocument doc="privacy" />
            </VillageModalShell>
          } />
          <Route path="plans" element={
            <VillageModalShell atmosphere="soft" modalTitle="Plans">
              <Plans />
            </VillageModalShell>
          } />
        </Route>

        {/* Protected routes */}
        <Route path="players/:userId" element={
          <Protected>
            <PublicPlayerProfile />
          </Protected>
        } />
        <Route path="account">
          <Route index element={<Navigate to="/account/settings" replace />} />
          <Route path="settings" element={
            <Protected>
              <AccountSettings />
            </Protected>
          } />
        </Route>
        <Route path="totems" element={
          <Protected>
            <TotemGallery />
          </Protected>
        } />
        <Route path="challenges" element={
          <Protected>
            <Challenges />
          </Protected>
        } />
        <Route path="expeditions" element={
          <Protected>
            <Expeditions />
          </Protected>
        } />
        <Route path="guides">
            <Route index element={
              <Guides />
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
              <Route path="gear" element={
                <TotemGear />
              } />
              <Route path="runes" element={
                <Runes />
              } />
              <Route path="traits" element={
                <Traits />
              } />
              <Route path="map" element={
                <WorldMap />
              } />
            </Route>

            <Route path="lore" element={
                <LoreArchives />
            } />
        </Route>
        <Route path="achievements" element={
          <Protected>
            <Achievements />
          </Protected>
        } />
        <Route path="rewards" element={
          <Protected>
            <Rewards />
          </Protected>
        } />
        <Route path="shop" element={
          <Protected>
            <ShopInterface />
          </Protected>
        } />
        <Route path="forge" element={
          <Protected>
            <TotemForge />
          </Protected>
        } />
        <Route path="sanctum" element={
          <Protected>
            <ElderSanctum />
          </Protected>
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
        <AuthProvider>
          <UserProvider>
            <GameProvider>
              <AchievementsProvider>
                <TutorialClaimsProvider>
                  <AppRoutes />
                  <ServiceWorkerDialog/>
                  <TutorialWizard/>
                  <DailyQuestWizard/>
                  <DailyQuestsCelebration/>
                </TutorialClaimsProvider>
              </AchievementsProvider>
            </GameProvider>
          </UserProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;