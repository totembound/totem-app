import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home, ShoppingBag, Trophy, Swords, Gift, PawPrint,
  Map, BookOpenText, Hammer
} from 'lucide-react';

const DesktopNavigation: React.FC = () => {
  const mainNavItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/totems', label: 'Totems', icon: PawPrint },
    { to: '/rewards', label: 'Rewards', icon: Gift },
    { to: '/shop', label: 'Shop', icon: ShoppingBag }
  ];

  const moreNavItems = [
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/expeditions', label: 'Expeditions', icon: Map },
    { to: '/forge', label: 'Forge', icon: Hammer },
    { to: '/achievements', label: 'Achievements', icon: Trophy },
    { to: '/guides', label: 'Guides', icon: BookOpenText },
  ];

  return (
    <nav className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hidden sm:block">
      <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-1 h-12">
          {[...mainNavItems, ...moreNavItems].map(({ to, label, icon: Icon }) => (
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
      </div>
    </nav>
  );
};

export default DesktopNavigation;