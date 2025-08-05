// src/contracts/serviceInterfaces.ts

import type {
  NotificationRecord,
  Settings,
  SessionTimer,
  DiaryEntry,
  MeditationLog,
} from '../models/domain';

/**
 * Interface for notification management, including scheduling, canceling, syncing, and response handling.
 */
export interface INotificationManager {
  scheduleOrUpdateReminder(timerId: string, reminderData: NotificationRecord): Promise<void>;
  cancelReminder(timerId: string): Promise<void>;
  cancelAllRemindersForTimer(timerId: string): Promise<void>;
  loadAllRemindersFromDB(): Promise<void>;
  syncScheduledNotifications(): Promise<void>;
  handleNotificationResponse(response: any): Promise<void>;
}

/**
 * Interface for handling backup and restore operations for the SQLite DB and related metadata.
 */
export interface IBackupJobHandler {
  restoreDatabaseFromFile(fileUri: string): Promise<void>;
  registerBackupJob(): Promise<void>;
  unregisterBackupJob(): Promise<void>;
  handleDatabaseRestore(): Promise<void>;
  executeBackup(): Promise<void>;
  cleanupOldBackups(): Promise<void>;
  updateBackupMetadata(): Promise<void>;
  handleScheduledBackup(): Promise<"newData" | "noData" | "failed">;
}

/**
 * Interface for application boot management, including hydration, lifecycle, and backup job registration.
 */
export interface IAppBootManager {
  checkAndRestoreSessionState(): Promise<void>;
  hydrateSettingsStore(): Promise<void>;
  handleCorruptSettingsData(): void;
  handleAppStartOrResume(state: any): Promise<void>;
  unregisterBackupJob(): Promise<void>;
  registerBackupJob(): Promise<void>;
}

/**
 * Interface for the Session Timer State Store (Zustand slice contract).
 */
export interface ITimerStateStore {
  sessionTimers: SessionTimer[];
  draftSessionTimer: SessionTimer | null;
  setSessionTimers(timers: SessionTimer[]): void;
  setDraftSessionTimer(timer: SessionTimer): void;
  resetDraftSessionTimer(): void;
  saveSessionTimer(timer: SessionTimer): Promise<void>;
  deleteSessionTimer(timerId: string): Promise<void>;
  loadSessionTimer(timerId: string): Promise<SessionTimer | null>;
}

/**
 * Interface for the Settings State Store (Zustand slice contract).
 */
export interface ISettingsStore {
  settings: Settings;
  setSettings(settings: Settings): void;
  setTheme(theme: string): void;
  setAdsFreePurchased(purchased: boolean): Promise<void>;
  setDndEnabled(enabled: boolean): void;
  setBackupEnabled(enabled: boolean): void;
  setKeepScreenOn(enabled: boolean): void;
  setCountUp(enabled: boolean): void;
  setBackgroundImage(imageRef: string): Promise<void>;
  setHydratedSettings(settings: Settings): void;
  setDefaults(): void;
  revertToPersistedSettings(): Promise<void>;
}

/**
 * Interface for the Diary State Store (Zustand slice contract).
 */
export interface IDiaryStore {
  diaryEntries: DiaryEntry[];
  saveDiaryEntry(entry: DiaryEntry): void;
  deleteDiaryEntry(timestamp: string): void;
  hydrateFromDB(): void;
}

/**
 * Interface for the Meditation Log State Store (Zustand slice contract).
 */
export interface ILogStateStore {
  meditationLogs: MeditationLog[];
  addMeditationLog(log: MeditationLog): void;
  updateMeditationLogDuration(timestamp: string, duration: number): void;
  hydrateFromDB(): void;
}

