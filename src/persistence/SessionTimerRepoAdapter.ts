/**
 *
 *
 *
 * Real version
 *
 *
 *
 */

import * as SQLite from 'expo-sqlite';
import type { SessionTimer } from '../models/domain';
import type { ISessionTimerRepository } from '../repositories/interfaces';

/**
 * Adapter implementation of ISessionTimerRepository using expo-sqlite async API.
 */
export class SessionTimerRepoAdapter implements ISessionTimerRepository {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  /**
   * Insert or update a SessionTimer in the SessionTimers table.
   * Serializes config/segments fields to JSON.
   */
  async save(timer: SessionTimer): Promise<void> {
    const sql = `
      INSERT OR REPLACE INTO SessionTimers (
        id,
        name,
        preparationTime,
        segmentationSound,
        meditationSound,
        segments,
        dailyReminderEnabled,
        reminderTime,
        enableDiaryNote
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      timer.id,
      timer.name,
      timer.preparationTime,
      JSON.stringify(timer.segmentationSound),
      JSON.stringify(timer.meditationSound),
      JSON.stringify(timer.segments),
      timer.dailyReminderEnabled ? 1 : 0,
      timer.reminderTime ?? null,
      timer.enableDiaryNote ? 1 : 0,
    ];
    await this.db.runAsync(sql, params);
  }

  /**
   * Delete a SessionTimer by ID.
   */
  async delete(id: string): Promise<void> {
    const sql = 'DELETE FROM SessionTimers WHERE id = ?';
    await this.db.runAsync(sql, [id]);
  }

  /**
   * Get a SessionTimer by ID, deserializing config/segments fields from JSON.
   */
  async getById(id: string): Promise<SessionTimer | null> {
    const sql = 'SELECT * FROM SessionTimers WHERE id = ?';
    const row = await this.db.getFirstAsync(sql, [id]) as Record<string, any> | undefined;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      preparationTime: row.preparationTime,
      segmentationSound: JSON.parse(row.segmentationSound),
      meditationSound: JSON.parse(row.meditationSound),
      segments: JSON.parse(row.segments),
      dailyReminderEnabled: !!row.dailyReminderEnabled,
      reminderTime: row.reminderTime ?? undefined,
      enableDiaryNote: !!row.enableDiaryNote,
    };
  }

  /**
   * Get all SessionTimers, deserializing config/segments fields from JSON.
   */
  async getAll(): Promise<SessionTimer[]> {
    const sql = 'SELECT * FROM SessionTimers';
    const rows = await this.db.getAllAsync(sql) as Record<string, any>[];
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      preparationTime: row.preparationTime,
      segmentationSound: JSON.parse(row.segmentationSound),
      meditationSound: JSON.parse(row.meditationSound),
      segments: JSON.parse(row.segments),
      dailyReminderEnabled: !!row.dailyReminderEnabled,
      reminderTime: row.reminderTime ?? undefined,
      enableDiaryNote: !!row.enableDiaryNote,
    }));
  }
}



/**
 *
 *
 *
 * STUB
 *
 *
 */

// import { SessionTimer } from "../models/domain";
// import type { ISessionTimerRepository } from "../repositories/interfaces";

// // Minimal stubs for sound config types:
// const defaultSegmentationSoundConfig: any = { uri: "", repetition: 0, volume: 1 };
// const defaultMeditationSoundConfig: any = { uri: "", repetition: 0, volume: 1 };

// // Minimal segment default:
// const defaultSegment: any = { label: "Default", duration: 60 };

// function randomId() {
//   // Generates a v4 UUID using Math.random (not cryptographically strong, but fine for mocks).
//   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//     const r = Math.random() * 16 | 0,
//           v = c === 'x' ? r : (r & 0x3 | 0x8);
//     return v.toString(16);
//   });
// }


// export class SessionTimerRepoAdapter implements ISessionTimerRepository {
//   private store = new Map<string, SessionTimer>();

//   constructor(seedCount: number = 1) {
//     for (let i = 0; i < seedCount; i++) {
//       const t: SessionTimer = {
//         id: randomId(),
//         name: "Fake Timer",
//         preparationTime: 0,
//         segmentationSound: defaultSegmentationSoundConfig,
//         meditationSound: defaultMeditationSoundConfig,
//         segments: [defaultSegment],
//         dailyReminderEnabled: false,
//         reminderTime: undefined,
//         enableDiaryNote: false,
//       };
//       this.store.set(t.id, t);
//     }
//   }

//   async save(timer: SessionTimer): Promise<void> {
//     this.store.set(timer.id, timer);
//   }

//   async delete(id: string): Promise<void> {
//     this.store.delete(id);
//   }

//   async getById(id: string): Promise<SessionTimer | null> {
//     return this.store.get(id) ?? null;
//   }

//   async getAll(): Promise<SessionTimer[]> {
//     return Array.from(this.store.values());
//   }
// }
