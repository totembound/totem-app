import { useState, useEffect, useRef } from "react";
import { Bell, X, ClipboardCopy } from "lucide-react"; // Icons for UI
import { useContractEvents } from "../hooks/useContractEvents";

function NotificationsPanel({ userAddress }: { userAddress: string | null }) {
    const { notifications, setNotifications } = useContractEvents(userAddress);
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
    const panelRef = useRef<HTMLDivElement>(null);
    
    // Handle copy to clipboard
    const handleCopy = (id: string, address: string) => {
        navigator.clipboard.writeText(address);
        setCopied(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [id]: false })), 2000); // Reset after 2s
    };
    
    // Remove notification
    const markAsRead = (id: string) => {
        const newNotifications = notifications.filter(n => n.id !== id);
        setNotifications(newNotifications);
        localStorage.setItem("totem-notifications", JSON.stringify(newNotifications));
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

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Icon Button */}
            <button 
                onClick={() => setOpen(!open)} 
                className="relative p-2 rounded-full transition-colors
                    bg-gray-100 hover:bg-gray-200
                    dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label="Notifications"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white 
                        text-xs min-w-[1.25rem] h-5 flex items-center justify-center
                        rounded-full px-1 font-medium">
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* Notifications Panel */}
            {open && (
                <div className="absolute right-0 mt-2 
                    w-[calc(100vw-2rem)] sm:w-80
                    bg-white dark:bg-gray-800 shadow-lg rounded-lg border
                    border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700
                        flex items-center justify-between">
                        <h3 className="font-semibold dark:text-gray-100">Notifications</h3>
                        {notifications.length > 0 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {notifications.length} new
                            </span>
                        )}
                    </div>
                    
                    <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <div key={notification.id} 
                                        className="p-3 flex items-start justify-between gap-4
                                            hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {notification.message}
                                        </p>
                                        <button 
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-1 rounded-full hover:bg-gray-200 
                                                dark:hover:bg-gray-600 flex-shrink-0"
                                        >
                                            <X size={14} className="text-gray-500 dark:text-gray-400" />
                                        </button>
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