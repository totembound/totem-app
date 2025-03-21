import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { User, LogOut, Settings, ChevronDown, Coins, Shield } from 'lucide-react';
import UserSettingsDialog from '../UserSettingsDialog';
import { AccountType } from '../../types/types';
import { Link } from 'react-router-dom';

export const UserMenu: React.FC = () => {
  const { address, disconnect, isSignedUp, totemBalance, polBalance, accountType } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef(null);

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

  const rect = (buttonRef?.current || { getBoundingClientRect:()=>{return{right:320};}}).getBoundingClientRect();
  let left = rect.right - 256;
  if (window.innerWidth < 420) {
      left = 28;
  }

  // Get account type badge color
  const getAccountTypeColor = () => {
    switch (accountType) {
      case 'Premium':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';    
      case 'Web3':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';    
      default: // Free
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  }

  const getAccountTypeName = (accountType: string) => {
    switch (accountType) {
      case 'Premium':
        return 'Mystic';
      case 'Web3':
        return 'Elder';
      default: // Free
        return 'Seeker';
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
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
        <div className="fixed right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64 
            bg-white dark:bg-gray-800 rounded-lg shadow-lg 
            border border-gray-200 dark:border-gray-700 
            py-2 z-50" style={{ top: '3rem', left: left + 'px' }}>
            {isSignedUp && (
            <>
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {getAccountTypeName(accountType)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getAccountTypeColor()}`}>
                      {accountType} Tier
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
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
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 
                      text-gray-700 dark:text-gray-300
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 
                      transition-colors"
                >
                  <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Settings</span>
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                <Link
                  to="/accounts/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 
                      text-gray-700 dark:text-gray-300
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 
                      transition-colors"
                >
                  <Settings size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-sm">Account Settings</span>
                </Link>
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
      {/* Settings Dialog */}
      <UserSettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};