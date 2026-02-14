import * as rax from 'retry-axios';
import axiosStatic, { AxiosError } from 'axios';
import {
  SolveSession,
  PuzzleBrief,
  PuzzleFull,
  PuzzleLove,
  ListResponse,
  UserBrief,
  CollectionBrief,
  CollectionFollow,
  ResourceStatus,
  ResourceResponse,
  UserDetail,
  FrontPage,
  Comment,
  Notification,
  UserAutocomplete,
  SupporterPrice,
  MeBrief,
  PaymentHistory,
  SitemapEntry,
  UserAccount,
  UserRestrictions,
  ModComment,
  ReceivedModeration,
  GivenModeration,
} from './data';
import {
  DataTag,
  DefaultError,
  InfiniteData,
  infiniteQueryOptions,
  QueryClient,
  QueryKey,
  UseSuspenseInfiniteQueryOptions,
} from '@tanstack/react-query';
import onlineSolveTracker from '../router/onlineSolveTracker';
import toast from 'react-hot-toast';
import {
  PrivatePuzzleSearchParams,
  PublicPuzzleSearchParams,
} from './PuzzleSearchQuery';
import { CollectionSearchParams } from './CollectionSearchQuery';
import { Account, authClient } from './auth';

export interface ApiErrorResponse {
  summary: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 10 * 1000,
      retry(failureCount, error) {
        if (error instanceof ApiError) {
          if (error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError(error) {
        toast.error(error.message);
      },
    },
  },
});

export const axios = axiosStatic.create({
  baseURL: import.meta.env?.VITE_API_ENDPOINT as string,
  withCredentials: true,
});

export const retryAxios = axiosStatic.create({
  baseURL: import.meta.env?.VITE_API_ENDPOINT as string,
  withCredentials: true,
});
retryAxios.defaults.raxConfig = {
  retry: 3,
  httpMethodsToRetry: ['GET', 'HEAD', 'OPTIONS', 'DELETE', 'PUT', 'POST'],
};
rax.attach(retryAxios);

const rethrowError = (error: AxiosError<ApiErrorResponse>) => {
  if (error.response) {
    throw new ApiError(error.response.data.summary, error.response.status);
  } else {
    throw error;
  }
};

