import React, { useEffect, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import GameBackground from './GameBackground';
import AchievementEffectManager from '../effects/AchievementEffectManager';
import ExpeditionEffectManager from '../effects/ExpeditionEffectManager';
import MessageDialog from '../MessageDialog';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';

export const MainLayout: React.FC = () => {
  const { isConnected, isSignedUp, messageDialog, hideError } = useUser();
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
        <div className={`header-nav-sticky-container sticky top-0 z-40 bg-gray-50 dark:bg-gray-900 relative transition-transform duration-300 ease-in-out sm:translate-y-0 ${
          !isHeaderVisible ? '-translate-y-full' : 'translate-y-0'
        }`}>
            <Header />
            {isConnected && isSignedUp && <DesktopNavigation />}
        </div>

        <main className="w-full pb-16 sm:pb-0 overflow-x-hidden flex-grow relative">
            <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3">
                <Outlet />
            </div>
        </main>

        <div className="relative">
            <Footer />
        </div>

        {/* Mobile Navigation - Fixed at Bottom */}
        {isConnected && isSignedUp && <MobileNavigation />}

        <div className="z-50 relative">
            <MessageDialog
                isOpen={messageDialog.isOpen}
                title={messageDialog.title}
                isRateLimit={messageDialog.isRateLimit}
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