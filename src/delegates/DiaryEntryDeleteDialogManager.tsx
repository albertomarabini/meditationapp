import React from 'react';
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper';

type DiaryEntryDeleteDialogManagerProps = {
  visible: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  errorMessage?: string | null;
};

export function DiaryEntryDeleteDialogManager(props: DiaryEntryDeleteDialogManagerProps) {
  const { visible, onConfirm, onCancel, errorMessage } = props;
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>Delete Entry?</Dialog.Title>
        <Dialog.Content>
          <Paragraph>
            Are you sure you want to delete this diary entry? This action cannot be undone.
          </Paragraph>
          {errorMessage ? (
            <Paragraph style={{ color: 'red', marginTop: 8 }}>{errorMessage}</Paragraph>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel} accessibilityLabel="Cancel Delete">
            Cancel
          </Button>
          <Button onPress={onConfirm} accessibilityLabel="Confirm Delete">
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
