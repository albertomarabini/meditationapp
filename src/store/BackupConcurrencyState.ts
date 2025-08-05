// src/store/types.ts

import {create} from 'zustand';

interface BackupConcurrencyState {
  isBackupInProgress: boolean;
  setBackupInProgress: (val: boolean) => void;
}

export const useBackupConcurrencyStore = create<BackupConcurrencyState>((set) => ({
  isBackupInProgress: false,
  setBackupInProgress: (val) => set({ isBackupInProgress: val }),
}));
