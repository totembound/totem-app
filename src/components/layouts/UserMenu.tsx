import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { User, LogOut, Settings, ChevronDown, Coins } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { address, disconnect, isSignedUp, totemBalance, polBalance } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg
          border transition-all duration-200
          bg-white hover:bg-gray-50 
          dark:bg-gray-800 dark:hover:bg-gray-700
          border-gray-200 dark:border-gray-700
          text-gray-700 dark:text-gray-300"
      >
        <User size={18} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium hidden sm:block">{shortenedAddress}</span>
        <span className="font-medium sm:hidden">{address.slice(0, 4)}...</span>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 
            bg-white dark:bg-gray-800 rounded-lg shadow-lg 
            border border-gray-200 dark:border-gray-700 
            py-2 z-500">
            {isSignedUp && (
            <>
                <div className="px-4 py-3 space-y-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Balances
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Coins size={16} className="text-yellow-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">TOTEM</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {Number(totemBalance).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/polygon-icon.png" alt="POL" className="w-4 h-4" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">POL</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {Number(polBalance).toLocaleString()}
                    </span>
                </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                <button
                className="w-full px-4 py-2 text-left flex items-center gap-2 
                    text-gray-700 dark:text-gray-300
                    hover:bg-gray-50 dark:hover:bg-gray-700/50 
                    transition-colors"
                >
                <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm">Settings</span>
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            </>
            )}
            <button
            onClick={disconnect}
            className="w-full px-4 py-2 text-left flex items-center gap-2 
                text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/20 
                transition-colors"
            >
            <LogOut size={16} />
            <span className="text-sm">Disconnect</span>
            </button>
        </div>
      )}
    </div>
  );
};