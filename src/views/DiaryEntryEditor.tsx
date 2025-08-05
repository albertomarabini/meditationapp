// /src/views/DiaryEntryEditor.tsx

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { TextInput, IconButton, Button, HelperText, Portal, Title, Appbar } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NavigationService } from '../navigation/NavigationLayer';
import { useDiaryStore } from '../store/DiaryStore';
import { useLogStore } from '../store/LogStateStore';
import { DiaryEntryValidationManager } from '../validation/DiaryEntryValidationManager';
import { UndoRedoStackManager } from '../delegates/UndoRedoStackManager';
import { DiaryEntryEditorButtonRow } from '../layouts/DiaryEntryEditorButtonRow';
import { DiaryEntryDeleteDialogManager } from '../delegates/DiaryEntryDeleteDialogManager';
import type { DiaryEntry } from '../models/domain';
import { statusBarHeight } from '../layouts/StatusBarHeight';
import { SettingsStore } from '../store/SettingsStore';
import { BANNER_HEIGHT } from '../components/AdBanner';

type DiaryEntryEditorRouteParams = {
  timestamp: string;
};

const MIN_CONTENT_LENGTH = 1;

export default function DiaryEntryEditor() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const timestamp: string = (route.params as DiaryEntryEditorRouteParams)?.timestamp;

  const diaryEntries = useDiaryStore(state => state.diaryEntries);
  const meditationLogs = useLogStore(state => state.meditationLogs);
  const saveDiaryEntry = useDiaryStore(state => state.saveDiaryEntry);
  const deleteDiaryEntry = useDiaryStore(state => state.deleteDiaryEntry);
  const adsFreePurchased = SettingsStore((state) => state.settings.adsFreePurchased);

  const found = diaryEntries.find(e => e.timestamp === timestamp);
  const isEditMode = !!found;
  const initialContent = found ? found.content : '';

  const forceBackRef = useRef(false);

  // Undo/redo manager instance (per editor)
  const undoRedoManagerRef = useRef<UndoRedoStackManager | null>(null);

  // Local state: content, error, save, dialog
  const [content, setContent] = useState<string>(initialContent);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveDisabled, setSaveDisabled] = useState<boolean>(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState<boolean>(false);

  // ---- LIFECYCLE ----

  // Undo/redo manager is created per editor instance, cleaned up on unmount
  useEffect(() => {
    undoRedoManagerRef.current = new UndoRedoStackManager(initialContent);
    return () => {
      undoRedoManagerRef.current?.clear();
      undoRedoManagerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timestamp]);

  // Initial mount: validate and setup error/save state
  useEffect(() => {
    handleDiaryEntryEditorMount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation: intercept hardware/system back navigation
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', handleEditorBack);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, timestamp, isEditMode, initialContent]);

  // ---- HANDLERS ----

  function handleDiaryEntryEditorMount(): void {
    if (!DiaryEntryValidationManager.isValidISO8601(timestamp)) {
      setErrorMsg('Invalid or missing timestamp.');
      setSaveDisabled(true);
      setTimeout(() => NavigationService.goBack(), 500);
      return;
    }
    const error = DiaryEntryValidationManager.validateAll(
      content,
      timestamp,
      diaryEntries,
      meditationLogs,
      isEditMode,
      MIN_CONTENT_LENGTH
    );
    setErrorMsg(error);
    setSaveDisabled(!!error);
  }

  function handleEditorBack(event: any): void {
    if (forceBackRef.current) {
      forceBackRef.current = false;
      return;
    }
    forceBackRef.current = true;
    event?.preventDefault?.();
    undoRedoManagerRef.current?.clear();
    setContent(initialContent);
    setErrorMsg(null);
    setSaveDisabled(true);
    setDeleteDialogVisible(false);
    NavigationService.goBack();
  }

  function handleEditorUnmount(): void {
    undoRedoManagerRef.current?.clear();
  }

  function handleChangeContent(value: string): void {
    const manager = undoRedoManagerRef.current!;
    manager.pushChange(value);
    const newContent = manager.currentContent;
    setContent(newContent);
    const error = DiaryEntryValidationManager.validateAll(
      newContent,
      timestamp,
      diaryEntries,
      meditationLogs,
      isEditMode,
      MIN_CONTENT_LENGTH
    );
    setErrorMsg(error);
    setSaveDisabled(!!error);
  }

  async function handleSaveOrBack(event?: any): Promise<void> {
    console.log("Back");
    const error = DiaryEntryValidationManager.validateAll(
      content,
      timestamp,
      diaryEntries,
      meditationLogs,
      isEditMode,
      MIN_CONTENT_LENGTH
    );
    setErrorMsg(error);
    setSaveDisabled(!!error);
    if (error) return;
    await saveDiaryEntry({ timestamp, content: content.trim() });
    NavigationService.goBack();
  }

  async function handleSave(event?: any): Promise<void> {
    const err = DiaryEntryValidationManager.validateAll(
      content,
      timestamp,
      diaryEntries,
      meditationLogs,
      isEditMode,
      MIN_CONTENT_LENGTH
    );
    setErrorMsg(err);
    setSaveDisabled(!!err);
    if (err) return;
    await saveDiaryEntry({ timestamp, content: content.trim() });
    NavigationService.goBack();
  }

  function handleCancel(): void {
    undoRedoManagerRef.current?.clear();
    setContent(initialContent);
    setErrorMsg(null);
    setSaveDisabled(true);
    setDeleteDialogVisible(false);
    NavigationService.goBack();
  }

  function handleUndo(): void {
    const manager = undoRedoManagerRef.current!;
    const prev = manager.undo();
    if (prev !== null) {
      setContent(prev);
      const error = DiaryEntryValidationManager.validateAll(
        prev,
        timestamp,
        diaryEntries,
        meditationLogs,
        isEditMode,
        MIN_CONTENT_LENGTH
      );
      setErrorMsg(error);
      setSaveDisabled(!!error);
    }
  }

  function handleRedo(): void {
    const manager = undoRedoManagerRef.current!;
    const next = manager.redo();
    if (next !== null) {
      setContent(next);
      const error = DiaryEntryValidationManager.validateAll(
        next,
        timestamp,
        diaryEntries,
        meditationLogs,
        isEditMode,
        MIN_CONTENT_LENGTH
      );
      setErrorMsg(error);
      setSaveDisabled(!!error);
    }
  }

  function handleDelete(): void {
    setDeleteDialogVisible(true);
  }

  async function handleConfirmDelete(): Promise<void> {
    await deleteDiaryEntry(timestamp);
    setDeleteDialogVisible(false);
    NavigationService.goBack();
  }

  function handleCancelDelete(): void {
    setDeleteDialogVisible(false);
  }

  function handleInvalidTimestamp(): void {
    const error = DiaryEntryValidationManager.validateAll(
      content,
      timestamp,
      diaryEntries,
      meditationLogs,
      isEditMode,
      MIN_CONTENT_LENGTH
    );
    setErrorMsg(error);
    setSaveDisabled(!!error);
    NavigationService.goBack();
  }

  // ---- RENDER ----

  const manager = undoRedoManagerRef.current;
  const canUndo = !!manager && manager.canUndo;
  const canRedo = !!manager && manager.canRedo;
  return (
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.select({ ios: 'padding', android: undefined })}
>
  <View style={{ flex: 1, paddingBottom: (adsFreePurchased)? 0:BANNER_HEIGHT }}>
    {/* HEADER statusBarHeight so confusing*/}
    <Appbar.Header>
        <Appbar.BackAction onPress={handleSaveOrBack} accessibilityLabel="Back"/>
        <Appbar.Content title={isEditMode ? 'Edit Diary Entry' : 'New Diary Entry'} />
        <Appbar.Action
          icon="delete"
          onPress={handleDelete}
          accessibilityLabel="Delete Diary Entry"
          iconColor="red"
          disabled={!isEditMode}
        />
      </Appbar.Header>
    {/* MAIN CONTENT */}
    <View style={{ flex: 1, marginHorizontal: 18, marginBottom: 8 }}>
      <TextInput
        label="Diary Entry"
        value={content}
        onChangeText={handleChangeContent}
        multiline
        mode="outlined"
        style={{
          flex: 1,
          fontSize: 18,
          paddingVertical: 12,
          textAlignVertical: 'top',
        }}
        error={!!errorMsg}
        accessibilityLabel="Diary Entry Content"
        disabled={false}
        scrollEnabled
      />
      <HelperText type="error" visible={!!errorMsg} style={{ marginLeft: 0 }}>
        {errorMsg}
      </HelperText>
    </View>

    {/* BOTTOM CONTROL GROUP */}
    <View style={styles.bottomButtonGroup}>
      {/* Undo/Redo Row */}
      <View style={styles.editorRow}>
        <DiaryEntryEditorButtonRow
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </View>
      {/* Save/Cancel Row */}
      <View style={styles.saveRow}>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={saveDisabled}
          style={styles.saveButton}
          accessibilityLabel="Save Diary Entry"
        >
          Save
        </Button>
        <Button
          mode="outlined"
          onPress={handleCancel}
          accessibilityLabel="Cancel"
          style={styles.saveButton}
        >
          Cancel
        </Button>
      </View>
    </View>
  </View>
</KeyboardAvoidingView>
    );



}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  input: {
    fontSize: 18,
    marginBottom: 8,
    paddingVertical: 12,
    // Remove minHeight, add flex: 1 in JSX instead
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    gap: 8, // If your RN version supports it, or use marginHorizontal on children
  },
  bottomButtonGroup: {
    paddingBottom: 8,
  },
  editorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  saveRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  saveButton: {
    minWidth: 100,
    marginHorizontal: 8,
  },
});

