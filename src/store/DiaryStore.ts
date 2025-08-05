// /src/store/DiaryStore.ts

import { create } from 'zustand';
import type { DiaryEntry } from '../models/domain';
import type { DiaryEntriesState } from '../store/types';
import type { IDiaryEntryRepository } from '../repositories/interfaces';

// SQLite DB setup - single instance shared app-wide
import * as SQLite from 'expo-sqlite';
let db: SQLite.SQLiteDatabase;

export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('my_database.db');
  }
  return db;
}

// Promisified SQLite helpers (fail-fast, no fallback)
export async function sqlAsync<T = any>(
  sql: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  const db = await initDb();

  if (params && params.length > 0) {
    const rows = await db.getAllAsync(sql, ...(Array.isArray(params) ? params : [params])) as T[];
    return { rows };
  } else {
    const rows = await db.getAllAsync(sql) as T[];
    return { rows };
  }
}

export async function execAsync(
  sql: string,
  params?: any[]
): Promise<void> {
  const db = await initDb();
  try {
    if (params && params.length > 0) {
      await db.runAsync(sql, ...(Array.isArray(params) ? params : [params]));
    } else {
      await db.execAsync(sql);
    }
  } catch (e) {
    console.log("DiaryStore Error on execAsync", e);
  }
}


/**
 * FAKE DB IMPLEMENTATION
 */

// // In-memory fake DB, single instance shared app-wide
// type InMemoryTable = Record<string, any[]>;
// const fakeDb: InMemoryTable = {};

// export async function initDb(): Promise<typeof fakeDb> {
//   // mimic async DB open
//   return fakeDb;
// }

// // Fake SQL helpers with same signature

// export async function sqlAsync<T = any>(
//   sql: string,
//   params?: any[]
// ): Promise<{ rows: T[] }> {
//   // Parse the "table" name from a fake SQL (for debug only)
//   // e.g. 'SELECT * FROM TableName' -> 'TableName'
//   const tableMatch = sql.match(/from\s+(\w+)/i) || sql.match(/into\s+(\w+)/i);
//   const table = tableMatch ? tableMatch[1] : "UnknownTable";

//   // Return all rows for this table (if present)
//   const rows = (fakeDb[table] || []) as T[];
//   return { rows };
// }

// export async function execAsync(
//   sql: string,
//   params?: any[]
// ): Promise<void> {
//   // Only minimal handling, enough to not throw errors
//   // This doesn't do anything, just for compatibility
//   return;
// }

/****************************************************************************** */

// Repository implementation for DiaryEntry, enforcing overwrite on timestamp (PK)
class DiaryEntryRepository implements IDiaryEntryRepository {
  async getAll(): Promise<DiaryEntry[]> {
    const { rows } = await sqlAsync<DiaryEntry>('SELECT timestamp, content FROM DiaryEntries');
    return rows.map(row => ({
      timestamp: row.timestamp,
      content: row.content,
    }));
  }

  async getByTimestamp(timestamp: string): Promise<DiaryEntry | null> {
    const { rows } = await sqlAsync<DiaryEntry>(
      'SELECT timestamp, content FROM DiaryEntries WHERE timestamp = ? LIMIT 1',
      [timestamp],
    );
    if (!rows.length) return null;
    return {
      timestamp: rows[0].timestamp,
      content: rows[0].content,
    };
  }

  async save(entry: DiaryEntry): Promise<void> {
    await execAsync(
      'INSERT OR REPLACE INTO DiaryEntries (timestamp, content) VALUES (?, ?)',
      [entry.timestamp, entry.content],
    );
  }

  async delete(timestamp: string): Promise<void> {
    await execAsync(
      'DELETE FROM DiaryEntries WHERE timestamp = ?',
      [timestamp],
    );
  }
}

// Single instance of the repository for all store flows
const diaryRepo: IDiaryEntryRepository = new DiaryEntryRepository();

// Zustand store for diary entries with strict contract enforcement
export const useDiaryStore = create<DiaryEntriesState>((set, get) => ({
  diaryEntries: [],

  // Save or update a diary entry; enforces timestamp uniqueness (overwrites if exists)
  saveDiaryEntry: (entry: DiaryEntry) => {
    diaryRepo.save(entry).then(() => {
      set((state) => {
        const idx = state.diaryEntries.findIndex(e => e.timestamp === entry.timestamp);
        let newEntries: DiaryEntry[];
        if (idx >= 0) {
          newEntries = [
            ...state.diaryEntries.slice(0, idx),
            entry,
            ...state.diaryEntries.slice(idx + 1),
          ];
        } else {
          newEntries = [...state.diaryEntries, entry];
        }
        return { diaryEntries: newEntries };
      });
    });
  },

  // Delete a diary entry by timestamp
  deleteDiaryEntry: (timestamp: string) => {
    diaryRepo.delete(timestamp).then(() => {
      set((state) => ({
        diaryEntries: state.diaryEntries.filter(e => e.timestamp !== timestamp),
      }));
    });
  },

  // Hydrate diary entries from SQLite DB (app boot, DB restore, etc)
  hydrateFromDB: () => {
    diaryRepo.getAll().then((entries) => {
      set({ diaryEntries: entries });
    });
  },
}));
