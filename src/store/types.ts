// src/store/types.ts

import type {
  SessionTimer,
  MeditationLog,
  DiaryEntry,
  NotificationRecord,
  Settings,
  BackupMeta,
} from '../models/domain';

/**
 * Zustand slice interface for SessionTimers, including all timers and draft state.
 */
export interface SessionTimersState {
  sessionTimers: SessionTimer[];
  draftSessionTimer: SessionTimer | null;
  timersLoading: boolean;
  setSessionTimers(timers: SessionTimer[]): void;
  setDraftSessionTimer(timer: SessionTimer): void;
  resetDraftSessionTimer(): void;
  saveSessionTimer(timer: SessionTimer): Promise<void>;
  deleteSessionTimer(timerId: string): Promise<void>;
  loadSessionTimer(timerId: string): Promise<SessionTimer | null>;
  loadAllSessionTimers(): Promise<void>;
  setTimersLoading: (value: boolean) => void;
}

/**
 * Zustand slice interface for MeditationLogs.
 */
export interface MeditationLogsState {
  meditationLogs: MeditationLog[];
  addMeditationLog(log: MeditationLog): void;
  updateMeditationLogDuration(timestamp: string, duration: number): void;
  hydrateFromDB(): void;
}

/**
 * Zustand slice interface for DiaryEntries.
 */
export interface DiaryEntriesState {
  diaryEntries: DiaryEntry[];
  saveDiaryEntry(entry: DiaryEntry): void;
  deleteDiaryEntry(timestamp: string): void;
  hydrateFromDB(): void;
}

/**
 * Zustand slice interface for Notifications.
 */
export interface NotificationsState {
  notificationRecords: NotificationRecord[];
  setNotificationRecords(records: NotificationRecord[]): void;
}

/**
 * Zustand slice interface for Settings.
 */
export interface SettingsState {
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
  loadSettings(): void;
}

/**
 * Zustand slice interface for BackupMeta state.
 */
export interface BackupMetaState {
  backups: BackupMeta[];
  setBackups(backups: BackupMeta[]): void;
}
