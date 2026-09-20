import { useAtomValue, useSetAtom, atom } from 'jotai';
import { atomWithQuery } from 'jotai-tanstack-query';
import { memo, useEffect, useMemo } from 'react';
import semverSatisfies from 'semver/functions/satisfies';
import toast from 'react-hot-toast';
import { api, queryClient } from '../online/api';
import { MeBrief } from '../online/data';
import { settingsAtom } from './settings';
import { cleanReload } from '../components/settings/ResetSite';
import storedRedirect from '../router/storedRedirect';
import { router } from '../router/router';

const defaultOnline = true;
const apiVersionRange = '20.x';

/**
 * Scoped to true inside embedded editors and preview modals,
 * where online features must be disabled.
 */
export const forceOfflineAtom = atom(false);

const offlineModeAtom = atom(get => get(settingsAtom).offlineMode);

const isOnlineQueryAtom = atomWithQuery(
  get => ({
    queryKey: ['isOnline'],
    queryFn: api.isOnline,
    enabled: !get(offlineModeAtom),
  }),
  () => queryClient
);

export const isOnlineAtom = atom(get => {
  if (get(forceOfflineAtom) || get(offlineModeAtom)) return false;
  const { data } = get(isOnlineQueryAtom);
  if (data) return semverSatisfies(data.version, apiVersionRange);
  // data === undefined means the query is still pending: assume online
  return data === null ? false : defaultOnline;
});

export const versionMismatchAtom = atom(get => {
  if (get(forceOfflineAtom)) return false;
  const { data } = get(isOnlineQueryAtom);
  return data ? !semverSatisfies(data.version, apiVersionRange) : false;
});

const meQueryAtom = atomWithQuery(
  get => ({
    queryKey: ['me'],
    queryFn: api.getMe,
    enabled: get(isOnlineAtom),
  }),
  () => queryClient
);

export const meAtom = atom(get => {
  if (!get(isOnlineAtom)) return null;
  return get(meQueryAtom).data ?? null;
});

export const isPendingAtom = atom(get => {
  if (get(forceOfflineAtom)) return false;
  if (get(isOnlineQueryAtom).isLoading) return true;
  return get(isOnlineAtom) && get(meQueryAtom).isLoading;
});

export const refreshAtom = atom(null, async () => {
  await queryClient.refetchQueries({ queryKey: ['isOnline'], type: 'all' });
  await queryClient.refetchQueries({ queryKey: ['me'], type: 'all' });
});

export interface OnlineState {
  /**
   * True if the server is reachable.
   */
  isOnline: boolean;
  /**
   * True if the server is reachable but the API version is incompatible.
   */
  versionMismatch: boolean;
  /**
   * The current user, or null if not logged in or offline.
   */
  me: MeBrief | null;
  /**
   * Whether the online status or user data is currently being fetched.
   */
  isPending: boolean;
  /**
   * Refresh the online status and user data.
   */
  refresh: () => Promise<void>;
}

export function useOnline(): OnlineState {
  const isOnline = useAtomValue(isOnlineAtom);
  const versionMismatch = useAtomValue(versionMismatchAtom);
  const me = useAtomValue(meAtom);
  const isPending = useAtomValue(isPendingAtom);
  const refresh = useSetAtom(refreshAtom);
  return useMemo(
    () => ({ isOnline, versionMismatch, me, isPending, refresh }),
    [isOnline, versionMismatch, me, isPending, refresh]
  );
}

/**
 * Watches for API version mismatches and reloads the page to recover.
 * Mount once at the app root.
 */
export const VersionMismatchWatcher = memo(function VersionMismatchWatcher() {
  const versionMismatch = useAtomValue(versionMismatchAtom);
  const isOnline = useAtomValue(isOnlineAtom);
  const { data } = useAtomValue(isOnlineQueryAtom);

  useEffect(() => {
    if (versionMismatch) {
      const reloadData = sessionStorage.getItem('versionMismatchReload');
      const reloadCount = reloadData ? parseInt(reloadData, 10) : 0;
      if (reloadCount >= 2) {
        console.error(
          `Version mismatch ${data!.version} != ${apiVersionRange} - max reloads reached`
        );
        const toastId = toast.error(
          'This version is out of date. Please refresh the page or try again later.'
        );
        return () => {
          toast.dismiss(toastId);
        };
      } else {
        console.warn(
          `Version mismatch ${data!.version} != ${apiVersionRange} - reload page attempt ${reloadCount + 1}`
        );
        sessionStorage.setItem(
          'versionMismatchReload',
          (reloadCount + 1).toString()
        );
        if (reloadCount === 0) {
          console.warn(
            `Version mismatch ${data!.version} != ${apiVersionRange} - redirect set to ${router.state.location.href}`
          );
          storedRedirect.set(router.state.location);
        }
        void cleanReload();
      }
    } else if (data && isOnline) {
      console.info(`Version up to date ${data.version} == ${apiVersionRange}`);
      if (sessionStorage.getItem('versionMismatchReload')) {
        sessionStorage.removeItem('versionMismatchReload');
        void storedRedirect.execute();
      }
    }
  }, [versionMismatch, data, isOnline]);

  return null;
});
