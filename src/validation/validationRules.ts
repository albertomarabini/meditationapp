// /src/validation/validationRules.ts

// Defines validation rule objects for all domain entities and forms (SessionTimer, MeditationLog, DiaryEntry, NotificationRecord, Settings).
// Used by all stateless validator helpers and forms. No logic, data only.

// ---- SessionTimer Validation ----
export const SessionTimerValidation = {
  name: { required: true, minLength: 1 },
  preparationTime: { required: true, type: "integer", min: 0 },
  segmentationSound: {
    uri: { required: false, pattern: /^.+$/ },
    repetition: { requiredIfUri: true, type: "integer", min: 1, max: 3 },
    volume: { requiredIfUri: true, type: "integer", min: 0, max: 5 },
  },
  meditationSound: {
    uri: { required: false, pattern: /^.+$/ }, // Not required, but if present must match pattern
    origin: { requiredIfUri: true, enum: ["system", "user_file"] },
    repetitionType: { requiredIfUri: true, enum: ["forever", "count"] },
    repetitionCount: {
      required: false, // handled below
      type: "integer",
      min: 1,
      custom: "required if repetitionType == 'count' and uri present"
    },
    volume: { requiredIfUri: true, type: "integer", min: 0, max: 5 },
  },
  segments: {
    required: true,
    type: "array",
    minItems: 1,
    maxItems: 4,
    items: {
      index: { type: "integer", min: 0 },
      duration: { type: "integer", min: 1 },
    },
  },
  dailyReminderEnabled: { required: true, type: "boolean" },
  reminderTime: { required: false, pattern: /^([01]\d|2[0-3]):([0-5]\d)$/ },
  enableDiaryNote: { required: true, type: "boolean" },
};

// ---- MeditationLog Validation ----
export const MeditationLogValidation = {
  timestamp: { required: true, format: "ISO8601", unique: true },
  duration: { required: true, type: "integer", min: 1 },
};

// ---- DiaryEntry Validation ----
export const DiaryEntryValidation = {
  timestamp: { required: true, format: "ISO8601", unique: true },
  content: { required: true, minLength: 1 },
};

// ---- NotificationRecord Validation ----
export const NotificationRecordValidation = {
  id: { required: true },
  frequency: { required: true, enum: ["daily", "every_n_days", "every_n_hours"] },
  time: { required: true, pattern: /^([01]\d|2[0-3]):([0-5]\d)$/ },
  sessionTimerId: { required: true },
  enabled: { required: true },
};

// ---- Settings Validation ----
export const SettingsValidation = {
  theme: { required: true },
  adsFreePurchased: { required: true, type: "boolean" },
  dndEnabled: { required: true, type: "boolean" },
  backupEnabled: { required: true, type: "boolean" },
  keepScreenOn: { required: true, type: "boolean" },
  countUp: { required: true, type: "boolean" },
  sessionBackgroundImage: { required: true },
};
