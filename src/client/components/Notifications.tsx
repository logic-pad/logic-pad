import {
  InfiniteData,
  mutationOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { memo, useState } from 'react';
import {
  FaBell,
  FaCheckDouble,
  FaCog,
  FaComment,
  FaListUl,
  FaQuestion,
  FaTrash,
} from 'react-icons/fa';
import { api, bidirectionalInfiniteQuery, queryClient } from '../online/api';
import { useOnline } from '../contexts/OnlineContext';
import { ListResponse, Notification, NotificationType } from '../online/data';
import Loading from './Loading';
import { RiAccountCircleFill } from 'react-icons/ri';
import { IconType } from 'react-icons';
import Markdown from './Markdown';
import { cn, toRelativeDate } from '../uiHelper';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import InfiniteScrollTrigger from './InfiniteScrollTrigger';

const markAllAsRead = (notificationIds: string[]) =>
  mutationOptions({
    mutationKey: ['notification', 'read', notificationIds],
    mutationFn: () => {
      return api.markNotificationRead(notificationIds);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['notification', 'list'],
      });
      const previousCount = queryClient.getQueryData<
        Pick<ListResponse<Notification>, 'total'>
      >(['notification', 'count']);
      queryClient.setQueryData<Pick<ListResponse<Notification>, 'total'>>(
        ['notification', 'count'],
        old => ({
          total: Math.max(0, (old?.total ?? 0) - notificationIds.length),
        })
      );
      const previousList = queryClient.getQueryData(['notification', 'list'])!;
      queryClient.setQueryData<InfiniteData<ListResponse<Notification>>>(
        ['notification', 'list'],
        oldData => {
          if (oldData === undefined) return undefined;
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              return {
                total: page.results.length,
                results: page.results.map(result =>
                  notificationIds.includes(result.id)
                    ? { ...result, read: true }
                    : result
                ),
              };
            }),
          };
        }
      );
      return { previousList, previousCount };
    },
    onError(_error, _variables, context) {
      if (context) {
        queryClient.setQueryData(
          ['notification', 'list'],
          context.previousList
        );
        queryClient.setQueryData(
          ['notification', 'count'],
          context.previousCount
        );
      }
    },
  });
const deleteAll = (notificationIds: string[], isRead: boolean) =>
  mutationOptions({
    mutationKey: ['notification', 'delete', notificationIds],
    mutationFn: () => {
      return api.deleteNotifications(notificationIds);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ['notification', 'list'],
      });
      const previousCount = queryClient.getQueryData<
        Pick<ListResponse<Notification>, 'total'>
      >(['notification', 'count']);
      if (!isRead) {
        queryClient.setQueryData<Pick<ListResponse<Notification>, 'total'>>(
          ['notification', 'count'],
          old => ({
            total: Math.max(0, (old?.total ?? 0) - notificationIds.length),
          })
        );
      }
      const previousNotifications = queryClient.getQueryData<
        InfiniteData<ListResponse<Notification>>
      >(['notification', 'list'])!;
      queryClient.setQueryData<InfiniteData<ListResponse<Notification>>>(
        ['notification', 'list'],
        oldData => {
          if (oldData === undefined) return undefined;
          return {
            ...oldData,
            pages: oldData.pages.map(page => {
              return {
                total: page.results.length,
                results: page.results.filter(
                  result => !notificationIds.includes(result.id)
                ),
              };
            }),
          };
        }
      );
      return { previousNotifications, previousCount };
    },
    onError(error, _variables, context) {
      toast.error(error.message);
      if (context) {
        queryClient.setQueryData<InfiniteData<ListResponse<Notification>>>(
          ['notification', 'list'],
          context.previousNotifications
        );
        queryClient.setQueryData(
          ['notification', 'count'],
          context.previousCount
        );
      }
    },
    async onSettled() {
      if (
        queryClient.isMutating({
          mutationKey: ['notification', 'delete', notificationIds],
        }) === 1
      ) {
        await queryClient.invalidateQueries({
          queryKey: ['notification'],
        });
      }
    },
  });

