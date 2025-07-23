// Global Firebase connection monitor
let isFirebaseOffline = false;
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

// Override the global fetch for Firebase requests to catch errors early
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    // Check if this is a Firebase request
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const isFirebaseRequest = url?.includes('firestore.googleapis.com') ||
                             url?.includes('firebase.googleapis.com') ||
                             url?.includes('identitytoolkit.googleapis.com');

    if (isFirebaseRequest && isFirebaseOffline) {
      // Immediately reject Firebase requests when in offline mode
      console.log("🚫 Blocking Firebase request - in offline mode");
      const rejectedResponse = new Response(null, {
        status: 503,
        statusText: 'Service Unavailable - Firebase Offline Mode'
      });
      return Promise.reject(new Error('Firebase is in offline mode - request blocked'));
    }

    const response = await originalFetch(...args);

    // Reset error count on successful Firebase request
    if (isFirebaseRequest && response.ok) {
      errorCount = 0;
      if (isFirebaseOffline) {
        console.log("🟢 Firebase connection restored");
        setFirebaseOffline(false);
      }
    }

    return response;
  } catch (error: any) {
    // Check if this is a Firebase request that failed
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    const isFirebaseRequest = url?.includes('firestore.googleapis.com') ||
                             url?.includes('firebase.googleapis.com') ||
                             url?.includes('identitytoolkit.googleapis.com');

    if (isFirebaseRequest) {
      reportFirebaseError(error);
    }

    throw error;
  }
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

// Very quick Firebase connectivity test
setTimeout(async () => {
  if (navigator.onLine) {
    try {
      // Try a quick fetch to Firebase to test connectivity
      const testUrl = 'https://firestore.googleapis.com/v1/projects/test';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      await fetch(testUrl, {
        signal: controller.signal,
        method: 'HEAD' // Just check if the service is reachable
      });

      clearTimeout(timeoutId);
      console.log("✅ Firebase connectivity test passed");
    } catch (error) {
      console.log("❌ Firebase connectivity test failed - switching to offline mode");
      setFirebaseOffline(true);
    }
  }
}, 500); // Test after 500ms

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
