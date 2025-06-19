import React from 'react';
import { useUser } from '../../contexts/UserContext';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import GameBackground from './GameBackground';
import AchievementEffectManager from '../effects/AchievementEffectManager';
import ExpeditionEffectManager from '../effects/ExpeditionEffectManager';
import MessageDialog from '../MessageDialog';

export const MainLayout: React.FC = () => {
  const { isConnected, isSignedUp, messageDialog, hideError } = useUser();

  return (
    <div className="min-h-screen flex flex-col relative">
        <GameBackground />
        
        <div className="header-nav-sticky-container sticky top-0 z-40 bg-gray-50 dark:bg-gray-900 relative">
            <Header />
            {isConnected && isSignedUp && <Navigation />}
        </div>

        <main className="w-full pb-16 sm:pb-0 overflow-x-hidden flex-grow relative">
            <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3">
                <Outlet />
            </div>
        </main>

        <div className="relative">
            <Footer />
        </div>

        <div className="z-50 relative">
            <MessageDialog
                isOpen={messageDialog.isOpen}
                title={messageDialog.title}
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