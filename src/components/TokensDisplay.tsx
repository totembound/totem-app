import { useUser } from '../contexts/UserContext';
import { Coins, CheckCircle2 } from 'lucide-react';
import Tooltip from './Tooltip';

const TokensDisplay = () => {
    const { isTokenApproved, totemBalance, polBalance } = useUser();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                {isTokenApproved && (
                    <Tooltip content="TOTEM tokens are approved for use in the game">
                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-100 dark:bg-green-900">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                    </Tooltip>
                )}
                {!isTokenApproved && (
                    <Coins className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">TOTEM:</span>
                <span className="font-bold text-gray-900 dark:text-white">{Number(totemBalance).toLocaleString()}</span>
                
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <img src="/polygon-icon.png" alt="POL" className="w-4 h-4" />
                <span className="text-sm text-gray-700 dark:text-gray-300">POL:</span>
                <span className="font-bold text-gray-900 dark:text-white">{Number(polBalance).toLocaleString()}</span>
            </div>
        </div>
    );
};

export default TokensDisplay;