import { memo, useRef } from 'react';
import { useOnline } from '../contexts/OnlineContext';
import { IoCloudOffline } from 'react-icons/io5';
import { api } from '../online/api';
import Loading from './Loading';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { FaBan } from 'react-icons/fa';
import { RiRefreshFill } from 'react-icons/ri';
import { cleanReload } from './settings/ResetSite';
import Avatar from '../online/Avatar';
import SupporterBadge from './SupporterBadge';
import storedRedirect from '../router/storedRedirect';

// million-ignore
export default memo(function AccountControl() {
  const { isOnline, versionMismatch, me, isPending, refresh } = useOnline();
  const location = useRouterState({ select: s => s.location });
  const navigate = useNavigate();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  if (versionMismatch) {
    return (
      <div
        className="btn btn-square btn-accent ms-4 px-4 shrink-0 w-fit"
        role="button"
        onClick={cleanReload}
      >
        <RiRefreshFill size={22} />
        Update site
      </div>
    );
  }
  if (!isOnline) {
    return (
      <div
        className="btn btn-square btn-disabled ms-4 px-4 shrink-0 w-fit"
        role="button"
      >
        <IoCloudOffline />
        Offline
      </div>
    );
  }
  if (isPending) {
    return (
      <button
        className="btn btn-square ms-4 px-4 shrink-0 w-fit"
        aria-label="Loading"
      >
        <Loading className="w-20 h-8" />
      </button>
    );
  }
  if (!me) {
    if (location.pathname === '/create') {
      // Disable button in create mode because this loses puzzle data
      // users should sign in via the online panel instead
      return (
        <>
          <div
            className="btn btn-square btn-disabled ms-4 px-4 shrink-0 w-fit"
            role="button"
          >
            <FaBan />
            Not signed in
          </div>
        </>
      );
    }
    return (
      <>
        <button
          className="btn btn-square ms-4 px-4 shrink-0 w-fit"
          onClick={async () => {
            await navigate({
              to: '/auth',
              search: {
                redirect: storedRedirect.set(location),
              },
            });
          }}
        >
          Sign in / sign up
        </button>
      </>
    );
  }
  return (
    <details ref={detailsRef} className="dropdown dropdown-end">
      <summary
        className="btn btn-square ms-4 px-4 shrink-0 w-fit"
        role="button"
        aria-label="Account menu"
      >
        <Avatar
          userId={me.id}
          username={me.name}
          className="w-8 h-8"
          aria-hidden="true"
        />
        <span aria-hidden="true">
          {me.name}
          <SupporterBadge supporter={me.supporter} />
        </span>
      </summary>
      <ul
        className="menu dropdown-content bg-base-300 text-base-content rounded-box z-50 w-52 mt-2 p-2 shadow-lg"
        role="menu"
      >
        <li role="presentation">
          <Link
            to="/profile/$userId"
            role="menuitem"
            params={{ userId: me.id }}
            onClick={() => (detailsRef.current!.open = false)}
          >
            Profile
          </Link>
        </li>
        <li role="presentation">
          <Link
            to="/my-stuff"
            role="menuitem"
            onClick={() => (detailsRef.current!.open = false)}
          >
            My stuff
          </Link>
        </li>
        <li role="presentation">
          <Link
            to="/settings"
            role="menuitem"
            onClick={() => (detailsRef.current!.open = false)}
          >
            Settings
          </Link>
        </li>
        <li role="presentation">
          <a
            role="menuitem"
            onClick={async () => {
              await api.logout();
              await refresh();
              detailsRef.current!.open = false;
            }}
          >
            Logout
          </a>
        </li>
      </ul>
    </details>
  );
});
