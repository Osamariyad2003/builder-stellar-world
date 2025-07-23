// Global Firebase connection monitor - start in offline mode for safety
let isFirebaseOffline = true;
let offlineListeners: Array<() => void> = [];

// Monitor for persistent Firebase errors - reduced threshold for faster offline mode
let errorCount = 0;
const maxErrors = 1; // Switch to offline mode after just 1 error

export const setFirebaseOffline = (offline: boolean) => {
  if (isFirebaseOffline !== offline) {
    isFirebaseOffline = offline;
    console.log(`🔄 Firebase mode changed: ${offline ? 'OFFLINE' : 'ONLINE'}`);

    // Notify all listeners
    offlineListeners.forEach(listener => listener());
  }
};

export const isFirebaseInOfflineMode = () => isFirebaseOffline;

export const addOfflineModeListener = (listener: () => void) => {
  offlineListeners.push(listener);
  return () => {
    offlineListeners = offlineListeners.filter(l => l !== listener);
  };
};

export const reportFirebaseError = (error: any) => {
  errorCount++;
  console.log(`🚨 Firebase error ${errorCount}/${maxErrors}:`, error.message);

  // If we get too many errors, switch to offline mode globally
  if (errorCount >= maxErrors) {
    console.log("🔄 Too many Firebase errors - switching to global offline mode");
    setFirebaseOffline(true);
  }
};

// More aggressive approach - completely prevent Firebase requests when offline
const originalFetch = window.fetch;
window.fetch = (...args) => {
  // Check if this is a Firebase request
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
  const isFirebaseRequest = url?.includes('firestore.googleapis.com') ||
                           url?.includes('firebase.googleapis.com') ||
                           url?.includes('identitytoolkit.googleapis.com');

  if (isFirebaseRequest && isFirebaseOffline) {
    // Immediately reject Firebase requests when in offline mode
    console.log("🚫 Blocking Firebase request:", url);
    return Promise.reject(new Error('Firebase offline mode - request blocked'));
  }

  // For non-Firebase requests or when online, use original fetch
  return originalFetch(...args)
    .then(response => {
      // Reset error count on successful Firebase request
      if (isFirebaseRequest && response.ok) {
        errorCount = 0;
        if (isFirebaseOffline) {
          console.log("🟢 Firebase connection restored");
          setFirebaseOffline(false);
        }
      }
      return response;
    })
    .catch(error => {
      // Handle Firebase request failures
      if (isFirebaseRequest) {
        reportFirebaseError(error);
      }
      throw error;
    });
};

// Initial connection test - more aggressive
console.log("🔄 Initializing Firebase monitoring...");

// Immediately check network status
if (!navigator.onLine) {
  console.log("🚫 No internet connection - starting in offline mode");
  setFirebaseOffline(true);
}

// Add network event listeners
window.addEventListener('online', () => {
  console.log("🟢 Internet connection restored");
  errorCount = 0; // Reset error count
  setFirebaseOffline(false);
});

window.addEventListener('offline', () => {
  console.log("🔴 Internet connection lost");
  setFirebaseOffline(true);
});

// Start in offline mode by default, only enable Firebase when we know it works
console.log("🔄 Starting Firebase monitoring in OFFLINE mode for safety");

setTimeout(() => {
  if (!navigator.onLine) {
    console.log("🚫 No internet connection detected");
  } else {
    console.log("🌐 Internet available - Firebase will be enabled on first successful request");
    // Don't enable Firebase yet, let it prove it works first
  }
}, 100);

// Disable Firebase features when offline to prevent any initialization
export const disableFirebaseWhenOffline = () => {
  if (isFirebaseOffline) {
    // Override Firebase initialization functions to prevent them from running
    const noop = () => {
      console.log("🚫 Firebase function called in offline mode - skipping");
      return Promise.reject(new Error('Firebase is offline'));
    };

    // Intercept common Firebase function calls
    if (typeof window !== 'undefined') {
      const firebase = (window as any).firebase;
      if (firebase) {
        firebase.initializeApp = noop;
        firebase.app = noop;
      }
    }
  }
};

export default {
  setFirebaseOffline,
  isFirebaseInOfflineMode,
  addOfflineModeListener,
  reportFirebaseError,
  disableFirebaseWhenOffline,
};
