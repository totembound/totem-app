import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { NavItemType } from "./codex/NavItems";
import { withVillagePrefix } from "../village/villagePath";

export interface CodexNavigationProps {
  items: NavItemType[];
  expanded: boolean;
  closeMobileMenu: () => void;
}

export const SidebarContent: React.FC<{ navItems: NavItemType[], expanded: boolean, closeMobileMenu?: () => void }> = ({
  navItems = [],
  expanded = false,
  closeMobileMenu = () => {},
}) => {
  return (
    <nav className="py-4">
      {navItems.map((item, index) => (
        <NavItem
          key={index}
          title={item.title}
          icon={item.icon}
          path={item.path}
          expanded={expanded}
          closeMobileMenu={closeMobileMenu}
        >
          {item.children?.map((subItem, subIndex) => (
            <NavSubItem
              key={subIndex}
              title={subItem.title}
              path={subItem.path}
              closeMobileMenu={closeMobileMenu}
            />
          ))}
        </NavItem>
      ))}
    </nav>
  );
};

// Navigation Item with Collapsible Children
interface NavItemProps {
  title: string;
  icon: React.ReactNode;
  path: string;
  expanded: boolean;
  closeMobileMenu: () => void;
  children?: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({
  title,
  icon,
  path,
  expanded,
  children,
  closeMobileMenu,
}) => {
  const [isOpen, setIsOpen] = useState(!!expanded);
  const location = useLocation();
  const hasChildren = React.Children.count(children) > 0;
  // Trunk-aware: when navigating inside the village modal, rewrite /guides/...
  // paths to /keepers-village/guides/... so links don't escape the modal.
  const trunkPath = withVillagePrefix(location.pathname, path);

  // Check if current path or any child path is active
  const isActive =
    location.pathname === trunkPath || location.pathname.startsWith(trunkPath + "/");

  // Auto-expand if child is active
  useEffect(() => {
    if (hasChildren && location.pathname.startsWith(trunkPath + "/")) {
      setIsOpen(true);
    }
  }, [location.pathname, hasChildren, trunkPath]);

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleClick = () => {
    closeMobileMenu();
  };

  return (
    <div className="mb-1">
      <div
        className={`
        flex items-center justify-between py-2 px-4 mx-2 rounded-md
        ${
          isActive
            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-white"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }
        transition-colors duration-200
      `}
      >
        {/* Left side (icon + text) is a navigation link */}
        <Link
          to={trunkPath}
          className="flex items-center flex-1 cursor-pointer"
          onClick={handleClick}
        >
          <span className="mr-2">{icon}</span>
          <span>{title}</span>
        </Link>

        {/* Chevron is a toggle button only */}
        {hasChildren && (
          <button
            onClick={toggleOpen}
            className="ml-2 p-1 hover:bg-purple-300 dark:hover:bg-purple-600 rounded"
            aria-label={isOpen ? "Collapse submenu" : "Expand submenu"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Collapsible Children */}
      {hasChildren && (
        <div
          className={`
          ml-6 px-2 border-l border-gray-300 dark:border-gray-700
          h-64 md:h-auto overflow-auto 
          ${isOpen ? "block" : "hidden"}
        `}
        >
          {children}
        </div>
      )}
    </div>
  );
};

// Navigation Sub Item
interface NavSubItemProps {
  title: string;
  path: string;
  closeMobileMenu: () => void;
}

const NavSubItem: React.FC<NavSubItemProps> = ({
  title,
  path,
  closeMobileMenu,
}) => {
  const location = useLocation();
  const trunkPath = withVillagePrefix(location.pathname, path);
  const isActive = location.pathname === trunkPath;

  return (
    <Link
      to={trunkPath}
      className={`
        block py-2 px-4 rounded-md my-1
        ${
          isActive
            ? "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }
        transition-colors duration-200
      `}
      onClick={closeMobileMenu}
    >
      {title}
    </Link>
  );
};