import { memo, RefObject, useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, queryClient } from '../api';
import toast from 'react-hot-toast';
import { cn } from '../../uiHelper';
import { modPrompt, PromptHandle } from './ModMessagePrompt';
import { UserAccount } from '../data';

const timezoneString = 'Z' + (new Date().toISOString().split('Z')[1] ?? '');

export interface UserStatusProps {
  account: UserAccount | undefined;
  promptHandle: RefObject<PromptHandle | null>;
}

export default memo(function UserStatus({
  account,
  promptHandle,
}: UserStatusProps) {
  const [banUntil, setBanUntil] = useState<string | null>(
    account?.bannedUntil ? account.bannedUntil : null
  );
  useEffect(() => {
    setBanUntil(account?.bannedUntil ? account.bannedUntil : null);
  }, [account?.bannedUntil]);
  const banUser = useMutation({
    mutationFn: (data: Parameters<typeof api.modBanUser>) => {
      return api.modBanUser(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['profile', account?.id, 'account'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['profile', account?.id, 'mod-moderations'],
      });
    },
  });
  const unbanUser = useMutation({
    mutationFn: (data: Parameters<typeof api.modUnbanUser>) => {
      return api.modUnbanUser(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['profile', account?.id, 'account'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['profile', account?.id, 'mod-moderations'],
      });
    },
  });

  const isActive = account?.bannedUntil
    ? new Date(account.bannedUntil) < new Date()
    : true;

  if (account === undefined) return <div className="skeleton h-36 w-72"></div>;

  return (
    <div className="w-72 flex flex-col gap-1">
      <h2
        className={cn(
          'font-semibold text-lg',
          isActive ? 'text-success' : 'text-error'
        )}
      >
        {isActive ? 'Account active' : 'Account banned'}
      </h2>
      <div className="text-xs">
        Banned accounts cannot log in or perform any actions. There is a short
        delay before the ban takes effect due to authentication caching.
      </div>
      <div className="text-xs flex gap-1 items-center">
        <span>Ban until:</span>
        <input
          type="datetime-local"
          className="input input-xs w-fit max-w-xs"
          value={
            banUntil
              ? new Date(banUntil).toISOString().split('Z')[0]
              : undefined
          }
          onChange={e =>
            setBanUntil(new Date(e.target.value + timezoneString).toISOString())
          }
        />
      </div>

      {banUser.isPending || unbanUser.isPending ? (
        <button className={cn('btn btn-xs w-full mt-2 btn-disabled')}>
          Saving...
        </button>
      ) : isActive ? (
        <button
          className={cn('btn btn-xs btn-error w-full mt-2')}
          onClick={() => {
            const expiresInSeconds = banUntil
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date(banUntil).getTime() - new Date().getTime()) / 1000
                  )
                )
              : null;
            if (expiresInSeconds === null || expiresInSeconds < 60) {
              toast.error('Please provide a valid ban duration');
              return;
            }
            modPrompt(
              promptHandle,
              'Explain why this user is being banned. This message will be logged with the action.'
            )
              .then(message => {
                return banUser.mutateAsync([
                  account.id,
                  expiresInSeconds,
                  message ?? '',
                ]);
              })
              .catch(() => {});
          }}
        >
          Ban account
        </button>
      ) : (
        <div className="flex gap-1 w-full">
          <button
            className={cn('btn btn-xs btn-primary flex-1 mt-2')}
            onClick={() => {
              const expiresInSeconds = banUntil
                ? Math.max(
                    0,
                    Math.floor(
                      (new Date(banUntil).getTime() - new Date().getTime()) /
                        1000
                    )
                  )
                : null;
              if (expiresInSeconds === null || expiresInSeconds < 60) {
                toast.error('Please provide a valid ban duration');
                return;
              }
              modPrompt(
                promptHandle,
                'Explain why the ban duration is being modified. This message will be logged with the action.'
              )
                .then(message => {
                  return banUser.mutateAsync([
                    account.id,
                    expiresInSeconds,
                    message ?? '',
                  ]);
                })
                .catch(() => {});
            }}
          >
            Modify duration
          </button>
          <button
            className={cn('btn btn-xs flex-1 mt-2 btn-success')}
            onClick={() => {
              modPrompt(
                promptHandle,
                'Explain why this user is being unbanned early. This message will be logged with the action.'
              )
                .then(message => {
                  return unbanUser.mutateAsync([account.id, message ?? '']);
                })
                .catch(() => {});
            }}
          >
            Unban account
          </button>
        </div>
      )}
    </div>
  );
});
