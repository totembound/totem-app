import React from 'react';
import { X } from 'lucide-react';

export interface MessageDialogState {
  isOpen: boolean;
  title: string;
  message: string;
}

interface MessageDialogProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  showDismiss: boolean;
  onClose: () => void;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  title,
  children,
  isOpen,
  showDismiss,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative w-[calc(100%-2rem)] max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 pr-8">
            {title}
          </h2>
          
          <div className="text-gray-600 dark:text-gray-300">
            {children}
          </div>

          {/* Dismiss button */}
          {showDismiss && 
            <div className="flex justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-900 dark:text-gray-100 transition-colors"
              >
                Dismiss
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default MessageDialog;