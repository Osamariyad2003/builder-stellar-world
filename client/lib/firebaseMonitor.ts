// Global Firebase connection monitor
let isFirebaseOffline = false;
let offlineListeners: Array<() => void> = [];

// Monitor for persistent Firebase errors
let errorCount = 0;
const maxErrors = 3;

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
      // Reject Firebase requests immediately if we're in offline mode
      throw new Error('Firebase is in offline mode');
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

// Initial connection test
setTimeout(() => {
  // Test Firebase connectivity on app start
  if (!navigator.onLine) {
    console.log("🚫 No internet connection - starting in offline mode");
    setFirebaseOffline(true);
  }
}, 1000);

export default {
  setFirebaseOffline,
  isFirebaseInOfflineMode,
  addOfflineModeListener,
  reportFirebaseError,
};
