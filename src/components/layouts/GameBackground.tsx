import React from 'react';

const GameBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-gray-50 dark:bg-gray-900
      text-gray-900 dark:text-gray-100">

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/totembound.png)'
        }}
      />

      {/* Dimming overlay */}
      <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />

      {/* Background gradient for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/10 to-gray-50/20 
          dark:via-gray-900/10 dark:to-gray-900/20" />

    </div>
  );
};

export default GameBackground;