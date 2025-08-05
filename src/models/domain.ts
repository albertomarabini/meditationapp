// src/models/domain.ts

/**
 * The origin of a sound: either a built-in system resource or a user-provided file.
 */
export type SoundOrigin = 'system' | 'user_file';

/**
 * Configuration for a segmentation sound (e.g., interval chime).
 */
export interface SegmentationSoundConfig {
  uri: string;            // URI for system ringtone or user audio file
  repetition: number;     // integer, 1-3
  volume: number;         // integer, 0-5
}

/**
 * Configuration for a meditation background sound.
 */
export interface MeditationSoundConfig {
  uri: string;                    // URI for system ringtone or user audio file
  origin: SoundOrigin;            // 'system' or 'user_file'
  repetitionType: 'forever' | 'count';
  repetitionCount?: number;       // integer >=1 if repetitionType == 'count'
  volume: number;                 // integer, 0-5
}

/**
 * One segment of a meditation session (e.g., focus, breath, body scan).
 */
export interface SessionSegment {
  index: number;      // 0-based
  duration: number;   // seconds, integer >= 1
}

/**
 * Complete definition of a user-configured meditation session timer.
 */
export interface SessionTimer {
  id: string;                                     // PK, UUID or SQLite TEXT PRIMARY KEY
  name: string;
  preparationTime: number;                        // seconds, integer >= 0
  segmentationSound: SegmentationSoundConfig;
  meditationSound: MeditationSoundConfig;
  segments: SessionSegment[];                     // length 1–4, at least 1 required
  dailyReminderEnabled: boolean;
  reminderTime?: string;                          // "HH:mm" 24h format, present if dailyReminderEnabled
  enableDiaryNote: boolean;
}

/**
 * Log of a performed meditation session.
 */
export interface MeditationLog {
  timestamp: string;     // PK, ISO8601, when meditation started
  duration: number;      // seconds, integer >= 1
}

/**
 * User's meditation diary entry (reflection/notes).
 */
export interface DiaryEntry {
  timestamp: string;     // PK, ISO8601, unique
  content: string;
}

/**
 * Local notification/reminder record for a SessionTimer.
 */
export type NotificationFrequency = "daily" | "every_n_days" | "every_n_hours";
export interface NotificationRecord {
  id: string;                // PK, expo-notifications ID
  frequency: NotificationFrequency;
  time: string;              // "HH:mm" or ISO8601
  sessionTimerId: string;    // FK to SessionTimer.id
  enabled: boolean;
}

/**
 * App-wide persistent settings (single row).
 */
export interface Settings {
  theme: string;                 // color/theme name or palette id
  adsFreePurchased: boolean;
  dndEnabled: boolean;
  backupEnabled: boolean;
  keepScreenOn: boolean;
  countUp: boolean;
  sessionBackgroundImage: string;    // URI or built-in image ref
}

/**
 * Metadata for a backup file.
 */
export interface BackupMeta {
  filePath: string;
  timestamp: string;             // ISO8601
}

/**
 * Summary statistics for meditations (for statistics page/export).
 */
export interface StatsSummary {
  total_sessions: number;
  total_time_minutes: number;
  average_session_duration_minutes: number;
}

/**
 * Per-period (e.g., month) statistics breakdown.
 */
export interface StatsByPeriod {
  period: string;           // e.g., "2025-05", "2025", "2025-Q1"
  total_sessions: number;
  total_minutes: number;
}
