// src/serialization/StatisticsYAMLExportHelper.ts

import yaml from 'js-yaml';
import type { StatsSummary, StatsByPeriod } from '../models/domain';

type StatisticsYAMLExport = {
  summary: StatsSummary;
  by_month: Array<{
    month: string;
    total_sessions: number;
    total_minutes: number;
  }>;
};

export class StatisticsYAMLExportHelper {
  /**
   * Serializes summary and by-month stats to the required YAML schema.
   * Ensures fields are correctly named and include all required export fields.
   */
  static serializeToYAML(
    summary: StatsSummary,
    byPeriod: StatsByPeriod[]
  ): string {
    const yamlObj: StatisticsYAMLExport = {
      summary,
      by_month: byPeriod.map(periodStat => ({
        month: periodStat.period,
        total_sessions: periodStat.total_sessions,
        total_minutes: periodStat.total_minutes,
      })),
    };
    return yaml.dump(yamlObj, { quotingType: '"', forceQuotes: false });
  }
}
