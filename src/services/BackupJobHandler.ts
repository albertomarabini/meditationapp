// /src/services/BackupJobHandler.ts

import { useSettingsStore } from '../store/SettingsStore';
import { BackupFileIOManager } from '../persistence/BackupFileIOManager';
import { BackupConcurrencyFlagManager } from '../delegates/BackupConcurrencyFlagManager';
import { BackupEligibilityChecker } from '../delegates/BackupEligibilityChecker';
import { BackupJobHydrationManager } from '../delegates/BackupJobHydrationManager';
import * as SecureStore from 'expo-secure-store';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as FileSystem from 'expo-file-system';
import type { IBackupJobHandler } from '../contracts/serviceInterfaces';
import type { BackupMeta } from '../models/domain';

const BACKUP_DIR = FileSystem.documentDirectory + 'backups/';
const SQLITE_DB_PATH = FileSystem.documentDirectory + 'SQLite/meditation-app.db';
const BACKUP_META_KEY = 'BACKUP_METADATA';
const LAST_BACKUP_TIMESTAMP_KEY = 'LAST_BACKUP_TIMESTAMP';
const MAX_BACKUPS = 5;
const BACKUP_JOB_TASK_NAME = 'BACKUP_JOB';

class BackupJobHandlerImpl implements IBackupJobHandler {
  private fileIO: BackupFileIOManager;
  private concurrencyFlagManager: BackupConcurrencyFlagManager;
  private eligibilityChecker: BackupEligibilityChecker;
  private hydrationManager: BackupJobHydrationManager;
  private uiFeedback?: (msg: string) => void;

  constructor() {
    this.fileIO = new BackupFileIOManager();
    this.concurrencyFlagManager = new BackupConcurrencyFlagManager();
    this.eligibilityChecker = new BackupEligibilityChecker();
    this.hydrationManager = new BackupJobHydrationManager();
  }

  public async restoreDatabaseFromFile(fileUri: string): Promise<void> {
    if (!(await this.concurrencyFlagManager.handleConcurrentBackupOrRestoreAttempt(this.uiFeedback))) return;
    try {
      await this.fileIO.validateBackupFile(fileUri);
      await this.fileIO.copyFileToDestination(fileUri, SQLITE_DB_PATH);
      await this.hydrationManager.reloadEntitiesFromRestoredDB();
      await this.fileIO.saveBackupMetadata(
        await this.fileIO.listBackupFilesWithMeta(BACKUP_DIR),
        BACKUP_META_KEY
      );
      await SecureStore.setItemAsync(LAST_BACKUP_TIMESTAMP_KEY, new Date().toISOString());
      this.concurrencyFlagManager.resetConcurrencyFlag();
    } catch (err) {
      this.concurrencyFlagManager.resetConcurrencyFlag();
      await this.handleBackupOrRestoreError(err as Error);
    }
  }

  public async registerBackupJob(): Promise<void> {
    const backupEnabled = useSettingsStore.getState().settings.backupEnabled;
    if (!backupEnabled) return;

    // Use TaskManager.getRegisteredTasksAsync instead of BackgroundFetch.getRegisteredTasksAsync
    const tasks = await TaskManager.getRegisteredTasksAsync();
    if (tasks.some((t: any) => t.taskName === BACKUP_JOB_TASK_NAME)) return;

    await BackgroundFetch.registerTaskAsync(BACKUP_JOB_TASK_NAME, {
      minimumInterval: 24 * 3600, // 24 hours in seconds
      stopOnTerminate: false,
      startOnBoot: true,
    });

    TaskManager.defineTask(BACKUP_JOB_TASK_NAME, async () => {
      return await this.handleScheduledBackup();
    });
  }

  public async unregisterBackupJob(): Promise<void> {
    try {
      const tasks = await TaskManager.getRegisteredTasksAsync();
      if (!tasks.some((t: any) => t.taskName === BACKUP_JOB_TASK_NAME)) return;
      await BackgroundFetch.unregisterTaskAsync(BACKUP_JOB_TASK_NAME);
    } catch (_) {
      // Fail silently, per requirements.
    }
  }

