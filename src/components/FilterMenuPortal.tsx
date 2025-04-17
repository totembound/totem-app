import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface FilterMenuPortalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const FilterMenuPortal: React.FC<FilterMenuPortalProps> = ({
  isOpen,
  onClose,
  activeFilter,
  onFilterChange,
  buttonRef,
}) => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Create or get the portal root element
    let element = document.getElementById("filter-menu-portal-root");
    if (!element) {
      element = document.createElement("div");
      element.id = "filter-menu-portal-root";
      document.body.appendChild(element);
    }
    setPortalRoot(element);

    // Update position when button reference changes
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - 160, // Menu width is 160px
      });
    }

    // Event listener to close on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        e.target instanceof Node &&
        !document.getElementById("filter-menu-content")?.contains(e.target)
      ) {
        onClose();
      }
    };

    // Set up event listeners
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);

      // Update button position on scroll or resize
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setPosition({
            top: rect.bottom + 4,
            left: rect.right - 160,
          });
        }
      };

      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        window.removeEventListener("scroll", updatePosition);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isOpen, buttonRef, onClose]);

  const handleFilterSelect = (e: React.MouseEvent, filter: string) => {
    e.preventDefault();
    e.stopPropagation();
    onFilterChange(filter);
  };

  if (!isOpen || !portalRoot) return null;

  return ReactDOM.createPortal(
    <div
      id="filter-menu-content"
      onClick={(e) => e.stopPropagation()}
      className="py-1 w-40 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-300
          border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
    >
      <button
        onClick={(e) => handleFilterSelect(e, "all")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "all"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        All
      </button>
      <button
        onClick={(e) => handleFilterSelect(e, "unread")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "unread"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        Unread
      </button>
      <button
        onClick={(e) => handleFilterSelect(e, "achievements")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "achievements"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        Achievements
      </button>
      <button
        onClick={(e) => handleFilterSelect(e, "challenges")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "evolution"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        Challenges
      </button>
      <button
        onClick={(e) => handleFilterSelect(e, "evolution")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "challenges"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        Evolution
      </button>
      <button
        onClick={(e) => handleFilterSelect(e, "rewards")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "rewards"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        Rewards
      </button>
      <button
        onClick={(e) => handleFilterSelect(e, "high-priority")}
        className={`w-full text-left px-3 py-1.5 text-sm ${
          activeFilter === "high-priority"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
        }`}
      >
        Important
      </button>
    </div>,
    portalRoot
  );
};

export default FilterMenuPortal;
