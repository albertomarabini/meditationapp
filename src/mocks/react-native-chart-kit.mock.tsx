// src/__mocks__/react-native-chart-kit.tsx
import React from 'react';
import { View, Text } from 'react-native';

export const LineChart = (props: any) => {
  console.log('[MOCK:react-native-chart-kit] LineChart props:', props);
  // Return a placeholder view instead of a real chart.
  return (
    <View//[ts] Cannot find name 'View'.
      style={[
        {
          height: props.height || 120,
          width: props.width || 220,
          backgroundColor: '#eee',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          margin: 6,
        },
        props.style,
      ]}
    >
      <Text style={{ color: '#555', fontSize: 16 }}>Chart hidden (mock)</Text> //[ts] JSX element class does not support attributes because it does not have a 'props' property.
    </View>//[ts] Cannot find name 'View'.
  );
};

// You may also want to export BarChart, PieChart, etc., in a similar way.
