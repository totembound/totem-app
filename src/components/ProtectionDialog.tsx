import React, { useState } from 'react';
import { Shield, AlertCircle, X, Minus, Plus } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useUser } from '../contexts/UserContext';
import { CURRENCY_NAMES, STREAK_PROTECTION, streakProtectionCost } from '../config/constants';

interface ProtectionDialogProps {
  type: 'daily' | 'weekly';
  children: React.ReactNode;
}

const ProtectionDialog: React.FC<ProtectionDialogProps> = ({ type, children }) => {
  const { rewardsState, purchaseProtection } = useGame();
  const { essenceBalance } = useUser();
  const essenceNum = Number(essenceBalance) || 0;
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cfg = STREAK_PROTECTION[type];
  const unit = type === 'daily' ? 'day' : 'week';

  const currentCharges = type === 'daily'
    ? (rewardsState.streakStatus?.protectionCharges ?? 0)
    : (rewardsState.weeklyStatus?.protectionCharges ?? 0);
  const currentStreak = type === 'daily'
    ? (rewardsState.streakStatus?.streakDays ?? 0)
    : (rewardsState.weeklyStatus?.weeklyStreak ?? 0);

  const headroom = Math.max(0, cfg.maxCharges - currentCharges);
  const meetsStreak = currentStreak >= cfg.requiredStreak;

  // Default to filling all the way to the cap.
  const [quantity, setQuantity] = useState(headroom > 0 ? headroom : 1);
  const clampedQty = Math.min(Math.max(1, quantity), Math.max(1, headroom));
  const cost = streakProtectionCost(type, clampedQty);
  const canAfford = essenceNum >= cost;
  const canPurchase = meetsStreak && canAfford && headroom > 0 && !isProcessing;

  // Per-charge price for the line where no bulk discount applies.
  const fullPrice = clampedQty * cfg.costPerCharge;
  const hasBulkDiscount = cost < fullPrice;

  const closeDialog = () => {
    setIsOpen(false);
    setErrorMessage(null);
  };

  const openDialog = () => {
    // Reset the picker to "fill to max" each time it opens.
    setQuantity(headroom > 0 ? headroom : 1);
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handlePurchase = async () => {
    if (!purchaseProtection || !canPurchase) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const success = await purchaseProtection(type, clampedQty);
      if (success) {
        closeDialog();
      }
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to purchase protection';
      setErrorMessage(message);
    }
    finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) {
    return (
      <div onClick={openDialog}>
        {children}
      </div>
    );
  }

  return (<>
      {children}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentCharges > 0 ? 'Refill Streak Saver' : 'Buy Streak Saver'}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Charges are spent only when you miss a {unit} — top up to your {type} cap.
              </p>
            </div>
            <button
              onClick={closeDialog}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6 space-y-4">
            {/* Current charges */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Charges banked</span>
              </div>
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                {currentCharges} / {cfg.maxCharges}
              </span>
            </div>

            {!meetsStreak ? (
              <div className="flex items-center gap-2 p-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Requires a {cfg.requiredStreak}-{unit} streak (current: {currentStreak}).</span>
              </div>
            ) : headroom === 0 ? (
              <div className="flex items-center gap-2 p-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span>You're full ({cfg.maxCharges}/{cfg.maxCharges}). Use a charge before buying more.</span>
              </div>
            ) : (
              <>
                {/* Quantity stepper */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Charges to add</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={clampedQty <= 1}
                      aria-label="Decrease"
                      className="p-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">{clampedQty}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(headroom, q + 1))}
                      disabled={clampedQty >= headroom}
                      aria-label="Increase"
                      className="p-1.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setQuantity(headroom)}
                      disabled={clampedQty >= headroom}
                      className="text-sm font-medium text-purple-600 dark:text-purple-400 disabled:opacity-40"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Cost */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cost</span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {cost} {CURRENCY_NAMES.SOFT}
                    </span>
                    {hasBulkDiscount && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        bulk — save {fullPrice - cost}
                      </span>
                    )}
                  </div>
                </div>

                {meetsStreak && !canAfford && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Not enough {CURRENCY_NAMES.SOFT} (need {cost - essenceNum} more)</span>
                  </div>
                )}
              </>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handlePurchase}
                disabled={!canPurchase}
                className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? 'Processing...'
                  : headroom === 0
                    ? 'Full'
                    : `Buy ${clampedQty} charge${clampedQty === 1 ? '' : 's'} — ${cost} ${CURRENCY_NAMES.SOFT}`}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProtectionDialog;
