const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const coerceStringArray = (value: unknown): string[] => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : undefined))
      .filter((entry): entry is string => Boolean(entry && entry.length > 0));
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap(coerceStringArray);
  }

  return [];
};

export interface ParsedApiError {
  status?: number;
  messages: string[];
}

export const parseApiError = (error: unknown): ParsedApiError => {
  const messages: string[] = [];
  let status: number | undefined;

  if (!isRecord(error) || !('response' in error)) {
    return { status, messages };
  }

  const responseCandidate = (error as { response?: unknown }).response;
  if (!isRecord(responseCandidate)) {
    return { status, messages };
  }

  const response = responseCandidate as { status?: unknown; data?: unknown };

  if (typeof response.status === 'number') {
    status = response.status;
  }

  if (!isRecord(response.data)) {
    return { status, messages };
  }

  const data = response.data as { message?: unknown; errors?: unknown };

  const primaryMessage = coerceStringArray(data.message)[0];
  if (primaryMessage) {
    messages.push(primaryMessage);
  }

  const errorMessages = coerceStringArray(data.errors);
  errorMessages.forEach((msg) => {
    if (!messages.includes(msg)) {
      messages.push(msg);
    }
  });

  return { status, messages };
};

export const getPrimaryErrorMessage = (error: unknown, fallback: string): string => {
  const { messages } = parseApiError(error);
  return messages[0] ?? fallback;
};

