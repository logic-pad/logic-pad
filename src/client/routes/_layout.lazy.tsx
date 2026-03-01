import {
  Link,
  Outlet,
  createLazyFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { memo, useState } from 'react';
import QuickAccessBar from '../components/QuickAccessBar';
import { useMediaQuery } from 'react-responsive';
import { RiMenu2Fill } from 'react-icons/ri';
import PWAPrompt from '../components/PWAPrompt';
import { useOnline } from '../contexts/OnlineContext';
import NavigationSkip from '../components/NavigationSkip';
import { FaInfo } from 'react-icons/fa';
import storedRedirect from '../router/storedRedirect';
import { router } from '../router/router';

const SignInPrompt = memo(function SignInPrompt() {
  const navigate = useNavigate();
  const location = useRouterState({ select: s => s.location });
  const [showSignInPrompt, setShowSignInPrompt] = useState(
    sessionStorage.getItem('showSignInPrompt') !== 'false'
  );
  if (!showSignInPrompt) return null;
  if (location.pathname === '/create') return null;
  return (
    <div className="alert alert-soft py-1 px-2 max-[1440px]:hidden shrink-0">
      <FaInfo size={16} />
      <span>
        Consider{' '}
        <a
          className="link"
          onClick={() => {
            void navigate({
              to: '/auth',
              search: {
                redirect: storedRedirect.set(router.state.location),
              },
            });
          }}
        >
          signing in
        </a>{' '}
        for a better experience
      </span>
      <button
        className="btn btn-sm btn-square btn-ghost"
        onClick={() => {
          setShowSignInPrompt(false);
          sessionStorage.setItem('showSignInPrompt', 'false');
        }}
      >
        ✕
      </button>
    </div>
  );
});

export const Route = createLazyFileRoute('/_layout')({
  component: memo(function Layout() {
    const { isOnline, me, isPending } = useOnline();
    const isLargeMedia = useMediaQuery({ minWidth: 1024 });
    const navLinks = [
      <Link
        key="create"
        to="/create"
        className="text-lg text-neutral-content flex items-center gap-2"
      >
        Create
      </Link>,
    ];
    if (isOnline) {
      navLinks.push(
        <Link
          key="search"
          to="/search"
          className="text-lg text-neutral-content flex items-center gap-2"
        >
          Explore
        </Link>
      );
      navLinks.push(
        <Link
          key="uploader"
          to="/uploader"
          className="text-lg text-neutral-content flex items-center gap-2"
        >
          Upload
        </Link>
      );
    }
    return (
      <>
        <PWAPrompt />
        <NavigationSkip />
        <header className="flex shrink-0 flex-wrap justify-between items-center lg:gap-4 px-8 py-2">
          <nav className="flex xl:basis-[320px] flex-wrap grow shrink items-center gap-8 lg:gap-12">
            {!isLargeMedia && (
              <div className="dropdown">
                <div tabIndex={0} role="button" className="btn btn-ghost">
                  <RiMenu2Fill size={20} />
                </div>
                <ul
                  tabIndex={0}
                  className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow-sm"
                >
                  {navLinks.map(link => (
                    <li key={link.key}>{link}</li>
                  ))}
                  {!isOnline && (
                    <li>
                      <div className="opacity-80">
                        Go online for more features
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}
            <Link
              to="/"
              className="text-xl md:text-3xl text-neutral-content flex items-center gap-2 font-serif"
            >
              <img
                src="/logo.svg"
                className="w-8 h-8 inline-block"
                alt="Logic Pad logo"
              />
              Logic Pad
            </Link>
            {isLargeMedia && navLinks}
            {isLargeMedia && !isOnline && (
              <div className="opacity-80">Go online for more features</div>
            )}
          </nav>
          {!isPending && !me && <SignInPrompt />}
          <QuickAccessBar className="xl:basis-[320px] grow shrink justify-end" />
        </header>
        <span
          id="main-content"
          tabIndex={-1}
          className="sr-only"
          aria-label="Start of main content"
        ></span>
        <Outlet />
      </>
    );
  }),
});
