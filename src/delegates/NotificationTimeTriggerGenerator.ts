import type {
  DailyTriggerInput,
  TimeIntervalTriggerInput,
} from 'expo-notifications';

export class NotificationTimeTriggerGenerator {
  static computeNextTrigger(
    currentTime: Date,
    timeString: string,
    frequency: 'daily' | 'every_n_days' | 'every_n_hours',
    intervalHours = 2
  ): {
    triggerDate: Date;
    triggerObject: DailyTriggerInput | TimeIntervalTriggerInput;
  } {
    let hours: number, minutes: number;

    if (/^\d{2}:\d{2}$/.test(timeString)) {
      [hours, minutes] = timeString.split(':').map(Number);
    } else {
      const iso = new Date(timeString);
      hours = iso.getHours();
      minutes = iso.getMinutes();
    }

    let triggerDate = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      hours,
      minutes,
      0,
      0
    );

    let triggerObject: DailyTriggerInput | TimeIntervalTriggerInput;

    switch (frequency) {
      case 'daily':
      case 'every_n_days':
        if (triggerDate <= currentTime) {
          triggerDate.setDate(triggerDate.getDate() + 1);
        }
        triggerObject = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };
        break;

      case 'every_n_hours':
        triggerDate = new Date(currentTime.getTime() + intervalHours * 3600 * 1000);
        triggerObject = {
          seconds: intervalHours * 3600,
          repeats: true,
        };
        break;

      default:
        throw new Error(`Unknown frequency: ${frequency}`);
    }

    return { triggerDate, triggerObject };
  }
}
