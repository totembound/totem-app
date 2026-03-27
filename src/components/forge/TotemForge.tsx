import React, { useState } from 'react';
import { Flame, Hammer, Lock } from 'lucide-react';
import FusionWorkshop from './FusionWorkshop';

const TotemForge: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'landing' | 'fusion'>('landing');

  if (activeSection === 'fusion') {
    return (
      <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
        <FusionWorkshop onBack={() => setActiveSection('landing')} />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
          <Hammer className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          The Forge
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Combine and craft to unlock powerful totems and items
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Totem Fusion Card */}
        <button
          onClick={() => setActiveSection('fusion')}
          className="group p-6 rounded-xl border-2 border-orange-200 dark:border-orange-800
            bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30
            hover:border-orange-400 dark:hover:border-orange-600 hover:shadow-lg
            transition-all text-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center
              group-hover:bg-orange-300 dark:group-hover:bg-orange-700/50 transition-colors">
              <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Totem Fusion
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Combine 3 totems of the same rarity to forge a new totem of the next rarity tier.
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
            Enter Forge
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </div>
        </button>

        {/* Gear Crafting Card (Coming Soon) */}
        <div
          className="p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700
            bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30
            opacity-60 cursor-not-allowed"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Hammer className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
              Gear Crafting
            </h2>
            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
            Craft equippable gear for your totems. Coming soon!
          </p>
          <div className="mt-4 text-sm font-medium text-gray-400 dark:text-gray-500">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotemForge;
