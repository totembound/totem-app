import React from 'react';
import { UserProvider, useUser } from './contexts/UserContext';
import { SignupForm } from './components/SignupForm';
import { GameControls } from './components/GameControls';
import TotemGallery from './components/TotemGallery';
import Footer from './components/Footer';

const AppContent: React.FC = (children) => {
    const { address, isSignedUp, isConnected } = useUser();
    
    console.log('App Rendering - Detailed State:', { 
        isConnected, 
        address, 
        isSignedUp,
        addressLength: address?.length,
        addressTrimmed: address ? address.slice(0, 6) : 'No Address'
    });

    // show signup form for new user
    if (!isConnected || !isSignedUp) {
        return (
          <div className="flex flex-col p-4 sm:p-6 md:p-8">
            <div className="relative p-2 py-3 sm:max-w-xl sm:mx-auto">
              <SignupForm />
            </div>
          </div>
        );
    }

    // Signed up - show main app views
    return (
        <div className="flex flex-col p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-6xl mx-auto items-start">
                <SignupForm />
                <GameControls />
                <TotemGallery />
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <UserProvider>
    <div className="relative min-h-screen">
      <div className="bg"></div>
      <div className="absolute inset-0 bg-slate-900/20"></div>
      <div className="relative z-10">
        <div className="min-h-screen bg-gray-100/20 flex flex-col sm:py-12">
          <div className="relative p-2 py-3 mx-auto w-full max-w-7xl">
            <AppContent />
            <Footer />
          </div>
        </div>
      </div>
    </div>
    </UserProvider>
  );
}

export default App;