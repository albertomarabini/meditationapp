// /src/delegates/BackupEligibilityChecker.ts

import { useSettingsStore } from '../store/SettingsStore';
import * as SecureStore from 'expo-secure-store';

const LAST_BACKUP_TIMESTAMP_KEY = 'LAST_BACKUP_TIMESTAMP';

export class BackupEligibilityChecker {
  /**
   * Checks if backup is enabled in persisted settings AND
   * that a backup has not already been made today.
   * Returns true only if eligible for backup, false otherwise.
   */
  async checkBackupEligibility(): Promise<boolean> {
    const backupEnabled = useSettingsStore.getState().settings.backupEnabled === true;
    if (!backupEnabled) return false;

    const lastBackupIso = await SecureStore.getItemAsync(LAST_BACKUP_TIMESTAMP_KEY);
    if (lastBackupIso) {
      const last = new Date(lastBackupIso);
      const now = new Date();
      if (
        last.getFullYear() === now.getFullYear() &&
        last.getMonth() === now.getMonth() &&
        last.getDate() === now.getDate()
      ) {
        return false;
      }
    }
    return true;
  }
}
