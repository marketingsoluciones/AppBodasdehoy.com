/**
 * Retry utility with exponential backoff.
 * Only retries on network errors and 5xx responses, never on 4xx.
 */

export interface RetryOptions {
  /** Max number of retries. Defaults to 2. */
  maxRetries?: number;
  /** Initial delay in ms. Defaults to 1000. */
  initialDelay?: number;
  /** Backoff multiplier. Defaults to 2 (exponential). */
  backoffMultiplier?: number;
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true; // Unknown errors → retry

  const err = error as Record<string, any>;

  // HTTP status in error
  const status = err.status ?? err.statusCode ?? err.response?.status;
  if (typeof status === 'number') {
    // 4xx → don't retry (client error)
    if (status >= 400 && status < 500) return false;
    // 5xx → retry
    if (status >= 500) return true;
  }

  // Network errors are retryable
  const message = String(err.message || '').toLowerCase();
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('econnreset') ||
    message.includes('timeout') ||
    message.includes('aborted')
  ) {
    return true;
  }

  return true;
}

/**
 * Wrap an async function with retry logic.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 2, initialDelay = 1000, backoffMultiplier = 2 } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
