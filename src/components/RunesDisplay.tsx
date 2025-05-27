import React from 'react';
import { Diamond, Hexagon, Pentagon } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

interface RuneIconProps {
  type: 'lesser' | 'greater' | 'ancient';
}

export const RuneIcon: React.FC<RuneIconProps> = ({ type }) => {
    switch (type) {
      case 'lesser':
        return <Diamond className="w-4 h-4 text-blue-500 fill-blue-500" />;
      case 'greater':
        return <Pentagon className="w-4 h-4 text-orange-500 fill-orange-500" />;
      case 'ancient':
        return <Hexagon className="w-4 h-4 text-purple-500 fill-purple-500" />;
      default:
        return <Diamond className="w-4 h-4 text-gray-500 fill-gray-500" />;
    }
};  

const RunesDisplay: React.FC = () => {
    const { runeBalances } = useGame();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <RuneIcon type="lesser"/>
                <span className="text-sm text-gray-700 dark:text-gray-300">Lesser:</span>
                <span className="font-bold text-gray-900 dark:text-white">{runeBalances.lesser}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <RuneIcon type="greater"/>
                <span className="text-sm text-gray-700 dark:text-gray-300">Greater:</span>
                <span className="font-bold text-gray-900 dark:text-white">{runeBalances.greater}</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                <RuneIcon type="ancient"/>
                <span className="text-sm text-gray-700 dark:text-gray-300">Ancient:</span>
                <span className="font-bold text-gray-900 dark:text-white">{runeBalances.ancient}</span>
            </div>
        </div>
    );
};

export default RunesDisplay;