import { Menu, X } from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { NavItemType } from "./codex/NavItems";
import { SidebarContent } from "./SidebarContent";

// Define a type for sidebar metadata
export interface SidebarConfig {
  title: string;
  backLink?: {
    path: string;
    text: string;
  };
  navItems: NavItemType[];
}

interface SidebarProps {
  config: SidebarConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({ config }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when navigating
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div>
        {/* Mobile Menu Button - Fixed at bottom right corner */}
        <div className="fixed bottom-16 left-2 z-50 md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="p-3 rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700 transition-all"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <aside
          className={`
          ${isMobileMenuOpen ? "translate-x-0 shadow-lg md:shadow-md" : "-translate-x-full"} 
            md:translate-x-0
            fixed md:sticky
            bottom-24 md:top-0
            rounded-lg
            z-40 md:z-0
            w-64
            -ml-4 md:ml-0
            overflow-y-auto
            transition-transform duration-300 ease-in-out
            bg-gray-100/50 dark:bg-gray-800 text-gray-800 dark:text-white
          `}
        >
          <div className="p-4 font-bold text-xl flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
            <Link
              to={config.backLink?.path || "/"}
              onClick={closeMobileMenu}
              className="hover:opacity-80 transition-opacity"
            >
              {config.title}
            </Link>
            <button className="md:hidden" onClick={toggleMobileMenu}>
              <X size={24} />
            </button>
          </div>

          <SidebarContent navItems={config.navItems} closeMobileMenu={closeMobileMenu} />
        </aside>

    </div>
  );
};

export default Sidebar;