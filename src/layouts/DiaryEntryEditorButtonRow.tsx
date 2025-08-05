import React from 'react';
import { Button } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';

type DiaryEntryEditorButtonRowProps = {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function DiaryEntryEditorButtonRow(props: DiaryEntryEditorButtonRowProps) {
  const { onUndo, onRedo, canUndo, canRedo } = props;
  return (
    <View style={styles.buttonRow}>
      <Button
        icon="undo"
        onPress={onUndo}
        disabled={!canUndo}
        accessibilityLabel="Undo"
        style={styles.actionButton}
      >
        Undo
      </Button>
      <Button
        icon="redo"
        onPress={onRedo}
        disabled={!canRedo}
        accessibilityLabel="Redo"
        style={styles.actionButton}
      >
        Redo
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  actionButton: {
    minWidth: 100,
    marginHorizontal: 8,
  },
});
