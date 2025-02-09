import React, { useEffect, useState } from 'react';
import { Sparkles, Crown, Star } from 'lucide-react';

const AchievementEffect = ({ 
  stage,
  onComplete
}: { 
  stage: number;
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
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background overlay with blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Main content container */}
      <div className="relative bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/50 rounded-xl border-2 border-purple-300 dark:border-purple-700 p-8 max-w-sm mx-4 transform transition-all">
        {/* Animated glow effect */}
        <div className="absolute -inset-1">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 animate-pulse" />
        </div>

        {/* Content */}
        <div className="relative text-center space-y-4">
          {/* Crown icon */}
          <div className="flex justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500 animate-bounce" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            Evolution Complete!
          </h2>

          {/* Stage indicator */}
          <p className="text-lg text-purple-700 dark:text-purple-200">
            Advanced to Stage {stage + 1}
          </p>

          {/* Decorative elements */}
          {showSparkles && (
            <>
              {/* Corner sparkles */}
              <div className="absolute -top-2 -left-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-ping" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Star className="w-6 h-6 text-yellow-400 animate-ping" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Star className="w-6 h-6 text-yellow-400 animate-ping" />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-ping" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementEffect;