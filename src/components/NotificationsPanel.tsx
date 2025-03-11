import { useState, useEffect, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import { useContractEvents } from "../hooks/useContractEvents";

function NotificationsPanel({ userAddress }: { userAddress: string | null }) {
    const { notifications, removeNotification, markAllAsRead } = useContractEvents(userAddress);
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
    const panelRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef(null);

    // Handle copy to clipboard
    const handleCopy = (id: string, address: string) => {
        navigator.clipboard.writeText(address);
        setCopied(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [id]: false })), 2000); // Reset after 2s
    };
    
    const handleRemoveNotification = (id: string) => {
        removeNotification(id);
    };
    
    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        // Only add listener if panel is open
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const rect = (buttonRef?.current || { getBoundingClientRect:()=>{return{right:320};}}).getBoundingClientRect();
    let left = rect.right - 320;
    if (window.innerWidth < 420) {
        left = 28;
    }

    // Format timestamp 
    const formatTime = (timestamp?: number) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const togglePanel = () => {
        // If we're opening the panel, mark all as read
        if (!open) {
            setTimeout(() => markAllAsRead(), 1000); // Delay to allow user to see unread state first
        }
        setOpen(!open);
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
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white 
                        text-xs min-w-[1.25rem] h-5 flex items-center justify-center
                        rounded-full px-1 font-medium">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Panel */}
            {open && (
                <div className="fixed right-0 mt-2 
                    w-[calc(100vw-2rem)] sm:w-80
                    bg-white dark:bg-gray-800 shadow-lg rounded-lg border
                    border-gray-200 dark:border-gray-700 z-50" style={{ top: '3rem', left: left + 'px' }}>
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700
                        flex items-center justify-between">
                        <h3 className="font-semibold dark:text-gray-100">Notifications</h3>
                        {notifications.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {notifications.length} total
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                No notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <div key={notification.id} 
                                        className={`p-3 flex flex-col gap-2
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50
                                            ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button 
                                                    onClick={() => handleRemoveNotification(notification.id)}
                                                    className="p-1 rounded-full hover:bg-red-100
                                                        dark:hover:bg-red-900/20 flex-shrink-0"
                                                    title="Remove notification"
                                                >
                                                    <Trash2 size={14} className="text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                        {notification.timestamp && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formatTime(notification.timestamp)}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationsPanel;