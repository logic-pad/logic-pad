import { createLazyFileRoute } from '@tanstack/react-router';
import { memo, ReactNode, useEffect, useMemo, useState } from 'react';
import ResponsiveLayout from '../components/ResponsiveLayout';
import { useOnline } from '../contexts/OnlineContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, queryClient } from '../online/api';
import Loading from '../components/Loading';
import toast from 'react-hot-toast';
import { UserBrief } from '../online/data';
import { useRouteProtection } from '../router/useRouteProtection';
import { FaDiscord, FaGoogle, FaQuestion, FaTrash } from 'react-icons/fa';
import { cn, toRelativeDate } from '../uiHelper';
import AuthProviders from '../online/AuthProviders';
import { IoSettingsSharp } from 'react-icons/io5';
import storedRedirect from '../router/storedRedirect';
import { router } from '../router/router';
import { Account } from '../online/auth';

interface SettingsSectionProps {
  header: ReactNode;
  children: ReactNode;
}

const SettingsSection = memo(function SettingsSection({
  header,
  children,
}: SettingsSectionProps) {
  return (
    <div className="flex gap-4 flex-wrap p-2">
      <div className="flex flex-col gap-2 w-96 max-w-full shrink-0">
        {header}
      </div>
      <div className="flex flex-col gap-4 md:min-w-96 grow">{children}</div>
    </div>
  );
});

const ProfileSettings = memo(function ProfileSettings() {
  const { me, refresh } = useOnline();

  const updateMe = useMutation({
    mutationFn: api.updateMe,
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ['me'] });
      queryClient.setQueryData(['me'], (old: UserBrief) => ({
        ...old,
        name: variables.name,
        description: variables.description,
      }));
      return { me };
    },
    onError(error, _, context) {
      toast.error(error.message);
      queryClient.setQueryData(['me'], context?.me);
    },
    onSettled: async () => {
      await refresh();
    },
  });

  const [username, setUsername] = useState(me?.name ?? '');
  const [description, setDescription] = useState(me?.description ?? '');

  useEffect(() => {
    setUsername(me?.name ?? '');
    setDescription(me?.description ?? '');
  }, [me]);

  if (!me) return null;
  return (
    <SettingsSection
      header={
        <>
          <span className="text-2xl font-semibold">Profile</span>
          <div>Public information on your profile</div>
        </>
      }
    >
      <fieldset className="fieldset w-full shrink-0">
        <div className="label w-full justify-between items-center">
          <span className="label-text text-neutral-content text-lg">
            Username
          </span>
          <span className="label-text-alt text-neutral-content">
            {username.length}/128
          </span>
        </div>
        <input
          type="text"
          placeholder="Type here"
          className="input text-base-content w-full"
          maxLength={128}
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      </fieldset>
      <fieldset className="fieldset w-full shrink-0">
        <div className="label w-full justify-between items-center">
          <span className="label-text text-neutral-content text-lg">
            Description
          </span>
          <span className="label-text-alt text-neutral-content">
            {description.length}/500
          </span>
        </div>
        <textarea
          placeholder="Type here"
          className="textarea textarea-bordered text-base-content w-full"
          maxLength={500}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </fieldset>
      {updateMe.isPending ? (
        <Loading className="self-end w-fit" />
      ) : (
        <button
          className="btn btn-primary self-end max-w-xs"
          onClick={async () => {
            await updateMe.mutateAsync({ name: username, description });
          }}
        >
          Save
        </button>
      )}
    </SettingsSection>
  );
});

const AccountEntry = memo(function AccountEntry({
  account: account,
}: {
  account: Account;
}) {
  const unlinkAccount = useMutation({
    mutationFn: async () => {
      await api.unlinkAccount(account.providerId, account.accountId);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSettled: async () => {
      await queryClient.refetchQueries({ queryKey: ['user', 'accounts'] });
    },
  });
  const Icon = useMemo(() => {
    switch (account.providerId) {
      case 'google':
        return FaGoogle;
      case 'discord':
        return FaDiscord;
      default:
        return FaQuestion;
    }
  }, [account.providerId]);

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        <span className="badge h-8 p-0 border-0 pe-2">
          <Icon className="h-8 w-8 p-2 rounded-full" />
          <span className="capitalize">{account.providerId}</span>
        </span>
        <span>{account.email}</span>
      </div>
      <div className="opacity-70 mt-1">
        Created {toRelativeDate(new Date(account.createdAt))}
      </div>
      <div className="divider my-2" />
      {unlinkAccount.isPending ? (
        <Loading className="w-8 h-8 absolute top-0 right-0" />
      ) : (
        <button
          className="absolute top-0 right-0 btn btn-ghost"
          onClick={() => unlinkAccount.mutate()}
        >
          <FaTrash />
        </button>
      )}
    </div>
  );
});

