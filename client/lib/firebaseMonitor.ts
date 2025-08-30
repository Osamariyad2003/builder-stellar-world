// Global Firebase connection monitor - start in online mode
let isFirebaseOffline = false;
let offlineListeners: Array<() => void> = [];

// Monitor for persistent Firebase errors - be less aggressive to avoid false positives
let errorCount = 0;
const maxErrors = 3; // Switch to offline mode after 3 consecutive errors

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

// Monitor Firebase requests and handle failures gracefully (patch fetch once)
if (!(window.fetch as any).__firebasePatched) {
  const originalFetch = window.fetch;
  const patchedFetch = (...args: Parameters<typeof fetch>) => {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request)?.url;
    const isFirebaseRequest = !!url && (
      url.includes('firestore.googleapis.com') ||
      url.includes('firebase.googleapis.com') ||
      url.includes('identitytoolkit.googleapis.com')
    );

    // Bypass all non-Firebase requests completely
    if (!isFirebaseRequest) {
      return originalFetch(...args);
    }

    // Only block Firebase requests if explicitly offline
    if (isFirebaseOffline) {
      const offlineError = new Error('Firebase offline mode - request blocked');
      (offlineError as any).isFirebaseOfflineError = true;
      return Promise.reject(offlineError);
    }

    return originalFetch(...args)
      .then((response) => {
        if (response.ok) {
          errorCount = 0;
          if (isFirebaseOffline) {
            console.log('🟢 Firebase connection restored');
            setFirebaseOffline(false);
          }
        }
        return response;
      })
      .catch((error) => {
        console.log('🔴 Firebase request failed:', error?.message || String(error));
        if (navigator.onLine) reportFirebaseError(error);
        throw error;
      });
  };
  (patchedFetch as any).__firebasePatched = true;
  window.fetch = patchedFetch as any;
}

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

// Start in online mode, switch to offline only on failures
console.log("🔄 Starting Firebase monitoring in ONLINE mode");

// Suppress Firebase offline errors from appearing in console
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  const errorMessage = args.join(' ');
  const suppressPatterns = [
    'Firebase offline mode - request blocked',
    'FirebaseError: [code=unavailable]',
    'Could not reach Cloud Firestore backend',
    'Connection failed',
    'The operation could not be completed',
    'device does not have a healthy Internet connection',
    'client will operate in offline mode',
    'Most recent error: FirebaseError',
    '@firebase/firestore: Firestore',
    'chrome-extension://',
    'fullstory.com',
    'TypeError: Failed to fetch (edge.fullstory.com)'
  ];

  if (suppressPatterns.some(pattern => errorMessage.includes(pattern))) {
    return; // Suppress Firebase offline errors
  }

  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const warnMessage = args.join(' ');
  if (warnMessage.includes('Firebase') && warnMessage.includes('offline')) {
    return; // Suppress Firebase offline warnings
  }
  originalConsoleWarn.apply(console, args);
};

// Also suppress some Firebase log messages
console.log = (...args) => {
  const logMessage = args.join(' ');
  if (logMessage.includes('@firebase/firestore') && logMessage.includes('offline')) {
    return; // Suppress Firebase offline logs
  }
  originalConsoleLog.apply(console, args);
};

setTimeout(() => {
  if (!navigator.onLine) {
    console.log("🚫 No internet connection detected - switching to offline mode");
    setFirebaseOffline(true);
  } else {
    console.log("🌐 Internet available - Firebase enabled and ready");
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
