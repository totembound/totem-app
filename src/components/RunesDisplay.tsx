import React from 'react';
import { Diamond } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

interface RuneIconProps {
  type: 'lesser' | 'greater' | 'ancient';
}

export const RuneIcon: React.FC<RuneIconProps> = ({ type }) => {
    switch (type) {
      case 'lesser':
        return <div className="w-6 h-6 bg-blue-200 dark:bg-blue-700/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/lesser-rune.png"
                    alt="Lesser Rune"
                    className={`w-full h-full object-contain`}/>
                </div>;
      case 'greater':
        return <div className="w-6 h-6 p-0.5 bg-orange-200 dark:bg-orange-700/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/greater-rune.png"
                    alt="Greater Rune"
                    className={`w-full h-full object-contain`}/>
                </div>;
      case 'ancient':
        return <div className="w-6 h-6 p-0.5 bg-purple-200 dark:bg-purple-700/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/ancient-rune.png"
                    alt="Ancient Rune"
                    className={`w-full h-full object-contain`}/>
                </div>;
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