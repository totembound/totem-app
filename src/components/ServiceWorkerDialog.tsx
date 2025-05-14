import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type ServiceWorkerStatus = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant' | null;

interface ServiceWorkerDialogProps {
  className?: string;
}

const ServiceWorkerDialog: React.FC<ServiceWorkerDialogProps> = ({ className }) => {
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [serviceWorkerReg, setServiceWorkerReg] = useState<ServiceWorkerRegistration | null>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<ServiceWorkerStatus>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if there's already a controller (service worker active)
      const hasController = Boolean(navigator.serviceWorker.controller);

      // Get the registration
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          setServiceWorkerReg(registration);
          
          // Check for waiting service worker (update available)
          if (registration.waiting) {
            setUpdateAvailable(true);
            setShowDialog(true);
          }
          
          // Check for installing service worker
          if (registration.installing) {
            trackInstallation(registration.installing);
          }
          
          // Listen for new service worker updates
          registration.addEventListener('updatefound', () => {
            if (registration.installing) {
              trackInstallation(registration.installing);
            }
          });
        }
      });
      
      // Set up periodic update checks
      const checkInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update().catch(console.error);
          }
        });
      }, 60 * 60 * 1000); // Check every hour
      
      return () => clearInterval(checkInterval);
    }
  }, []);
  
  // Track the installation state changes of a service worker
  const trackInstallation = (sw: ServiceWorker) => {
    setServiceWorkerStatus(sw.state as ServiceWorkerStatus);
    
    sw.addEventListener('statechange', () => {
      setServiceWorkerStatus(sw.state as ServiceWorkerStatus);
      
      // If the service worker is installed but waiting
      if (sw.state === 'installed' && navigator.serviceWorker.controller) {
        setUpdateAvailable(true);
        setShowDialog(true);
      }
    });
  };
  
  // Apply the update by telling the service worker to skip waiting
  const applyUpdate = () => {
    if (serviceWorkerReg && serviceWorkerReg.waiting) {
      // Send skip waiting message
      serviceWorkerReg.waiting.postMessage({ type: 'SKIP_WAITING' });
      setShowDialog(false);
    }
    window.location.reload();
  };
  
  // Close the dialog without taking action
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