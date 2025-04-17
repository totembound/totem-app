import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Trash2,
  X,
  Check,
  Filter,
  Clock,
  Star,
  Shield,
  Award,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import {
  NotificationType,
  NotificationPriority,
  NotificationScope,
} from "../types/notifications";
import FilterMenuPortal from "./FilterMenuPortal";

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case NotificationType.ACHIEVEMENT_UNLOCKED:
      return <Award size={16} className="text-yellow-500" />;
    case NotificationType.MILESTONE_UNLOCKED:
      return <Star size={16} className="text-amber-500" />;
    case NotificationType.TOTEM_EVOLVED:
      return <Star size={16} className="text-purple-500" />;
    case NotificationType.PRESTIGE_REACHED:
      return <Shield size={16} className="text-indigo-500" />;
    case NotificationType.HIGH_SCORE_SET:
      return <Award size={16} className="text-blue-500" />;
    case NotificationType.REWARD_CLAIMED:
      return <Bell size={16} className="text-green-500" />;
    default:
      return <Bell size={16} className="text-gray-500 dark:text-gray-400" />;
  }
};

const NotificationPriorityBadge = ({
  priority,
}: {
  priority: NotificationPriority;
}) => {
  if (priority === NotificationPriority.HIGH) {
    return <div className="h-2 w-2 rounded-full bg-red-500"></div>;
  } else if (priority === NotificationPriority.MEDIUM) {
    return <div className="h-2 w-2 rounded-full bg-yellow-500"></div>;
  }
  return (
    <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600"></div>
  );
};

