// /src/validation/DiaryEntryValidationManager.ts

import type { DiaryEntry, MeditationLog } from '../models/domain';
import { DiaryEntryValidation } from '../validation/validationRules';

/**
 * Stateless manager for diary entry validation (content, timestamp ISO8601, uniqueness).
 * Provides helper methods used in DiaryEntryEditor and DiaryStore.
 */
export class DiaryEntryValidationManager {
  /**
   * Validates diary entry content for requiredness and minimum length.
   * Returns error message string if invalid, or null if valid.
   */
  static validateContent(content: string, minLength: number): string | null {
    if (!content || content.trim().length < minLength) {
      return 'Entry content is required.';
    }
    return null;
  }

  /**
   * Checks if a string is a valid ISO8601 timestamp for diary entry requirements.
   */
  static isValidISO8601(ts: string): boolean {
    // Accepts "YYYY-MM-DDTHH:MM" or "YYYY-MM-DDTHH:MM:SS[.sss][Z|±hh:mm]"
    return (
      typeof ts === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?(?:Z|[\+\-]\d{2}:\d{2})?)?$/.test(ts)
    );
  }

  /**
   * Determines if the given timestamp is unique among both diary entries and meditation logs,
   * enforcing 1:1 mapping. Allows overwrite only in edit mode.
   */
  static isUniqueTimestamp(
    ts: string,
    diaryEntries: Array<{ timestamp: string }>,
    meditationLogs: Array<{ timestamp: string }>,
    isEditMode: boolean
  ): boolean {
    // DiaryEntry timestamp must not collide with MeditationLog timestamp unless editing (allows overwrite in edit mode)
    const logClash = meditationLogs.filter((l) => l.timestamp === ts);
    return logClash.length === 0 || isEditMode;
  }

  /**
   * Aggregates validation for all fields (timestamp format, uniqueness, content length).
   * Returns error message string or null.
   */
  static validateAll(
    content: string,
    timestamp: string,
    diaryEntries: Array<{ timestamp: string }>,
    meditationLogs: Array<{ timestamp: string }>,
    isEditMode: boolean,
    minContentLength: number
  ): string | null {
    if (!timestamp || !this.isValidISO8601(timestamp)) {
      return 'Timestamp missing or invalid.';
    }
    if (!this.isUniqueTimestamp(timestamp, diaryEntries, meditationLogs, isEditMode)) {
      return 'Diary entry for this time already exists.';
    }
    const contentError = this.validateContent(content, minContentLength);
    if (contentError) {
      return contentError;
    }
    return null;
  }
}

export { DiaryEntryValidation };
