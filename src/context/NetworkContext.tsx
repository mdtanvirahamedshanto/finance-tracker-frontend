import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerBackgroundSync } from '../serviceWorkerRegistration';

interface NetworkContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  triggerSync: () => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  isOnline: navigator.onLine,
  isSyncing: false,
  lastSyncTime: null,
  triggerSync: () => {}
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger background sync when coming back online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        setIsSyncing(true);
        triggerBackgroundSync();
        // In a real app, we would listen for sync completion
        // For now, simulate sync completion after a delay
        setTimeout(() => {
          setIsSyncing(false);
          setLastSyncTime(new Date());
        }, 2000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for app-specific sync events from service worker
    const handleSyncComplete = () => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('sync-complete', handleSyncComplete);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('sync-complete', handleSyncComplete);
    };
  }, []);

  const triggerSync = () => {
    if (isOnline && !isSyncing) {
      setIsSyncing(true);
      triggerBackgroundSync();
      // Simulate sync completion after a delay
      setTimeout(() => {
        setIsSyncing(false);
        setLastSyncTime(new Date());
      }, 2000);
    }
  };

  return (
    <NetworkContext.Provider value={{ isOnline, isSyncing, lastSyncTime, triggerSync }}>
      {children}
    </NetworkContext.Provider>
  );
};