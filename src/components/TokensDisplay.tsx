import { useUser } from '../contexts/UserContext';
import { Sparkles, Gem } from 'lucide-react';
import { CURRENCY_NAMES } from '../config/constants';

const TokensDisplay = () => {
    const { essenceBalance, gemsBalance } = useUser();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{CURRENCY_NAMES.SOFT}:</span>
                <span className="font-bold text-gray-900 dark:text-white min-w-[3ch] tabular-nums">{Number(essenceBalance).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <Gem className="w-4 h-4 text-purple-500 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{CURRENCY_NAMES.PREMIUM}:</span>
                <span className="font-bold text-gray-900 dark:text-white min-w-[3ch] tabular-nums">{Number(gemsBalance).toLocaleString()}</span>
            </div>
        </div>
    );
};

export default TokensDisplay;