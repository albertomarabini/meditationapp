// src/persistence/BackupFileIOManager.ts

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import type { BackupMeta } from '../models/domain'; //[ts] Import declaration conflicts with local declaration of 'BackupMeta'.

/**
 * Handles backup file I/O: validates, copies, ensures directory, generates filenames,
 * lists and prunes backups, manages meta, and parses timestamps.
 * Used only by BackupJobHandlerImpl.
 */
export class BackupFileIOManager {
  /**
   * Validates that a file exists, is a file, has `.db` extension, and is non-zero-sized.
   * Throws if any validation fails.
   * @param fileUri Absolute file URI to be validated.
   */
  async validateBackupFile(fileUri: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists || info.isDirectory) {//[ts] Property 'isFile' does not exist on type '{ exists: true; uri: string; size: number; isDirectory: boolean; modificationTime: number; md5?: string | undefined; }'.
      throw new Error('Selected backup file does not exist.');
    }
    if (!fileUri.endsWith('.db')) {
      throw new Error('Selected backup file must have .db extension.');
    }
    if (info.size === 0) {
      throw new Error('Backup file is empty.');
    }
  }

  /**
   * Performs atomic file copy from `from` to `to`.
   * @param from Absolute source file URI.
   * @param to Absolute destination file URI.
   */
  async copyFileToDestination(from: string, to: string): Promise<void> {
    await FileSystem.copyAsync({ from, to });
  }

  /**
   * Checks if directory exists and creates it if not.
   * @param dir Directory URI (must end with '/')
   */
  async ensureDirectoryExists(dir: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }

  /**
   * Returns a timestamped backup filename for the given date.
   * Format: meditation-app-backup-YYYY-MM-DDTHH-MM-SS-Z.db
   * (ISO8601 with colons and dots replaced by dashes)
   */
  generateBackupFilename(now: Date): string {
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    return `meditation-app-backup-${timestamp}.db`;
  }

  /**
   * Deletes oldest .db backup files if more than maxBackups present in the directory.
   * Always keeps the newest maxBackups files.
   */
  async pruneOldBackups(backupDir: string, maxBackups: number): Promise<void> {
    const files = await FileSystem.readDirectoryAsync(backupDir);
    const backupFiles = files
      .filter((fname) => fname.endsWith('.db'))
      .map((fname) => ({
        filename: fname,
        timestamp: this.parseTimestampFromFilename(fname),
      }))
      .filter(
        (item): item is { filename: string; timestamp: number } =>
          item.timestamp !== null
      );

    if (backupFiles.length > maxBackups) {
      backupFiles.sort((a, b) => a.timestamp - b.timestamp); // oldest first
      const toDelete = backupFiles.slice(0, backupFiles.length - maxBackups);
      for (const file of toDelete) {
        await FileSystem.deleteAsync(backupDir + file.filename, { idempotent: true });
      }
    }
  }

  /**
   * Returns a list of BackupMeta objects for all valid backup files in the directory.
   * @param backupDir Directory URI (must end with '/')
   */
  async listBackupFilesWithMeta(backupDir: string): Promise<BackupMeta[]> {
    const files = await FileSystem.readDirectoryAsync(backupDir);
    const backupMeta: BackupMeta[] = [];
    for (const fname of files) {
      if (!fname.endsWith('.db')) continue;
      const timestamp = this.parseTimestampFromFilename(fname);
      if (timestamp == null) continue;
      backupMeta.push({
        filePath: backupDir + fname,
        timestamp: new Date(timestamp).toISOString(),
      });
    }
    return backupMeta;
  }

  /**
   * Serializes and writes backup metadata to SecureStore.
   * @param meta Array of BackupMeta objects.
   * @param key SecureStore key for persistence.
   */
  async saveBackupMetadata(meta: BackupMeta[], key: string): Promise<void> {
    await SecureStore.setItemAsync(key, JSON.stringify(meta));
  }

  /**
   * Extracts numeric timestamp from backup filename.
   * Returns null if parsing fails.
   * Example filename: meditation-app-backup-2023-12-31T22-23-44-000Z.db
   */
  parseTimestampFromFilename(fname: string): number | null {
    // Extract the portion between 'backup-' and '.db'
    const match = fname.match(/backup-(.*?)\.db$/);
    if (!match) return null;
    // Fix the time component: e.g. 2023-12-31T22-23-44-000Z  => 2023-12-31T22:23:44.000Z
    let iso = match[1];
    iso = iso.replace(
      /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
      (_m, h, m2, s, ms) => `T${h}:${m2}:${s}.${ms}Z`
    );
    const d = new Date(iso);
    return isNaN(d.valueOf()) ? null : d.valueOf();
  }
}
