// src/aggregation/StatisticsAggregator.ts

import type { MeditationLog, StatsSummary, StatsByPeriod } from '../models/domain';

/**
 * Aggregator for computing meditation statistics and chart data.
 * Pure/stateless aggregation logic for use in StatisticsPage and YAML export.
 */
export class StatisticsAggregator {
  /**
   * Parse ISO8601 string to Date.
   */
  static parseISO8601(dateStr: string): Date {
    return new Date(dateStr);
  }

  /**
   * Returns a YYYY-MM string for given Date.
   */
  static monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Returns an array of last n months' keys (YYYY-MM), oldest to newest.
   * E.g., getLastNMonths(3) on June 2025 yields ['2025-04', '2025-05', '2025-06']
   */
  static getLastNMonths(n: number): string[] {
    const now = new Date();
    const keys: string[] = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(StatisticsAggregator.monthKey(d));
    }
    return keys;
  }

  /**
   * Aggregates meditation logs into summary stats, by-period breakdown, and chart data.
   * - logs: Array of meditation logs ({timestamp, duration})
   * - periodKey: "ALL" for all data, or "<n>M" for last n months (e.g., "3M")
   * - locale: device/user locale for date formatting (e.g., "en-US")
   *
   * Returns:
   *   {
   *     summary: StatsSummary,
   *     byPeriod: StatsByPeriod[],
   *     chartData: { labels: string[], data: number[] }
   *   }
   */
  static aggregateStatistics(
    logs: { timestamp: string; duration: number }[],
    periodKey: string,
    locale: string
  ): {
    summary: StatsSummary;
    byPeriod: StatsByPeriod[];
    chartData: { labels: string[]; data: number[] };
  } {
    // 1. Filter for valid logs
    const validLogs = logs.filter(
      l =>
        !!l.timestamp &&
        typeof l.duration === 'number' &&
        Number.isFinite(l.duration) &&
        l.duration > 0
    );

    // 2. Determine period labels and filter logs
    let filteredLogs = validLogs;
    let periodLabels: string[] = [];

    if (periodKey === 'ALL') {
      periodLabels = Array.from(
        new Set(validLogs.map(l =>
          StatisticsAggregator.monthKey(StatisticsAggregator.parseISO8601(l.timestamp))
        ))
      ).sort();
    } else {
      // e.g., '1M', '3M', '6M', '12M'
      const monthsCount = parseInt(periodKey);
      periodLabels = StatisticsAggregator.getLastNMonths(monthsCount);
      const allowedMonths = new Set(periodLabels);
      filteredLogs = validLogs.filter(l =>
        allowedMonths.has(StatisticsAggregator.monthKey(StatisticsAggregator.parseISO8601(l.timestamp)))
      );
    }

    // 3. Aggregate logs per period key (month)
    const periodMap: Record<string, { total_sessions: number; total_minutes: number }> = {};
    for (const key of periodLabels) {
      periodMap[key] = { total_sessions: 0, total_minutes: 0 };
    }
    for (const l of filteredLogs) {
      const key = StatisticsAggregator.monthKey(StatisticsAggregator.parseISO8601(l.timestamp));
      if (periodMap[key]) {
        periodMap[key].total_sessions += 1;
        periodMap[key].total_minutes += Math.round(l.duration / 60);
      }
    }

    // 4. Chart labels (localized) and data
    const chartLabels: string[] = periodLabels.map(key => {
      const [year, month] = key.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      return dateObj.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
    });
    const chartDataArr: number[] = periodLabels.map(
      key => periodMap[key]?.total_minutes || 0
    );

    // 5. Prepare summary
    const total_sessions = filteredLogs.length;
    const total_time_minutes = filteredLogs.reduce(
      (acc, l) => acc + Math.round(l.duration / 60),
      0
    );
    const average_session_duration_minutes =
      total_sessions === 0
        ? 0
        : Number(
            (
              filteredLogs.reduce((acc, l) => acc + l.duration, 0) /
              total_sessions /
              60
            ).toFixed(1)
          );

    // 6. By-period breakdown
    const byPeriod: StatsByPeriod[] = periodLabels.map(key => ({
      period: key,
      total_sessions: periodMap[key]?.total_sessions || 0,
      total_minutes: periodMap[key]?.total_minutes || 0,
    }));

    return {
      summary: {
        total_sessions,
        total_time_minutes,
        average_session_duration_minutes,
      },
      byPeriod,
      chartData: { labels: chartLabels, data: chartDataArr }
    };
  }
}

export type { StatsSummary, StatsByPeriod };
