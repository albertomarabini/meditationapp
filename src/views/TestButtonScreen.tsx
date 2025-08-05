import React from 'react';
import { View } from 'react-native';
import { IconButton } from 'react-native-paper';

export function TestButtonScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'yellow' }}>
      <IconButton
        icon="cog"
        iconColor="red"
        size={60}
        onPress={() => { console.log('STANDALONE COG CLICKED!'); }}
      />
    </View>
  );
}
