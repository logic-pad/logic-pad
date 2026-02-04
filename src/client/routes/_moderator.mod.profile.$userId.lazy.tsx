import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { useRouteProtection } from '../router/useRouteProtection';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { userBriefQueryOptions } from './_layout.profile.$userId';
import { memo, useRef } from 'react';
import { toRelativeDate } from '../uiHelper';
import Avatar from '../online/Avatar';
import SupporterBadge from '../components/SupporterBadge';
import { FaCheckSquare, FaEdit } from 'react-icons/fa';
import { userAccountQueryOptions } from './_moderator.mod.profile.$userId';
import UserRestrictions from '../online/moderator/UserRestrictions';
import ModMessagePrompt, {
  modPrompt,
  PromptHandle,
} from '../online/moderator/ModMessagePrompt';
import UserPuzzles from '../online/moderator/UserPuzzles';
import UserCollections from '../online/moderator/UserCollections';
import UserComments from '../online/moderator/UserComments';
import UserModerations from '../online/moderator/UserModerations';
import UserStatus from '../online/moderator/UserStatus';
import { api, queryClient } from '../online/api';
import toast from 'react-hot-toast';

export const Route = createLazyFileRoute('/_moderator/mod/profile/$userId')({
  component: memo(function RouteComponent() {
    useRouteProtection('moderator');
    const userId = Route.useParams().userId;
    const { data: userBrief } = useSuspenseQuery(userBriefQueryOptions(userId));
    const { data: userAccount } = useQuery(userAccountQueryOptions(userId));
    const promptRef = useRef<PromptHandle>(null);
    const removeDescription = useMutation({
      mutationFn: (data: Parameters<typeof api.modRemoveUserDescription>) => {
        return api.modRemoveUserDescription(...data);
      },
      onError(error) {
        toast.error(error.message);
      },
      onSuccess() {
        void queryClient.invalidateQueries({
          queryKey: ['profile', userId],
        });
      },
    });
    const removeName = useMutation({
      mutationFn: (data: Parameters<typeof api.modRemoveUserName>) => {
        return api.modRemoveUserName(...data);
      },
      onError(error) {
        toast.error(error.message);
      },
      onSuccess() {
        void queryClient.invalidateQueries({
          queryKey: ['profile', userId],
        });
      },
    });

    if (!userBrief) return null;

    return (
      <div className="flex flex-col bg-base-100 flex-1 self-stretch text-sm font-sans">
        <div className="text-xs bg-error text-error-content text-center shrink-0">
          All moderator actions are logged and auditable.
        </div>
        <ModMessagePrompt ref={promptRef} />
        <div className="flex flex-col flex-1 self-stretch px-4 pt-4">
          <div className="flex gap-8 items-start flex-wrap shrink-0">
            <Avatar
              userId={userBrief.id}
              username={userBrief.name}
              className="w-24 h-24"
            />
            <div className="flex flex-col gap-1 flex-1 min-w-[320px]">
              <Link
                to="/profile/$userId"
                params={{ userId }}
                className="text-3xl font-bold"
              >
                {userBrief.name}
                <SupporterBadge tooltip supporter={userBrief.supporter} />
                {userAccount?.roles.map(role => (
                  <span
                    key={role}
                    className="badge badge-info badge-sm inline-block py-1 px-2 ms-2 h-fit w-fit whitespace-nowrap align-middle capitalize"
                  >
                    {role}
                  </span>
                ))}
                <div
                  className="tooltip tooltip-error tooltip-bottom ms-2"
                  data-tip="Remove user name"
                >
                  <button
                    className="btn btn-xs btn-error"
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      modPrompt(
                        promptRef,
                        'Replacing user name with "[anonymous]". Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                      )
                        .then(message => removeName.mutate([userId, message]))
                        .catch(() => {});
                    }}
                  >
                    Remove
                  </button>
                </div>
              </Link>
              {userBrief.title && (
                <span className="text-accent font-semibold">
                  {userBrief.title}
                </span>
              )}
              <div className="flex gap-2 mt-2">
                <div className="badge badge-neutral badge-sm py-1 px-2 h-fit w-fit flex gap-1 whitespace-nowrap">
                  <FaCheckSquare />
                  Solved {userBrief.solveCount}
                </div>
                <div className="badge badge-neutral badge-sm py-1 px-2 h-fit w-fit flex gap-1 whitespace-nowrap">
                  <FaEdit />
                  Created {userBrief.createCount}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <span className="opacity-80">
                  created {toRelativeDate(new Date(userBrief.createdAt))}
                </span>
                <span className="opacity-80">
                  updated {toRelativeDate(new Date(userBrief.updatedAt))}
                </span>
                {userAccount?.accessedAt ? (
                  <div className="opacity-80">
                    accessed {toRelativeDate(new Date(userAccount.accessedAt))}
                  </div>
                ) : (
                  <div className="skeleton h-5 w-36"></div>
                )}
              </div>
              <div className="flex-1 flex gap-2 min-w-[320px] mt-2">
                <span>{userBrief.description}</span>
                <div
                  className="tooltip tooltip-error tooltip-top"
                  data-tip="Remove user description"
                >
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() =>
                      modPrompt(
                        promptRef,
                        'Replacing user description with "[removed]". Please explain why this action is being taken. This message will be sent to the user and logged with the action.'
                      )
                        .then(message =>
                          removeDescription.mutate([userId, message])
                        )
                        .catch(() => {})
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
            <UserRestrictions userId={userId} promptHandle={promptRef} />
            <UserStatus account={userAccount} promptHandle={promptRef} />
          </div>
          <div className="divider shrink-0" />
          <div className="flex-1 flex gap-8 justify-start items-stretch overflow-x-auto">
            <UserPuzzles userId={userId} promptHandle={promptRef} />
            <UserCollections userId={userId} promptHandle={promptRef} />
            <UserComments userId={userId} promptHandle={promptRef} />
            <UserModerations userId={userId} type="received" />
            {userAccount?.roles.includes('moderator') && (
              <UserModerations userId={userId} type="given" />
            )}
          </div>
        </div>
      </div>
    );
  }),
});
