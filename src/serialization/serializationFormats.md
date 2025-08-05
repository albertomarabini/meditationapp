# YAML Export Schemas

This document defines the **YAML serialization formats** used by the application for exporting diary entries and meditation statistics.

All exports must *exactly* match these schemas. Only persisted, valid entries are exported (no drafts or in-memory data). YAML is produced via JS-YAML or equivalent, with no extra formatting or speculative fields.

---

## Diary Entry YAML Export

diary_entries:
- timestamp: "2025-06-10T07:30:00"
  content: >
    Had a really deep session today. Breathing felt effortless.
    Noticed more space between thoughts.
- timestamp: "2025-06-11T08:15:00"
  content: >
    Mind was scattered. Couldn't settle. Felt restless.

**Schema:**
- Root field: `diary_entries` (array)
  - Each entry:
    - `timestamp`: string, ISO8601 (when diary note was created)
    - `content`: string (user's diary text; multiline supported)

---

## Statistics YAML Export

summary:
  total_sessions: 86
  total_time_minutes: 2850
  average_session_duration_minutes: 33.1
by_month:
- month: "2025-05"
  total_sessions: 40
  total_minutes: 1280
- month: "2025-06"
  total_sessions: 12
  total_minutes: 420

**Schema:**
- Root field: `summary` (object)
  - `total_sessions`: integer
  - `total_time_minutes`: integer
  - `average_session_duration_minutes`: float (to one decimal point)
- Root field: `by_month` (array)
  - Each entry:
    - `month`: string (YYYY-MM)
    - `total_sessions`: integer
    - `total_minutes`: integer

---

*All YAML exports must conform strictly to these schemas. No additional fields or formatting are permitted.*

