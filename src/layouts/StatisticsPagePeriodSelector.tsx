import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton, Text } from 'react-native-paper';

type StatisticsPagePeriodSelectorProps = {
  selectedPeriod: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
};

export const StatisticsPagePeriodSelector: React.FC<StatisticsPagePeriodSelectorProps> = ({
  selectedPeriod,
  options,
  onChange,
}) => (
  <RadioButton.Group
    onValueChange={onChange}
    value={selectedPeriod}
  >
    <View style={styles.periodRow}>
      {options.map((option) => (
        <View key={option.key} style={styles.radioItem}>
          <RadioButton value={option.key} />
          <Text style={styles.radioLabel}>{option.label}</Text>
        </View>
      ))}
    </View>
  </RadioButton.Group>
);

const styles = StyleSheet.create({
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    marginBottom: 4,
  },
  radioLabel: {
    fontSize: 15,
    marginLeft: 2,
  },
});
