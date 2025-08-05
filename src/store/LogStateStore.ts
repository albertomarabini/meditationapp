// src/store/LogStateStore.ts

import {create} from 'zustand';
import type { MeditationLog } from '../models/domain';
import type { MeditationLogsState } from './types';
import type { IMeditationLogRepository } from '../repositories/interfaces';

// --- SQLite DAL Implementation ---
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'meditation-app.db';
const TABLE_NAME = 'MeditationLogs';
let db: SQLite.SQLiteDatabase;

// SQLite database instance (singleton per Expo/React Native app)
export async function initDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('my_database.db');
  }
  return db;
}

const MeditationLogRepository: IMeditationLogRepository = {
  async getAll() {
    let db = await initDb();
    const rows = await db.getAllAsync<MeditationLog>(
      `SELECT timestamp, duration FROM ${TABLE_NAME}`
    );
    return rows;
  },

  async getByTimestamp(timestamp: string) {
    let db = await initDb();
    const row = await db.getFirstAsync<MeditationLog>(
      `SELECT timestamp, duration FROM ${TABLE_NAME} WHERE timestamp = ? LIMIT 1`,
      timestamp
    );
    return row ?? null;
  },

  async save(log: MeditationLog) {
    let db = await initDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE_NAME} (timestamp, duration) VALUES (?, ?)`,
      log.timestamp,   // log.timestamp should be a string!
      log.duration
    );
  },

  async updateDuration(timestamp: string, duration: number) {
    let db = await initDb();
    await db.runAsync(
      `UPDATE ${TABLE_NAME} SET duration = ? WHERE timestamp = ?`,
      duration,
      timestamp
    );
  },
};

/**
 *
 * Fake Implementation
 *
 */

// // In-memory "table"
// const logs: MeditationLog[] = [];

// export const MeditationLogRepository: IMeditationLogRepository = {
//   async getAll() {
//     return [...logs]; // return a shallow copy
//   },

//   async getByTimestamp(timestamp: string) {
//     return logs.find(l => l.timestamp === timestamp) || null;
//   },

//   async save(log: MeditationLog) {
//     // Replace if exists, else push
//     const idx = logs.findIndex(l => l.timestamp === log.timestamp);
//     if (idx >= 0) {
//       logs[idx] = log;
//     } else {
//       logs.push(log);
//     }
//   },

//   async updateDuration(timestamp: string, duration: number) {
//     const log = logs.find(l => l.timestamp === timestamp);
//     if (log) log.duration = duration;
//   },
// };
/********************************************************************************** */

// --- Zustand Store Definition ---
export const useLogStore = create<MeditationLogsState>((set, get) => ({
  meditationLogs: [],

  addMeditationLog: (log: MeditationLog) => {
    // Accept only valid logs: ISO8601 timestamp, duration >= 1, finite
    if (
      typeof log.timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(log.timestamp) ||
      typeof log.duration !== 'number' ||
      log.duration < 1 ||
      !Number.isFinite(log.duration)
    ) {
      throw new TypeError('Invalid meditation log data');
    }
    MeditationLogRepository.save(log).then(() => {
      set(state => ({
        meditationLogs: [
          ...state.meditationLogs.filter(l => l.timestamp !== log.timestamp),
          log,
        ].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      }));
    });
  },

  updateMeditationLogDuration: (timestamp: string, duration: number) => {
    if (
      typeof timestamp !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(timestamp) ||
      typeof duration !== 'number' ||
      duration < 1 ||
      !Number.isFinite(duration)
    ) {
      throw new TypeError('Invalid meditation log duration update');
    }
    MeditationLogRepository.updateDuration(timestamp, duration).then(() => {
      set(state => ({
        meditationLogs: state.meditationLogs.map(l =>
          l.timestamp === timestamp ? { ...l, duration } : l
        ),
      }));
    });
  },

  hydrateFromDB: () => {
    MeditationLogRepository.getAll().then(logs => {
      const validLogs = logs.filter(
        l =>
          typeof l.timestamp === 'string' &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(l.timestamp) &&
          typeof l.duration === 'number' &&
          l.duration >= 1 &&
          Number.isFinite(l.duration)
      );
      set({
        meditationLogs: validLogs.sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
      });
    });
  },
}));
