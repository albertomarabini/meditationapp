import React from 'react';

export function Calendar(props: any) {
  // You could log every prop or action for debugging
  console.log('Calendar (mock) rendered with:', props);

  // Option 1: Render nothing
  return null;

  // Option 2: Render a stub UI
  // return (
  //   <View style={{height: 320, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee'}}>
  //     <Text>Mock Calendar (react-native-calendars removed)</Text>
  //   </View>
  // );
}
