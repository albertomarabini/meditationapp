// /src/store/SettingsStore.ts

import {create} from 'zustand';
import type {
  Settings,
} from '../models/domain';
import type { SettingsState } from '../store/types';
import { SettingsPersistenceDelegate } from '../persistence/SettingsPersistenceDelegate';

const persistenceDelegate = new SettingsPersistenceDelegate();

/**
 * Central Zustand store for all global user settings and flags.
 * All state mutation and hydration is validated and persisted atomically via SettingsPersistenceDelegate.
 */
export const SettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    theme: 'default',
    adsFreePurchased: false,
    dndEnabled: false,
    backupEnabled: false,
    keepScreenOn: false,
    countUp: false,
    sessionBackgroundImage: ''
  },

  loadSettings: async () => {
    try {
      const settings = await persistenceDelegate.get();
      set({ settings: { ...settings } });
    } catch (err) {
      const defaults = await persistenceDelegate.setDefaults();
      set({ settings: { ...defaults } });
    }
  },

  setSettings: (settings: Settings) => {
    set({ settings: { ...settings } });
    // Persist atomically
    void persistenceDelegate.save(settings);
  },

  setTheme: (theme: string) => {
    set(state => ({
      settings: { ...state.settings, theme }
    }));
    void persistenceDelegate.saveField('theme', theme);
  },

  setAdsFreePurchased: async (purchased: boolean) => {
    set(state => ({
      settings: { ...state.settings, adsFreePurchased: purchased }
    }));
    await persistenceDelegate.saveField('adsFreePurchased', purchased);
  },

  setDndEnabled: (enabled: boolean) => {
    set(state => ({
      settings: { ...state.settings, dndEnabled: enabled }
    }));
    void persistenceDelegate.saveField('dndEnabled', enabled);
  },

  setBackupEnabled: (enabled: boolean) => {
    set(state => ({
      settings: { ...state.settings, backupEnabled: enabled }
    }));
    void persistenceDelegate.saveField('backupEnabled', enabled);
  },

  setKeepScreenOn: (enabled: boolean) => {
    set(state => ({
      settings: { ...state.settings, keepScreenOn: enabled }
    }));
    void persistenceDelegate.saveField('keepScreenOn', enabled);
  },

  setCountUp: (enabled: boolean) => {
    set(state => ({
      settings: { ...state.settings, countUp: enabled }
    }));
    void persistenceDelegate.saveField('countUp', enabled);
  },

  setBackgroundImage: async (imageRef: string) => {
    set(state => ({
      settings: { ...state.settings, sessionBackgroundImage: imageRef }
    }));
    await persistenceDelegate.saveField('sessionBackgroundImage', imageRef);
  },

  setHydratedSettings: (settings: Settings) => {
    set({ settings: { ...settings } });
  },

  setDefaults: async () => {
    const defaults = await persistenceDelegate.setDefaults();
    set({ settings: { ...defaults } });
  },

  revertToPersistedSettings: async () => {
    const restored = await persistenceDelegate.revertToPersistedSettings();
    set({ settings: { ...restored } });
  },
}));

export const useSettingsStore = SettingsStore
