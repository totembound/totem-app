import React, { useEffect, useState } from 'react';
import { Sparkles, Star, Trophy } from 'lucide-react';

const AchievementEffect = ({ 
  title,
  description,
  badgeUri,
  onComplete
}: { 
  title: string;
  description: string;
  badgeUri: string;
  onComplete: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    // Trigger sparkles after initial render
    const sparkleTimeout = setTimeout(() => {
      setShowSparkles(true);
    }, 100);

    // Hide the celebration after animation
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(sparkleTimeout);
      clearTimeout(hideTimeout);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background overlay with blur */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Main content container */}
      <div className="relative w-[calc(100%-2rem)] max-w-sm bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/50 rounded-xl border-2 border-purple-300 dark:border-purple-700 p-4 sm:p-8 mx-auto transform transition-all">
        {/* Animated glow effect */}
        <div className="absolute -inset-1">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative text-center space-y-3 sm:space-y-4">
          {/* Trophy icon */}
          <div className="flex justify-center mb-2 sm:mb-4">
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-500 animate-bounce" />
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
            {title}
          </h2>

          {/* Decorative elements */}
          {showSparkles && (
            <>
              {/* Corner sparkles */}
              <div className="absolute -top-2 -left-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-ping" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-ping" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-ping" />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-ping" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementEffect;