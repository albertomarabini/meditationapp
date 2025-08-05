// src/delegates/SessionTimerReminderCoordinator.ts

import type { SessionTimer } from '../models/domain';
import type { INotificationManager } from '../contracts/serviceInterfaces';

/**
 * Coordinates scheduling, updating, and cancelling of reminders/notifications for SessionTimers.
 * Maps SessionTimer domain data to notification API and delegates to injected INotificationManager.
 * Used only by TimerStateStore.
 */
export class SessionTimerReminderCoordinator {
  private notificationManager: INotificationManager;

  constructor(notificationManager: INotificationManager) {
    this.notificationManager = notificationManager;
  }

  /**
   * Schedules or cancels a reminder after a SessionTimer is saved.
   * If dailyReminderEnabled is true and reminderTime is present, schedules or updates the reminder.
   * Otherwise, cancels any existing reminder for this timer.
   * @param timer SessionTimer
   */
  async syncRemindersForSave(timer: SessionTimer): Promise<void> {
    if (timer.dailyReminderEnabled && timer.reminderTime) {
      await this.notificationManager.scheduleOrUpdateReminder(timer.id, {
        id: timer.id,
        frequency: 'daily',
        time: timer.reminderTime,
        sessionTimerId: timer.id,
        enabled: true,
      });
    } else {
      await this.notificationManager.cancelReminder(timer.id);
    }
  }

  /**
   * Cancels all reminders for a timer prior to deletion.
   * @param timerId string
   */
  async clearRemindersForDelete(timerId: string): Promise<void> {
    await this.notificationManager.cancelAllRemindersForTimer(timerId);
  }
}
