// src/delegates/SettingsBackupMetadataManager.ts

import * as SecureStore from 'expo-secure-store';
import type { BackupMeta } from '../models/domain';

export class SettingsBackupMetadataManager {
  backupList: BackupMeta[] = [];
  lastBackupIso: string | null = null;

  /**
   * Fetches and parses backup metadata and last backup ISO from SecureStore.
   * Populates backupList and lastBackupIso.
   */
  async refreshBackupMetadata(): Promise<void> {
    const metaJson = await SecureStore.getItemAsync('BACKUP_METADATA');
    if (metaJson) {
      try {
        this.backupList = JSON.parse(metaJson);
      } catch {
        this.backupList = [];
      }
    } else {
      this.backupList = [];
    }
    const lastBackup = await SecureStore.getItemAsync('LAST_BACKUP_TIMESTAMP');
    this.lastBackupIso = lastBackup || null;
  }

  /**
   * Returns the most recently parsed backup list.
   */
  getBackupList(): BackupMeta[] {
    return this.backupList;
  }

  /**
   * Returns the last backup ISO timestamp (or null if none).
   */
  getLastBackupIso(): string | null {
    return this.lastBackupIso;
  }
}
