type ErrorSeverity = 'error' | 'warning' | 'info';

type LogOptions = {
  component?: string;
  stack?: string | null;
  severity?: ErrorSeverity;
  context?: Record<string, string>;
  url?: string;
};

const LOG_ENDPOINT = '/api/logs/client';
const MAX_CACHE_SIZE = 50;
const DUPLICATE_TTL_MS = 60_000;

const loggedSignatures = new Map<string, number>();

const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
const bearerPattern = /Bearer\s+[A-Za-z0-9\-_.+/=]+/gi;

const NOISY_ERROR_MESSAGES = new Set([
  'ResizeObserver loop limit exceeded',
  'Script error.',
]);

export function attachGlobalErrorHandlers() {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('error', (event) => {
    if (!event.message) {
      return;
    }

    if (NOISY_ERROR_MESSAGES.has(event.message)) {
      return;
    }

    const stack =
      event.error?.stack ??
      [event.filename, event.lineno, event.colno]
        .filter(Boolean)
        .join(':');

    logClientError(event.message, {
      stack,
      component: 'window.onerror',
      context: {
        source: 'global_error',
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;

    if (reason instanceof Error) {
      logClientError(reason.message, {
        stack: reason.stack ?? null,
        component: 'window.onunhandledrejection',
        context: {
          source: 'unhandled_rejection',
        },
      });
    } else if (typeof reason === 'string') {
      logClientError(reason, {
        component: 'window.onunhandledrejection',
        context: {
          source: 'unhandled_rejection',
        },
      });
    } else {
      logClientError('Unhandled promise rejection', {
        component: 'window.onunhandledrejection',
        context: {
          source: 'unhandled_rejection',
          reason: safeStringify(reason),
        },
      });
    }
  });
}

export function logClientError(message: string, options: LogOptions = {}) {
  sendLog(message, {
    ...options,
    severity: options.severity ?? 'error',
  });
}

export function logClientWarning(message: string, options: LogOptions = {}) {
  sendLog(message, {
    ...options,
    severity: 'warning',
  });
}

export function logClientInfo(message: string, options: LogOptions = {}) {
  sendLog(message, {
    ...options,
    severity: 'info',
  });
}

function sendLog(message: string, options: LogOptions) {
  if (!shouldSendLogs()) {
    if (!import.meta.env.PROD) {
      console.debug('[clientLogger] skipped (env):', message, options);
    }
    return;
  }

  const sanitizedMessage = sanitize(message);
  const sanitizedStack = options.stack ? sanitize(options.stack) : undefined;
  const url = options.url ?? (typeof window !== 'undefined' ? window.location.pathname : undefined);
  const context = sanitizeContext(options.context);

  const signature = `${sanitizedMessage}|${options.component ?? 'unknown'}|${sanitizedStack ?? ''}`;
  if (isDuplicate(signature)) {
    return;
  }

  const payload = {
    message: sanitizedMessage,
    stackTrace: truncated(sanitizedStack, 4000),
    component: options.component ?? 'unknown',
    severity: options.severity ?? 'error',
    url,
    context,
  };

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(LOG_ENDPOINT, blob);
      return;
    } catch {
      // fall back to fetch
    }
  }

  fetch(LOG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => {
    // Suppress fetch errors to avoid cascading failures.
  });
}

function sanitize(value: string): string {
  return value.replace(emailPattern, '[redacted-email]').replace(bearerPattern, 'Bearer [redacted-token]');
}

function sanitizeContext(context?: Record<string, string>): Record<string, string> | undefined {
  if (!context) {
    return undefined;
  }

  const result: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(context)) {
    if (!key) {
      continue;
    }

    if (isSensitiveKey(key)) {
      continue;
    }

    const sanitizedValue = sanitize(rawValue ?? '');
    result[key] = truncated(sanitizedValue, 256);
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

function isSensitiveKey(key: string): boolean {
  const lowered = key.toLowerCase();
  return lowered.includes('email') ||
    lowered.includes('phone') ||
    lowered.includes('token') ||
    lowered.includes('secret') ||
    lowered.includes('password') ||
    lowered.includes('name');
}

function shouldSendLogs(): boolean {
  return typeof window !== 'undefined' && import.meta.env.PROD;
}

function truncated(value: string | undefined, maxLength: number): string | undefined {
  if (!value) {
    return value;
  }

  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

function isDuplicate(signature: string): boolean {
  const now = Date.now();
  const previous = loggedSignatures.get(signature);

  if (previous && now - previous < DUPLICATE_TTL_MS) {
    return true;
  }

  loggedSignatures.set(signature, now);

  if (loggedSignatures.size > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const entries = Array.from(loggedSignatures.entries()).sort((a, b) => a[1] - b[1]);
    while (entries.length > MAX_CACHE_SIZE) {
      const [key] = entries.shift()!;
      loggedSignatures.delete(key);
    }
  }

  return false;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

