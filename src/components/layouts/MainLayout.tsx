/**
 * Main Layout
 *
 * App layout wrapper with authentication.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import Header from './Header';
import Footer from './Footer';
import { Outlet, useLocation } from 'react-router-dom';
import GameBackground from './GameBackground';
import AchievementEffectManager from '../effects/AchievementEffectManager';
import ExpeditionEffectManager from '../effects/ExpeditionEffectManager';
import MessageDialog from '../MessageDialog';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';

export const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { messageDialog, hideError, tutorialWizardVisible } = useUser();
  const { pathname } = useLocation();
  // Hide secondary nav (DesktopNavigation + MobileNavigation) inside the village.
  // Header stays visible — UserMenu in the header is the catch-all for non-building
  // destinations (account settings, tutorial, logout) per the "user menu beyond the
  // 10 buildings" decision.
  const inVillage = pathname === '/keepers-village' || pathname.startsWith('/keepers-village/');
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  // Mobile scroll behavior for header/nav container
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 10;

      // Only apply scroll behavior on mobile (below sm breakpoint = 640px)
      if (window.innerWidth < 640) {
        if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
          // Scrolling down - hide header+nav container
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY || currentScrollY <= scrollThreshold) {
          // Scrolling up or near top - show header+nav container
          setIsHeaderVisible(true);
        }
      } else {
        // Always visible on desktop
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });

    // Handle resize to ensure proper visibility on screen size changes
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsHeaderVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [lastScrollY]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <GameBackground />

      {/* Header + Desktop Navigation Container - Slides on Mobile */}
      <div
        className={`header-nav-sticky-container sticky top-0 z-40 bg-gray-50 dark:bg-gray-900 relative transition-transform duration-300 ease-in-out sm:translate-y-0 ${
          !isHeaderVisible ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <Header />
        {/* Game navigation - only shown when authenticated and not in village */}
        {isAuthenticated && !inVillage && (
          <div className="hidden sm:block">
            <DesktopNavigation />
          </div>
        )}
      </div>

      <main className={`w-full ${tutorialWizardVisible ? 'pb-72' : 'pb-24'} sm:pb-0 overflow-x-hidden flex-grow relative`}>
        <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <Outlet />
        </div>
      </main>

      {/* Footer hidden in village hub — the immersive panorama owns the
          viewport. Anything in the footer that the user might need (links,
          legal) is reachable from the standalone routes outside village. */}
      {!inVillage && (
        <div className="relative">
          <Footer />
        </div>
      )}

      {/* Mobile Navigation - Fixed at Bottom. Hidden in village so the panorama
          owns the viewport on mobile too; UserMenu in the header covers
          non-building destinations (account/tutorial/logout). */}
      {isAuthenticated && !inVillage && <MobileNavigation />}

      <div className="z-50 relative">
        <MessageDialog
          isOpen={messageDialog.isOpen}
          title={messageDialog.title}
          isRateLimit={messageDialog.isRateLimit}
          isSuccess={messageDialog.isSuccess}
          showDismiss={true}
          onClose={hideError}
        >
          {messageDialog.message}
        </MessageDialog>
        <AchievementEffectManager />
        <ExpeditionEffectManager />
      </div>
    </div>
  );
};

export default MainLayout;
