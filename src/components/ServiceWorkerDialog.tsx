import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ServiceWorkerDialogProps {
  className?: string;
}

const ServiceWorkerDialog: React.FC<ServiceWorkerDialogProps> = ({ className }) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [serviceWorkerReg, setServiceWorkerReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Reload once the new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    // Get the registration
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;
      setServiceWorkerReg(registration);

      // Check for waiting service worker (update already downloaded)
      if (registration.waiting) {
        setShowDialog(true);
      }

      // Listen for new service worker updates
      registration.addEventListener('updatefound', () => {
        const newSW = registration.installing;
        if (!newSW) return;

        newSW.addEventListener('statechange', () => {
          // New SW finished installing and is waiting
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setServiceWorkerReg(registration);
            setShowDialog(true);
          }
        });
      });
    });

    // Check for updates every hour
    const checkInterval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.update().catch(console.error);
      });
    }, 60 * 60 * 1000);

    return () => clearInterval(checkInterval);
  }, []);

  // Tell the waiting SW to activate — controllerchange listener handles reload
  const applyUpdate = () => {
    if (serviceWorkerReg?.waiting) {
      serviceWorkerReg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowDialog(false);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };
  
  if (!showDialog) {
    return null;
  }
  
  return (
    <div className={`fixed bottom-4 right-4 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out z-50 border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          App Update Available
        </h3>
        <button
          onClick={closeDialog}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <p className="text-gray-600 dark:text-gray-300">
          A new version of TotemBound is available. Update now to get the latest features and improvements.
        </p>
      </div>
      
      {/* Footer with actions */}
      <div className="flex justify-end gap-2 p-4 bg-gray-50 dark:bg-gray-700/50">
        <button
          onClick={closeDialog}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
        >
          Later
        </button>
        <button
          onClick={applyUpdate}
          className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default ServiceWorkerDialog;