// /src/layouts/SessionTimerFormLayout.tsx

import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { statusBarHeight } from './StatusBarHeight';
import { BANNER_HEIGHT } from '../components/AdBanner';
import {
  TextInput,
  Button,
  IconButton,
  Dialog,
  Portal,
  HelperText,
  Title,
  Subheading,
  Paragraph,
  Divider,
  Card,
  Switch,
  RadioButton,
  Appbar,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { SessionTimer, SoundOrigin } from '../models/domain';
import { SettingsStore } from '../store/SettingsStore';

type SessionTimerFormLayoutProps = {
  localForm: SessionTimer;
  localValidation: Record<string, string>;
  isEditMode: boolean;
  isLoading: boolean;
  title: string;
  deleteDialogVisible: boolean;
  unsavedDialogVisible: boolean;
  errorDialog: string | null;
  reminderTimePickerVisible: boolean;
  onNameChange(value: string): void;
  onPreparationTimeChange(value: string): void;
  onSegmentationSoundPress(): void;
  onSegmentationRepeatChange(value: string | number): void;
  onSegmentationVolumeChange(value: number): void;
  onMeditationSoundSourceChange(value: string): void;
  onMeditationSoundSelectorPress(): void;
  onMeditationRepeatTypeChange(value: string): void;
  onMeditationRepeatCountChange(value: string | number): void;
  onMeditationVolumeChange(value: number): void;
  onAddSegmentPress(): void;
  onSegmentDurationChange(idx: number, value: string): void;
  onRemoveSegmentPress(idx: number): void;
  onDailyReminderToggle(value: boolean): void;
  onReminderTimeChange(_event: any, selectedTime: Date | undefined): void;
  onEnableDiaryToggle(value: boolean): void;
  onBackPress(): void;
  onCancelPress(): void;
  onDeletePress(): void;
  onDeleteCancel(): void;
  onDeleteConfirm(): void;
  onUnsavedChangesSave(): void;
  onUnsavedChangesDiscard(): void;
  onSavePress(): void;
  onErrorDialogDismiss(): void;
  setReminderTimePickerVisible(value: boolean): void;
};

export const SessionTimerFormLayout: React.FC<SessionTimerFormLayoutProps> = (props) => {
  const {
    localForm,
    localValidation,
    isEditMode,
    isLoading,
    title,
    deleteDialogVisible,
    unsavedDialogVisible,
    errorDialog,
    reminderTimePickerVisible,
    onNameChange,
    onPreparationTimeChange,
    onSegmentationSoundPress,
    onSegmentationRepeatChange,
    onSegmentationVolumeChange,
    onMeditationSoundSourceChange,
    onMeditationSoundSelectorPress,
    onMeditationRepeatTypeChange,
    onMeditationRepeatCountChange,
    onMeditationVolumeChange,
    onAddSegmentPress,
    onSegmentDurationChange,
    onRemoveSegmentPress,
    onDailyReminderToggle,
    onReminderTimeChange,
    onEnableDiaryToggle,
    onBackPress,
    onCancelPress,
    onDeletePress,
    onDeleteCancel,
    onDeleteConfirm,
    onUnsavedChangesSave,
    onUnsavedChangesDiscard,
    onSavePress,
    onErrorDialogDismiss,
    setReminderTimePickerVisible,
  } = props;

  const adsFreePurchased = SettingsStore((state) => state.settings.adsFreePurchased);
  const saveDisabled =
    isLoading ||
    (localForm
      ? Object.keys(localValidation).length > 0 ||
      !localForm.name ||
      localForm.segments.length === 0
      : true);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={onDeleteCancel}>
          <Dialog.Title>Delete Session Timer</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete this Session Timer? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onDeleteCancel}>Cancel</Button>
            <Button onPress={onDeleteConfirm} loading={isLoading} disabled={isLoading} buttonColor="red">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={unsavedDialogVisible} onDismiss={onUnsavedChangesDiscard}>
          <Dialog.Title>Unsaved Changes</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Do you want to save your changes before leaving?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onUnsavedChangesDiscard}>Discard</Button>
            <Button onPress={onUnsavedChangesSave}>Save</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={!!errorDialog} onDismiss={onErrorDialogDismiss}>
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{errorDialog}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={onErrorDialogDismiss}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Appbar.Header>
        <Appbar.BackAction onPress={onBackPress} accessibilityLabel="Go Back" />
        <Appbar.Content title={title} style={{ flex: 1 , alignContent:"center"}}/>
        {isEditMode && (
            <Appbar.Action icon="delete" onPress={onDeletePress} accessibilityLabel="Delete" iconColor="red" />
        )}
      </Appbar.Header>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.container, {paddingBottom: (adsFreePurchased)? 0:BANNER_HEIGHT + 8}]}>
        <TextInput
          label="Name"
          value={localForm.name}
          onChangeText={onNameChange}
          error={!!localValidation.name}
          mode="outlined"
          style={styles.input}
          accessibilityLabel="Session Timer Name"
          disabled={isLoading}
        />
        <HelperText type="error" visible={!!localValidation.name}>
          {localValidation.name}
        </HelperText>
        <TextInput
          label="Preparation Time (seconds)"
          value={localForm.preparationTime.toString()}
          onChangeText={onPreparationTimeChange}
          keyboardType="numeric"
          error={!!localValidation.preparationTime}
          mode="outlined"
          style={styles.input}
          accessibilityLabel="Preparation Time"
          disabled={isLoading}
        />
        <HelperText type="error" visible={!!localValidation.preparationTime}>
          {localValidation.preparationTime}
        </HelperText>
        <Subheading>Segmentation Sound</Subheading>
        <View style={styles.inlineRow}>
          <Button mode="outlined" onPress={onSegmentationSoundPress} disabled={isLoading}>
            {localForm.segmentationSound.uri ? 'Change Sound' : 'Pick Sound'}
          </Button>
          <TextInput
            label="Repetition (1-3)"
            value={localForm.segmentationSound.repetition.toString()}
            onChangeText={v => onSegmentationRepeatChange(v)}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            error={!!localValidation.segmentationSound_repetition}
            disabled={isLoading}
          />
          <TextInput
            label="Volume (0-5)"
            value={localForm.segmentationSound.volume.toString()}
            onChangeText={v => onSegmentationVolumeChange(parseInt(v || '0', 10))}
            keyboardType="numeric"
            style={[styles.input, { flex: 1, marginLeft: 8 }]}
            error={!!localValidation.segmentationSound_volume}
            disabled={isLoading}
          />
        </View>
        <HelperText type="error" visible={
          !!localValidation.segmentationSound_uri ||
          !!localValidation.segmentationSound_repetition ||
          !!localValidation.segmentationSound_volume
        }>
          {[localValidation.segmentationSound_uri,
          localValidation.segmentationSound_repetition,
          localValidation.segmentationSound_volume
          ]
            .filter(Boolean)
            .join('\n')}
        </HelperText>

        <Subheading>Meditation Sound</Subheading>
        <View style={styles.inlineRow}>
          <RadioButton.Group
            onValueChange={onMeditationSoundSourceChange}//[ts] Type '(value: SoundOrigin) => void' is not assignable to type '(value: string) => void'.
            value={localForm.meditationSound.origin}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton value="system" />
              <Paragraph>System Sound</Paragraph>
              <RadioButton value="user_file" />
              <Paragraph>User File</Paragraph>
            </View>
          </RadioButton.Group>
        </View>
        <Button
          mode="outlined"
          onPress={onMeditationSoundSelectorPress}
          disabled={isLoading}
          style={{ marginBottom: 8 }}
        >
          {localForm.meditationSound.uri ? 'Change Sound' : 'Pick Sound'}
        </Button>
        <View style={styles.inlineRow}>
          <RadioButton.Group
            onValueChange={onMeditationRepeatTypeChange}
            value={localForm.meditationSound.repetitionType}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <RadioButton value="forever" />
              <Paragraph>Forever</Paragraph>
              <RadioButton value="count" />
              <Paragraph>Count</Paragraph>
            </View>
          </RadioButton.Group>
        </View>
        {localForm.meditationSound.repetitionType === 'count' && (
          <TextInput
            label="Repeat Count"
            value={localForm.meditationSound.repetitionCount?.toString() || ''}
            onChangeText={v => onMeditationRepeatCountChange(v)}
            keyboardType="numeric"
            style={styles.input}
            error={!!localValidation.meditationSound_repetitionCount}
            disabled={isLoading}
          />
        )}
        <TextInput
          label="Volume (0-5)"
          value={localForm.meditationSound.volume.toString()}
          onChangeText={v => onMeditationVolumeChange(parseInt(v || '0', 10))}
          keyboardType="numeric"
          style={styles.input}
          error={!!localValidation.meditationSound_volume}
          disabled={isLoading}
        />
        <HelperText
          type="error"
          visible={
            !!localValidation.meditationSound_uri ||
            !!localValidation.meditationSound_origin ||
            !!localValidation.meditationSound_repetitionType ||
            !!localValidation.meditationSound_repetitionCount ||
            !!localValidation.meditationSound_volume
          }
        >
          {[
            localValidation.meditationSound_uri,
            localValidation.meditationSound_origin,
            localValidation.meditationSound_repetitionType,
            localValidation.meditationSound_repetitionCount,
            localValidation.meditationSound_volume,
          ]
            .filter(Boolean)
            .join('\n')}
        </HelperText>

        <Subheading>Session Segments</Subheading>
        {localForm.segments.map((seg, i) => (
          <Card key={i} style={styles.segmentCard}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                label={`Segment ${i + 1} Duration (s)`}
                value={seg.duration.toString()}
                onChangeText={v => onSegmentDurationChange(i, v)}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
                error={!!localValidation[`segment_${i}_duration`]}
                disabled={isLoading}
              />
              {localForm.segments.length > 1 && (
                <IconButton
                  icon="close"
                  iconColor="red"
                  onPress={() => onRemoveSegmentPress(i)}
                  accessibilityLabel={`Remove Segment ${i + 1}`}
                  disabled={isLoading}
                />
              )}
            </Card.Content>
            <HelperText type="error" visible={!!localValidation[`segment_${i}_duration`]}>
              {localValidation[`segment_${i}_duration`]}
            </HelperText>
          </Card>
        ))}
        <Button
          mode="outlined"
          onPress={onAddSegmentPress}
          disabled={localForm.segments.length >= 4 || isLoading}
          icon="plus"
          style={{ marginBottom: 12 }}
        >
          Add Segment
        </Button>
        <HelperText type="error" visible={!!localValidation.segments_count}>
          {localValidation.segments_count}
        </HelperText>
        <View style={styles.inlineRow}>
          <Paragraph>Enable Daily Reminder</Paragraph>
          <Switch
            value={!!localForm.dailyReminderEnabled}
            onValueChange={onDailyReminderToggle}
            disabled={isLoading}
          />
        </View>
        {localForm.dailyReminderEnabled && (
          <View>
            <Button
              mode="outlined"
              onPress={() => setReminderTimePickerVisible(true)}
              style={{ marginBottom: 8 }}
              disabled={isLoading}
            >
              {localForm.reminderTime ? `Reminder Time: ${localForm.reminderTime}` : 'Set Reminder Time'}
            </Button>
            {reminderTimePickerVisible && (
              <DateTimePicker
                mode="time"
                value={
                  localForm.reminderTime
                    ? (() => {
                      const [h, m] = localForm.reminderTime!.split(':');
                      const date = new Date();
                      date.setHours(parseInt(h, 10), parseInt(m, 10));
                      date.setSeconds(0);
                      date.setMilliseconds(0);
                      return date;
                    })()
                    : new Date()
                }
                onChange={onReminderTimeChange}
                is24Hour={true}
              />
            )}
          </View>
        )}
        <HelperText type="error" visible={!!localValidation.reminderTime}>
          {localValidation.reminderTime}
        </HelperText>
        <View style={styles.inlineRow}>
          <Paragraph>Enable Diary Note</Paragraph>
          <Switch
            value={!!localForm.enableDiaryNote}
            onValueChange={onEnableDiaryToggle}
            disabled={isLoading}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            onPress={onSavePress}
            disabled={saveDisabled}
            loading={isLoading}
            style={styles.button}
          >
            Save
          </Button>
          <Button
            mode="outlined"
            onPress={onCancelPress}
            disabled={isLoading}
            style={styles.button}
          >
            Cancel
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    //statusBarHeight so confusing
    marginTop: statusBarHeight,
  },
  input: {
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  segmentCard: {
    marginBottom: 8,
    elevation: 1,
  },
});
