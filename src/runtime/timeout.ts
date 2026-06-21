export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), { once: true });
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}
