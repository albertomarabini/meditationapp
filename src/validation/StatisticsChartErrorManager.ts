export class StatisticsChartErrorManager {
  static getChartErrorMessage(error: Error): string {
    if (!error) return 'Unknown chart error.';
    if (error.message && error.message.toLowerCase().includes('data')) {
      return 'Unable to render chart due to invalid or missing data.';
    }
    if (error.message && error.message.toLowerCase().includes('format')) {
      return 'Chart data format error.';
    }
    return error.message || 'Chart rendering error.';
  }
}
