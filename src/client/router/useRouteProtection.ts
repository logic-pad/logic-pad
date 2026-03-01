import { useEffect } from 'react';
import { useOnline } from '../contexts/OnlineContext';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import storedRedirect from './storedRedirect';
import toast from 'react-hot-toast';

export const useRouteProtection = (level: 'online' | 'login' | 'moderator') => {
  const { isOnline, me, isPending } = useOnline();
  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  useEffect(() => {
    if (isPending) return;
    if (level === 'online' && !isOnline) {
      toast.error('You have to be online to access this page');
      void navigate({ to: '/', replace: true });
    } else if (
      (level === 'login' || level === 'moderator') &&
      (!isOnline || !me)
    ) {
      if (isOnline) {
        toast.error('You have to log in to access this page');
        void navigate({
          to: '/auth',
          search: {
            redirect: storedRedirect.set(location),
          },
          replace: true,
        });
      } else {
        toast.error('You have to be online to access this page');
        void navigate({ to: '/', replace: true });
      }
    } else if (
      level === 'moderator' &&
      (!isOnline || !me?.roles.includes('moderator'))
    ) {
      toast.error('You have to be a moderator to access this page');
      void navigate({ to: '/', replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending]);
};
