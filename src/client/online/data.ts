/* Sync with backend */

import { PuzzleType } from '@logic-pad/core/data/primitives';

export enum ResourceStatus {
  Private = 'private',
  Public = 'public',
}

export enum NotificationType {
  CollectionActivity = 'collectionActivity',
  CommentActivity = 'commentActivity',
  Account = 'account',
  System = 'system',
}

export interface ResourceResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export enum AutoCollection {
  CreatedPuzzles = 'createdPuzzles',
  LovedPuzzles = 'lovedPuzzles',
  SolvedPuzzles = 'solvedPuzzles',
}

export interface UserBrief extends ResourceResponse {
  accessedAt: string;
  solveCount: number;
  createCount: number;
  description: string;
  name: string;
  title: string | null;
  supporter: number;
}

export interface MeBrief extends UserBrief {
  supporterUntil: string | null;
  roles: string[];
}

export interface PuzzleBrief extends ResourceResponse {
  title: string;
  description: string;
  designDifficulty: number;
  ratedDifficulty: number[];
  inSeries: boolean | null;
  solveCount: number;
  loveCount: number;
  types: PuzzleType[];
  width: number;
  height: number;
  status: ResourceStatus;
  publishedAt?: string | null;
  creator: UserBrief;
}

export interface CollectionBrief extends ResourceResponse {
  title: string;
  description: string;
  puzzleCount: number | null;
  followCount: number;
  status: ResourceStatus;
  creator: UserBrief;
  autoPopulate: string | null;
  modifiedAt: string;
  isSeries: boolean;
}

export interface Comment extends ResourceResponse {
  puzzleId: string;
  creator: UserBrief;
  content: string;
}

export interface Completion extends ResourceResponse {
  ratedDifficulty: number | null;
  solvedAt: string | null;
  msTimeUsed: number;
  puzzle: string;
  user: string;
}

export interface Notification extends ResourceResponse {
  user: string;
  target: string | null;
  source: string | null;
  message: string;
  type: NotificationType;
  read: boolean;
}

export interface PuzzleLove {
  loved: boolean;
}

export interface CollectionFollow {
  followed: boolean;
}

export interface UserAutocomplete {
  id: string;
  name: string;
}

export interface PuzzleSection {
  id: string;
  data: PuzzleBrief[];
}

export interface UserDetail {
  followCount: number;
  solvedPuzzles: PuzzleSection | null;
  createdPuzzles: PuzzleSection | null;
  lovedPuzzles: PuzzleSection | null;
  createdCollections: CollectionBrief[];
}

export interface PuzzleFull extends PuzzleBrief {
  data: string;
  series: CollectionBrief | null;
}

export interface FrontPage {
  newestPuzzles: PuzzleBrief[];
  newestCollections: CollectionBrief[];
}

export interface ListResponse<T> {
  total: number;
  results: T[];
}

export interface SupporterPrice {
  priceId: string;
  months: number;
  price: number;
  currency: string;
}

export interface PaymentHistory extends ResourceResponse {
  user: string;
  order: string;
  currency: string;
  amount: string;
  items: string[];
}

export interface SitemapEntry {
  id: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  createdAt: string;
  updatedAt: string;
  accessedAt: string;
  roles: string[];
  bannedUntil: string | null;
  banReason: string | null;
}

export interface UserRestrictions {
  comments: string | null;
  puzzles: string | null;
  collections: string | null;
  ratings: string | null;
}

export interface ModComment extends ResourceResponse {
  puzzle: {
    id: string;
    createdAt: string;
    updatedAt: string;
    title: string;
  };
  creatorId: string;
  content: string;
}

export interface ReceivedModeration extends ResourceResponse {
  moderator: UserBrief;
  action: string;
  target: string;
  description: string;
  message: string | null;
}

export interface GivenModeration extends ResourceResponse {
  user: UserBrief;
  action: string;
  target: string;
  description: string;
  message: string | null;
}
