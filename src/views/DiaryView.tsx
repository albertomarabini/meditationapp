// /src/views/DiaryView.tsx

import React, { useState, useMemo } from 'react';
import { SafeAreaView, View, FlatList, StyleSheet } from 'react-native';
import { NavigationService } from '../navigation/NavigationLayer';
import { useDiaryStore } from '../store/DiaryStore';
import { DiaryExportYAMLSerializer } from '../serialization/DiaryExportYAMLSerializer';

import {
  Appbar,
  Card,
  IconButton,
  Text,
  List,
} from 'react-native-paper';
// import Share from 'react-native-share';
import Share from '../mocks/Share.mock'
import { BANNER_HEIGHT } from '../components/AdBanner';
import { SettingsStore } from '../store/SettingsStore';

export default function DiaryView() {
  const diaryEntries = useDiaryStore((state) => state.diaryEntries);
  const adsFreePurchased = SettingsStore((state) => state.settings.adsFreePurchased);

  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const sortedEntries = useMemo(
    () => [...diaryEntries].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [diaryEntries]
  );

  const handleEditDiaryEntry = (timestamp: string) => {
    NavigationService.navigate('DiaryEntryEditor',{ timestamp });
  };

  const handleAddDiaryEntry = () => {
    const now = new Date().toISOString();
    NavigationService.navigate('DiaryEntryEditor',{ timestamp: now });
  };

  const handleExportDiary = async () => {
    setExporting(true);
    try {
      const yamlStr = DiaryExportYAMLSerializer.serialize(sortedEntries);
      await Share.open({
        title: 'Export Diary Entries',
        message: yamlStr,
      });
    } catch (e: any) {
      setSnackbar(e?.message || 'Failed to export diary entries.');
    } finally {
      setExporting(false);
    }
  };

  const renderDiaryItem = ({ item }: { item: typeof sortedEntries[0] }) => (
    <Card style={styles.entryCard} key={item.timestamp}>
      <Card.Title
        title={truncateContent(item.content)}
        subtitle={formatDate(item.timestamp)}
        right={(props) => (
          <IconButton
            {...props}
            icon="pencil"
            accessibilityLabel="Edit Diary Entry"
            onPress={() => handleEditDiaryEntry(item.timestamp)}
          />
        )}
      />
      <Card.Content>
        <Text style={styles.contentText}>{truncateContent(item.content, 120)}</Text>
      </Card.Content>
    </Card>
  );

  function truncateContent(content: string, l:number = 38): string {
    const trimmed = (content || '').trim();
    return trimmed.length > l ? trimmed.slice(0, l) + '…' : trimmed;
  }

  function formatDate(ts: string): string {
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return ts;
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => NavigationService.goBack()} />
        <Appbar.Content title="Diary" />
        <Appbar.Action
          icon="export-variant"
          onPress={handleExportDiary}
          accessibilityLabel="Export Diary"
          disabled={exporting || !sortedEntries.length}
        />
        <Appbar.Action
          icon="plus"
          onPress={handleAddDiaryEntry}
          accessibilityLabel="Add Diary Entry"
        />
      </Appbar.Header>
      <FlatList
        data={sortedEntries}
        renderItem={renderDiaryItem}
        keyExtractor={(item) => item.timestamp}
        contentContainerStyle={[
          styles.listContent,
          !sortedEntries.length ? { flex: 1, justifyContent: 'center' } : {},
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <List.Icon icon="notebook-outline" />
            <Text style={{ fontSize: 16, color: '#888' }}>
              No diary entries yet. Tap "+" to add one!
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 40,
  },
  entryCard: {
    marginVertical: 7,
    elevation: 1,
  },
  contentText: {
    fontSize: 15,
    color: '#242424',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
    opacity: 0.7,
  },
});
