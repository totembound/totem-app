import React from 'react';
import { useUser } from '../../contexts/UserContext';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import GameBackground from './GameBackground';
import AchievementEffectManager from '../effects/AchievementEffectManager';
import ErrorDialog from '../ErrorDialog';

export const MainLayout: React.FC = () => {
  const { isConnected, isSignedUp, errorDialog, hideError } = useUser();

  return (
    <div className="min-h-screen flex flex-col relative">
        
        {/* Game Background */}
        <GameBackground />

        <div className="min-h-screen w-auto flex flex-col relative z-1">

            <Header />

            {isConnected && isSignedUp && <Navigation />}
        
            <main className="flex-grow w-full flex flex-col pb-16 sm:pb-0">
                <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex-grow">
                    <Outlet />
                </div>
            </main>
            <ErrorDialog
                isOpen={errorDialog.isOpen}
                title={errorDialog.title}
                onClose={hideError}
            >
                {errorDialog.message}
            </ErrorDialog>
            <AchievementEffectManager />

            <Footer />
        </div>
    </div>
  );
};