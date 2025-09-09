import React, { useContext } from 'react';
import { NetworkContext } from '../context/NetworkContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { syncAllOfflineData } from '../lib/offlineApi';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const { isOnline, isSyncing, lastSyncTime, triggerSync } = useContext(NetworkContext);

  const handleSyncClick = async () => {
    if (isOnline && !isSyncing) {
      // Call triggerSync from context if available
      if (typeof triggerSync === 'function') {
        triggerSync();
      }
      
      // Always call the actual sync function as a fallback
      try {
        await syncAllOfflineData();
      } catch (error) {
        console.error('Error syncing data:', error);
      }
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never synced';
    
    const date = new Date(lastSyncTime);
    return `Last sync: ${date.toLocaleTimeString()}`;
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-500">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-amber-500" />
          <span className="text-amber-500">Offline</span>
        </>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 h-8 px-2"
        onClick={handleSyncClick}
        disabled={!isOnline || isSyncing}
      >
        <RefreshCw className={cn(
          "h-4 w-4 mr-1", 
          isSyncing && "animate-spin"
        )} />
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Button>
      
      <span className="text-xs text-muted-foreground ml-1">
        {formatLastSync()}
      </span>
    </div>
  );
}