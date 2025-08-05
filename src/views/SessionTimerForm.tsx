// /src/views/SessionTimerForm.tsx

import React, { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSessionTimersStore } from '../store/TimerStateStore';
import { SessionTimerFormLayout } from '../layouts/SessionTimerFormLayout';
import { SessionTimerFormPersistenceHelper } from '../delegates/SessionTimerFormPersistenceHelper';
import { SessionTimerFormFilePickerHelper } from '../delegates/SessionTimerFormFilePickerHelper';
import { NotificationManager } from '../services/NotificationManager';
import type { SessionTimer, SoundOrigin } from '../models/domain';
import { useSnackbarStore } from '../store/GlobalSnackbarStore';


type Props = {
  route?: any; // navigation param for edit, e.g., route.params.id
};

const getDefaultSessionTimer = (): SessionTimer => ({
  id: '',
  name: '',
  preparationTime: 0,
  segmentationSound: {
    uri: '',
    repetition: 1,
    volume: 3,
  },
  meditationSound: {
    uri: '',
    origin: 'system',
    repetitionType: 'forever',
    repetitionCount: 1,
    volume: 3,
  },
  segments: [
    { index: 0, duration: 60 },
  ],
  dailyReminderEnabled: false,
  reminderTime: '',
  enableDiaryNote: false,
});

