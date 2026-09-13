/**
 * A small in-memory LRU cache for SSR-rendered HTML pages.
 * Stores at most MAX_ENTRIES pages, each for up to MAX_AGE_MS.
 */
const MAX_ENTRIES = 50;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  html: string;
  createdAt: number;
}

// Map preserves insertion order: the least recently used entry is first.
const cache = new Map<string, CacheEntry>();

export function getCachedPage(key: string): string | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > MAX_AGE_MS) {
    cache.delete(key);
    return null;
  }
  // Mark as most recently used.
  cache.delete(key);
  cache.set(key, entry);
  return entry.html;
}

export function setCachedPage(key: string, html: string): void {
  cache.delete(key);
  cache.set(key, { html, createdAt: Date.now() });
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}
