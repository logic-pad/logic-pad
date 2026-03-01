import {
  Link,
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useOnline } from '../contexts/OnlineContext';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import AuthProviders from '../online/AuthProviders';
import PWAPrompt from '../components/PWAPrompt';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { api } from '../online/api';

export const Route = createFileRoute('/auth')({
  validateSearch: zodValidator(
    z.object({
      redirect: z.string().min(1).optional().catch(undefined),
      error: z.unknown().optional().catch(undefined),
    })
  ),
  remountDeps: ({ search }) =>
    `redirect=${search.search?.redirect},error=${String(search.search?.error)}`,
  component: function Auth() {
    const { isOnline, me } = useOnline();
    const navigate = useNavigate();
    const { error } = Route.useSearch();
    const location = useRouterState({ select: s => s.location });
    useEffect(() => {
      void (async () => {
        if (!isOnline) {
          toast.error('Failed to sign in because you are offline');
          const redirect = new URL(
            location.search?.redirect ?? window.location.origin
          );
          await navigate({
            to: redirect.pathname + redirect.search + redirect.hash,
          });
        }
        if (me) {
          toast.success('Signed in automatically');
          const redirect = new URL(
            location.search?.redirect ?? window.location.origin
          );
          await navigate({
            to: redirect.pathname + redirect.search + redirect.hash,
          });
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline, me]);
    return (
      <div className="flex items-center justify-center w-full h-full min-h-screen">
        <PWAPrompt />
        <div className="card bg-base-100 card-lg shadow-xs overflow-hidden max-w-full w-[500px] m-4">
          <div className="bg-base-200 p-4">
            <Link
              to="/"
              className="text-xl text-neutral-content flex items-center gap-2 font-serif"
            >
              <img
                src="/logo.svg"
                className="w-8 h-8 inline-block"
                alt="Logic Pad logo"
              />
              Logic Pad
            </Link>
          </div>
          <div className="card-body gap-8">
            <div>
              <h2 className="card-title font-thin text-3xl">
                Continue with an account
              </h2>
              <p className="text-lg">Sign in or sign up here</p>
            </div>
            {!!error && (
              <div className="alert alert-error alert-outline">
                <p>Something went wrong. Please try again.</p>
              </div>
            )}
            <AuthProviders
              onClick={async provider => {
                const redirect = location.search?.redirect;
                const errorUrl = new URL('/auth', window.location.origin);
                errorUrl.searchParams.set('error', 'true');
                if (redirect) errorUrl.searchParams.set('redirect', redirect);
                await api.signInWithOAuth(
                  provider,
                  redirect ?? new URL('/', window.location.origin).toString(),
                  errorUrl.toString()
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  },
});
