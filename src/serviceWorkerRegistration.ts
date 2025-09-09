// Service worker registration script

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    // The URL constructor is available in all browsers that support SW
    const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
    
    // Our service worker won't work if PUBLIC_URL is on a different origin
    // from what our page is served on. This might happen if a CDN is used.
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

      if (import.meta.env.DEV) {
        // This is running in development mode.
        // Check if service worker still exists and reload if needed
        checkValidServiceWorker(swUrl, config);
      } else {
        // It's production build, so register service worker
        registerValidSW(swUrl, config);
      }
    });

    // Add event listener for online/offline status changes
    window.addEventListener('online', () => {
      document.dispatchEvent(new CustomEvent('app-online'));
      triggerBackgroundSync();
    });

    window.addEventListener('offline', () => {
      document.dispatchEvent(new CustomEvent('app-offline'));
    });
  }
}

function registerValidSW(swUrl: string, config?: Config): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('New content is available and will be used when all tabs for this page are closed.');

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config): void {
  // Check if the service worker can be found.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Trigger background sync for offline data
export function triggerBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((registration) => {
        // Register sync for different data types
        (registration as any).sync.register('sync-transactions')
          .catch(err => console.warn('Sync registration failed for transactions:', err));
        (registration as any).sync.register('sync-budgets')
          .catch(err => console.warn('Sync registration failed for budgets:', err));
        (registration as any).sync.register('sync-savings')
          .catch(err => console.warn('Sync registration failed for savings:', err));
      })
      .catch((err) => {
        console.error('Background sync registration failed:', err);
        // Dispatch event to notify app that background sync is not available
        document.dispatchEvent(new CustomEvent('sync-fallback-needed'));
      });
  } else {
    console.warn('Background Sync is not supported in this browser');
    // Dispatch event to notify app that background sync is not available
    document.dispatchEvent(new CustomEvent('sync-fallback-needed'));
  }
}

// Check if the app is online
export function isOnline(): boolean {
  return navigator.onLine;
}