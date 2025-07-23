// Global Firebase connection monitor - start in online mode
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

// Monitor Firebase requests and handle failures gracefully
const originalFetch = window.fetch;
window.fetch = (...args) => {
  // Check if this is a Firebase request
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
  const isFirebaseRequest = url?.includes('firestore.googleapis.com') ||
                           url?.includes('firebase.googleapis.com') ||
                           url?.includes('identitytoolkit.googleapis.com');

  // Only block Firebase requests if we're explicitly in offline mode due to previous failures
  if (isFirebaseRequest && isFirebaseOffline) {
    // Silently block Firebase requests when in offline mode (no console error)
    const offlineError = new Error('Firebase offline mode - request blocked');
    (offlineError as any).isFirebaseOfflineError = true;
    return Promise.reject(offlineError);
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
        console.log("🔴 Firebase request failed:", error.message);
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
    '@firebase/firestore: Firestore'
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