export const api = {
  isOnline: async () => {
    return await axios
      .get<{ version: string }>('/')
      .then(res => res.data)
      .catch((err: AxiosError) => {
        if (err.status === 503) {
          toast.error('The server is in maintenance. Please try again later.');
        }
        return null;
      });
  },
  signInWithOAuth: async (provider: string, success: string, error: string) => {
    onlineSolveTracker.clearSolveRecords();
    const result = await authClient.signIn.social({
      provider,
      callbackURL: success,
      errorCallbackURL: error,
    });
    if (!result.data) {
      throw new ApiError(
        result.error.message ?? 'Failed to sign in',
        result.error.status
      );
    }
    window.location.href = result.data.url!;
  },
  linkAccount: async (provider: string, callbackURL: string) => {
    const result = await authClient.linkSocial({
      provider,
      callbackURL,
      errorCallbackURL: callbackURL,
    });
    if (!result.data) {
      throw new ApiError(
        result.error.message ?? 'Failed to link account',
        result.error.status
      );
    }
    window.location.href = result.data.url!;
  },
  listAccounts: async () => {
    const result = await authClient.listAccounts();
    if (!result.data) {
      throw new ApiError(
        result.error.message ?? 'Failed to list accounts',
        result.error.status
      );
    }
    return result.data as Account[];
  },
  unlinkAccount: async (providerId: string, accountId: string) => {
    const result = await authClient.unlinkAccount({
      providerId,
      accountId,
    });
    if (!result.data) {
      throw new ApiError(
        result.error.message ?? 'Failed to unlink account',
        result.error.status
      );
    }
    return result.data;
  },
  logout: async () => {
    await queryClient.invalidateQueries();
    onlineSolveTracker.clearSolveRecords();
    await authClient.signOut();
    window.location.reload();
  },
  getMe: async () => {
    return await axios
      .get<MeBrief>('/user/me')
      .then(res => res.data)
      .catch(() => null);
  },
  updateMe: async (
    data: Partial<Pick<MeBrief, 'name' | 'description' | 'email'>>
  ) => {
    const result = await axios
      .put<UserBrief>('/user/me', data)
      .catch(() => null);
    if (data.email) {
      // Invalidate session cache to update email in the session
      await authClient.getSession({
        query: {
          disableCookieCache: true,
        },
      });
    }
    return result;
  },
  getUser: async (userId: string) => {
    return await axios
      .get<UserBrief>(`/user/${userId}`)
      .then(res => res.data)
      .catch(() => null);
  },
  getUserDetail: async (userId: string) => {
    return await axios
      .get<UserDetail>(`/user/${userId}/detail`)
      .then(res => res.data)
      .catch(() => null);
  },
  getAvatar: (userId: string) => {
    return `${axios.defaults.baseURL}/user/${userId}/avatar`;
  },
  getPuzzleFullForEdit: async (puzzleId: string) => {
    return await axios
      .get<PuzzleFull>(`/puzzle/${puzzleId}/edit`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  getPuzzleFullForSolve: async (puzzleId: string) => {
    return await axios
      .get<PuzzleFull>(`/puzzle/${puzzleId}/solve`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  getPuzzleBriefForSolve: async (puzzleId: string) => {
    return await axios
      .get<PuzzleBrief>(`/puzzle/${puzzleId}/solve/brief`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  createPuzzle: async (
    title: string,
    description: string,
    designDifficulty: number,
    data: string
  ) => {
    return await axios
      .post<{ id: string }>('/puzzle/create', {
        title,
        description,
        designDifficulty,
        data,
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  savePuzzle: async (
    puzzleId: string,
    title: string,
    description: string,
    designDifficulty: number,
    data: string
  ) => {
    return await axios
      .put<{ id: string }>('/puzzle/' + puzzleId, {
        title,
        description,
        designDifficulty,
        data,
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  deletePuzzle: async (puzzleId: string) => {
    await axios.delete(`/puzzle/${puzzleId}`).catch(rethrowError);
  },
  deletePuzzles: async (puzzleIds: string[]) => {
    return await axios
      .post<{ deleted: string[] }>(`/puzzle/delete`, { puzzleIds })
      .then(res => res.data)
      .catch(rethrowError);
  },
  publishPuzzle: async (puzzleId: string, status: ResourceStatus) => {
    return await axios
      .post<{ id: string }>(`/puzzle/${puzzleId}/publish`, { status })
      .then(res => res.data)
      .catch(rethrowError);
  },
  getPuzzleLove: async (puzzleId: string) => {
    return await axios
      .get<PuzzleLove>(`/puzzle/${puzzleId}/love`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  setPuzzleLove: async (puzzleId: string, loved: boolean) => {
    return await axios
      .put<PuzzleLove>(`/puzzle/${puzzleId}/love`, { loved })
      .then(res => res.data)
      .catch(rethrowError);
  },
  solveSessionBegin: async (puzzleId: string) => {
    return await retryAxios
      .post<SolveSession>(`/session/${puzzleId}/begin`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  solveSessionSolvingBeacon: (puzzleId: string, msTimeElapsed: number) => {
    const headers = {
      type: 'application/json',
    };
    const blob = new Blob([JSON.stringify({ msTimeElapsed })], headers);
    return navigator.sendBeacon(
      (import.meta.env?.VITE_API_ENDPOINT as string) +
        `/session/${puzzleId}/solving`,
      blob
    );
  },
  solveSessionSolving: async (puzzleId: string, msTimeElapsed: number) => {
    return await retryAxios
      .post<SolveSession>(`/session/${puzzleId}/solving`, { msTimeElapsed })
      .then(res => res.data)
      .catch(rethrowError);
  },
  solveSessionComplete: async (puzzleId: string) => {
    return await retryAxios
      .post<SolveSession>(`/session/${puzzleId}/complete`, undefined, {})
      .then(res => res.data)
      .catch(rethrowError);
  },
  ratePuzzle: async (puzzleId: string, rating: number) => {
    return await axios
      .put<{ id: string }>(`/session/${puzzleId}/rate`, { rating })
      .then(res => res.data)
      .catch(rethrowError);
  },
  searchPuzzles: async (
    query: PublicPuzzleSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<PuzzleBrief>>(`/puzzle/search`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  searchMyPuzzles: async (
    query: PrivatePuzzleSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<PuzzleBrief>>(`/puzzle/search/own`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  searchAllPuzzles: async (
    query: PrivatePuzzleSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<PuzzleBrief>>(`/puzzle/search/all`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  getRandomPuzzle: async () => {
    return await axios
      .get<{ id: string }>(`/puzzle/random`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  getCollectionBrief: async (collectionId: string) => {
    return await axios
      .get<CollectionBrief>(`/collection/${collectionId}`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  listCollectionPuzzles: async (
    collectionId: string,
    sort?: 'asc' | 'desc',
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<PuzzleBrief>>(`/collection/${collectionId}/puzzles`, {
        params: { sort, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  getCollectionFollow: async (collectionId: string) => {
    return await axios
      .get<CollectionFollow>(`/collection/${collectionId}/follow`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  setCollectionFollow: async (collectionId: string, followed: boolean) => {
    return await axios
      .put<CollectionFollow>(`/collection/${collectionId}/follow`, {
        followed,
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  createCollection: async (
    title: string,
    isSeries: boolean,
    description?: string
  ) => {
    return await axios
      .post<{ id: string }>(`/collection/create`, {
        title,
        isSeries,
        description,
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  updateCollection: async (
    collectionId: string,
    title?: string,
    description?: string,
    status?: ResourceStatus,
    isSeries?: boolean
  ) => {
    await axios
      .put<CollectionBrief>(`/collection/${collectionId}`, {
        title,
        description,
        status,
        isSeries,
      })
      .catch(rethrowError);
  },
  deleteCollection: async (collectionId: string) => {
    await axios.delete(`/collection/${collectionId}`).catch(rethrowError);
  },
  reorderCollection: async (
    collectionId: string,
    moving: string,
    replacing: string
  ) => {
    await axios
      .put(`/collection/${collectionId}/reorder`, {
        moving,
        replacing,
      })
      .catch(rethrowError);
  },
  addToCollection: async (collectionId: string, puzzleIds: string[]) => {
    await axios
      .post(`/collection/${collectionId}/add`, { puzzleIds })
      .catch(rethrowError);
  },
  removeFromCollection: async (collectionId: string, puzzleIds: string[]) => {
    await axios
      .post(`/collection/${collectionId}/remove`, { puzzleIds })
      .catch(rethrowError);
  },
  searchCollections: async (
    query: CollectionSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<CollectionBrief>>(`/collection/search`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  searchMyCollections: async (
    query: CollectionSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<CollectionBrief>>(`/collection/search/own`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  searchAllCollections: async (
    query: CollectionSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<CollectionBrief>>(`/collection/search/all`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  userAutocomplete: async (q: string) => {
    return await axios
      .get<UserAutocomplete[]>(`/user/autocomplete`, {
        params: { q },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  getFrontPage: async () => {
    return await axios
      .get<FrontPage>(`/frontpage`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  listMyFollowedCollections: async (
    query: CollectionSearchParams,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<CollectionBrief>>(`/user/me/followed-collections`, {
        params: { ...query, cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  countComments: async (puzzleId: string) => {
    return await axios
      .get<Pick<ListResponse<Comment>, 'total'>>(`/comment/${puzzleId}/count`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  listComments: async (
    puzzleId: string,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<Comment>>(`/comment/${puzzleId}`, {
        params: { cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  createComment: async (puzzleId: string, content: string) => {
    return await axios
      .post<{ id: string }>(`/comment/${puzzleId}`, { content })
      .then(res => res.data)
      .catch(rethrowError);
  },
  updateComment: async (commentId: string, content: string) => {
    await axios
      .put<Comment>(`/comment/${commentId}`, { content })
      .catch(rethrowError);
  },
  deleteComment: async (commentId: string) => {
    await axios.delete(`/comment/${commentId}`).catch(rethrowError);
  },
  getNotifications: async (cursorBefore?: string, cursorAfter?: string) => {
    return await axios
      .get<ListResponse<Notification>>(`/notification`, {
        params: { cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  countNotifications: async () => {
    return await axios
      .get<Pick<ListResponse<Notification>, 'total'>>(`/notification/count`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  markNotificationRead: async (notificationIds: string[]) => {
    await axios
      .put(`/notification/read`, { notificationIds })
      .catch(rethrowError);
  },
  deleteNotifications: async (notificationIds: string[]) => {
    await axios
      .post(`/notification/delete`, { notificationIds })
      .catch(rethrowError);
  },
  listSupporterPrices: async () => {
    return await axios
      .get<SupporterPrice[]>(`/payment/supporter/prices`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  checkoutSupporter: (price: string, success: string, error: string) => {
    const url = new URL(
      (import.meta.env?.VITE_API_ENDPOINT as string) +
        '/payment/supporter/checkout'
    );
    url.searchParams.set('priceId', price);
    url.searchParams.set('success', success);
    url.searchParams.set('error', error);
    window.location.href = url.toString();
  },
  listPaymentHistory: async (cursorBefore?: string, cursorAfter?: string) => {
    return await axios
      .get<ListResponse<PaymentHistory>>(`/payment/history`, {
        params: { cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  listSitemap: async (
    resource: 'users' | 'puzzles' | 'collections',
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<SitemapEntry[]>(`/sitemap/${resource}`, {
        params: { cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  modGetAccount: async (userId: string) => {
    return await axios
      .get<UserAccount>(`/moderation/user/${userId}`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  modGetRestrictions: async (userId: string) => {
    return await axios
      .get<UserRestrictions>(`/moderation/user/${userId}/restrictions`)
      .then(res => res.data)
      .catch(rethrowError);
  },
  modUpdateRestrictions: async (
    userId: string,
    restrictions: Partial<UserRestrictions>,
    message: string
  ) => {
    return await axios
      .post<UserRestrictions>(`/moderation/user/${userId}/restrictions`, {
        restrictions,
        message,
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  modListComments: async (
    userId: string,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<ModComment>>(`/moderation/user/${userId}/comments`, {
        params: { cursorBefore, cursorAfter },
      })
      .then(res => res.data)
      .catch(rethrowError);
  },
  modListReceivedModerations: async (
    userId: string,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<ReceivedModeration>>(
        `/moderation/user/${userId}/moderations/received`,
        {
          params: { cursorBefore, cursorAfter },
        }
      )
      .then(res => res.data)
      .catch(rethrowError);
  },
  modListGivenModerations: async (
    userId: string,
    cursorBefore?: string,
    cursorAfter?: string
  ) => {
    return await axios
      .get<ListResponse<GivenModeration>>(
        `/moderation/user/${userId}/moderations/given`,
        {
          params: { cursorBefore, cursorAfter },
        }
      )
      .then(res => res.data)
      .catch(rethrowError);
  },
  modBanUser: async (
    userId: string,
    expiresInSeconds: number,
    message: string
  ) => {
    await axios
      .post(`/moderation/user/${userId}/ban`, {
        expiresInSeconds,
        message,
      })
      .catch(rethrowError);
  },
  modUnbanUser: async (userId: string, message: string) => {
    await axios
      .post(`/moderation/user/${userId}/unban`, {
        message,
      })
      .catch(rethrowError);
  },
  modRemoveUserDescription: async (userId: string, message: string) => {
    await axios
      .post(`/moderation/user/${userId}/description/remove`, {
        message,
      })
      .catch(rethrowError);
  },
  modRemoveUserName: async (userId: string, message: string) => {
    await axios
      .post(`/moderation/user/${userId}/name/remove`, {
        message,
      })
      .catch(rethrowError);
  },
  modUpdatePuzzle: async (
    action: 'unpublish' | 'delete',
    puzzleId: string,
    message: string
  ) => {
    await axios
      .post(`/moderation/puzzle/${puzzleId}/${action}`, {
        message,
      })
      .catch(rethrowError);
  },
  modRemovePuzzleDescription: async (puzzleId: string, message: string) => {
    await axios
      .post(`/moderation/puzzle/${puzzleId}/description/remove`, {
        message,
      })
      .catch(rethrowError);
  },
  modUpdateCollection: async (
    action: 'unpublish' | 'delete',
    collectionId: string,
    message: string
  ) => {
    await axios
      .post(`/moderation/collection/${collectionId}/${action}`, {
        message,
      })
      .catch(rethrowError);
  },
  modRemoveCollectionDescription: async (
    collectionId: string,
    message: string
  ) => {
    await axios
      .post(`/moderation/collection/${collectionId}/description/remove`, {
        message,
      })
      .catch(rethrowError);
  },
  modUpdateComment: async (
    action: 'remove' | 'delete',
    commentId: string,
    message: string
  ) => {
    await axios
      .post(`/moderation/comment/${commentId}/${action}`, {
        message,
      })
      .catch(rethrowError);
  },
};

export const bidirectionalInfiniteQuery = <
  TQueryFnData extends ListResponse<ResourceResponse>,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: (
    cursorBefore?: string,
    cursorAfter?: string
  ) => Promise<TQueryFnData>,
  predictEndOfQuery = true
): UseSuspenseInfiniteQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  { cursorBefore?: string; cursorAfter?: string } | undefined
> & {
  queryKey: DataTag<TQueryKey, InfiniteData<TQueryFnData>, TError>;
} =>
  infiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    { cursorBefore?: string; cursorAfter?: string } | undefined
  >({
    queryKey,
    queryFn: ({ pageParam = {} }) => {
      return queryFn(pageParam.cursorBefore, pageParam.cursorAfter);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage, _allPages, lastPageParams) => {
      return lastPage.results.length === 30 ||
        (!predictEndOfQuery &&
          !lastPageParams?.cursorAfter &&
          !lastPageParams?.cursorBefore)
        ? lastPage.results.length === 0
          ? undefined
          : {
              cursorAfter: lastPage.results[lastPage.results.length - 1].id,
            }
        : lastPageParams?.cursorBefore
          ? { cursorAfter: lastPageParams.cursorBefore }
          : undefined;
    },
    getPreviousPageParam: (firstPage, _allPages, firstPageParams) => {
      return firstPage.results.length === 30 ||
        (!predictEndOfQuery &&
          !firstPageParams?.cursorAfter &&
          !firstPageParams?.cursorBefore)
        ? firstPage.results.length === 0
          ? undefined
          : {
              cursorBefore: firstPage.results[0].id,
            }
        : firstPageParams?.cursorAfter
          ? { cursorBefore: firstPageParams.cursorAfter }
          : undefined;
    },
    throwOnError(error) {
      toast.error((error as Error).message);
      return false;
    },
    retry: false,
    staleTime: 1000 * 60,
  });
