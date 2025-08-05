// /src/delegates/NotificationScheduleErrorHandler.ts

export class NotificationScheduleErrorHandler {
  /**
   * Rolls back all notification state/UI to the last persisted DB state.
   * Calls provided "reload" method (usually NotificationManagerImpl.loadAllRemindersFromDB).
   * Throws the error to be caught in UI for dialog display.
   *
   * @param dbTable - The notifications table name (not used, included for contract completeness)
   * @param loadAllRemindersFromDB - Function to reload all reminders from DB and hydrate UI/store state
   * @param error - The error that occurred; will be re-thrown for the parent/UI to handle
   */
  static async handleError(
    dbTable: string,
    loadAllRemindersFromDB: () => Promise<void>,
    error: Error
  ): Promise<void> {
    await loadAllRemindersFromDB();
    throw error;
  }
}
