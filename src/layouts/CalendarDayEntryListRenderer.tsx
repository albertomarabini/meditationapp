// src/layouts/CalendarDayEntryListRenderer.tsx

import React from 'react';//[ts] Module '"c:/Users/User/Documents/bk/Waldi/MeditationApp/node_modules/@types/react/index"' can only be default-imported using the 'esModuleInterop' flag
import { View, StyleSheet } from 'react-native';
import { Card, Text, List, IconButton, HelperText } from 'react-native-paper';
import type { MeditationLog, DiaryEntry } from '../models/domain';
import type { MD3Theme } from 'react-native-paper';

type CalendarDayEntryListRendererProps = {
  meditations: MeditationLog[];
  diaryEntries: DiaryEntry[];
  findDiaryForMeditation: (timestamp: string) => DiaryEntry | undefined;
  onMeditationPress: (timestamp: string) => void;
  onDiaryPress: (timestamp: string) => void;
  onDiaryIconPress: (timestamp: string) => void;
  formatDateTime: (timestamp: string) => string;
  theme: MD3Theme;
};

export const CalendarDayEntryListRenderer: React.FC<CalendarDayEntryListRendererProps> = ({
  meditations,
  diaryEntries,
  findDiaryForMeditation,
  onMeditationPress,
  onDiaryPress,
  onDiaryIconPress,
  formatDateTime,
  theme,
}) => {
  if (meditations.length === 0 && diaryEntries.length === 0) {
    return (
      <View>
        <Text variant="titleLarge" style={{ flex: 1, textAlign: 'center'}}>No activity for this date</Text>
      </View>
    );
  }

  return (
    <View>
      {meditations.map(meditation => {
        const diary = findDiaryForMeditation(meditation.timestamp);
        const diaryExists = !!diary;
        return (
          <Card
            key={meditation.timestamp}
            style={styles.card}
            onPress={() => onMeditationPress(meditation.timestamp)}
            accessibilityLabel={`Meditation session at ${formatDateTime(meditation.timestamp)}. Duration: ${meditation.duration} seconds.`}
          >
            <Card.Title
              title="Meditation"
              subtitle={formatDateTime(meditation.timestamp)}
              left={props => (
                <List.Icon {...props} icon="meditation" color={theme.colors.primary} />
              )}
              right={props =>
                diaryExists ? (
                  <IconButton
                    {...props}
                    icon="notebook"
                    onPress={() => onDiaryIconPress(meditation.timestamp)}
                    accessibilityLabel="Open Diary Entry"
                  />
                ) : null
              }
            />
            <Card.Content>
              <Text>
                Duration:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {meditation.duration} sec
                </Text>
              </Text>
              {diaryExists ? (
                <HelperText
                  type="info"
                  visible
                  style={{ color: theme.colors.primary }}
                >
                  Diary attached
                </HelperText>
              ) : null}
            </Card.Content>
          </Card>
        );
      })}
      {diaryEntries.map(entry => (
        <Card
          key={entry.timestamp}
          style={styles.card}
          onPress={() => onDiaryPress(entry.timestamp)}
          accessibilityLabel={`Diary entry created at ${formatDateTime(entry.timestamp)}.`}
        >
          <Card.Title
            title="Diary Entry"
            subtitle={formatDateTime(entry.timestamp)}
            left={props => (
              <List.Icon {...props} icon="notebook" color={theme.colors.secondary} />
            )}
          />
          <Card.Content>
            <Text numberOfLines={2} ellipsizeMode="tail">
              {entry.content}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    elevation: 1,
  },
  emptyState: {
    marginVertical: 32,
    alignSelf: 'center',
    opacity: 0.65,
  },
});