function NotificationsPanel() {
  const {
    notifications,
    unreadCount,
    removeNotification,
    markAllAsRead,
    markAsRead,
    clearNotifications,
    getFilteredNotifications,
    openPanel,
    setOpenPanel,
    soundEnabled,
    toggleSound,
    maxNotifications,
    updateMaxNotifications,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [filteredNotifications, setFilteredNotifications] =
    useState(notifications);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [maxNotificationsInput, setMaxNotificationsInput] = useState(
    maxNotifications.toString()
  );

  const rect = (
    buttonRef?.current || {
      getBoundingClientRect: () => {
        return { right: 188 };
      },
    }
  ).getBoundingClientRect();
  let left = rect.right - 188;
  if (window.innerWidth < 420) {
    left = 28;
  }

  // Update filtered notifications when filter changes or notifications update
  useEffect(() => {
    let filtered;
    switch (activeFilter) {
      case "unread":
        filtered = getFilteredNotifications({ unreadOnly: true });
        break;
      case "achievements":
        filtered = getFilteredNotifications({
          types: [
            NotificationType.ACHIEVEMENT_UNLOCKED,
            NotificationType.MILESTONE_UNLOCKED,
          ],
        });
        break;
      case "challenges":
        filtered = getFilteredNotifications({
          types: [
            NotificationType.CHALLENGE_COMPLETED,
            NotificationType.HIGH_SCORE_SET,
          ],
        });
        break;
      case "evolution":
        filtered = getFilteredNotifications({
          types: [
            NotificationType.TOTEM_EVOLVED,
            NotificationType.PRESTIGE_REACHED,
          ],
        });
        break;
      case "rewards":
        filtered = getFilteredNotifications({
          types: [
            NotificationType.REWARD_CLAIMED,
            NotificationType.PROTECTION_PURCHASED,
            NotificationType.PROTECTION_USED,
          ],
        });
        break;
      case "high-priority":
        // Since there's no direct priority filter, we'll filter manually
        filtered = notifications.filter(
          (n) => n.priority === NotificationPriority.HIGH
        );
        break;
      default:
        filtered = notifications;
    }
    setFilteredNotifications(filtered);
  }, [activeFilter, notifications, getFilteredNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if the click is on the filter menu
      if (
        document
          .getElementById("filter-menu-content")
          ?.contains(event.target as Node)
      ) {
        return;
      }

      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenPanel(false);
        setShowFilterMenu(false);
      }
    };

    // Only add listener if panel is open
    if (openPanel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openPanel, setOpenPanel]);

  // When opening panel, mark notifications as read after a delay
  useEffect(() => {
    if (openPanel && unreadCount > 0) {
      const timeout = setTimeout(() => {
        markAllAsRead();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [openPanel, unreadCount, markAllAsRead]);

  // Format timestamp
  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return "";

    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const togglePanel = () => {
    setOpenPanel(!openPanel);
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setShowFilterMenu(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Icon Button */}
      <button
        ref={buttonRef}
        onClick={togglePanel}
        className="relative p-2 rounded-full transition-colors
            bg-gray-100 hover:bg-gray-200
            dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 bg-red-500 text-white 
              text-xs min-w-[1.25rem] h-5 flex items-center justify-center
              rounded-full px-1 font-medium"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {openPanel && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed right-0 mt-2 
            w-[calc(100vw-2rem)] sm:w-80 md:w-96
            bg-white dark:bg-gray-800 shadow-lg rounded-lg border
            border-gray-200 dark:border-gray-700 z-40 overflow-hidden"
          style={{
            top: "3rem",
            left: left + "px",
            maxHeight: "calc(100vh - 4rem)",
          }}
        >
          {/* Header with filters */}
          <div
            className="p-3 border-b border-gray-200 dark:border-gray-700
              sticky top-0 bg-white dark:bg-gray-800 z-10
              flex items-center justify-between"
          >
            <h3 className="font-semibold dark:text-gray-100">Notifications</h3>
            <div className="flex-grow ml-2">
              {/* Sound toggle button */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title={
                  soundEnabled
                    ? "Mute notifications"
                    : "Enable notification sounds"
                }
              >
                {soundEnabled ? (
                  <Volume2
                    size={16}
                    className="text-blue-500 dark:text-blue-400"
                  />
                ) : (
                  <VolumeX
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative">
                {/* Filter button */}
                <button
                  ref={filterButtonRef}
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Filter notifications"
                >
                  <Filter
                    size={16}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
                <FilterMenuPortal
                  isOpen={showFilterMenu}
                  onClose={() => setShowFilterMenu(false)}
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                  buttonRef={filterButtonRef}
                />
              </div>

              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Mark all as read"
              >
                <Check size={16} className="text-gray-500 dark:text-gray-400" />
              </button>

              <button
                onClick={handleClearAll}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Clear all notifications"
              >
                <Trash2
                  size={16}
                  className="text-gray-500 dark:text-gray-400"
                />
              </button>
            </div>
          </div>

          {/* Filter badge */}
          {activeFilter !== "all" && (
            <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {activeFilter === "unread" && "Showing unread notifications"}
                  {activeFilter === "achievements" &&
                    "Showing achievement notifications"}
                  {activeFilter === "challenges" &&
                    "Showing challenge notifications"}
                  {activeFilter === "evolution" &&
                    "Showing evolution notifications"}
                  {activeFilter === "rewards" && "Showing reward notifications"}
                  {activeFilter === "high-priority" &&
                    "Showing important notifications"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilter("all");
                  }}
                  className="text-blue-600 dark:text-blue-400"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Notifications content */}
          <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 flex flex-col gap-2
                      hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${
                        !notification.isRead
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-1 gap-2">
                          <NotificationPriorityBadge
                            priority={notification.priority}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 flex-shrink-0"
                        title="Remove notification"
                      >
                        <Trash2
                          size={14}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with quick actions */}
          <div
            className="p-2 border-t border-gray-200 dark:border-gray-700 
              bg-gray-50 dark:bg-gray-900/20 text-xs"
          >
            <div className="flex justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 dark:text-blue-400 px-2 py-1 rounded
                  hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  Mark all as read
                </button>
              </div>
              <div className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span>Total: {notifications.length}</span>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                  title="Notification settings"
                >
                  <Settings
                    size={14}
                    className="text-gray-500 dark:text-gray-400"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg dark:text-gray-100">
                Notification Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Maximum saved notifications
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={maxNotificationsInput}
                    onChange={(e) => setMaxNotificationsInput(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                      rounded-md shadow-sm bg-white dark:bg-gray-700 
                      text-gray-900 dark:text-gray-100"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Older notifications will be automatically removed when this
                  limit is reached, max setting 1000
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notification sound
                </label>
                <div className="flex items-center">
                  <button
                    onClick={toggleSound}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      soundEnabled
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {soundEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md shadow-sm text-sm font-medium 
                  text-gray-700 dark:text-gray-300
                  bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateMaxNotifications(parseInt(maxNotificationsInput));
                  setShowSettingsModal(false);
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm 
                  text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                  dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPanel;
