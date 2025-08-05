// /src/services/NotificationManager.ts
import * as Notifications from 'expo-notifications';import { useSettingsStore } from '../store/SettingsStore';
import { useSessionTimersStore } from '../store/TimerStateStore';
import { NotificationSQLiteHelper } from '../persistence/NotificationSQLiteHelper';
import { NotificationTimeTriggerGenerator } from '../delegates/NotificationTimeTriggerGenerator';
import { NotificationScheduleErrorHandler } from '../delegates/NotificationScheduleErrorHandler';
import { useNavigation } from '@react-navigation/native';
import type { INotificationManager } from '../contracts/serviceInterfaces';
import type { NotificationRecord } from '../models/domain';

const NOTIFICATIONS_TABLE = 'Notifications';

class NotificationManagerImpl implements INotificationManager {
  private sqliteHelper = NotificationSQLiteHelper;
  private triggerGenerator = NotificationTimeTriggerGenerator;
  private errorHandler = NotificationScheduleErrorHandler;

  async scheduleOrUpdateReminder(timerId: string, reminderData: NotificationRecord): Promise<void> {
    await this.sqliteHelper.upsertNotificationRecord(NOTIFICATIONS_TABLE, reminderData);

    const { triggerObject } = this.triggerGenerator.computeNextTrigger(
      new Date(),
      reminderData.time,
      reminderData.frequency//[ts] Argument of type 'string' is not assignable to parameter of type '"daily" | "every_n_days" | "every_n_hours"'.
    );

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminderData.frequency === 'daily'
          ? 'Meditation Reminder'
          : 'Meditation App Reminder',
        body: "It's time for your meditation session.",
        data: { timerId: timerId },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: triggerObject,
    });

    await this.sqliteHelper.updateNotificationId(NOTIFICATIONS_TABLE, timerId, notificationId as string);
  }

  async cancelReminder(timerId: string): Promise<void> {
    const reminders = await this.sqliteHelper.queryRemindersByTimerId(NOTIFICATIONS_TABLE, timerId);
    for (const reminder of reminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
      await this.sqliteHelper.deleteNotificationById(NOTIFICATIONS_TABLE, reminder.id);
    }
  }

  async cancelAllRemindersForTimer(timerId: string): Promise<void> {
    const reminders = await this.sqliteHelper.queryRemindersByTimerId(NOTIFICATIONS_TABLE, timerId);
    for (const reminder of reminders) {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    }
    await this.sqliteHelper.deleteNotificationsByTimerId(NOTIFICATIONS_TABLE, timerId);
  }

  async loadAllRemindersFromDB(): Promise<void> {
    const reminders = await this.sqliteHelper.queryEnabledReminders(NOTIFICATIONS_TABLE);
    // Placeholder for Zustand notification slice sync, contract only; reactivity handled elsewhere
    // e.g., useNotificationsStore.getState().setReminders(reminders)
  }

  async syncScheduledNotifications(): Promise<void> {
    const dbReminders = await this.sqliteHelper.queryEnabledReminders(NOTIFICATIONS_TABLE);
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledIds = new Set(
      (scheduled as { identifier: string }[]).map(s => s.identifier)
    );
        for (const reminder of dbReminders) {
      if (!scheduledIds.has(reminder.id)) {
        const { triggerObject } = this.triggerGenerator.computeNextTrigger(
          new Date(),
          reminder.time,
          reminder.frequency
        );
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: reminder.frequency === 'daily'
              ? 'Meditation Reminder'
              : 'Meditation App Reminder',
            body: "It's time for your meditation session.",
            data: { timerId: reminder.sessionTimerId },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: triggerObject,
        });
        await this.sqliteHelper.updateNotificationId(NOTIFICATIONS_TABLE, reminder.sessionTimerId, notificationId as string);
      }
    }
  }

  async scheduleReminder(timerId: string, reminderData: NotificationRecord): Promise<void> {
    const { triggerObject } = this.triggerGenerator.computeNextTrigger(
      new Date(),
      reminderData.time,
      reminderData.frequency
    );
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: reminderData.frequency === 'daily'
          ? 'Meditation Reminder'
          : 'Meditation App Reminder',
        body: "It's time for your meditation session.",
        data: { timerId: timerId },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: triggerObject,
    });
    if (reminderData.id !== notificationId) {
      await this.sqliteHelper.updateNotificationId(NOTIFICATIONS_TABLE, timerId, notificationId as string);
    }
    await this.onNotificationScheduled(notificationId as string, reminderData);
  }

  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const data = response?.notification?.request?.content?.data;
    let timerId: string | undefined = undefined;
    if (data && typeof data === 'object' && 'timerId' in data) {
      timerId = data.timerId as string;
    }
    if (!timerId || typeof timerId !== 'string') {
      throw new Error('No Session Timer ID found in notification data.');
    }
    useNavigation().navigate({
      screen: 'SessionTimerEdit',
      params: { id: timerId }
    } as never);
    // The following import is intentionally required here (runtime), for contract coherence
    const timerStateStore = require('../store/TimerStateStore');
    await timerStateStore.TimerStateStore.getState().loadSessionTimer(timerId);
  }

  async onNotificationScheduled(notificationId: string, data: NotificationRecord): Promise<void> {
    await this.sqliteHelper.upsertNotificationRecord(NOTIFICATIONS_TABLE, {
      ...data,
      id: notificationId,
    });
  }

  async onNotificationCancel(notificationId: string): Promise<void> {
    await this.sqliteHelper.deleteNotificationById(NOTIFICATIONS_TABLE, notificationId);
  }

  async onNotificationScheduleFailure(error: Error): Promise<void> {
    await this.errorHandler.handleError(
      NOTIFICATIONS_TABLE,
      this.loadAllRemindersFromDB.bind(this),
      error
    );
  }

  getNotificationRecords(): Readonly<NotificationRecord[]> {
    // Placeholder for notification state selector, contract only
    return [];
  }

  setNotificationRecords(_records: NotificationRecord[]): void {
    // Noop: contract placeholder for notification slice update, not implemented here
  }
}

export const NotificationManager: INotificationManager = new NotificationManagerImpl();
