// /src/delegates/CalendarDateTimeFormatter.ts

export class CalendarDateTimeFormatter {
  /**
   * Returns a localized string showing both date and time,
   * using the device's locale and medium/short styles.
   * If parsing fails, returns the original timestamp string.
   */
  static formatDateTime(timestamp: string): string {
    try {
      const d = new Date(timestamp);
      return Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(d);
    } catch {
      return timestamp;
    }
  }

  /**
   * Returns a localized time string (hours:minutes) in the device's locale.
   * If parsing fails, returns the original timestamp string.
   */
  static formatTimeOnly(timestamp: string): string {
    try {
      const d = new Date(timestamp);
      return Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return timestamp;
    }
  }
}
