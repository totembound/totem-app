import React, { useState } from 'react';
import { Shield, AlertCircle, X } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { CURRENCY_NAMES } from '../config/constants';

interface ProtectionDialogProps {
  type: 'daily' | 'weekly';
  children: React.ReactNode;
}

interface ProtectionTier {
  cost: number;
  duration: number;
  requiredStreak: number;
}

const ProtectionDialog: React.FC<ProtectionDialogProps> = ({ type, children }) => {
  const { rewardsState, purchaseProtection } = useGame();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dailyTiers: ProtectionTier[] = [
    { cost: 50, duration: 1, requiredStreak: 7 },
    { cost: 250, duration: 7, requiredStreak: 14 }
  ];

  const weeklyTiers: ProtectionTier[] = [
    { cost: 500, duration: 14, requiredStreak: 28 }
  ];

  const tiers = type === 'daily' ? dailyTiers : weeklyTiers;
  const streakStatus = rewardsState.streakStatus;

  const handlePurchase = async (tier: number) => {
    if (!purchaseProtection) return;
    setIsProcessing(true);
    try {
      const success = await purchaseProtection(type, tier);
      if (success) {
        setIsOpen(false);
      }
    }
    finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
    );
  }

  return (<>
      {children}
    
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Purchase Streak Protection
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Choose a protection tier to safeguard your {type} streak
              </p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4">
            {tiers.map((tier, index) => {
              const isEligible = streakStatus?.streakDays || 0 >= tier.requiredStreak;
              const isSelected = selectedTier === index;

              return (
                <div 
                  key={index}
                  onClick={() => {
                    if (isEligible) setSelectedTier(index);
                  }}
                  className={`p-4 border rounded-lg transition-all ${
                    isEligible
                      ? 'hover:border-purple-500 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  } ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Shield className={`w-5 h-5 ${
                        isSelected ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {type === 'daily' ? `Tier ${index + 1}` : 'Weekly'} Protection
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tier.cost} {CURRENCY_NAMES.SOFT}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Protects your streak for {tier.duration} day{tier.duration > 1 ? 's' : ''}
                  </div>

                  {!isEligible && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>Requires {tier.requiredStreak}-day streak</span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePurchase(selectedTier || 0)}
                disabled={selectedTier === null || isProcessing}
                className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Purchase Protection'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProtectionDialog;