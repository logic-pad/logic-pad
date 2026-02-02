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
import { toRelativeDate } from '../uiHelper';
import AuthProviders from '../online/AuthProviders';
import { IoSettingsSharp } from 'react-icons/io5';
import deferredRedirect from '../router/deferredRedirect';

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
  useRouteProtection('login');
  const { me, refresh } = useOnline();

  const updateMe = useMutation({
    mutationFn: api.updateMe,
    onMutate: async variables => {
      await queryClient.cancelQueries({ queryKey: ['me'] });
      queryClient.setQueryData(['me'], (old: UserBrief) => ({
        ...old,
        name: variables.name,
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

const IdentityEntry = memo(function IdentityEntry({
  identity,
}: {
  identity: Identity;
}) {
  const deleteIdentity = useMutation({
    mutationFn: api.deleteIdentity,
    onError(error) {
      toast.error(error.message);
    },
    onSettled: async () => {
      await queryClient.refetchQueries({ queryKey: ['user', 'identities'] });
    },
  });
  const Icon = useMemo(() => {
    switch (identity.provider) {
      case 'google':
        return FaGoogle;
      case 'discord':
        return FaDiscord;
      default:
        return FaQuestion;
    }
  }, [identity.provider]);

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        <span className="badge h-8 p-0 border-0 pe-2">
          <Icon className="h-8 w-8 p-2 rounded-full" />
          <span className="capitalize">{identity.provider}</span>
        </span>
        <span>{identity.email}</span>
      </div>
      <div className="opacity-70 mt-1">
        Created {toRelativeDate(new Date(identity.createdAt))}
      </div>
      <div className="divider my-2" />
      {deleteIdentity.isPending ? (
        <Loading className="w-8 h-8 absolute top-0 right-0" />
      ) : (
        <button
          className="absolute top-0 right-0 btn btn-ghost"
          onClick={() => deleteIdentity.mutate(identity.id)}
        >
          <FaTrash />
        </button>
      )}
    </div>
  );
});

const AddProviderButton = memo(function AddProviderButton() {
  return (
    <>
      <button
        className="btn btn-primary self-end max-w-xs"
        onClick={() =>
          (
            document.getElementById('add_provider_modal') as HTMLDialogElement
          ).showModal()
        }
      >
        Log in with a new provider
      </button>
      <dialog id="add_provider_modal" className="modal">
        <div className="modal-box text-base-content flex flex-col gap-4">
          <h3 className="font-semibold text-xl">
            Add a provider to your account
          </h3>
          <AuthProviders
            onBeforeRedirect={() => deferredRedirect.set({ to: '/settings' })}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
});

const IdentitiesSettings = memo(function IdentitiesSettings() {
  const identitiesQuery = useQuery({
    queryKey: ['user', 'identities'],
    queryFn: api.listIdentities,
  });
  return (
    <SettingsSection
      header={
        <>
          <span className="text-2xl font-semibold">Providers</span>
          <div>Identity providers that you use to log in</div>
        </>
      }
    >
      {identitiesQuery.isPending ? (
        <Loading />
      ) : (
        <>
          <div>
            This account is associated with {identitiesQuery.data?.total}{' '}
            providers
          </div>
          <div>
            {identitiesQuery.data?.results.map(identity => (
              <IdentityEntry key={identity.id} identity={identity} />
            ))}
          </div>
        </>
      )}
      <AddProviderButton />
    </SettingsSection>
  );
});

export const Route = createLazyFileRoute('/_layout/settings')({
  component: memo(function Settings() {
    return (
      <ResponsiveLayout>
        <div className="text-3xl mt-8">
          <IoSettingsSharp className="inline-block me-2" />
          Settings
        </div>
        <div className="divider" />
        <ProfileSettings />
        <div className="divider my-4" />
        <IdentitiesSettings />
      </ResponsiveLayout>
    );
  }),
});
