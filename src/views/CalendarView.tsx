// /src/views/CalendarView.tsx

import React, { useState, useRef, useCallback } from 'react';//[ts] Module '"react"' has no exported member 'useRef'.
import { View, StyleSheet, ScrollView } from 'react-native';
import { CalendarList } from 'react-native-calendars';
import {
  Portal,
  Dialog,
  Button,
  TextInput,
  Text,
  IconButton,
  MD3LightTheme,
  Divider,
  Paragraph,
  Appbar
} from 'react-native-paper';
import { useSnackbarStore } from '../store/GlobalSnackbarStore';
import { NavigationService } from '../navigation/NavigationLayer';
import { useLogStore } from '../store/LogStateStore';
import { useDiaryStore } from '../store/DiaryStore';
import { useSettingsStore } from '../store/SettingsStore';
import { CalendarDayEntryListRenderer } from '../layouts/CalendarDayEntryListRenderer';
import { CalendarDateTimeFormatter } from '../delegates/CalendarDateTimeFormatter';
import type { MeditationLog, DiaryEntry } from '../models/domain';
import { statusBarHeight } from '../layouts/StatusBarHeight';

function isValidISO8601(ts: string): boolean {
  return (
    typeof ts === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ts)
  );
}


export default function CalendarView() {

  // Zustand state slices
  const meditationLogs = useLogStore((state) => state.meditationLogs);
  const updateMeditationLogDuration = useLogStore((state) => state.updateMeditationLogDuration);
  const hydrateLogs = useLogStore((state) => state.hydrateFromDB);
  const diaryEntries = useDiaryStore((state) => state.diaryEntries);
  const hydrateDiaries = useDiaryStore((state) => state.hydrateFromDB);
  const settings = useSettingsStore((state) => state.settings);
  const showSnackbar = useSnackbarStore(state => state.showSnackbar);

  // Local UI State
  const [calendarKey, setCalendarKey] = useState('init');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState<MeditationLog | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDurationValue, setEditDurationValue] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const calendarRef = useRef(null);

  // Meditations for currently selected day
  const meditationsForSelectedDay: MeditationLog[] = React.useMemo(() => {
    return meditationLogs.filter((log) => {
      if (!isValidISO8601(log.timestamp)) return false;
      return log.timestamp.slice(0, 10) === selectedDate;
    });
  }, [meditationLogs, selectedDate]);

  // Diary entries for selected day, standalone (not attached to meditation logs)
  const diaryEntriesForSelectedDay: DiaryEntry[] = React.useMemo(() => {
    const meditationTimestamps = new Set(meditationsForSelectedDay.map((m) => m.timestamp));
    return diaryEntries.filter((entry) => {
      if (!isValidISO8601(entry.timestamp)) return false;
      return (
        entry.timestamp.slice(0, 10) === selectedDate &&
        !meditationTimestamps.has(entry.timestamp)
      );
    });
  }, [diaryEntries, selectedDate, meditationsForSelectedDay]);

  // Find diary for a meditation log (by timestamp)
  const findDiaryForMeditation = useCallback(
    (timestamp: string): DiaryEntry | undefined =>
      diaryEntries.find((entry) => entry.timestamp === timestamp),
    [diaryEntries]
  );

  // Day cell pressed in calendar
  const handleDayPress = useCallback((date: { dateString: string }) => {
    setSelectedDate(date.dateString);
    hydrateLogs();
    hydrateDiaries();
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [hydrateLogs, hydrateDiaries]);

  // Meditation entry pressed
  const handleMeditationEntryPress = useCallback((timestamp: string) => {
    const meditation = meditationLogs.find((log) => log.timestamp === timestamp) || null;
    setSelectedMeditation(meditation);
    setModalOpen(true);
    setEditMode(false);
    setEditError(null);
    setEditDurationValue(meditation && typeof meditation.duration === 'number'
      ? String(meditation.duration)
      : '');
  }, [meditationLogs]);

  // Diary entry pressed (standalone)
  const handleDiaryEntryPress = useCallback((timestamp: string) => {
    NavigationService.navigate('DiaryEntryEditor', { timestamp });
  }, [NavigationService]);

  // Edit Duration (in modal)
  const handleEditDuration = useCallback(() => {
    setEditMode(true);
    setEditError(null);
    setEditDurationValue(
      selectedMeditation && typeof selectedMeditation.duration === 'number'
        ? String(selectedMeditation.duration)
        : ''
    );
  }, [selectedMeditation]);

  // Edit Duration Save (in modal)
  const handleEditDurationSave = useCallback(async () => {
    if (!selectedMeditation) return;
    const val = parseInt(editDurationValue, 10);
    if (!Number.isInteger(val) || val < 1) {
      setEditError('Duration must be a positive integer (seconds).');
      return;
    }
    try {
      await updateMeditationLogDuration(selectedMeditation.timestamp, val);
      setModalOpen(false);
      setEditMode(false);
      setEditError(null);
    } catch (err: any) {
      handleSqlTransactionError(err);
    }
  }, [editDurationValue, selectedMeditation, updateMeditationLogDuration]);


  // Edit Duration Cancel
  const handleEditDurationCancel = useCallback(() => {
    setEditMode(false);
    setEditError(null);
    setEditDurationValue(
      selectedMeditation && typeof selectedMeditation.duration === 'number'
        ? String(selectedMeditation.duration)
        : ''
    );
  }, [selectedMeditation]);

  // Diary button in modal (Add/Edit Diary)
  const handleDiaryButtonPress = useCallback(() => {
    if (!selectedMeditation) return;
    NavigationService.navigate('DiaryEntryEditor', { timestamp: selectedMeditation.timestamp });
    setModalOpen(false);
    setEditMode(false);
  }, [NavigationService, selectedMeditation]);

  // Open diary icon for meditation
  const handleOpenDiary = useCallback((meditationTimestamp: string) => {
    NavigationService.navigate('DiaryEntryEditor', { timestamp: meditationTimestamp });
  }, [NavigationService]);


  // Back button
  const handleBackPress = useCallback(() => {
    NavigationService.navigate('MainScreen');
  }, [NavigationService]);

  // SQL transaction error (surface error and rollback state)
  const handleSqlTransactionError = useCallback((error: any) => {
    showSnackbar(error && error.message ? error.message : 'SQL Transaction Error');
    hydrateLogs();
    hydrateDiaries();
    setModalOpen(false);
    setEditMode(false);
  }, [hydrateLogs, hydrateDiaries]);

  // Calendar marked dates
  const markedDates = React.useMemo(() => {
    const marks: Record<string, any> = {};

    // Collect diary and meditation log dates
    const diaryByDay: Record<string, boolean> = {};
    const meditationByDay: Record<string, boolean> = {};

    diaryEntries.forEach(entry => {
      const d = entry.timestamp.slice(0, 10);
      diaryByDay[d] = true;
    });
    meditationLogs.forEach(log => {
      const d = log.timestamp.slice(0, 10);
      meditationByDay[d] = true;
    });

    // Get all days present
    const allDates = Array.from(new Set([...Object.keys(diaryByDay), ...Object.keys(meditationByDay)]));

    allDates.forEach(date => {
      const dots = [];
      if (diaryByDay[date]) dots.push({ key: 'diary', color: 'red' });
      if (meditationByDay[date]) dots.push({ key: 'meditation', color: 'blue' });
      marks[date] = { dots };
      if (date === selectedDate) {
        marks[date].selected = true;
        marks[date].selectedColor = '#1976d2';
      }
    });

    // Make sure the currently selected date is always marked as selected, even if it has no dots
    if (!marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: '#1976d2',
        dots: [],
      };
    }

    return marks;
  }, [diaryEntries, meditationLogs, selectedDate]);

  return (
    //statusBarHeight so confusing
    <View style={{ flex: 1}}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackPress} />
        <Appbar.Content title="Calendar" />
        <Appbar.Action
          icon="calendar-today"
          onPress={() => {
            const today = new Date().toISOString().slice(0, 10);
            setSelectedDate(today);
            setCalendarKey('calendar-' + today + '-' + Date.now());
          }}
          accessibilityLabel="Go to today"
        />
      </Appbar.Header>
      <Divider />
      <CalendarList
        ref={calendarRef}
        key={calendarKey}
        onDayPress={(date: { dateString: string }) => {
          setSelectedDate(date.dateString);
          hydrateLogs();
          hydrateDiaries();
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: 0, animated: false });
          }
        }}
        markedDates={markedDates}
        markingType="multi-dot"
        current={selectedDate}
        horizontal={true}
        hideArrows={false}
        theme={{
          backgroundColor: '#fff',
          calendarBackground: '#fff',
          todayTextColor: '#1976d2',
          selectedDayBackgroundColor: '#1976d2',
          selectedDayTextColor: '#fff',
          dayTextColor: '#222',
        }}
        accessibilityLabel="Meditation and Diary Calendar"
      />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent}>
        <CalendarDayEntryListRenderer
          meditations={meditationsForSelectedDay}
          diaryEntries={diaryEntriesForSelectedDay}
          findDiaryForMeditation={findDiaryForMeditation}
          onMeditationPress={handleMeditationEntryPress}
          onDiaryPress={handleDiaryEntryPress}
          onDiaryIconPress={handleOpenDiary}
          formatDateTime={CalendarDateTimeFormatter.formatDateTime}
          theme={MD3LightTheme}
        />
      </ScrollView>
      <Portal>
        {/* Meditation Log Detail Modal/Dialog */}
        <Dialog visible={modalOpen} onDismiss={() => setModalOpen(false)}>
          <Dialog.Title>Meditation Details</Dialog.Title>
          <Dialog.Content>
            {selectedMeditation && (
              <View>
                <Paragraph>
                  {`Started: ${CalendarDateTimeFormatter.formatDateTime(selectedMeditation.timestamp)}`}
                </Paragraph>
                <Paragraph>
                  {editMode ? (
                    <>
                      <TextInput
                        label="Duration (seconds)"
                        value={editDurationValue}
                        onChangeText={setEditDurationValue}
                        keyboardType="numeric"
                        error={!!editError}
                        style={{ marginVertical: 8 }}
                        accessibilityLabel="Edit duration"
                      />
                      {editError ? (
                        <Text style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>{editError}</Text>
                      ) : null}
                    </>
                  ) : (
                    `Duration: ${selectedMeditation.duration} seconds`
                  )}
                </Paragraph>
                {!editMode && (
                  <Button
                    icon="pencil"
                    mode="outlined"
                    onPress={handleEditDuration}
                    style={{ marginVertical: 8 }}
                    accessibilityLabel="Edit Duration"
                  >
                    Edit Duration
                  </Button>
                )}
                {editMode ? (
                  <View style={{ flexDirection: 'row', marginVertical: 4 }}>
                    <Button
                      mode="contained"
                      onPress={handleEditDurationSave}
                      style={{ flex: 1, marginRight: 8 }}
                      accessibilityLabel="Save Duration"
                    >
                      Save
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={handleEditDurationCancel}
                      style={{ flex: 1 }}
                      accessibilityLabel="Cancel Duration Edit"
                    >
                      Cancel
                    </Button>
                  </View>
                ) : (
                  <Button
                    icon="notebook"
                    mode="contained"
                    onPress={handleDiaryButtonPress}
                    style={{ marginTop: 8 }}
                    accessibilityLabel={findDiaryForMeditation(selectedMeditation.timestamp)
                      ? "Edit Diary Entry"
                      : "Add Diary Entry"}
                  >
                    {findDiaryForMeditation(selectedMeditation.timestamp)
                      ? "Edit Diary"
                      : "Add Diary"}
                  </Button>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setModalOpen(false); setEditMode(false); }}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
});
