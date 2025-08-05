import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Card, IconButton, Surface, Text, MD3Theme as Theme } from 'react-native-paper';
import type { SessionTimer } from '../models/domain';
import { MainScreenAccessibilityHelper } from './MainScreenAccessibilityHelper';
// import { useTheme } from 'react-native-paper';
// type Theme = ReturnType<typeof useTheme>;

const EMPTY_STATE_TEXT = "No Session Timers. Tap + to create.";

export type MainScreenTimerListRendererProps = {
  sessionTimers: SessionTimer[];
  onPlay: (id: string) => void;
  onEdit: (id: string) => void;
  onCreate: () => void;
  theme: Theme; // <-- fix this
  loading: boolean;
};

export function MainScreenTimerListRenderer({
  sessionTimers,
  onPlay,
  onEdit,
  onCreate,
  theme,
  loading,
}: MainScreenTimerListRendererProps): React.ReactElement {
  // Deduplicate by id (if not already done on parent)
  const uniqueTimers = React.useMemo(() => {
    const seen = new Set<string>();
    return sessionTimers.filter(timer => {
      if (seen.has(timer.id)) return false;
      seen.add(timer.id);
      return true;
    });
  }, [sessionTimers]);

  const renderTimerItem = ({ item }: { item: SessionTimer }) => (
    <Card
      style={styles.card}
      key={item.id}
      {...MainScreenAccessibilityHelper.getAccessibilityProps(`Session Timer: ${item.name}`)}
    >
      <Card.Title
        title={item.name}
        subtitle={`Segments: ${item.segments.length}`}
        left={props => <IconButton {...props} icon="meditation" />}
        right={props => (
          <View style={styles.cardActions}>
            <IconButton
              {...props}
              icon="play-circle"
              onPress={() => console.log("Session Id being played",onPlay(item.id))}
              {...MainScreenAccessibilityHelper.getAccessibilityProps(`Start session: ${item.name}`)}
            />
            <IconButton
              {...props}
              icon="pencil"
              onPress={() => onEdit(item.id)}
              {...MainScreenAccessibilityHelper.getAccessibilityProps(`Edit session: ${item.name}`)}
            />
          </View>
        )}
      />
    </Card>
  );

  const renderEmptyState = () => (
    <Surface
      style={styles.emptyState}
      {...MainScreenAccessibilityHelper.getAccessibilityProps("No Session Timers")}
    >
      <Text style={{ color: theme.colors.onSurface, fontSize: 16, marginBottom: 8 }}>
        {EMPTY_STATE_TEXT}
      </Text>
      <IconButton icon="plus" size={32} onPress={onCreate} />
    </Surface>
  );
  console.log("FlatList loading:", loading)
  return (
    <FlatList
      data={uniqueTimers}
      renderItem={renderTimerItem}
      keyExtractor={item => item.id}
      contentContainerStyle={[
        styles.listContent,
        !uniqueTimers.length ? { flexGrow: 1, justifyContent: 'center' } : {},
      ]}
      ListEmptyComponent={!loading ? renderEmptyState: null}
      accessibilityLabel="Session Timers List"
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 10,
    elevation: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 0,
    padding: 24,
    marginTop: 48,
    backgroundColor: 'transparent',
  },
});