export default function SessionTimerForm(props: Props) {
  const navigation = useNavigation();

  // Zustand state and actions
  const sessionTimers = useSessionTimersStore((state) => state.sessionTimers);
  const draftSessionTimer = useSessionTimersStore((state) => state.draftSessionTimer);
  const setDraftSessionTimer = useSessionTimersStore((state) => state.setDraftSessionTimer);
  const resetDraftSessionTimer = useSessionTimersStore((state) => state.resetDraftSessionTimer);
  const saveSessionTimer = useSessionTimersStore((state) => state.saveSessionTimer);
  const deleteSessionTimer = useSessionTimersStore((state) => state.deleteSessionTimer);
  const loadSessionTimer = useSessionTimersStore((state) => state.loadSessionTimer);
  const validationError = useSessionTimersStore((state) => state.validationError);
  const mutationError = useSessionTimersStore((state) => state.mutationError);
  const clearMutationError = useSessionTimersStore((state) => state.clearMutationError);
  const showSnackbar = useSnackbarStore(state => state.showSnackbar);


  // Local UI state
  const [localForm, setLocalForm] = useState<SessionTimer>(getDefaultSessionTimer());
  const [localValidation, setLocalValidation] = useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState<boolean>(false);
  const [unsavedDialogVisible, setUnsavedDialogVisible] = useState<boolean>(false);
  const [errorDialog, setErrorDialog] = useState<string | null>(null);
  const [reminderTimePickerVisible, setReminderTimePickerVisible] = useState<boolean>(false);

  // Delegates
  const persistenceHelperRef = useRef(new SessionTimerFormPersistenceHelper());
  const filePickerHelperRef = useRef(new SessionTimerFormFilePickerHelper());

  // Initial hydration on mount
  useEffect(() => {
    const id = props.route?.params?.id;
    if (id) {
      setIsEditMode(true);
      loadSessionTimer(id).then((loaded) => {
        if (loaded) {
          setLocalForm({ ...loaded });
        } else {
          setLocalForm(getDefaultSessionTimer());
        }
      });
    } else {
      setIsEditMode(false);
      if (draftSessionTimer) {
        setLocalForm({ ...draftSessionTimer });
      } else {
        setLocalForm(getDefaultSessionTimer());
      }
    }
    setLocalValidation({});
    setIsLoading(false);
    setDeleteDialogVisible(false);
    setUnsavedDialogVisible(false);
    setErrorDialog(null);
    setReminderTimePickerVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch for store draft updates (Zustand), sync to local form
  useEffect(() => {
    if (draftSessionTimer) {
      setLocalForm({ ...draftSessionTimer });
    }
  }, [draftSessionTimer]);

  // Watch for validation errors from store
  useEffect(() => {
    if (validationError && Object.keys(validationError).length > 0) {
      setLocalValidation({ ...validationError });
    } else {
      setLocalValidation({});
    }
  }, [validationError]);

  // Watch for global mutation errors from store (e.g., DB errors)
  useEffect(() => {
    if (mutationError) {
      setErrorDialog(mutationError);
      clearMutationError();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mutationError]);

  // --- Handlers for form fields ---

  const handleNameChange = (value: string) => {
    const updated = { ...localForm, name: value };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handlePreparationTimeChange = (value: string) => {
    const intVal = parseInt(value || '0', 10) || 0;
    const updated = { ...localForm, preparationTime: intVal };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleSegmentationSoundPress = async () => {
    await filePickerHelperRef.current.pickSegmentationSound(handleSoundPicked, handleSoundPickerCancel);
  };

  const handleSegmentationRepeatChange = (value: string | number) => {
    const intVal = typeof value === 'string' ? parseInt(value || '1', 10) : value;
    const updated = {
      ...localForm,
      segmentationSound: {
        ...localForm.segmentationSound,
        repetition: intVal,
      },
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleSegmentationVolumeChange = (value: number) => {
    const updated = {
      ...localForm,
      segmentationSound: {
        ...localForm.segmentationSound,
        volume: value,
      },
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleMeditationSoundSourceChange = (value: SoundOrigin) => {
    const updated = {
      ...localForm,
      meditationSound: {
        ...localForm.meditationSound,
        origin: value,
        uri: '',
      },
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleMeditationSoundSelectorPress = async () => {
    await filePickerHelperRef.current.pickMeditationSound(
      localForm.meditationSound.origin,
      handleSoundPicked,
      handleFilePickerCancel
    );
  };

  const handleMeditationRepeatTypeChange = (value: 'forever' | 'count') => {
    const updated = {
      ...localForm,
      meditationSound: {
        ...localForm.meditationSound,
        repetitionType: value,
      },
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleMeditationRepeatCountChange = (value: string | number) => {
    const intVal = typeof value === 'string' ? parseInt(value || '1', 10) : value;
    const updated = {
      ...localForm,
      meditationSound: {
        ...localForm.meditationSound,
        repetitionCount: intVal,
      },
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleMeditationVolumeChange = (value: number) => {
    const updated = {
      ...localForm,
      meditationSound: {
        ...localForm.meditationSound,
        volume: value,
      },
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleAddSegmentPress = () => {
    if (localForm.segments.length >= 4) return;
    const newIdx = localForm.segments.length;
    const updatedSegments = [
      ...localForm.segments,
      { index: newIdx, duration: 60 },
    ];
    const updated = { ...localForm, segments: updatedSegments };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleSegmentDurationChange = (idx: number, value: string) => {
    const intVal = parseInt(value || '1', 10) || 1;
    const updatedSegments = localForm.segments.map((seg, i) =>
      i === idx ? { ...seg, duration: intVal } : seg
    );
    const updated = { ...localForm, segments: updatedSegments };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleRemoveSegmentPress = (idx: number) => {
    if (localForm.segments.length <= 1) return;
    const updatedSegments = localForm.segments
      .filter((_, i) => i !== idx)
      .map((seg, i) => ({ ...seg, index: i }));
    const updated = { ...localForm, segments: updatedSegments };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  const handleDailyReminderToggle = (value: boolean) => {
    const updated = {
      ...localForm,
      dailyReminderEnabled: value,
      reminderTime: value ? localForm.reminderTime : '',
    };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
    if (!value) {
      setReminderTimePickerVisible(false);
    }
  };

  const handleReminderTimeChange = (_event: any, selectedTime: Date | undefined) => {
    setReminderTimePickerVisible(false);
    if (selectedTime) {
      const hh = selectedTime.getHours().toString().padStart(2, '0');
      const mm = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      const updated = { ...localForm, reminderTime: timeStr };
      setLocalForm(updated);
      setDraftSessionTimer(updated);
    }
  };

  const handleEnableDiaryToggle = (value: boolean) => {
    const updated = { ...localForm, enableDiaryNote: value };
    setLocalForm(updated);
    setDraftSessionTimer(updated);
  };

  // --- Navigation and dialog handlers ---

  const isDirty = (): boolean => {
    if (!draftSessionTimer) return false;
    const timerId = props.route?.params?.id;
    const persisted = sessionTimers.find((t) => t.id === timerId);
    if (!persisted && !isEditMode) {
      return (//
        draftSessionTimer.name.trim().length > 0 ||
        draftSessionTimer.preparationTime > 0 ||
        !!(draftSessionTimer.segmentationSound && draftSessionTimer.segmentationSound.uri) ||
        !!(draftSessionTimer.meditationSound && draftSessionTimer.meditationSound.uri) ||
        !!(draftSessionTimer.segments && draftSessionTimer.segments.length > 1)
      );
    }
    if (persisted) {
      return JSON.stringify(persisted) !== JSON.stringify(draftSessionTimer);
    }
    return false;
  };

  const handleBackPress = () => {
    if (isDirty()) {
      setUnsavedDialogVisible(true);
    } else {
      navigation.goBack();
    }
  };

  const handleCancelPress = () => {
    resetDraftSessionTimer();
    navigation.goBack();
  };

  const handleDeletePress = () => {
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = async () => {
    setIsLoading(true);
    try {
      await persistenceHelperRef.current.deleteAndCancelReminders(
        localForm.id,
        deleteSessionTimer,
        NotificationManager
      );
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (err: any) {
      setErrorDialog(err.message || 'Failed to delete Session Timer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogVisible(false);
  };

  const handleUnsavedChangesSave = async () => {
    setUnsavedDialogVisible(false);
    await handleSavePress();
  };

  const handleUnsavedChangesDiscard = () => {
    setUnsavedDialogVisible(false);
    resetDraftSessionTimer();
    navigation.goBack();
  };

  const handleSavePress = async () => {
    setIsLoading(true);
    try {
      await persistenceHelperRef.current.saveAndSchedule(
        localForm,
        saveSessionTimer,
        NotificationManager
      );
      showSnackbar('Session Timer saved successfully.');
      navigation.goBack();
    } catch (err: any) {
      setErrorDialog(err.message || 'Failed to save Session Timer.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- File & sound picker handlers ---

  const handleSoundPicked = (selection: { uri: string }) => {
    if (deleteDialogVisible || unsavedDialogVisible) return;
    if (!selection.uri) return;
    // For segmentation sound
    if (
      !localForm.meditationSound ||
      !localForm.meditationSound.origin ||
      localForm.segmentationSound.uri === '' ||
      localForm.segmentationSound.uri === selection.uri
    ) {
      const updated = {
        ...localForm,
        segmentationSound: {
          ...localForm.segmentationSound,
          uri: selection.uri,
        },
      };
      setLocalForm(updated);
      setDraftSessionTimer(updated);
      return;
    }
    // For meditation sound
    if (
      localForm.meditationSound &&
      (localForm.meditationSound.origin === 'system' ||
        localForm.meditationSound.origin === 'user_file')
    ) {
      const updated = {
        ...localForm,
        meditationSound: {
          ...localForm.meditationSound,
          uri: selection.uri,
        },
      };
      setLocalForm(updated);
      setDraftSessionTimer(updated);
    }
  };

  const handleFilePicked = (_fileUri: string) => {
    // No file picker for non-sound fields in this form
  };

  const handleSoundPickerCancel = () => {
    // No operation: required contract, intentionally empty
  };

  const handleFilePickerCancel = () => {
    // No operation: required contract, intentionally empty
  };

  const handleErrorDialogDismiss = () => setErrorDialog(null);

  // --- Render ---

  return (
    <SessionTimerFormLayout
      localForm={localForm}
      localValidation={localValidation}
      isEditMode={isEditMode}
      isLoading={isLoading}
      title={isEditMode ? 'Edit Session Timer' : 'Create Session Timer'}
      deleteDialogVisible={deleteDialogVisible}
      unsavedDialogVisible={unsavedDialogVisible}
      errorDialog={errorDialog}
      reminderTimePickerVisible={reminderTimePickerVisible}
      onNameChange={handleNameChange}
      onPreparationTimeChange={handlePreparationTimeChange}
      onSegmentationSoundPress={handleSegmentationSoundPress}
      onSegmentationRepeatChange={handleSegmentationRepeatChange}
      onSegmentationVolumeChange={handleSegmentationVolumeChange}
      onMeditationSoundSourceChange={handleMeditationSoundSourceChange}
      onMeditationSoundSelectorPress={handleMeditationSoundSelectorPress}
      onMeditationRepeatTypeChange={handleMeditationRepeatTypeChange}
      onMeditationRepeatCountChange={handleMeditationRepeatCountChange}
      onMeditationVolumeChange={handleMeditationVolumeChange}
      onAddSegmentPress={handleAddSegmentPress}
      onSegmentDurationChange={handleSegmentDurationChange}
      onRemoveSegmentPress={handleRemoveSegmentPress}
      onDailyReminderToggle={handleDailyReminderToggle}
      onReminderTimeChange={handleReminderTimeChange}
      onEnableDiaryToggle={handleEnableDiaryToggle}
      onBackPress={handleBackPress}
      onCancelPress={handleCancelPress}
      onDeletePress={handleDeletePress}
      onDeleteCancel={handleDeleteCancel}
      onDeleteConfirm={handleDeleteConfirm}
      onUnsavedChangesSave={handleUnsavedChangesSave}
      onUnsavedChangesDiscard={handleUnsavedChangesDiscard}
      onSavePress={handleSavePress}
      onErrorDialogDismiss={handleErrorDialogDismiss}
      setReminderTimePickerVisible={setReminderTimePickerVisible}
    />
  );
}
