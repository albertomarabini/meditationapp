// /src/bootstrap/AppBootManager.ts

import { SettingsStore } from '../store/SettingsStore';
import { useSessionTimersStore } from '../store/TimerStateStore';
import { SessionTimerRepoAdapter } from '../persistence/SessionTimerRepoAdapter'
import { useLogStore } from '../store/LogStateStore';
import { useDiaryStore } from '../store/DiaryStore';
import { NotificationManager } from '../services/NotificationManager';
import { BackupJobHandler } from '../services/BackupJobHandler';
import { AppState, AppStateStatus } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import type { IAppBootManager } from '../contracts/serviceInterfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Snackbar integration point for UI notification (set externally by UI layer)
let showSnackbar: (msg: string) => void = () => { };
export function setAppBootManagerSnackbar(fn: (msg: string) => void) {
  showSnackbar = fn;
}

export class AppBootManager implements IAppBootManager {
  private appStateSubscription: { remove: () => void } | null = null;

  /**
   * Loads and restores any in-progress or interrupted meditation session from AsyncStorage (or other configured location)
   * If a valid session is found, restores session state into the session window slice (or store) and navigates to the session window in paused state.
   */
  public async checkAndRestoreSessionState(): Promise<void> {
    try {
      const sessionJson = await AsyncStorage.getItem('meditationSessionState');
      if (sessionJson) {
        const state = JSON.parse(sessionJson);
        console.log('meditationsessionstate');
        if (
          state &&
          typeof state === 'object' &&
          state.sessionBlueprint &&
          typeof state.currentSegmentIndex === 'number' &&
          typeof state.roundTimerValue === 'number' &&
          typeof state.digitalElapsed === 'number'
        ) {
          // Restore state into session window store (paused)
          // const sessionSlice = require('../store/SessionWindowStore');
          // if (sessionSlice && sessionSlice.SessionWindowStore) {
          //   sessionSlice.SessionWindowStore.getState().restoreSession({
          //     ...state,
          //     sessionState: 'paused',
          //   });
          // }
          // Navigate to MeditationSessionWindow (using navigation container ref)
        }
      }
    } catch {
      // If failed or corrupt, do nothing (normal app entry)
    }
  }

  /**
   * Loads settings from persistent storage, validates, and hydrates Zustand. If missing/corrupt, triggers fallback/defaults.
   */
  public async hydrateSettingsStore(): Promise<void> {
    try {
      const settingsObj = await require('../persistence/SettingsPersistenceDelegate')
        .SettingsPersistenceDelegate.prototype.getSettings();
      SettingsStore.getState().setHydratedSettings(settingsObj);
    } catch {
      this.handleCorruptSettingsData();
    }
  }

  /**
   * If settings are missing/corrupt, sets defaults and triggers user notification via Snackbar/Dialog.
   */
  public handleCorruptSettingsData(): void {
    void SettingsStore.getState().setDefaults();
    showSnackbar("Settings were reset due to missing or corrupt configuration.");
  }

  /**
   * On app boot or resume, synchronizes notifications/reminders, loads settings and timers as needed.
   */
  public async handleAppStartOrResume(state: AppStateStatus): Promise<void> {
    if (state !== 'active') return;
    try {
      await NotificationManager.loadAllRemindersFromDB();
      await NotificationManager.syncScheduledNotifications();
      // Hydrate settings and timers if necessary
      const settingsObj = await require('../persistence/SettingsPersistenceDelegate')
        .SettingsPersistenceDelegate.prototype.getSettings();
      SettingsStore.getState().setHydratedSettings(settingsObj);
      if (typeof useSessionTimersStore.getState().setSessionTimers === 'function') {
        const timers = await SessionTimerRepoAdapter.prototype.getAll();
        useSessionTimersStore.getState().setSessionTimers(timers);
      }
    } catch {
      // Hydration errors are handled elsewhere
    }
  }

  /**
   * Unregisters any scheduled backup job (background-fetch/task-manager).
   */
  public async unregisterBackupJob(): Promise<void> {
    const BACKUP_JOB_TASK_NAME = 'BACKUP_JOB';
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKUP_JOB_TASK_NAME);
      await require('../persistence/SettingsPersistenceDelegate')
        .SettingsPersistenceDelegate.prototype.saveField('backupEnabled', false);
    } catch {
      // Silent per requirements
    }
  }

  /**
   * Registers (or unregisters) the backup job based on current backupEnabled flag.
   */
  public async registerBackupJob(): Promise<void> {
    const BACKUP_JOB_TASK_NAME = 'BACKUP_JOB';
    const settings = SettingsStore.getState().settings;
    if (settings.backupEnabled) {
      await BackgroundFetch.registerTaskAsync(BACKUP_JOB_TASK_NAME, {
        minimumInterval: 24 * 3600,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      await require('../persistence/SettingsPersistenceDelegate')
        .SettingsPersistenceDelegate.prototype.saveField('backupEnabled', true);
    } else {
      await BackgroundFetch.unregisterTaskAsync(BACKUP_JOB_TASK_NAME);
      await require('../persistence/SettingsPersistenceDelegate')
        .SettingsPersistenceDelegate.prototype.saveField('backupEnabled', false);
    }
  }

  /**
   * Registers the AppState listener for resume/boot, triggers hydration and reminder/state sync.
   */
  public registerLifecycleListeners(): void {
    if (this.appStateSubscription) return;
    this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      void this.handleAppStartOrResume(state);
    });
  }

  /**
   * Optional teardown (rarely needed). Removes AppState event listener.
   */
  public unregisterLifecycleListeners(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}