const AddSignInMethodButton = memo(function AddSignInMethodButton() {
  return (
    <>
      <button
        className="btn btn-primary self-end max-w-xs"
        onClick={() =>
          (
            document.getElementById(
              'add_sign_in_method_modal'
            ) as HTMLDialogElement
          ).showModal()
        }
      >
        Add another sign-in method
      </button>
      <dialog id="add_sign_in_method_modal" className="modal">
        <div className="modal-box text-base-content flex flex-col gap-4">
          <h3 className="font-semibold text-xl">Pick a sign-in method</h3>
          <AuthProviders
            onClick={async provider => {
              const redirectUrl = storedRedirect.set(router.state.location);
              await api.linkAccount(provider, redirectUrl);
            }}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
});

const ChangeEmailControl = memo(function ChangeEmailControl({
  options,
}: {
  options: string[];
}) {
  const { me, refresh } = useOnline();

  const updateMe = useMutation({
    mutationFn: api.updateMe,
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ['me'] });
      queryClient.setQueryData(['me'], (old: UserBrief) => ({
        ...old,
        email: variables.email,
      }));
      return { me };
    },
    onError(error, _, context) {
      toast.error(error.message);
      queryClient.setQueryData(['me'], context?.me);
    },
    onSettled: async () => {
      await refresh();
    },
  });
  const [email, setEmail] = useState(me?.email ?? '');

  useEffect(() => {
    setEmail(me?.email ?? '');
  }, [me]);

  if (!me) return null;
  return (
    <>
      <fieldset className="fieldset w-full shrink-0">
        <div className="label w-full justify-between items-center">
          <span className="label-text text-neutral-content text-lg">
            Primary email
          </span>
        </div>
        <div className="label">
          <span className="label-text text-neutral-content/80 whitespace-normal w-min min-w-full">
            You can create multiple Logic Pad accounts, but each account must
            have a unique primary email. Add a new sign-in method below to use a
            different email.
          </span>
        </div>
        <select
          className="select w-full"
          disabled={options.length < 2}
          value={email}
          onChange={e => setEmail(e.target.value)}
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </fieldset>
      {updateMe.isPending ? (
        <Loading className="self-end w-fit h-10" />
      ) : (
        <button
          className={cn(
            'btn btn-primary self-end max-w-xs',
            options.length < 2 && 'hidden'
          )}
          onClick={async () => {
            await updateMe.mutateAsync({ email });
          }}
        >
          Save
        </button>
      )}
    </>
  );
});

const SecuritySettings = memo(function SecuritySettings() {
  const accountsQuery = useQuery({
    queryKey: ['user', 'accounts'],
    queryFn: api.listAccounts,
  });
  const emailOptions = [
    ...new Set(
      (accountsQuery.data?.map(a => a.email).filter(Boolean) as string[]) ?? []
    ),
  ];
  return (
    <SettingsSection
      header={
        <>
          <span className="text-2xl font-semibold">Security</span>
          <div>Manage primary email and sign-in methods</div>
        </>
      }
    >
      <ChangeEmailControl options={emailOptions} />
      {accountsQuery.isPending ? (
        <Loading />
      ) : (
        <>
          <div className="label w-full justify-between items-center">
            <span className="label-text text-neutral-content text-lg">
              Linked accounts
            </span>
          </div>
          <div>You have linked {accountsQuery.data?.length} accounts</div>
          <div>
            {accountsQuery.data?.map(account => (
              <AccountEntry key={account.id} account={account} />
            ))}
          </div>
        </>
      )}
      <AddSignInMethodButton />
    </SettingsSection>
  );
});

export const Route = createLazyFileRoute('/_layout/settings')({
  component: memo(function Settings() {
    useRouteProtection('login');
    return (
      <ResponsiveLayout>
        <div className="text-3xl mt-8">
          <IoSettingsSharp className="inline-block me-2" />
          Settings
        </div>
        <div className="divider" />
        <ProfileSettings />
        <div className="divider my-4" />
        <SecuritySettings />
      </ResponsiveLayout>
    );
  }),
});
