import type { NavigateOptions } from '@tanstack/react-router';
import { router } from './router';

class StoredRedirect {
  set(location: NavigateOptions): string {
    sessionStorage.setItem('redirect', JSON.stringify(location));
    const url = new URL('/redirect', window.location.origin);
    return url.toString();
  }

  clear() {
    sessionStorage.removeItem('redirect');
  }

  async execute(): Promise<boolean> {
    const serialized = sessionStorage.getItem('redirect');
    sessionStorage.removeItem('redirect');
    if (!serialized) return false;
    const location = JSON.parse(serialized) as NavigateOptions & {
      publicHref?: string;
    };
    try {
      // The stored `href` is router-internal, so it carries no locale prefix:
      // navigating with it would silently drop the language the user signed in
      // from. Re-enter through `publicHref` instead — the rewrite strips it back
      // down to the same route while restoring the locale.
      await router.navigate({
        ...location,
        ...(location.publicHref ? { href: location.publicHref } : {}),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default new StoredRedirect();
