import { memo } from 'react';
import { IconType } from 'react-icons';
import { FaDiscord, FaGoogle } from 'react-icons/fa';

interface AuthButtonProps {
  label: string;
  icon: IconType;
  onClick: () => void;
}

function AuthButton({ label, icon: Icon, onClick }: AuthButtonProps) {
  return (
    <button
      className="btn btn-outline font-thin text-lg w-full"
      onClick={onClick}
    >
      {<Icon size={24} />}
      {label}
    </button>
  );
}

export interface AuthProvidersProps {
  onClick: (provider: string) => void;
}

export default memo(function AuthProviders({ onClick }: AuthProvidersProps) {
  return (
    <div className="justify-end card-actions flex-col gap-4 w-full">
      <AuthButton
        label="Continue with Google"
        icon={FaGoogle}
        onClick={() => onClick?.('google')}
      />
      <AuthButton
        label="Continue with Discord"
        icon={FaDiscord}
        onClick={() => onClick?.('discord')}
      />
      <p>More options coming soon</p>
    </div>
  );
});
