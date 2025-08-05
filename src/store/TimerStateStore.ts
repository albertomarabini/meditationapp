// src/store/TimerStateStore.ts

import { create } from 'zustand';
import type { SessionTimer } from '../models/domain';
import type { SessionTimersState } from '../store/types';
import type { ISessionTimerRepository } from '../repositories/interfaces';
import type { INotificationManager } from '../contracts/serviceInterfaces';
import { SessionTimerValidator } from '../validation/SessionTimerValidator';
import { SessionTimerRepoAdapter } from '../persistence/SessionTimerRepoAdapter';
import { SessionTimerReminderCoordinator } from '../delegates/SessionTimerReminderCoordinator';
import { SessionTimerDraftManager } from '../delegates/SessionTimerDraftManager';
import { TimerStateStoreFormErrorHelper } from '../delegates/TimerStateStoreFormErrorHelper';
import { generateUUIDv4 } from "../persistence/GenerateUUIDv4"
import * as SQLite from 'expo-sqlite';

// ---- Dependency holders ----
let db: SQLite.SQLiteDatabase | null = null;
let sessionTimerRepo: ISessionTimerRepository | null = null;

// Singletons for stuff that doesn't need async setup
const notificationManager: INotificationManager = require('../services/NotificationManager').NotificationManager;
const sessionTimerValidator = SessionTimerValidator;
const sessionTimerReminderCoordinator = new SessionTimerReminderCoordinator(notificationManager);
const sessionTimerDraftManager = SessionTimerDraftManager;
const formErrorHelper = TimerStateStoreFormErrorHelper;

// ---- Async init function ----
export async function initTimerStore() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('meditation-app.db');
  }
  sessionTimerRepo = new SessionTimerRepoAdapter(db);
}

// ---- Zustand slice ----
type ValidationError = Record<string, string> | null;
type MutationError = string | null;

export const useSessionTimersStore = create<SessionTimersState & {
  validationError: ValidationError;
  mutationError: MutationError;
  handleNameUniquenessResult: (result: any) => void;
  handleSqlMutationComplete: (result: any) => Promise<void>;
  handleSqlMutationError: (error: any) => void;
  clearMutationError: () => void;
  initialized: boolean;
  setInitialized: (value: boolean) => void;
  timersLoading: boolean;
  setTimersLoading: (value: boolean) => void;
}>((set, get) => ({
  sessionTimers: [],
  draftSessionTimer: null,
  validationError: null,
  mutationError: null,
  initialized: false,
  timersLoading: true,

  setInitialized(value: boolean) {
    set({ initialized: value });
  },

  setSessionTimers(timers: SessionTimer[]) {
    set({ sessionTimers: timers });
  },

  setDraftSessionTimer(timer: SessionTimer) {
    set({ draftSessionTimer: { ...timer } });
  },

  resetDraftSessionTimer() {
    const state = get();
    const lastPersisted = state.sessionTimers.find(
      (t) => t.id === state.draftSessionTimer?.id
    );
    const draft = sessionTimerDraftManager.resetDraft(lastPersisted);
    set({ draftSessionTimer: draft, validationError: null });
  },

  async saveSessionTimer(timer: SessionTimer): Promise<void> {
    if (!sessionTimerRepo) throw new Error('Timer store not initialized! Call initTimerStore() first.');
    const { valid, errors } = sessionTimerValidator.validate(timer);
    //DEBUG
    set({ validationError: valid ? null : errors });
    if (!valid) return;
    if (!timer.id) timer.id = generateUUIDv4();
    await sessionTimerRepo.save(timer);
    await sessionTimerReminderCoordinator.syncRemindersForSave(timer);
    const timers = await sessionTimerRepo.getAll();
    set({ sessionTimers: timers });
  },

  async deleteSessionTimer(timerId: string): Promise<void> {
    if (!sessionTimerRepo) throw new Error('Timer store not initialized! Call initTimerStore() first.');
    await sessionTimerReminderCoordinator.clearRemindersForDelete(timerId);
    await sessionTimerRepo.delete(timerId);
    const timers = await sessionTimerRepo.getAll();
    set({ sessionTimers: timers });
  },

  async loadSessionTimer(timerId: string): Promise<SessionTimer | null> {
    if (!sessionTimerRepo) throw new Error('Timer store not initialized! Call initTimerStore() first.');
    const timer = await sessionTimerRepo.getById(timerId);
    if (timer) {
      set({ draftSessionTimer: { ...timer } });
    }
    return timer;
  },

  handleNameUniquenessResult(result: any) {
    const duplicate = result.rows.length > 0 ? result.rows.item(0) : null;
    if (duplicate) {
      set({
        validationError: { name: 'A timer with this name already exists.' },
      });
    } else {
      set({ validationError: null });
    }
  },

  async handleSqlMutationComplete(_result: any): Promise<void> {
    if (!sessionTimerRepo) throw new Error('Timer store not initialized! Call initTimerStore() first.');
    const timers = await sessionTimerRepo.getAll();
    set({ sessionTimers: timers });
  },

  handleSqlMutationError(error: any) {
    set({
      mutationError: error?.message || 'SQLite mutation error.',
    });
  },

  async loadAllSessionTimers(): Promise<void> {
    if (!sessionTimerRepo) throw new Error('Timer store not initialized! Call initTimerStore() first.');
    const { setTimersLoading } = useSessionTimersStore.getState();
    setTimersLoading(true);
    try {
      const timers = await sessionTimerRepo.getAll();
      set({ sessionTimers: timers });
    } finally {
      setTimersLoading(false);
    }
  },

  clearMutationError() {
    set({ mutationError: null });
  },
  setTimersLoading: (value: boolean) => set({ timersLoading: value }),
}));

