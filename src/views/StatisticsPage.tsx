// src/views/StatisticsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { Card, Button, Text, HelperText, ActivityIndicator, Surface } from 'react-native-paper';
// import { LineChart } from 'react-native-chart-kit';
import { LineChart } from '../mocks/react-native-chart-kit.mock'; // Dev/mock only!
// import Share from 'react-native-share';
import Share from '../mocks/Share.mock';
import { useLogStore } from '../store/LogStateStore';
import { useSettingsStore } from '../store/SettingsStore';
import { StatisticsAggregator } from '../aggregation/StatisticsAggregator';
import { StatisticsYAMLExportHelper } from '../serialization/StatisticsYAMLExportHelper';
import { StatisticsChartErrorManager } from '../validation/StatisticsChartErrorManager';
import { StatisticsPagePeriodSelector } from '../layouts/StatisticsPagePeriodSelector';
import { StatisticsByMonthDetailList } from '../layouts/StatisticsByMonthDetailList';

const PERIOD_OPTIONS = [
  { key: '1M', label: '1 Month' },
  { key: '3M', label: '3 Months' },
  { key: '6M', label: '6 Months' },
  { key: '12M', label: '12 Months' },
  { key: 'ALL', label: 'All Time' },
];

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(34, 95, 178, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 44, 44, ${opacity})`,
  style: {
    borderRadius: 12,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#2A6CEF',
  },
};

export default function StatisticsPage() {
  const meditationLogs = useLogStore(state => state.meditationLogs);
  const settings = useSettingsStore(state => state.settings);

  const [selectedPeriod, setSelectedPeriod] = useState<string>('3M');
  const [summary, setSummary] = useState<ReturnType<typeof StatisticsAggregator.aggregateStatistics>['summary']>({
    total_sessions: 0,
    total_time_minutes: 0,
    average_session_duration_minutes: 0,
  });
  const [byPeriod, setByPeriod] = useState<ReturnType<typeof StatisticsAggregator.aggregateStatistics>['byPeriod']>([]);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [chartError, setChartError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const locale =
    (typeof Intl !== 'undefined' && Intl.DateTimeFormat().resolvedOptions().locale) || 'en-US';

  useEffect(() => {
    try {
      setChartError(null);
      const { summary, byPeriod, chartData } = StatisticsAggregator.aggregateStatistics(
        meditationLogs,
        selectedPeriod,
        locale
      );
      setSummary(summary);
      setByPeriod(byPeriod);
      setChartData(chartData);
    } catch (_error: any) {
      setChartError('Statistics calculation error.');
      setSummary({
        total_sessions: 0,
        total_time_minutes: 0,
        average_session_duration_minutes: 0,
      });
      setByPeriod([]);
      setChartData({ labels: [], data: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meditationLogs, selectedPeriod, locale]);

  const handlePeriodChange = useCallback((period: string) => {
    setSelectedPeriod(period);
  }, []);

  const handleChartError = useCallback((error: Error) => {
    const errorMsg = StatisticsChartErrorManager.getChartErrorMessage(error);
    setChartError(errorMsg);
  }, []);

  const openShareDialog = useCallback(async (yamlData: string) => {
    setIsSharing(true);
    try {
      await Share.open({
        title: 'Share Meditation Statistics',
        message: yamlData,
        failOnCancel: false,
      });
    } finally {
      setIsSharing(false);
    }
  }, []);

  const handleSharePress = useCallback(async () => {
    const yamlStr = StatisticsYAMLExportHelper.serializeToYAML(summary, byPeriod);
    await openShareDialog(yamlStr);
  }, [summary, byPeriod, openShareDialog]);

  const chartWidth = Math.max(Dimensions.get('window').width - 34, 260);
  const chartHeight = 220;
  const showChart = chartData.labels.length > 0 && chartData.data.length > 0 && !chartError;

  function renderChart() {
    try {
      return (
        <LineChart
          data={{
            labels: chartData.labels,
            datasets: [{ data: chartData.data }],
          }}
          width={chartWidth}
          height={chartHeight}
          chartConfig={chartConfig}
          bezier
          style={{ borderRadius: 14, paddingRight: 12 }}
          fromZero
          onDataPointClick={undefined}
          withInnerLines
          withOuterLines
          withVerticalLabels
          yAxisSuffix="m"
          yAxisInterval={1}
          yLabelsOffset={2}
          yAxisLabel=""
        />
      );
    } catch (error) {
      handleChartError(error as Error);
      return null;
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      accessibilityLabel="Statistics Page"
    >
      <Card style={styles.card}>
        <Card.Title title="Meditation Statistics" />
        <Card.Content>
          <View style={styles.summaryRow}>
            <Surface style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Sessions</Text>
              <Text style={styles.summaryValue}>{summary.total_sessions}</Text>
            </Surface>
            <Surface style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total Minutes</Text>
              <Text style={styles.summaryValue}>{summary.total_time_minutes}</Text>
            </Surface>
            <Surface style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Avg Duration</Text>
              <Text style={styles.summaryValue}>
                {summary.average_session_duration_minutes}
                <Text style={styles.summaryUnit}> min</Text>
              </Text>
            </Surface>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Time Period" />
        <Card.Content>
          <StatisticsPagePeriodSelector
            selectedPeriod={selectedPeriod}
            options={PERIOD_OPTIONS}
            onChange={handlePeriodChange}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Chart" />
        <Card.Content>
          {showChart ? (
            renderChart()
          ) : (
            <View style={styles.noChartBox}>
              {chartError ? (
                <HelperText type="error" visible={!!chartError}>
                  {chartError}
                </HelperText>
              ) : (
                <Text style={styles.noChartText}>No data for chart.</Text>
              )}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="By Month" />
        <Card.Content>
          <StatisticsByMonthDetailList byPeriod={byPeriod} />
        </Card.Content>
      </Card>

      <View style={styles.bottomRow}>
        <Button
          mode="contained"
          disabled={isSharing || byPeriod.length === 0}
          loading={isSharing}
          style={styles.shareButton}
          onPress={handleSharePress}
          accessibilityLabel="Share meditation statistics"
        >
          Share Statistics
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
    backgroundColor: '#FAFAFA',
  },
  card: {
    marginBottom: 13,
    borderRadius: 14,
    elevation: 1,
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#F9F9F9',
    elevation: 0,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555',
  },
  summaryValue: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#2A6CEF',
    marginTop: 2,
  },
  summaryUnit: {
    fontSize: 12,
    color: '#555',
    fontWeight: 'normal',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  shareButton: {
    minWidth: 180,
    borderRadius: 9,
  },
  noChartBox: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  noChartText: {
    color: '#888',
    fontSize: 15,
    opacity: 0.88,
  },
});
