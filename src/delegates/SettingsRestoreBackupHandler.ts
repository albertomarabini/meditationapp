// /src/delegates/SettingsRestoreBackupHandler.ts

import * as DocumentPicker from 'expo-document-picker';
import type { BackupMeta } from '../models/domain';
import { BackupJobHandler } from '../services/BackupJobHandler';

export class SettingsRestoreBackupHandler {
  public restoreLoading: boolean = false;

  /**
   * Launches the file picker and calls onRestoreSelected with the file URI if selected,
   * or onError with a message if the picker fails.
   */
  async initiateRestoreViaFilePicker(
    onRestoreSelected: (fileUri: string) => void,
    onError: (msg: string) => void
  ): Promise<void> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream',
        multiple: false,
        copyToCacheDirectory: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        onRestoreSelected(result.assets[0].uri);
      }
    } catch (e: any) {
      onError('Backup restore failed: ' + (e && e.message ? e.message : e));
    }
  }

  /**
   * Confirms and executes restore from the given backup. Manages loading state and notifies UI.
   */
  async confirmRestore(
    backupMeta: BackupMeta,
    onSuccess: () => void,
    onError: (msg: string) => void
  ): Promise<void> {
    this.restoreLoading = true;
    try {
      await BackupJobHandler.restoreDatabaseFromFile(backupMeta.filePath);
      onSuccess();
    } catch (e: any) {
      onError('Restore failed: ' + (e && e.message ? e.message : e));
    }
    this.restoreLoading = false;
  }
}
