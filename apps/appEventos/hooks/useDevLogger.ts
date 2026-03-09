import { useEffect, useCallback, useRef } from 'react';

interface LogPayload {
  type: 'log' | 'error' | 'warn' | 'info' | 'navigation' | 'click' | 'scroll' | 'network' | 'dom';
  data: unknown;
  url?: string;
}

const API_ENDPOINT = '/api/dev/browser-log';

// Send log to API (debounced for scroll events)
const sendLog = async (payload: LogPayload) => {
  try {
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        url: window.location.href,
      }),
    });
  } catch {
    // Silently fail - don't want to cause more errors
  }
};

// Throttle function for scroll events
function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: unknown[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function useDevLogger(enabled = true) {
  const originalConsole = useRef<{
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  } | null>(null);

  const setupConsoleInterceptors = useCallback(() => {
    if (originalConsole.current) return; // Already setup

    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    // Intercept console methods
    (['log', 'error', 'warn', 'info'] as const).forEach((method) => {
      console[method] = (...args: unknown[]) => {
        // Call original
        originalConsole.current?.[method]?.apply(console, args);

        // Send to API
        sendLog({
          type: method,
          data: args.map((arg) => {
            try {
              if (arg instanceof Error) {
                return { message: arg.message, stack: arg.stack, name: arg.name };
              }
              return JSON.parse(JSON.stringify(arg));
            } catch {
              return String(arg);
            }
          }),
        });
      };
    });
  }, []);

  const setupErrorHandlers = useCallback(() => {
    // Global error handler
    const errorHandler = (event: ErrorEvent) => {
      sendLog({
        type: 'error',
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        },
      });
    };

    // Unhandled promise rejection
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      sendLog({
        type: 'error',
        data: {
          type: 'unhandledrejection',
          reason: event.reason?.message || String(event.reason),
          stack: event.reason?.stack,
        },
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

  const setupNavigationTracking = useCallback(() => {
    // Track navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      sendLog({ type: 'navigation', data: { action: 'pushState', url: args[2] } });
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      sendLog({ type: 'navigation', data: { action: 'replaceState', url: args[2] } });
    };

    const popstateHandler = () => {
      sendLog({ type: 'navigation', data: { action: 'popstate', url: window.location.href } });
    };

    window.addEventListener('popstate', popstateHandler);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', popstateHandler);
    };
  }, []);

  const setupInteractionTracking = useCallback(() => {
    // Track clicks
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      sendLog({
        type: 'click',
        data: {
          tagName: target.tagName,
          id: target.id,
          className: target.className,
          text: target.textContent?.slice(0, 100),
          x: event.clientX,
          y: event.clientY,
        },
      });
    };

    // Track scroll (throttled)
    const scrollHandler = throttle(() => {
      sendLog({
        type: 'scroll',
        data: {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
          scrollPercent: Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
          ),
        },
      });
    }, 1000);

    document.addEventListener('click', clickHandler);
    window.addEventListener('scroll', scrollHandler);

    return () => {
      document.removeEventListener('click', clickHandler);
      window.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  const setupNetworkTracking = useCallback(() => {
    // Track fetch requests
    const originalFetch = window.fetch;

    window.fetch = async function (...args) {
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof URL ? args[0].href : (args[0] as Request).url;
      const method = args[1]?.method || 'GET';
      const startTime = Date.now();

      try {
        const response = await originalFetch.apply(this, args);
        const duration = Date.now() - startTime;

        // Don't log our own API calls
        if (!url.includes('/api/dev/browser-log')) {
          sendLog({
            type: 'network',
            data: {
              url,
              method,
              status: response.status,
              statusText: response.statusText,
              duration,
              ok: response.ok,
            },
          });
        }

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        sendLog({
          type: 'network',
          data: {
            url,
            method,
            error: error instanceof Error ? error.message : String(error),
            duration,
            ok: false,
          },
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    // Only run in development and in browser
    if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined' || !enabled) {
      return;
    }

    // Send initial page load info
    sendLog({
      type: 'navigation',
      data: {
        action: 'pageLoad',
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userAgent: navigator.userAgent,
      },
    });

    // Setup all trackers
    setupConsoleInterceptors();
    const cleanupError = setupErrorHandlers();
    const cleanupNavigation = setupNavigationTracking();
    const cleanupInteraction = setupInteractionTracking();
    const cleanupNetwork = setupNetworkTracking();

    // Cleanup
    return () => {
      cleanupError();
      cleanupNavigation();
      cleanupInteraction();
      cleanupNetwork();

      // Restore console
      if (originalConsole.current) {
        console.log = originalConsole.current.log;
        console.error = originalConsole.current.error;
        console.warn = originalConsole.current.warn;
        console.info = originalConsole.current.info;
      }
    };
  }, [enabled, setupConsoleInterceptors, setupErrorHandlers, setupNavigationTracking, setupInteractionTracking, setupNetworkTracking]);

  return { sendLog };
}

export default useDevLogger;
