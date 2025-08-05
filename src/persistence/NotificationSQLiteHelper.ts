import * as SQLite from 'expo-sqlite';
import type { NotificationFrequency, NotificationRecord } from '../models/domain';
import type { INotificationRepository } from '../repositories/interfaces';

export class NotificationSQLiteHelper implements INotificationRepository {
  async getAll(): Promise<NotificationRecord[]> {
    return NotificationSQLiteHelper.queryAllReminders('Notifications');
  }

  async save(record: NotificationRecord): Promise<void> {
    await NotificationSQLiteHelper.upsertNotificationRecord('Notifications', record);
  }

  async delete(id: string): Promise<void> {
    await NotificationSQLiteHelper.deleteNotificationById('Notifications', id);
  }

  static async upsertNotificationRecord(
    table: string,
    record: NotificationRecord
  ): Promise<void> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    await db.runAsync(
      `INSERT OR REPLACE INTO ${table}
        (id, frequency, time, sessionTimerId, enabled)
       VALUES (?, ?, ?, ?, ?);`,
      [
        record.id,
        record.frequency,
        record.time,
        record.sessionTimerId,
        record.enabled ? 1 : 0,
      ]
    );
  }

  static async updateNotificationId(
    table: string,
    timerId: string,
    newId: string
  ): Promise<void> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    await db.runAsync(
      `UPDATE ${table} SET id = ? WHERE sessionTimerId = ?;`,
      [newId, timerId]
    );
  }

  static async deleteNotificationById(
    table: string,
    notificationId: string
  ): Promise<void> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    await db.runAsync(
      `DELETE FROM ${table} WHERE id = ?;`,
      [notificationId]
    );
  }

  static async deleteNotificationsByTimerId(
    table: string,
    timerId: string
  ): Promise<void> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    await db.runAsync(
      `DELETE FROM ${table} WHERE sessionTimerId = ?;`,
      [timerId]
    );
  }

  static async queryEnabledReminders(table: string): Promise<NotificationRecord[]> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    const results = await db.getAllAsync(
      `SELECT id, frequency, time, sessionTimerId, enabled FROM ${table} WHERE enabled = 1;`
    ) as Record<string, any>[];
    return results.map(NotificationSQLiteHelper.parseRowToRecord);
  }

  static async queryRemindersByTimerId(
    table: string,
    timerId: string
  ): Promise<NotificationRecord[]> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    const results = await db.getAllAsync(
      `SELECT id, frequency, time, sessionTimerId, enabled FROM ${table} WHERE sessionTimerId = ?;`,
      [timerId]
    ) as Record<string, any>[];
    return results.map(NotificationSQLiteHelper.parseRowToRecord);
  }

  static async queryAllReminders(table: string): Promise<NotificationRecord[]> {
    const db = await SQLite.openDatabaseAsync('meditation-app.db');
    const results = await db.getAllAsync(
      `SELECT id, frequency, time, sessionTimerId, enabled FROM ${table};`
    ) as Record<string, any>[];
    return results.map(NotificationSQLiteHelper.parseRowToRecord);
  }

  static parseRowToRecord(row: Record<string, any>): NotificationRecord {
    return {
      id: String(row.id),
      frequency: String(row.frequency) as NotificationFrequency,
      time: String(row.time),
      sessionTimerId: String(row.sessionTimerId),
      enabled: !!row.enabled,
    };
  }
}



/**
 *
 *
 * STUB CLASS
 *
 *
 */


// import type { NotificationRecord } from '../models/domain';
// import type { INotificationRepository } from '../repositories/interfaces';

// // Minimal external in-memory store
// const NOTIFICATION_STORE = new Map<string, NotificationRecord>();

// // Seed with one fake record for demo/debug
// if (NOTIFICATION_STORE.size === 0) {
//   NOTIFICATION_STORE.set('fake-id', {
//     id: 'fake-id',
//     frequency: 'daily',
//     time: '08:00',
//     sessionTimerId: 'fake-timer-id',
//     enabled: true,
//   });
// }

// export class NotificationSQLiteHelper {
//   // Instance-style methods for interface compatibility
//   async getAll(): Promise<NotificationRecord[]> {
//     return NotificationSQLiteHelper.queryAllReminders('Notifications');
//   }

//   async save(record: NotificationRecord): Promise<void> {
//     await NotificationSQLiteHelper.upsertNotificationRecord('Notifications', record);
//   }

//   async delete(id: string): Promise<void> {
//     await NotificationSQLiteHelper.deleteNotificationById('Notifications', id);
//   }

//   // --- Static methods, as per your original pattern ---

//   static async upsertNotificationRecord(
//     table: string,
//     record: NotificationRecord
//   ): Promise<void> {
//     NOTIFICATION_STORE.set(record.id, { ...record });
//   }

//   static async updateNotificationId(
//     table: string,
//     timerId: string,
//     newId: string
//   ): Promise<void> {
//     for (const rec of NOTIFICATION_STORE.values()) {
//       if (rec.sessionTimerId === timerId) {
//         NOTIFICATION_STORE.delete(rec.id);
//         NOTIFICATION_STORE.set(newId, { ...rec, id: newId });
//         break;
//       }
//     }
//   }

//   static async deleteNotificationById(
//     table: string,
//     notificationId: string
//   ): Promise<void> {
//     NOTIFICATION_STORE.delete(notificationId);
//   }

//   static async deleteNotificationsByTimerId(
//     table: string,
//     timerId: string
//   ): Promise<void> {
//     for (const rec of Array.from(NOTIFICATION_STORE.values())) {
//       if (rec.sessionTimerId === timerId) {
//         NOTIFICATION_STORE.delete(rec.id);
//       }
//     }
//   }

//   static async queryEnabledReminders(
//     table: string
//   ): Promise<NotificationRecord[]> {
//     return Array.from(NOTIFICATION_STORE.values()).filter((r) => r.enabled);
//   }

//   static async queryRemindersByTimerId(
//     table: string,
//     timerId: string
//   ): Promise<NotificationRecord[]> {
//     return Array.from(NOTIFICATION_STORE.values()).filter(
//       (r) => r.sessionTimerId === timerId
//     );
//   }

//   static async queryAllReminders(
//     table: string
//   ): Promise<NotificationRecord[]> {
//     return Array.from(NOTIFICATION_STORE.values());
//   }
// }
