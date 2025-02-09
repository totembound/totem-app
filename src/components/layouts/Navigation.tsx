import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Trophy, Gamepad2, Swords, Map, Gift, PawPrint, Compass } from 'lucide-react';

const Navigation: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/totems', label: 'Totems', icon: PawPrint },
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/expeditions', label: 'Expeditions', icon: Compass },
    { to: '/achievements', label: 'Achievements', icon: Trophy },
    { to: '/rewards', label: 'Rewards', icon: Gift },
    { to: '/shop', label: 'Shop', icon: ShoppingBag },
  ];

  return (
    <nav className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4">
        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-1 md:gap-2 h-12">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 md:px-3 py-1 rounded-md transition-colors
                ${isActive 
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/50' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50'
                }`
              }
            >
              <Icon size={18} />
              <span className="text-sm font-medium text-nowrap">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Mobile Navigation */}
        <div className="flex sm:hidden justify-center items-center h-12 gap-1">
          {navItems.map(({ to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `p-2 rounded-md transition-colors
                ${isActive 
                  ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/50' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50'
                }`
              }
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;