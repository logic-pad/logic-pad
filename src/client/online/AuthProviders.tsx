import { memo } from 'react';
import { IconType } from 'react-icons';
import { api } from './api';
import { FaDiscord, FaGoogle } from 'react-icons/fa';

interface AuthButtonProps {
  provider: string;
  label: string;
  icon: IconType;
  onBeforeRedirect?: () => void;
}

function AuthButton({
  provider,
  label,
  icon: Icon,
  onBeforeRedirect,
}: AuthButtonProps) {
  return (
    <button
      className="btn btn-outline font-thin text-lg w-full"
      onClick={async () => {
        onBeforeRedirect?.();
        const successUrl = new URL(window.location.origin);
        successUrl.searchParams.set('test', 'erf4tg5h64g5rfgtr');
        const errorUrl = new URL(window.location.origin);
        errorUrl.pathname = 'auth';
        errorUrl.searchParams.set('error', 'oauth_failed');
        await api.signInWithOAuth(
          provider,
          successUrl.toString(),
          errorUrl.toString()
        );
      }}
    >
      {<Icon size={24} />}
      {label}
    </button>
  );
}

export interface AuthProvidersProps {
  onBeforeRedirect?: () => void;
}

export default memo(function AuthProviders(props: AuthProvidersProps) {
  return (
    <div className="justify-end card-actions flex-col gap-4 w-full">
      <AuthButton
        provider="google"
        label="Continue with Google"
        icon={FaGoogle}
        {...props}
      />
      <AuthButton
        provider="discord"
        label="Continue with Discord"
        icon={FaDiscord}
        {...props}
      />
      <p>More providers coming soon</p>
    </div>
  );
});
