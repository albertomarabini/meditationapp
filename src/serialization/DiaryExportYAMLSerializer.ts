// src/serialization/DiaryExportYAMLSerializer.ts

import * as yaml from 'js-yaml';
import type { DiaryEntry } from '../models/domain';

/**
 * Pure static serializer for diary entries to the required YAML export format.
 * Used for export/share in DiaryView and SettingsMenu.
 */
export class DiaryExportYAMLSerializer {
  /**
   * Serializes an array of DiaryEntry objects to the YAML export schema.
   * - Resulting YAML has root key "diary_entries" and array of {timestamp, content} items.
   * - Entries are sorted ascending by timestamp.
   *
   * @param entries Array of DiaryEntry objects (already validated/persisted)
   * @returns YAML string for export/sharing
   */
  static serialize(entries: DiaryEntry[]): string {
    const sortedEntries = [...entries].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
    const yamlExport = {
      diary_entries: sortedEntries.map(entry => ({
        timestamp: entry.timestamp,
        content: entry.content,
      })),
    };
    return yaml.dump(yamlExport, { noRefs: true });
  }
}
