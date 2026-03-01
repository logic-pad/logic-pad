import { memo, RefObject, useEffect, useState } from 'react';
import { userRestrictionsQueryOptions } from '../../routes/_moderator.mod.profile.$userId';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, queryClient } from '../api';
import toast from 'react-hot-toast';
import { cn } from '../../uiHelper';
import { modPrompt, PromptHandle } from './ModMessagePrompt';

const timezoneString = 'Z' + (new Date().toISOString().split('Z')[1] ?? '');

const RestrictionEntry = memo(function RestrictionEntry({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex gap-2 self-stretch justify-between items-center">
      <label className="font-semibold capitalize">{label}</label>
      <div className="flex gap-1 items-center">
        {value ? (
          <>
            <input
              type="datetime-local"
              className="input input-xs w-fit max-w-xs"
              value={new Date(value).toISOString().split('Z')[0]}
              onChange={e =>
                onChange(
                  new Date(e.target.value + timezoneString).toISOString()
                )
              }
            />
            <button
              className="btn btn-xs btn-neutral"
              onClick={() => onChange(null)}
            >
              Clear
            </button>
          </>
        ) : (
          <button
            className="btn btn-xs btn-error"
            onClick={() => onChange(new Date().toISOString())}
          >
            Set
          </button>
        )}
      </div>
    </div>
  );
});

export interface UserRestrictionsProps {
  userId: string;
  promptHandle: RefObject<PromptHandle | null>;
}

export default memo(function UserRestrictions({
  userId,
  promptHandle,
}: UserRestrictionsProps) {
  const { data: userRestrictions } = useQuery(
    userRestrictionsQueryOptions(userId)
  );
  const [newRestrictions, setNewRestrictions] = useState(
    userRestrictions ?? {
      comments: null,
      collections: null,
      puzzles: null,
      ratings: null,
    }
  );
  useEffect(() => {
    if (userRestrictions) setNewRestrictions(userRestrictions);
  }, [userRestrictions]);
  const saveRestrictions = useMutation({
    mutationFn: (data: Parameters<typeof api.modUpdateRestrictions>) => {
      return api.modUpdateRestrictions(...data);
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      void queryClient.invalidateQueries({
        queryKey: ['profile', userId, 'restrictions'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['profile', userId, 'mod-moderations'],
      });
    },
  });

  if (!userRestrictions) return <div className="skeleton h-36 w-96"></div>;

  const isEqual = Object.entries(userRestrictions).every(([key, value]) => {
    return newRestrictions[key as keyof typeof newRestrictions] === value;
  });

  return (
    <div className="w-96 flex flex-col gap-1">
      <h2 className="font-semibold text-lg">Restrictions</h2>
      {Object.entries(newRestrictions).map(([key, value]) => (
        <RestrictionEntry
          key={key}
          label={key}
          value={value as string | null}
          onChange={newValue => {
            setNewRestrictions(prev => ({ ...prev, [key]: newValue }));
          }}
        />
      ))}
      {!isEqual && (
        <button
          className={cn(
            'btn btn-xs btn-primary w-full mt-2',
            saveRestrictions.isPending && 'btn-disabled'
          )}
          onClick={() =>
            modPrompt(
              promptHandle,
              "Modifying user's restrictions. Please explain why this action is being taken. This message will be sent to the user and logged with the action."
            )
              .then(message =>
                saveRestrictions.mutate([userId, newRestrictions, message])
              )
              .catch(() => {})
          }
        >
          {saveRestrictions.isPending ? 'Saving...' : 'Save'}
        </button>
      )}
    </div>
  );
});
