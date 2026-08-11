function normalizeMessage(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => normalizeMessage(item))
      .filter((item): item is string => Boolean(item));
    return parts.length ? parts.join(', ') : null;
  }
  if (value && typeof value === 'object' && 'message' in value) {
    return normalizeMessage((value as { message?: unknown }).message);
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const err = error as {
    response?: { data?: { message?: unknown; error?: unknown } };
    message?: unknown;
  };

  return (
    normalizeMessage(err?.response?.data?.message) ??
    normalizeMessage(err?.response?.data?.error) ??
    normalizeMessage(err?.message) ??
    fallback
  );
}
