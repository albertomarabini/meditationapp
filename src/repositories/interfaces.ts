// src/repositories/interfaces.ts

import type {
  SessionTimer,
  MeditationLog,
  DiaryEntry,
  NotificationRecord,
  Settings,
} from '../models/domain';

/**
 * Repository interface for SessionTimer entity (SessionTimers table).
 */
export interface ISessionTimerRepository {
  getAll(): Promise<SessionTimer[]>;
  getById(id: string): Promise<SessionTimer | null>;
  save(timer: SessionTimer): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Repository interface for MeditationLog entity (MeditationLogs table).
 */
export interface IMeditationLogRepository {
  getAll(): Promise<MeditationLog[]>;
  getByTimestamp(timestamp: string): Promise<MeditationLog | null>;
  save(log: MeditationLog): Promise<void>;
  updateDuration(timestamp: string, duration: number): Promise<void>;
}

/**
 * Repository interface for DiaryEntry entity (DiaryEntries table).
 */
export interface IDiaryEntryRepository {
  getAll(): Promise<DiaryEntry[]>;
  getByTimestamp(timestamp: string): Promise<DiaryEntry | null>;
  save(entry: DiaryEntry): Promise<void>;
  delete(timestamp: string): Promise<void>;
}

/**
 * Repository interface for NotificationRecord entity (Notifications table).
 */
export interface INotificationRepository {
  getAll(): Promise<NotificationRecord[]>;
  save(record: NotificationRecord): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Repository interface for Settings entity (Settings table, single row).
 */
export interface ISettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}
