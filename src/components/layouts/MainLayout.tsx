import React from 'react';
import { useUser } from '../../contexts/UserContext';
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import GameBackground from './GameBackground';

export const MainLayout: React.FC = () => {
  const { isConnected, isSignedUp } = useUser();

  return (
    <div className="min-h-screen flex flex-col relative">
        
        {/* Game Background */}
        <GameBackground />

        <div className="min-h-screen flex flex-col relative z-10">

            <Header />
        
            {isConnected && isSignedUp && <Navigation />}
        
            <main className="flex-grow w-full flex flex-col">
                <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 py-2 sm:py-3 flex-grow">
                    <Outlet />
                </div>
            </main>

            <div className="bg-gray-900/95 backdrop-blur-[1px]">
                <Footer />
            </div>
        </div>
    </div>
  );
};