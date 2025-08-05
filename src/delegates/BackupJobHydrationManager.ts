// /src/delegates/BackupJobHydrationManager.ts

import * as SQLite from 'expo-sqlite';
import type { Settings, DiaryEntry, SessionTimer, MeditationLog } from '../models/domain';
import { SettingsStore } from '../store/SettingsStore';
import { useDiaryStore } from '../store/DiaryStore';
import { useSessionTimersStore } from '../store/TimerStateStore';
import { useLogStore } from '../store/LogStateStore';

export class BackupJobHydrationManager {
  /**
   * Hydrate all domain slices (Settings, DiaryEntries, SessionTimers, MeditationLogs)
   * from the restored SQLite database, updating Zustand stores with the reloaded data.
   */
  async reloadEntitiesFromRestoredDB(): Promise<void> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');

    // Hydrate Settings
    const firstRow = await db.getFirstAsync<Settings>(
      `SELECT theme, adsFreePurchased, dndEnabled, backupEnabled, keepScreenOn, countUp, sessionBackgroundImage
       FROM Settings LIMIT 1;`
    );
    if (firstRow) {
      const s: Settings = {
        theme: firstRow.theme,
        adsFreePurchased: !!firstRow.adsFreePurchased,
        dndEnabled: !!firstRow.dndEnabled,
        backupEnabled: !!firstRow.backupEnabled,
        keepScreenOn: !!firstRow.keepScreenOn,
        countUp: !!firstRow.countUp,
        sessionBackgroundImage: firstRow.sessionBackgroundImage || "",
      };
      SettingsStore.getState().setHydratedSettings(s);
    }

    // Hydrate Diary Entries
    const diaryRows = await db.getAllAsync<{ timestamp: string; content: string }>(
      'SELECT timestamp, content FROM DiaryEntries;'
    );
    useDiaryStore.getState().hydrateFromDB
      ? useDiaryStore.getState().hydrateFromDB()
      : useDiaryStore.setState({ diaryEntries: diaryRows });

    // Hydrate SessionTimers
    const timerRows = await db.getAllAsync<any>('SELECT * FROM SessionTimers;');
    const timers: SessionTimer[] = timerRows.map(row => ({
      id: row.id,
      name: row.name,
      preparationTime: row.preparationTime,
      segmentationSound: JSON.parse(row.segmentationSound),
      meditationSound: JSON.parse(row.meditationSound),
      segments: JSON.parse(row.segments),
      dailyReminderEnabled: !!row.dailyReminderEnabled,
      reminderTime: row.reminderTime,
      enableDiaryNote: !!row.enableDiaryNote,
    }));
    useSessionTimersStore.getState().setSessionTimers(timers);

    // Hydrate Meditation Logs
    const logRows = await db.getAllAsync<{ timestamp: string; duration: number }>(
      'SELECT timestamp, duration FROM MeditationLogs;'
    );
    useLogStore.getState().hydrateFromDB
      ? useLogStore.getState().hydrateFromDB()
      : useLogStore.setState({ meditationLogs: logRows });
  }
}


// import type { Settings, DiaryEntry, SessionTimer, MeditationLog, SegmentationSoundConfig, MeditationSoundConfig, SessionSegment } from '../models/domain';
// import { SettingsStore } from '../store/SettingsStore';
// import { useDiaryStore } from '../store/DiaryStore';
// import { useSessionTimersStore } from '../store/TimerStateStore';
// import { useLogStore } from '../store/LogStateStore';

// // --- Minimal, valid mocks ---

// const fakeSettings: Settings = {
//   theme: "light",
//   adsFreePurchased: false,
//   dndEnabled: false,
//   backupEnabled: false,
//   keepScreenOn: false,
//   countUp: false,
//   sessionBackgroundImage: ""
// };

// const fakeDiaryEntries: DiaryEntry[] = [
//   { timestamp: "2024-01-01T10:00:00Z", content: "Fake entry" }
// ];

// const fakeSegmentationSound: SegmentationSoundConfig = {
//   uri: "sound.mp3",
//   repetition: 1,
//   volume: 1
// };

// const fakeMeditationSound: MeditationSoundConfig = {
//   uri: "meditation.mp3",
//   origin: "system",
//   repetitionType: "forever",
//   volume: 1
// };

// const fakeSegments: SessionSegment[] = [
//   {
//     duration: 60,
//     // Add other required fields for SessionSegment if any (fill with dummy values)
//   } as SessionSegment
// ];

// const fakeSessionTimers: SessionTimer[] = [
//   {
//     id: "fake-id",
//     name: "Fake Timer",
//     preparationTime: 0,
//     segmentationSound: fakeSegmentationSound,
//     meditationSound: fakeMeditationSound,
//     segments: fakeSegments,
//     dailyReminderEnabled: false,
//     reminderTime: undefined,
//     enableDiaryNote: false,
//   }
// ];

// const fakeMeditationLogs: MeditationLog[] = [
//   { timestamp: "2024-01-01T11:00:00Z", duration: 120 }
// ];

// // --- Hydration manager ---

// export class BackupJobHydrationManager {
//   async reloadEntitiesFromRestoredDB(): Promise<void> {
//     SettingsStore.getState().setHydratedSettings(fakeSettings);
//     useDiaryStore.setState({ diaryEntries: fakeDiaryEntries });
//     useSessionTimersStore.getState().setSessionTimers(fakeSessionTimers);
//     useLogStore.setState({ meditationLogs: fakeMeditationLogs });
//   }
// }
