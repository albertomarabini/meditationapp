// /src/validation/SessionTimerValidator.ts

import type { MeditationSoundConfig, SessionTimer } from '../models/domain';
import { SessionTimerValidation } from '../validation/validationRules';

/**
 * Stateless validator for SessionTimer domain objects.
 * Exposes static validate() method for all business/data rules,
 * returning error map for UI display.
 * Used by TimerStateStore, SessionTimerForm, and persistence helpers.
 */
export class SessionTimerValidator {
  /**
   * Validates a SessionTimer object against all business rules.
   * Returns an object with a 'valid' boolean and an 'errors' map for consumption by the UI.
   * No internal state: this is a pure function.
   */
  static validate(timer: SessionTimer): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Name: required, minLength 1
    if (
      typeof timer.name !== 'string' ||
      timer.name.trim().length < SessionTimerValidation.name.minLength
    ) {
      errors.name = 'Name is required.';
    }

    // PreparationTime: required, integer, min 0
    if (
      typeof timer.preparationTime !== 'number' ||
      !Number.isInteger(timer.preparationTime) ||
      timer.preparationTime < SessionTimerValidation.preparationTime.min
    ) {
      errors.preparationTime = 'Preparation time must be an integer ≥ 0.';
    }

    // SegmentationSound: required fields
    const segSound = timer.segmentationSound;
    if (segSound && typeof segSound !== 'object') {
      errors.segmentationSound = 'Segmentation sound config required.';
    } else if (segSound) {
      // uri: required, pattern
      if (
        typeof segSound.uri !== 'string' ||
        segSound.uri.length > 0 && !SessionTimerValidation.segmentationSound.uri.pattern.test(segSound.uri)
      ) {
        errors.segmentationSound_uri = 'Segmentation sound URI required.';
      } else if (typeof segSound.uri === 'string' && segSound.uri.length > 0) {
        if (
          typeof segSound.repetition !== 'number' ||
          !Number.isInteger(segSound.repetition) ||
          segSound.repetition < SessionTimerValidation.segmentationSound.repetition.min ||
          segSound.repetition > SessionTimerValidation.segmentationSound.repetition.max
        ) {
          errors.segmentationSound_repetition = 'Repetition: integer 1-3 required.';
        }
        // volume: required, integer, min 0, max 5
        if (
          typeof segSound.volume !== 'number' ||
          !Number.isInteger(segSound.volume) ||
          segSound.volume < SessionTimerValidation.segmentationSound.volume.min ||
          segSound.volume > SessionTimerValidation.segmentationSound.volume.max
        ) {
          errors.segmentationSound_volume = 'Volume: integer 0-5 required.';
        }
      }
    }

    // MeditationSound: required fields
    const medSound = timer.meditationSound as MeditationSoundConfig;
    if (medSound && typeof medSound !== 'object') {
      errors.meditationSound = 'Meditation sound config required.';
    } else if (medSound) {
      // uri: not required but pattern
      const m = medSound as MeditationSoundConfig;
      const uriPresent = typeof m.uri === 'string' && m.uri.trim().length > 0;
      if (uriPresent) {
        if (!SessionTimerValidation.meditationSound.uri.pattern.test(m.uri)) {
          errors.meditationSound_uri = 'Meditation sound URI required.';
        }
        // origin: required enum
        if (!SessionTimerValidation.meditationSound.origin.enum.includes(m.origin)) {
          errors.meditationSound_origin = 'Sound origin invalid.';
        }
        // repetitionType: required enum
        if (!SessionTimerValidation.meditationSound.repetitionType.enum.includes(m.repetitionType)) {
          errors.meditationSound_repetitionType = 'Repetition type invalid.';
        }
        // repetitionCount: required if repetitionType == 'count'
        if (
          m.repetitionType === 'count' &&
          (
            typeof m.repetitionCount !== 'number' ||
            !Number.isInteger(m.repetitionCount) ||
            m.repetitionCount < SessionTimerValidation.meditationSound.repetitionCount.min
          )
        ) {
          errors.meditationSound_repetitionCount = 'Repetition count required (≥1) for count type.';
        }
        // volume: required, integer, min 0, max 5
        if (
          typeof m.volume !== 'number' ||
          !Number.isInteger(m.volume) ||
          m.volume < SessionTimerValidation.meditationSound.volume.min ||
          m.volume > SessionTimerValidation.meditationSound.volume.max
        ) {
          errors.meditationSound_volume = 'Volume: integer 0-5 required.';
        }
      }
    }

    // Segments: array, minItems 1, maxItems 4, items { index: integer ≥0, duration: integer ≥1 }
    if (!Array.isArray(timer.segments)) {
      errors.segments = 'Segments array required.';
    } else {
      if (
        timer.segments.length < SessionTimerValidation.segments.minItems ||
        timer.segments.length > SessionTimerValidation.segments.maxItems
      ) {
        errors.segments_count = '1-4 segments required.';
      }
      timer.segments.forEach((seg, i) => {
        // index: integer ≥0
        if (
          typeof seg.index !== 'number' ||
          !Number.isInteger(seg.index) ||
          seg.index < SessionTimerValidation.segments.items.index.min
        ) {
          errors[`segment_${i}_index`] = `Segment #${i + 1}: Index must be integer ≥ 0.`;
        }
        // duration: integer ≥1
        if (
          typeof seg.duration !== 'number' ||
          !Number.isInteger(seg.duration) ||
          seg.duration < SessionTimerValidation.segments.items.duration.min
        ) {
          errors[`segment_${i}_duration`] = `Segment #${i + 1}: Duration must be integer ≥ 1.`;
        }
      });
    }

    // dailyReminderEnabled: required, boolean
    if (typeof timer.dailyReminderEnabled !== 'boolean') {
      errors.dailyReminderEnabled = 'Daily reminder flag required.';
    }

    // reminderTime: pattern, required only if dailyReminderEnabled
    if (timer.dailyReminderEnabled) {
      if (
        typeof timer.reminderTime !== 'string' ||
        !SessionTimerValidation.reminderTime.pattern.test(timer.reminderTime)
      ) {
        errors.reminderTime = 'Reminder time required ("HH:mm" 24h format) when reminder is enabled.';
      }
    }

    // enableDiaryNote: required, boolean
    if (typeof timer.enableDiaryNote !== 'boolean') {
      errors.enableDiaryNote = 'Enable Diary Note flag required.';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

export { SessionTimerValidation };