  public async handleDatabaseRestore(): Promise<void> {
    await this.hydrationManager.reloadEntitiesFromRestoredDB();
  }

  public async handleConcurrentBackupOrRestoreAttempt(): Promise<boolean> {
    return await this.concurrencyFlagManager.handleConcurrentBackupOrRestoreAttempt(this.uiFeedback);
  }

  public async checkBackupEligibility(): Promise<boolean> {
    return await this.eligibilityChecker.checkBackupEligibility();
  }

  public async executeBackup(): Promise<void> {
    if (!(await this.concurrencyFlagManager.handleConcurrentBackupOrRestoreAttempt(this.uiFeedback))) return;
    try {
      await this.fileIO.ensureDirectoryExists(BACKUP_DIR);
      const now = new Date();
      const destFile = BACKUP_DIR + this.fileIO.generateBackupFilename(now);
      await this.fileIO.copyFileToDestination(SQLITE_DB_PATH, destFile);
      await SecureStore.setItemAsync(LAST_BACKUP_TIMESTAMP_KEY, now.toISOString());
      await this.fileIO.pruneOldBackups(BACKUP_DIR, MAX_BACKUPS);
      await this.fileIO.saveBackupMetadata(
        await this.fileIO.listBackupFilesWithMeta(BACKUP_DIR),
        BACKUP_META_KEY
      );
      this.concurrencyFlagManager.resetConcurrencyFlag();
    } catch (err) {
      this.concurrencyFlagManager.resetConcurrencyFlag();
      await this.handleBackupFailure(err as Error);
    }
  }

  public async cleanupOldBackups(): Promise<void> {
    await this.fileIO.pruneOldBackups(BACKUP_DIR, MAX_BACKUPS);
  }

  public async updateBackupMetadata(): Promise<void> {
    const backupMeta = await this.fileIO.listBackupFilesWithMeta(BACKUP_DIR);
    await this.fileIO.saveBackupMetadata(backupMeta, BACKUP_META_KEY);
  }

  // Now returns: Promise<"failed">
  public async handleBackupFailure(_error: Error): Promise<"failed"> {
    // No UI feedback, only signal failure to background fetch/task manager
    return "failed";
  }

  public async executeRestore(selectedBackupFile: { uri: string }): Promise<void> {
    if (!(await this.concurrencyFlagManager.handleConcurrentBackupOrRestoreAttempt(this.uiFeedback))) return;
    try {
      await this.fileIO.validateBackupFile(selectedBackupFile.uri);
      await this.fileIO.copyFileToDestination(selectedBackupFile.uri, SQLITE_DB_PATH);
      await this.hydrationManager.reloadEntitiesFromRestoredDB();
      await this.updateBackupMetadata();
      this.concurrencyFlagManager.resetConcurrencyFlag();
    } catch (err) {
      this.concurrencyFlagManager.resetConcurrencyFlag();
      await this.handleBackupOrRestoreError(err as Error);
    }
  }

  public async reloadEntitiesFromRestoredDB(): Promise<void> {
    await this.hydrationManager.reloadEntitiesFromRestoredDB();
  }

  public async handleBackupOrRestoreError(error: Error): Promise<void> {
    if (this.uiFeedback) {
      this.uiFeedback(
        `Backup/Restore error: ${error && (error as any).message ? (error as any).message : 'Unknown error'}`
      );
    }
  }

  // Return values: "newData" | "noData" | "failed"
  public async handleScheduledBackup(): Promise<"newData" | "noData" | "failed"> {//
    const backupEnabled = useSettingsStore.getState().settings.backupEnabled;
    if (!backupEnabled) return "noData";
    try {
      await this.executeBackup();
      return "newData";
    } catch (err) {
      await this.handleBackupFailure(err as Error);
      return "failed";
    }
  }
}

export const BackupJobHandler: IBackupJobHandler = new BackupJobHandlerImpl();
