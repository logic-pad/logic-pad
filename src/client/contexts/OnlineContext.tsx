import { useQuery } from '@tanstack/react-query';
import React, { createContext, memo, use, useEffect, useMemo } from 'react';
import { api } from '../online/api';
import { MeBrief } from '../online/data';
import { useSettings } from './SettingsContext';
import semverSatisfies from 'semver/functions/satisfies';
import toast from 'react-hot-toast';
import { cleanReload } from '../components/settings/ResetSite';
import deferredRedirect from '../router/deferredRedirect';
import { router } from '../router/router';

const defaultOnline = true;
const apiVersionRange = '18.x';

export interface OnlineContext {
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

const Context = createContext<OnlineContext>({
  isOnline: defaultOnline,
  versionMismatch: false,
  me: null,
  isPending: false,
  refresh: async () => {},
});

export const useOnline = () => {
  return use(Context);
};

export const OnlineConsumer = Context.Consumer;

export default memo(function OnlineContext({
  children,
  forceOffline,
}: {
  children: React.ReactNode;
  forceOffline?: boolean;
}) {
  forceOffline ??= false;
  const [offlineMode] = useSettings('offlineMode');

  const onlineQuery = useQuery({
    queryKey: ['isOnline'],
    queryFn: api.isOnline,
    enabled: !forceOffline && !offlineMode,
  });

  const onlineResult = useMemo(() => {
    let apiOnline = defaultOnline;
    let versionMismatch = false;
    if (onlineQuery.data) {
      if (semverSatisfies(onlineQuery.data.version, apiVersionRange)) {
        apiOnline = true;
      } else {
        apiOnline = false;
        versionMismatch = true;
      }
    } else if (onlineQuery.data === null) {
      apiOnline = false;
    }
    return {
      isOnline: !forceOffline && !offlineMode && apiOnline,
      versionMismatch,
    };
  }, [forceOffline, offlineMode, onlineQuery]);

  useEffect(() => {
    if (onlineResult.versionMismatch) {
      const reloadData = sessionStorage.getItem('versionMismatchReload');
      const reloadCount = reloadData ? parseInt(reloadData, 10) : 0;
      if (reloadCount >= 2) {
        console.error(
          `Version mismatch ${onlineQuery.data!.version} != ${apiVersionRange} - max reloads reached`
        );
        const toastId = toast.error(
          'This version is out of date, but automatically updates have failed.'
        );
        return () => {
          toast.dismiss(toastId);
        };
      } else {
        console.warn(
          `Version mismatch ${onlineQuery.data!.version} != ${apiVersionRange} - reload page attempt ${reloadCount + 1}`
        );
        sessionStorage.setItem(
          'versionMismatchReload',
          (reloadCount + 1).toString()
        );
        if (reloadCount === 0) {
          console.warn(
            `Version mismatch ${onlineQuery.data!.version} != ${apiVersionRange} - redirect set to ${router.state.location.href}`
          );
          deferredRedirect.set(router.state.location);
        }
        void cleanReload();
      }
    } else if (onlineQuery.data && onlineResult.isOnline) {
      console.info(
        `Version up to date ${onlineQuery.data.version} == ${apiVersionRange}`
      );
      if (sessionStorage.getItem('versionMismatchReload')) {
        sessionStorage.removeItem('versionMismatchReload');
        void deferredRedirect.execute();
      }
    }
  }, [onlineResult.versionMismatch, onlineQuery.data, onlineResult.isOnline]);

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.getMe,
    enabled: onlineResult.isOnline,
  });

  const value = useMemo(
    () => ({
      ...onlineResult,
      me: meQuery.data ?? null,
      isPending: onlineQuery.isLoading || meQuery.isLoading,
      refresh: async () => {
        await onlineQuery.refetch();
        await meQuery.refetch();
      },
    }),
    [onlineResult, onlineQuery, meQuery]
  );

  return <Context value={value}>{children}</Context>;
});
