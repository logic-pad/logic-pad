import { api } from '../api';
import { ANONYMOUS_USER_ID, ProgressDb } from './progressDb';

const REFRESH_INTERVAL = 10 * 60 * 1000;

/**
 * Centralized source of truth for the current user's puzzle progress.
 *
 * Holds two cumulative in-memory sets (`solved ⊆ seen`), mirrored to
 * IndexedDB, and refreshed from `GET /user/me/progress` at most once per
 * {@link REFRESH_INTERVAL}. Components read it through `useSolveStatus`
 * (react hook bridge) — never through direct polling.
 *
 * Lifecycle: `ProgressBootstrap` (main.tsx) calls {@link bind} once the online
 * status and `me` are settled. Bind hydrates from IndexedDB (instant, no
 * network), then refreshes in the background if the cache is stale. All async
 * steps are generation-guarded so StrictMode double-mounts and rapid identity
 * changes cannot interleave.
 */
class OnlineSolveTracker {
  private seen = new Set<string>();
  private solved = new Set<string>();
  /** Marks made while a refresh is in flight; re-unioned when it lands. */
  private pendingSeen = new Set<string>();
  private pendingSolved = new Set<string>();
  private loaded = false;
  private boundTo: string | null = null;
  private version = 0;
  private generation = 0;
  private subscribers = new Set<() => void>();
  private db: ProgressDb | null = null;
  private opening: Promise<ProgressDb | null> | null = null;

  // Bound as instance properties so they are safe to pass unbound to
  // useSyncExternalStore.
  subscribe = (onStoreChange: () => void): (() => void) => {
    this.subscribers.add(onStoreChange);
    return () => {
      this.subscribers.delete(onStoreChange);
    };
  };

  getVersion = (): number => this.version;

  isLoaded = (): boolean => this.loaded;

  /**
   * True when bound to a real account. Anonymous visitors still track solves
   * (for the in-page banner) but must not see card indicators: their `seen` set
   * is empty, so every card would show a dot.
   */
  isTracked = (): boolean =>
    this.boundTo !== null && this.boundTo !== ANONYMOUS_USER_ID;

  isSeen = (puzzleId: string): boolean => this.seen.has(puzzleId);

  isSolved = (puzzleId: string): boolean => this.solved.has(puzzleId);

  private bump() {
    this.version++;
    for (const notify of this.subscribers) notify();
  }

  private ensureDb(): Promise<ProgressDb | null> {
    this.opening ??= ProgressDb.open();
    return this.opening;
  }

  markSeen = (puzzleId: string): void => {
    if (this.seen.has(puzzleId)) return;
    this.seen.add(puzzleId);
    this.pendingSeen.add(puzzleId);
    this.bump();
    void this.ensureDb().then(db => db?.markSeen(puzzleId));
  };

  markSolved = (puzzleId: string): void => {
    if (this.solved.has(puzzleId)) return;
    this.solved.add(puzzleId);
    this.seen.add(puzzleId);
    this.pendingSolved.add(puzzleId);
    this.bump();
    void this.ensureDb().then(db => db?.markSolved(puzzleId));
  };

  /**
   * Binds the tracker to an account (or {@link ANONYMOUS_USER_ID}) and starts
   * hydration + background refresh. Idempotent for the same id.
   */
  bind = (userId: string): void => {
    if (userId === this.boundTo) return;
    const previous = this.boundTo;
    this.boundTo = userId;
    if (previous !== null) {
      // Identity changed without a page reload (rare: sign-in/out normally
      // navigates). Drop the old account's data from view immediately.
      this.seen = new Set();
      this.solved = new Set();
      this.pendingSeen.clear();
      this.pendingSolved.clear();
      this.loaded = false;
      this.bump();
    }
    const generation = ++this.generation;
    void this.bindAsync(userId, generation);
  };

  private async bindAsync(userId: string, generation: number) {
    const db = await this.ensureDb();
    if (generation !== this.generation) return;
    this.db = db;
    const meta = db ? await db.readMeta() : null;
    if (generation !== this.generation) return;
    if (db && meta && meta.userId !== null && meta.userId !== userId) {
      await db.resetForUser(userId);
    } else {
      await db?.writeMeta({ userId });
    }
    if (generation !== this.generation) return;
    if (db) {
      const [seen, solved] = await Promise.all([
        db.readKeys('seen'),
        db.readKeys('solved'),
      ]);
      if (generation !== this.generation) return;
      this.seen = new Set(seen);
      this.solved = new Set(solved);
    }
    this.loaded = true;
    this.bump();
    await this.refreshIfStale(generation);
  }

  private async refreshIfStale(generation: number) {
    if (this.boundTo === null || this.boundTo === ANONYMOUS_USER_ID) return;
    const db = this.db;
    const meta = db ? await db.readMeta() : null;
    if (generation !== this.generation) return;
    if (
      meta &&
      meta.fetchedAt !== null &&
      Date.now() - meta.fetchedAt < REFRESH_INTERVAL
    ) {
      return;
    }
    const progress = await api.getUserProgress();
    if (generation !== this.generation) return;
    if (!progress) return;
    // The wire format is disjoint (solved ids are omitted from `seen`); the
    // local stores are cumulative, so union them back together here.
    const seen = new Set(progress.seen);
    const solved = new Set(progress.solved);
    for (const id of progress.solved) seen.add(id);
    for (const id of this.pendingSeen) seen.add(id);
    for (const id of this.pendingSolved) {
      seen.add(id);
      solved.add(id);
    }
    this.seen = seen;
    this.solved = solved;
    this.pendingSeen.clear();
    this.pendingSolved.clear();
    this.bump();
    if (db) {
      await Promise.all([
        db.writeKeys('seen', [...seen]),
        db.writeKeys('solved', [...solved]),
        db.writeMeta({ fetchedAt: Date.now() }),
      ]);
    }
  }

  /**
   * Reports a solve. Returns `false` (without any API call) if this puzzle was
   * already solved, so a solve is never double-reported across reloads.
   */
  completeSolve = async (
    puzzleId: string,
    msTimeElapsed?: number,
    solutionData?: string
  ): Promise<boolean> => {
    if (this.isSolved(puzzleId)) return false;
    this.markSolved(puzzleId);
    if (msTimeElapsed !== undefined)
      await api.solveSessionSolving(puzzleId, msTimeElapsed, solutionData);
    await api.solveSessionComplete(puzzleId);
    return true;
  };

  sendSolving = async (
    puzzleId: string,
    msTimeElapsed: number,
    solutionData?: string
  ) => {
    if (!this.isSolved(puzzleId))
      await api.solveSessionSolving(puzzleId, msTimeElapsed, solutionData);
  };

  sendSolvingBeacon(puzzleId: string, msTimeElapsed: number) {
    if (!this.isSolved(puzzleId))
      api.solveSessionSolvingBeacon(puzzleId, msTimeElapsed);
  }

  /**
   * Resets in-memory state only; the persistent wipe is owned by
   * {@link bind} so it cannot race page navigation. Called on sign-in and
   * logout, both of which reload the page afterwards.
   */
  clearSolveRecords = (): void => {
    this.seen = new Set();
    this.solved = new Set();
    this.pendingSeen.clear();
    this.pendingSolved.clear();
    this.loaded = false;
    this.boundTo = null;
    this.generation++;
    this.bump();
  };
}

export default new OnlineSolveTracker();
