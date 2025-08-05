// /src/delegates/SettingsDialogManager.ts

import { BackupMeta } from '../models/domain';

export class SettingsDialogManager {
  showThemeDialog: boolean;
  showImageDialog: boolean;
  showRestoreDialog: boolean;
  pendingRestoreMeta: BackupMeta | null;
  errorDialog: string;
  snackbarMsg: string;

  constructor() {
    this.showThemeDialog = false;
    this.showImageDialog = false;
    this.showRestoreDialog = false;
    this.pendingRestoreMeta = null;
    this.errorDialog = '';
    this.snackbarMsg = '';
  }

  openThemeDialog(): void {
    this.showThemeDialog = true;
  }

  closeThemeDialog(): void {
    this.showThemeDialog = false;
  }

  openImageDialog(): void {
    this.showImageDialog = true;
  }

  closeImageDialog(): void {
    this.showImageDialog = false;
  }

  openRestoreDialog(meta?: BackupMeta): void {
    this.pendingRestoreMeta = meta ?? null;
    this.showRestoreDialog = true;
  }

  closeRestoreDialog(): void {
    this.showRestoreDialog = false;
    this.pendingRestoreMeta = null;
  }

  setPendingRestoreMeta(meta: BackupMeta | null): void {
    this.pendingRestoreMeta = meta;
  }

  setErrorDialog(msg: string): void {
    this.errorDialog = msg;
  }

  clearErrorDialog(): void {
    this.errorDialog = '';
  }

}
