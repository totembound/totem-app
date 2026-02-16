import { ShoppingBag, HandCoins } from 'lucide-react';

interface MarketToggleProps {
  mode: 'browse' | 'sell';
  onModeChange: (mode: 'browse' | 'sell') => void;
}

const MarketToggle: React.FC<MarketToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <button
        onClick={() => onModeChange('browse')}
        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all min-h-[44px] ${
          mode === 'browse'
            ? 'border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className={`p-2 rounded-lg ${
          mode === 'browse'
            ? 'bg-purple-100 dark:bg-purple-800/40'
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <ShoppingBag className={`w-5 h-5 ${
            mode === 'browse'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-400'
          }`} />
        </div>
        <div className="text-left">
          <div className={`font-semibold text-sm ${
            mode === 'browse'
              ? 'text-purple-700 dark:text-purple-300'
              : 'text-gray-700 dark:text-gray-300'
          }`}>Browse Market</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Buy pre-owned totems</div>
        </div>
      </button>
      <button
        onClick={() => onModeChange('sell')}
        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all min-h-[44px] ${
          mode === 'sell'
            ? 'border-purple-500 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-sm'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <div className={`p-2 rounded-lg ${
          mode === 'sell'
            ? 'bg-purple-100 dark:bg-purple-800/40'
            : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          <HandCoins className={`w-5 h-5 ${
            mode === 'sell'
              ? 'text-purple-600 dark:text-purple-400'
              : 'text-gray-500 dark:text-gray-400'
          }`} />
        </div>
        <div className="text-left">
          <div className={`font-semibold text-sm ${
            mode === 'sell'
              ? 'text-purple-700 dark:text-purple-300'
              : 'text-gray-700 dark:text-gray-300'
          }`}>Sell Your Totems</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Trade for Essence</div>
        </div>
      </button>
    </div>
  );
};

export default MarketToggle;
