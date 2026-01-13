// Global Firebase connection monitor - start in online mode
let isFirebaseOffline = false;
let offlineListeners: Array<() => void> = [];
let extensionBlockingDetected = false; // Flag to track if an extension is blocking requests

// Monitor for persistent Firebase errors - be less aggressive to avoid false positives
let errorCount = 0;
const maxErrors = 3; // Switch to offline mode after 3 consecutive errors

export const setFirebaseOffline = (offline: boolean) => {
  if (isFirebaseOffline !== offline) {
    isFirebaseOffline = offline;
    console.log(`🔄 Firebase mode changed: ${offline ? "OFFLINE" : "ONLINE"}`);

    // Notify all listeners
    offlineListeners.forEach((listener) => listener());
  }
};

export const isFirebaseInOfflineMode = () => isFirebaseOffline;

export const isExtensionBlocking = () => extensionBlockingDetected;

export const addOfflineModeListener = (listener: () => void) => {
  offlineListeners.push(listener);
  return () => {
    offlineListeners = offlineListeners.filter((l) => l !== listener);
  };
};

export const reportFirebaseError = (error: any) => {
  errorCount++;
  console.log(`🚨 Firebase error ${errorCount}/${maxErrors}:`, error.message);

  // If we get too many errors, switch to offline mode globally
  if (errorCount >= maxErrors) {
    console.log(
      "🔄 Too many Firebase errors - switching to global offline mode",
    );
    setFirebaseOffline(true);
  }
};

// Monitor Firebase requests and handle failures gracefully (patch fetch once)
if (!(window.fetch as any).__firebasePatched) {
  const originalFetch = window.fetch;
  const patchedFetch = (...args: Parameters<typeof fetch>) => {
    // Helper: XHR-based fallback to perform requests when fetch is intercepted by extensions
    const xhrFallback = (input: RequestInfo, init?: RequestInit) => {
      return new Promise<any>((resolve, reject) => {
        try {
          const url =
            typeof input === "string" ? input : (input as Request).url;
          const method = (init && init.method) || "GET";
          const xhr = new XMLHttpRequest();
          xhr.open(method as string, url, true);
          // set headers
          if (init && init.headers) {
            const headers = init.headers as any;
            Object.keys(headers).forEach((h) => {
              try {
                xhr.setRequestHeader(h, headers[h]);
              } catch (_) {}
            });
          }
          xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) return;
            const status = xhr.status || 0;
            const text = xhr.responseText || "";
            const resLike = {
              ok: status >= 200 && status < 400,
              status,
              text: async () => text,
              json: async () => {
                try {
                  return text ? JSON.parse(text) : {};
                } catch (e) {
                  throw e;
                }
              },
            } as any;
            resolve(resLike);
          };
          xhr.onerror = () => reject(new Error("XHR network error"));
          xhr.ontimeout = () => reject(new Error("XHR timeout"));
          if (init && init.body) {
            try {
              if ((init.body as any) instanceof FormData) {
                xhr.send(init.body as any);
              } else if (typeof init.body === "string") {
                xhr.send(init.body as any);
              } else {
                xhr.send(JSON.stringify(init.body));
              }
            } catch (e) {
              reject(e);
            }
          } else {
            xhr.send();
          }
        } catch (e) {
          reject(e);
        }
      });
    };
    const url =
      typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url;
    const isFirebaseRequest =
      !!url &&
      (url.includes("firestore.googleapis.com") ||
        url.includes("firebase.googleapis.com") ||
        url.includes("identitytoolkit.googleapis.com"));

    // Bypass all non-Firebase requests completely, but guard against synchronous throws (e.g., from extensions/invalid schemes)
    if (!isFirebaseRequest) {
      try {
        return originalFetch(...args);
      } catch (err) {
        // Convert synchronous throws into a rejected promise so they behave like async fetch errors
        return Promise.reject(err);
      }
    }

    // If we've already detected an extension is blocking, immediately switch to offline mode
    if (extensionBlockingDetected || isFirebaseOffline) {
      if (extensionBlockingDetected) {
        setFirebaseOffline(true);
      }
      const offlineError = new Error("Firebase offline mode - request blocked");
      (offlineError as any).isFirebaseOfflineError = true;
      return Promise.reject(offlineError);
    }

    try {
      const fetchPromise = originalFetch(...args);
      return Promise.resolve(fetchPromise)
        .then((response) => {
          if (response.ok) {
            errorCount = 0;
            if (isFirebaseOffline) {
              console.log("🟢 Firebase connection restored");
              setFirebaseOffline(false);
            }
          }
          return response;
        })
        .catch((error) => {
          // If this error comes from a browser extension or third-party script
          const stack = String((error && (error.stack || "")) || "");
          const message = String(error?.message || error || "").toLowerCase();
          const isExtensionError =
            stack.includes("chrome-extension://") ||
            stack.includes("extension://") ||
            message.includes("extension") ||
            message.includes("failed to fetch");

          // If extension is blocking, switch to offline mode immediately
          if (isExtensionError && message.includes("failed to fetch")) {
            console.log(
              "🔴 Extension detected blocking Firebase requests - activating permanent offline mode",
            );
            extensionBlockingDetected = true;
            setFirebaseOffline(true);
            // Return a rejected promise but don't retry
            const err = new Error(
              "Firebase offline (extension blocking requests)",
            );
            (err as any).isExtensionBlocked = true;
            return Promise.reject(err);
          }

          console.log(
            "🔴 Firebase request failed:",
            error?.message || String(error),
          );

          if (!isExtensionError && navigator.onLine) reportFirebaseError(error);
          // Re-throw so callers get the original failure
          throw error;
        });
    } catch (error) {
      // Handle synchronous errors thrown by fetch (e.g., invalid URL schemes)
      console.log(
        "🔴 Firebase request threw synchronously:",
        (error as any)?.message || String(error),
      );
      const stack = String((error && (error.stack || "")) || "");
      const message = String(
        (error as any)?.message || error || "",
      ).toLowerCase();
      const isExtensionError =
        stack.includes("chrome-extension://") ||
        stack.includes("extension://") ||
        message.includes("extension") ||
        message.includes("failed to fetch");

      // If extension is blocking requests, switch to permanent offline mode
      if (isExtensionError && message.includes("failed to fetch")) {
        console.log(
          "🔴 Extension blocking Firebase requests - permanent offline mode",
        );
        extensionBlockingDetected = true;
        setFirebaseOffline(true);
      }

      if (!isExtensionError && navigator.onLine) reportFirebaseError(error);
      return Promise.reject(error);
    }
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
window.addEventListener("online", () => {
  console.log("🟢 Internet connection restored");
  errorCount = 0; // Reset error count
  setFirebaseOffline(false);
});

