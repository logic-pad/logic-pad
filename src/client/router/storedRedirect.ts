import type { NavigateOptions } from '@tanstack/react-router';

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
    const location = JSON.parse(serialized) as NavigateOptions;
    try {
      const { router } = await import('./router');
      await router.navigate(location);
      return true;
    } catch {
      return false;
    }
  }
}

export default new StoredRedirect();
