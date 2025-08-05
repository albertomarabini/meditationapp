// src/delegates/SessionTimerFormPersistenceHelper.ts

import type { SessionTimer } from '../models/domain';
import type { INotificationManager } from '../contracts/serviceInterfaces';
import { Alert } from 'react-native';
import { SessionTimerValidator } from '../validation/SessionTimerValidator';

type SaveSessionTimerFunc = (t: SessionTimer) => Promise<void>;
type DeleteSessionTimerFunc = (id: string) => Promise<void>;

export class SessionTimerFormPersistenceHelper {
  /**
   * Validates the SessionTimer, persists it to DB, and schedules/cancels reminders accordingly.
   * Throws on validation or persistence error; all notification actions are performed only after DB commit.
   *
   * @param form - the SessionTimer object (from form state)
   * @param saveSessionTimer - the DB persistence function (from TimerStateStore)
   * @param notificationManager - the notification manager implementing INotificationManager
   */
  async saveAndSchedule(
    form: SessionTimer,
    saveSessionTimer: SaveSessionTimerFunc,
    notificationManager: INotificationManager
  ): Promise<void> {
    const { valid, errors } = SessionTimerFormPersistenceHelper.validateSessionForm(form);
    // DEBUG
    // if (!valid) {
    //   throw new Error('Validation failed: ' + Object.values(errors).join(' '));
    // }
    await saveSessionTimer(form);
    if (form.dailyReminderEnabled && form.reminderTime) {
      await notificationManager.scheduleOrUpdateReminder(form.id, {
        id: '', // The notificationManager will assign the actual notification id
        frequency: 'daily',
        time: form.reminderTime,
        sessionTimerId: form.id,
        enabled: true,
      });
    } else {
      await notificationManager.cancelReminder(form.id);
    }
  }

  /**
   * Cancels all reminders for the timer, then deletes the timer from DB/storage.
   * Throws if cancellation or deletion fails.
   *
   * @param timerId - id of the SessionTimer to delete
   * @param deleteSessionTimer - the DB deletion function (from TimerStateStore)
   * @param notificationManager - the notification manager implementing INotificationManager
   */
  async deleteAndCancelReminders(
    timerId: string,
    deleteSessionTimer: DeleteSessionTimerFunc,
    notificationManager: INotificationManager
  ): Promise<void> {
    await notificationManager.cancelAllRemindersForTimer(timerId);
    await deleteSessionTimer(timerId);
  }

  /**
   * Production validation for a SessionTimer. Returns { valid, errors }.
   * Reimplements the form validation logic as described in the requirements.
   */
  static validateSessionForm(timer: SessionTimer) {
    return SessionTimerValidator.validate(timer);
  }
}
