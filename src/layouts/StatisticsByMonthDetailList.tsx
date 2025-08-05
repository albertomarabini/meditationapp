import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, HelperText } from 'react-native-paper';

// StatsByPeriod type is provided by the statistics aggregation module / models layer.
export type StatsByPeriod = {
  period: string;
  total_sessions: number;
  total_minutes: number;
};

type StatisticsByMonthDetailListProps = {
  byPeriod: StatsByPeriod[];
};

export const StatisticsByMonthDetailList: React.FC<StatisticsByMonthDetailListProps> = ({
  byPeriod,
}) => (
  <View>
    {byPeriod.length === 0 ? (
      <HelperText type="info" visible={true}>
        No data for this period.
      </HelperText>
    ) : (
      byPeriod.map((stat) => (
        <View key={stat.period} style={styles.detailRow}>
          <Text style={styles.detailPeriod}>{stat.period}</Text>
          <Text style={styles.detailText}>Sessions: {stat.total_sessions}</Text>
          <Text style={styles.detailText}>Minutes: {stat.total_minutes}</Text>
        </View>
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    paddingBottom: 2,
  },
  detailPeriod: {
    flex: 1.2,
    fontWeight: 'bold',
  },
  detailText: {
    flex: 1,
    textAlign: 'right',
  },
});
