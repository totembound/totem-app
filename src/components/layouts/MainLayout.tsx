import React from 'react';
import { useUser } from '../../contexts/UserContext';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import GameBackground from './GameBackground';
import AchievementEffectManager from '../effects/AchievementEffectManager';
import MessageDialog from '../MessageDialog';

export const MainLayout: React.FC = () => {
  const { isConnected, isSignedUp, messageDialog, hideError } = useUser();

  return (
    <div className="min-h-screen flex flex-col relative">
        <GameBackground />
        <div className="min-h-screen w-auto flex flex-col relative z-1">
            <Header />
            {isConnected && isSignedUp && <Navigation />}
            <main className="flex-grow w-full flex flex-col pb-16 sm:pb-0">
                <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex-grow">
                    <Outlet />
                </div>
            </main>
            <MessageDialog
                isOpen={messageDialog.isOpen}
                title={messageDialog.title}
                showDismiss={true}
                onClose={hideError}
            >
                {messageDialog.message}
            </MessageDialog>
            <AchievementEffectManager />
            <Footer />
        </div>
    </div>
  );
};