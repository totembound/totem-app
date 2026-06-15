import React, { useEffect } from 'react';
import { Sparkles, Map, Star, Award, X } from 'lucide-react';
import { RuneIcon } from '../RunesDisplay';

interface ExpeditionRewardsEffectProps {
  expeditionName: string;
  experienceGained: number;
  essenceGained: number;
  runesGained: {
    lesser: number;
    greater: number;
    ancient: number;
  };
  score: number;
  onComplete: () => void;
}

const ExpeditionRewardsEffect: React.FC<ExpeditionRewardsEffectProps> = ({
  expeditionName,
  experienceGained,
  essenceGained,
  runesGained,
  score,
  onComplete
}) => {
  // Determine success level based on score
  const isGreatSuccess = score >= 90;
  const isSuccess = score >= 70;
  const statusText = isGreatSuccess ? 'Great Success!' : isSuccess ? 'Success!' : 'Completed';
  const statusColor = isGreatSuccess ? 'text-green-500' : isSuccess ? 'text-blue-500' : 'text-yellow-500';
  
  // Animation effect on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      const elements = document.querySelectorAll('.sparkle');
      elements.forEach(el => {
        el.classList.add('animate-ping');
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  const totalRunes = runesGained.lesser + runesGained.greater + runesGained.ancient;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center">
      <div className="relative w-full max-w-lg transform transition-all bg-gradient-to-br from-blue-300/40 to-purple-300/40 dark:from-blue-700/40 dark:to-purple-700/40 rounded-xl border-2 border-blue-400 dark:border-blue-600 p-1 animate-fade-in scale-100 mx-4">
        <div className="absolute -inset-1">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 animate-pulse"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onComplete}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
        >
          <X size={24} />
        </button>

        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6">
          {/* Sparkles */}
          <div className="absolute -top-2 -left-2 sparkle">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -top-2 -right-2 sparkle">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -left-2 sparkle">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 sparkle">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Map className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Expedition Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Your team has returned from {expeditionName}
            </p>
            <div className={`text-xl font-bold mt-2 ${statusColor}`}>
              {statusText}
            </div>
          </div>

          {/* Rewards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <Award className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Experience / Totem</h3>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                +{experienceGained} XP
              </p>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <Sparkles className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Essence / Team</h3>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                +{essenceGained}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 col-span-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-2">Runes Gained</h3>
              
              {totalRunes > 0 ? (
                <div className="flex flex-col space-y-2">
                  {runesGained.lesser > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <RuneIcon type="lesser" />
                        <span className="text-sm ml-1 text-gray-700 dark:text-gray-300">Lesser</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">+{runesGained.lesser}</span>
                    </div>
                  )}
                  
                  {runesGained.greater > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <RuneIcon type="greater" />
                        <span className="text-sm ml-1 text-gray-700 dark:text-gray-300">Greater</span>
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">+{runesGained.greater}</span>
                    </div>
                  )}
                  
                  {runesGained.ancient > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <RuneIcon type="ancient" />
                        <span className="text-sm ml-1 text-gray-700 dark:text-gray-300">Ancient</span>
                      </div>
                      <span className="font-bold text-purple-600 dark:text-purple-400">+{runesGained.ancient}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 font-medium">
                  No runes found
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onComplete}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpeditionRewardsEffect;