import * as SQLite from 'expo-sqlite';
import type { Settings } from '../models/domain';
import { SettingsValidation } from '../validation/validationRules';
import type { ISettingsRepository } from '../repositories/interfaces';

// This function should be created somewhere and used globally in your app
let db: SQLite.SQLiteDatabase | undefined;
export async function getSettingsDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) db = await SQLite.openDatabaseAsync('meditation-app.db');
  return db;
}

export class SettingsPersistenceDelegate implements ISettingsRepository {
  private dbPromise: Promise<SQLite.SQLiteDatabase>;

  constructor(dbPromise?: Promise<SQLite.SQLiteDatabase>) {
    // You can pass a db instance, but by default, we use the global singleton
    this.dbPromise = dbPromise || getSettingsDb();
  }

  async get(): Promise<Settings> {
    const db = await this.dbPromise;
    let row = await db.getFirstAsync<Settings>(`SELECT * FROM Settings LIMIT 1;`);
    if (!row) {
      return await this.setDefaults();
    }
    // Handle sessionBackgroundImage fallback to AsyncStorage if not present
    let bgImage = row.sessionBackgroundImage || "";
    const settings: Settings = {
      theme: row.theme,
      adsFreePurchased: !!row.adsFreePurchased,
      dndEnabled: !!row.dndEnabled,
      backupEnabled: !!row.backupEnabled,
      keepScreenOn: !!row.keepScreenOn,
      countUp: !!row.countUp,
      sessionBackgroundImage: bgImage,
    };
    return settings;
  }

  async save(settings: Settings): Promise<void> {
    const db = await this.dbPromise;
    await db.runAsync(
      `INSERT OR REPLACE INTO Settings
        (id, theme, adsFreePurchased, dndEnabled, backupEnabled, keepScreenOn, countUp, sessionBackgroundImage)
        VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      settings.theme,
      settings.adsFreePurchased ? 1 : 0,
      settings.dndEnabled ? 1 : 0,
      settings.backupEnabled ? 1 : 0,
      settings.keepScreenOn ? 1 : 0,
      settings.countUp ? 1 : 0,
      settings.sessionBackgroundImage || ""
    );
  }

  async saveField<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
    if (value === undefined || value === null) {
      throw new TypeError(`Missing required setting field: ${key}`);
    }
    if (key === "sessionBackgroundImage") {
      if (!value || typeof value !== "string") {
        throw new TypeError("sessionBackgroundImage must be a non-empty string");
      }
      await this.save({ ...(await this.get()), sessionBackgroundImage: value as string });
      return;
    }
    const prev = await this.get();
    const next: Settings = { ...prev, [key]: value };
    await this.save(next);
  }

  async revertToPersistedSettings(): Promise<Settings> {
    try {
      return await this.get();
    } catch {
      return await this.setDefaults();
    }
  }

  async setDefaults(): Promise<Settings> {
    const DEFAULT_SETTINGS: Settings = {
      theme: "default",
      adsFreePurchased: false,
      dndEnabled: false,
      backupEnabled: false,
      keepScreenOn: false,
      countUp: false,
      sessionBackgroundImage: "",
    };
    await this.save(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 *
 *
 *
 *STUB
 *
 *
 *
 *
 */

// import type { Settings } from "../models/domain";
// import type { ISettingsRepository } from "../repositories/interfaces";

// export class SettingsPersistenceDelegate implements ISettingsRepository {
//   private stored: Settings;

//   constructor(seed?: Settings) {
//     this.stored = seed ?? {
//       theme: "default",
//       adsFreePurchased: false,
//       dndEnabled: false,
//       backupEnabled: false,
//       keepScreenOn: false,
//       countUp: false,
//       sessionBackgroundImage: "",
//     };
//   }

//   async get(): Promise<Settings> {
//     return { ...this.stored };
//   }

//   async save(settings: Settings): Promise<void> {
//     // If SettingsValidation is only rule object, skip invocation
//     this.stored = { ...settings };
//   }

//   async saveField<K extends keyof Settings>(
//     key: K,
//     value: Settings[K]
//   ): Promise<void> {
//     if (value === undefined || value === null) {
//       throw new TypeError(`Missing required setting: ${key}`);
//     }
//     await this.save({ ...this.stored, [key]: value });
//   }

//   async revertToPersistedSettings(): Promise<Settings> {
//     return this.get();
//   }

//   async setDefaults(): Promise<Settings> {
//     const defaults: Settings = {
//       theme: "default",
//       adsFreePurchased: false,
//       dndEnabled: false,
//       backupEnabled: false,
//       keepScreenOn: false,
//       countUp: false,
//       sessionBackgroundImage: "",
//     };
//     this.stored = { ...defaults };
//     return { ...defaults };
//   }
// }
