import * as SQLite from 'expo-sqlite';

const DB_NAME = 'meditation-app.db';

export class ExpoSQLiteSchema {
    db: SQLite.SQLiteDatabase | null = null;

    /**
     * Opens the database and creates tables if not exists.
     * Call this ONCE at app launch.
     */
    async initialize(): Promise<void> {
        this.db = await SQLite.openDatabaseAsync(DB_NAME);

        await this.db.execAsync(`
-- SessionTimers
CREATE TABLE IF NOT EXISTS SessionTimers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    preparationTime INTEGER NOT NULL,
    segmentationSound TEXT NOT NULL,        -- JSON (SegmentationSoundConfig)
    meditationSound TEXT NOT NULL,          -- JSON (MeditationSoundConfig)
    segments TEXT NOT NULL,                 -- JSON (SessionSegment[])
    dailyReminderEnabled INTEGER NOT NULL,
    reminderTime TEXT,                      -- nullable, "HH:mm"
    enableDiaryNote INTEGER NOT NULL
);

-- MeditationLogs
CREATE TABLE IF NOT EXISTS MeditationLogs (
    timestamp TEXT PRIMARY KEY, -- ISO8601
    duration INTEGER NOT NULL
);

-- DiaryEntries
CREATE TABLE IF NOT EXISTS DiaryEntries (
    timestamp TEXT PRIMARY KEY, -- ISO8601
    content TEXT NOT NULL
);

-- Notifications
CREATE TABLE IF NOT EXISTS Notifications (
    id TEXT PRIMARY KEY, -- expo-notifications ID
    frequency TEXT NOT NULL,
    time TEXT NOT NULL,
    sessionTimerId TEXT NOT NULL,
    enabled INTEGER NOT NULL
);

-- Settings (single row, id=1)
CREATE TABLE IF NOT EXISTS Settings (
    id INTEGER PRIMARY KEY CHECK (id=1),
    theme TEXT NOT NULL,
    adsFreePurchased INTEGER NOT NULL,
    dndEnabled INTEGER NOT NULL,
    backupEnabled INTEGER NOT NULL,
    keepScreenOn INTEGER NOT NULL,
    countUp INTEGER NOT NULL,
    sessionBackgroundImage TEXT
);

          `);
    }
}