const NotificationEntry = memo(function NotificationEntry({
  notification,
}: {
  notification: Notification;
}) {
  const markAsRead = useMutation(markAllAsRead([notification.id]));
  const deleteNotification = useMutation(
    deleteAll([notification.id], notification.read)
  );

  let Icon: IconType;
  let type: string;
  switch (notification.type) {
    case NotificationType.Account:
      Icon = RiAccountCircleFill;
      type = 'Account';
      break;
    case NotificationType.System:
      Icon = FaCog;
      type = 'System';
      break;
    case NotificationType.CollectionActivity:
      Icon = FaListUl;
      type = 'Collection';
      break;
    case NotificationType.CommentActivity:
      Icon = FaComment;
      type = 'Comment';
      break;
    default:
      Icon = FaQuestion;
      type = 'Unknown';
      break;
  }
  return (
    <Link
      to={notification.target ?? undefined}
      preload={
        notification.type !== NotificationType.System &&
        notification.type !== NotificationType.Account
          ? 'intent'
          : false
      }
      className={cn(
        'flex items-center gap-4 rounded-lg p-4 w-full transition-colors shrink-0',
        notification.read
          ? 'bg-base-300 hover:bg-base-200'
          : 'bg-secondary/10 hover:bg-secondary/20'
      )}
      onClick={() => {
        if (!notification.read) {
          markAsRead.mutate();
        }
      }}
    >
      <div className="relative w-fit h-fit">
        <Icon size={20} className="shrink-0" />
        {!notification.read && (
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-secondary rounded-full"></div>
        )}
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-center w-full">
          <span className="text-xs text-secondary uppercase opacity-70">
            {type}
          </span>
          <span className="text-xs opacity-70 w-full text-right">
            {toRelativeDate(new Date(notification.updatedAt))}
          </span>
        </div>
        <Markdown className="text-sm">{notification.message}</Markdown>
      </div>
      <button
        className="btn btn-ghost btn-sm btn-square opacity-50 hover:opacity-100"
        onClickCapture={e => {
          e.preventDefault();
          deleteNotification.mutate();
        }}
        aria-label="Delete notification"
      >
        <FaTrash size={16} />
      </button>
    </Link>
  );
});

export default memo(function Notifications() {
  const { isOnline, me } = useOnline();
  const [expand, setExpand] = useState(false);
  const notificationsCount = useQuery({
    queryKey: ['notification', 'count'],
    queryFn: api.countNotifications,
    enabled: isOnline && !!me,
  });
  const notifications = useInfiniteQuery({
    ...bidirectionalInfiniteQuery(
      ['notification', 'list'],
      (cursorBefore, cursorAfter) =>
        api.getNotifications(cursorBefore, cursorAfter)
    ),
    enabled: isOnline && !!me && expand,
  });
  const markAll = useMutation(
    markAllAsRead(
      notifications.data?.pages.flatMap(p =>
        p.results.filter(n => !n.read).map(n => n.id)
      ) ?? []
    )
  );
  const deleteRead = useMutation(
    deleteAll(
      notifications.data?.pages.flatMap(p =>
        p.results.filter(n => n.read).map(n => n.id)
      ) ?? [],
      false
    )
  );

  if (!isOnline || !me) return null;

  return (
    <div className="relative w-fit h-fit">
      <button
        className="btn btn-square btn-ghost max-md:btn-sm text-neutral-content"
        onClick={() => setExpand(v => !v)}
        aria-label={
          expand
            ? 'Close notifications'
            : `${notificationsCount.data?.total ?? 0} new notifications`
        }
      >
        <FaBell size={24} />
        {(notificationsCount.data?.total ?? 0) > 0 && (
          <span className="badge badge-secondary badge-sm absolute -top-1 -right-1">
            {notificationsCount.data?.total}
          </span>
        )}
      </button>
      {expand && (
        <div className="absolute w-0 h-0 bottom-0 right-0 text-base-content">
          <div className="z-50 fixed top-28 md:absolute md:top-2 right-0 flex flex-col items-center p-4 gap-2 max-w-[100vw] w-[500px] bg-base-100 shadow-lg rounded-xl min-h-52 max-h-[calc(100vh-10rem)] overflow-y-auto infinite-scroll">
            <div className="flex justify-between items-center self-stretch shrink-0">
              <span className="text-secondary text-lg">Notifications</span>
              <div className="flex gap-2">
                <div
                  className="tooltip tooltip-info tooltip-left"
                  data-tip="Mark all as read"
                >
                  <button
                    className={cn(
                      'btn btn-ghost btn-sm',
                      !notifications.data?.pages
                        .flatMap(p => p.results)
                        .some(n => !n.read) && 'btn-disabled'
                    )}
                    onClick={() => {
                      markAll.mutate();
                    }}
                  >
                    <FaCheckDouble size={16} />
                  </button>
                </div>
                <div
                  className="tooltip tooltip-info tooltip-left"
                  data-tip="Delete all read"
                >
                  <button
                    className={cn(
                      'btn btn-ghost btn-sm',
                      !notifications.data?.pages
                        .flatMap(p => p.results)
                        .some(n => n.read) && 'btn-disabled'
                    )}
                    onClick={() => {
                      deleteRead.mutate();
                    }}
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            </div>
            {notifications.data?.pages.flatMap(page =>
              page.results.map(notification => (
                <NotificationEntry
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
            {notifications.data?.pages[0]?.total === 0 && (
              <div className="text-center text-sm opacity-70 mt-8 shrink-0">
                No notifications
              </div>
            )}
            {notifications.isFetching ? (
              <Loading className="w-4 h-4 shrink-0" />
            ) : notifications.hasNextPage ? (
              <InfiniteScrollTrigger
                onLoadMore={async () => await notifications.fetchNextPage()}
                className="btn-sm shrink-0"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
});