window.addEventListener("offline", () => {
  console.log("🔴 Internet connection lost");
  setFirebaseOffline(true);
});

// Start in online mode, switch to offline only on failures
console.log("🔄 Starting Firebase monitoring in ONLINE mode");

// Suppress unhandled promise rejections from noisy extensions/analytics
window.addEventListener("unhandledrejection", (event) => {
  const msg = String(event?.reason?.message || event?.reason || "");
  const stack = String((event?.reason && (event.reason.stack || "")) || "");
  const isExtensionOrError =
    stack.includes("chrome-extension://") ||
    stack.includes("extension://") ||
    msg.toLowerCase().includes("failed to fetch") ||
    msg.toLowerCase().includes("extension");

  // If the rejection originates from an extension or analytics script, swallow it
  if (
    isExtensionOrError &&
    (stack.includes("chrome-extension://") ||
      stack.includes("extension://") ||
      stack.includes("fullstory.com"))
  ) {
    event.preventDefault();
    return;
  }

  // Also ignore noisy XHR/fetch failures that include extension origins in stack
  if (stack.includes("chrome-extension://") || stack.includes("extension://")) {
    event.preventDefault();
    return;
  }

  // Suppress "Failed to fetch" errors from extensions even without stack trace
  if (
    msg.toLowerCase().includes("failed to fetch") &&
    stack.includes("chrome-extension")
  ) {
    event.preventDefault();
    return;
  }
});

// Suppress Firebase offline errors from appearing in console
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args) => {
  // Build a joined message and also inspect any Error objects for stacks
  const errorMessage = args
    .map((a) => (a && typeof a === "object" ? String(a) : a))
    .join(" ");
  const hasErrorStack = args.some(
    (a: any) =>
      a &&
      typeof a === "object" &&
      a.stack &&
      (a.stack as string).includes("chrome-extension://"),
  );

  const suppressPatterns = [
    "Firebase offline mode - request blocked",
    "FirebaseError: [code=unavailable]",
    "Could not reach Cloud Firestore backend",
    "Connection failed",
    "The operation could not be completed",
    "device does not have a healthy Internet connection",
    "client will operate in offline mode",
    "Most recent error: FirebaseError",
    "@firebase/firestore: Firestore",
    "fullstory.com",
    "TypeError: Failed to fetch",
  ];

  // Suppress if patterns match or if an extension stack is present
  if (
    suppressPatterns.some((pattern) => errorMessage.includes(pattern)) ||
    hasErrorStack ||
    errorMessage.includes("chrome-extension://") ||
    errorMessage.includes("extension://")
  ) {
    return; // Suppress noisy errors from extensions or Firebase offline
  }

  originalConsoleError.apply(console, args);
};

console.warn = (...args) => {
  const warnMessage = args.join(" ");
  if (warnMessage.includes("Firebase") && warnMessage.includes("offline")) {
    return; // Suppress Firebase offline warnings
  }
  originalConsoleWarn.apply(console, args);
};

// Also suppress some Firebase log messages
console.log = (...args) => {
  const logMessage = args.join(" ");
  if (
    logMessage.includes("@firebase/firestore") &&
    logMessage.includes("offline")
  ) {
    return; // Suppress Firebase offline logs
  }
  originalConsoleLog.apply(console, args);
};

setTimeout(() => {
  if (!navigator.onLine) {
    console.log(
      "🚫 No internet connection detected - switching to offline mode",
    );
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
      return Promise.reject(new Error("Firebase is offline"));
    };

    // Intercept common Firebase function calls
    if (typeof window !== "undefined") {
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
  isExtensionBlocking,
  addOfflineModeListener,
  reportFirebaseError,
  disableFirebaseWhenOffline,
};
