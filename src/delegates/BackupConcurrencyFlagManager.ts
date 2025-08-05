import { useBackupConcurrencyStore } from '../store/BackupConcurrencyState';

export class BackupConcurrencyFlagManager {
  async handleConcurrentBackupOrRestoreAttempt(
    uiFeedback?: (msg: string) => void
  ): Promise<boolean> {
    const { isBackupInProgress, setBackupInProgress } = useBackupConcurrencyStore.getState();
    if (isBackupInProgress) {
      if (uiFeedback) uiFeedback('Backup/restore in progress');
      return false;
    }
    setBackupInProgress(true);
    return true;
  }

  resetConcurrencyFlag(): void {
    useBackupConcurrencyStore.getState().setBackupInProgress(false);
  }
}
