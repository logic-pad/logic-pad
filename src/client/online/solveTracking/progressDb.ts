/**
 * IndexedDB persistence for the signed-in user's puzzle progress.
 *
 * This is the only place in the client that touches IndexedDB. Every method
 * degrades quietly: if the database cannot be opened (private browsing,
 * storage eviction, no IDB support) {@link openProgressDb} resolves to `null`,
 * and no method ever throws. Progress indicators are cosmetic, so losing
 * persistence must never break a page.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'logic-pad-progress';
const DB_VERSION = 1;

/** Bumped when the meaning of stored records changes, not just their shape. */
export const PROGRESS_SCHEMA_VERSION = 1;

/** Stand-in user id for anonymous play, so local progress still persists. */
export const ANONYMOUS_USER_ID = 'anonymous';

export type ProgressStoreName = 'seen' | 'solved';

interface ProgressSchema extends DBSchema {
  seen: { key: string; value: number };
  solved: { key: string; value: number };
  meta: { key: string; value: string | number };
}

export interface ProgressMeta {
  userId: string | null;
  fetchedAt: number | null;
}

export interface ProgressMetaPatch {
  userId?: string;
  fetchedAt?: number;
}

export class ProgressDb {
  private constructor(private readonly db: IDBPDatabase<ProgressSchema>) {}

  static async open(): Promise<ProgressDb | null> {
    try {
      if (typeof indexedDB === 'undefined') return null;
      const db = await openDB<ProgressSchema>(DB_NAME, DB_VERSION, {
        upgrade: database => {
          for (const name of ['seen', 'solved', 'meta'] as const) {
            if (!database.objectStoreNames.contains(name)) {
              database.createObjectStore(name);
            }
          }
        },
      });
      const progress = new ProgressDb(db);
      await progress.migrateSchema();
      return progress;
    } catch (ex) {
      console.warn('progress: IndexedDB unavailable', ex);
      return null;
    }
  }

  /**
   * Records are keyed by puzzle id, valued by the time the client first learned
   * of the state. A schema change invalidates those timestamps' meaning, so the
   * progress stores are dropped and `fetchedAt` is cleared to force a server
   * refresh; the bound user id survives.
   */
  private async migrateSchema() {
    try {
      const stored = await this.db.get('meta', 'schema');
      if (stored === PROGRESS_SCHEMA_VERSION) return;
      const tx = this.db.transaction(['seen', 'solved', 'meta'], 'readwrite');
      await tx.objectStore('seen').clear();
      await tx.objectStore('solved').clear();
      const meta = tx.objectStore('meta');
      await meta.delete('fetchedAt');
      await meta.put(PROGRESS_SCHEMA_VERSION, 'schema');
      await tx.done;
    } catch (ex) {
      console.warn('progress: schema migration failed', ex);
    }
  }

  async readMeta(): Promise<ProgressMeta> {
    try {
      const [userId, fetchedAt] = await Promise.all([
        this.db.get('meta', 'userId'),
        this.db.get('meta', 'fetchedAt'),
      ]);
      return {
        userId: typeof userId === 'string' ? userId : null,
        fetchedAt: typeof fetchedAt === 'number' ? fetchedAt : null,
      };
    } catch {
      return { userId: null, fetchedAt: null };
    }
  }

  async writeMeta(patch: ProgressMetaPatch): Promise<void> {
    try {
      const tx = this.db.transaction('meta', 'readwrite');
      if (patch.userId !== undefined) {
        await tx.store.put(patch.userId, 'userId');
      }
      if (patch.fetchedAt !== undefined) {
        await tx.store.put(patch.fetchedAt, 'fetchedAt');
      }
      await tx.done;
    } catch (ex) {
      console.warn('progress: failed to write metadata', ex);
    }
  }

  /**
   * Wipes both progress stores and the refresh timestamp, then binds the
   * database to `userId`, atomically. Called when the stored data belongs to a
   * different account (or to nobody).
   */
  async resetForUser(userId: string): Promise<void> {
    try {
      const tx = this.db.transaction(['seen', 'solved', 'meta'], 'readwrite');
      await tx.objectStore('seen').clear();
      await tx.objectStore('solved').clear();
      const meta = tx.objectStore('meta');
      await meta.delete('fetchedAt');
      await meta.put(userId, 'userId');
      await tx.done;
    } catch (ex) {
      console.warn('progress: failed to reset for user', ex);
    }
  }

  async readKeys(name: ProgressStoreName): Promise<string[]> {
    try {
      return await this.db.getAllKeys(name);
    } catch (ex) {
      console.warn(`progress: failed to read ${name}`, ex);
      return [];
    }
  }

  /**
   * Replaces a whole store, atomically, with the ids reported by the server.
   * Timestamps record when the client learned of the state, since the
   * progress endpoint sends no times.
   */
  async writeKeys(
    name: ProgressStoreName,
    ids: readonly string[]
  ): Promise<void> {
    try {
      const tx = this.db.transaction(name, 'readwrite');
      const store = tx.store;
      await store.clear();
      const at = Date.now();
      await Promise.all(ids.map(id => store.put(at, id)));
      await tx.done;
    } catch (ex) {
      console.warn(`progress: failed to write ${name}`, ex);
    }
  }

  /** Adds a puzzle to the seen set, keeping the earliest timestamp. */
  async markSeen(id: string, at = Date.now()): Promise<void> {
    try {
      await this.db.add('seen', at, id);
    } catch {
      // Already seen: `add` rejects on an existing key, which is the outcome
      // we want.
    }
  }

  /**
   * Adds a puzzle to the solved set. The local stores are cumulative (every
   * solved id is also in `seen`), unlike the disjoint wire format.
   */
  async markSolved(id: string, at = Date.now()): Promise<void> {
    try {
      await this.db.put('solved', at, id);
    } catch (ex) {
      console.warn('progress: failed to record solve', ex);
    }
    try {
      await this.db.add('seen', at, id);
    } catch {
      // Already seen.
    }
  }
}

export async function openProgressDb(): Promise<ProgressDb | null> {
  return ProgressDb.open();
}
