// /src/views/SettingsMenu.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { View, StyleSheet, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/SettingsStore';
import { useDiaryStore } from '../store/DiaryStore';
import { useLogStore } from '../store/LogStateStore';
import { BackupJobHandler } from '../services/BackupJobHandler';
import { AdBanner } from '../components/AdBanner';
import { SettingsDialogManager } from '../delegates/SettingsDialogManager';
import { SettingsBackupMetadataManager } from '../delegates/SettingsBackupMetadataManager';
import { SettingsMonetizationHandler } from '../delegates/SettingsMonetizationHandler';
import { SettingsSharingExportHandler } from '../delegates/SettingsSharingExportHandler';
import { SettingsPermissionsHandler } from '../delegates/SettingsPermissionsHandler';
import { SettingsBackgroundImagePicker } from '../delegates/SettingsBackgroundImagePicker';
import { SettingsRestoreBackupHandler } from '../delegates/SettingsRestoreBackupHandler';
import {
  Drawer,
  Switch,
  Button,
  List,
  Divider,
  Dialog,
  Portal,
  Paragraph,
  Text,
  useTheme,
} from 'react-native-paper';
import type { BackupMeta } from '../models/domain';
import { useNavigation } from '@react-navigation/native';
import { statusBarHeight } from '../layouts/StatusBarHeight';
import { useSnackbarStore } from '../store/GlobalSnackbarStore';



// Theme and background options
const THEME_OPTIONS = [
  { key: 'default', label: 'Default' },
  { key: 'calm_blue', label: 'Calm Blue' },
  { key: 'midnight', label: 'Midnight' },
  { key: 'sunrise', label: 'Sunrise' },
];
const BUILT_IN_BACKGROUNDS = [
  { key: 'calm_blue', label: 'Calm Blue' },
  { key: 'nature_green', label: 'Nature Green' },
  { key: 'serene_purple', label: 'Serene Purple' },
];

const BUY_ME_A_COFFEE_URL = 'https://www.buymeacoffee.com/yourprofile';


export default function SettingsMenu(props: DrawerContentComponentProps) {
  // Zustand stores
  const settings = useSettingsStore(state => state.settings);
  const setTheme = useSettingsStore(state => state.setTheme);
  const setDndEnabled = useSettingsStore(state => state.setDndEnabled);
  const setKeepScreenOn = useSettingsStore(state => state.setKeepScreenOn);
  const setCountUp = useSettingsStore(state => state.setCountUp);
  const setBackupEnabled = useSettingsStore(state => state.setBackupEnabled);
  const setAdsFreePurchased = useSettingsStore(state => state.setAdsFreePurchased);
  const setBackgroundImage = useSettingsStore(state => state.setBackgroundImage);

  const diaryEntries = useDiaryStore(state => state.diaryEntries);
  const meditationLogs = useLogStore(state => state.meditationLogs);

  const navigation = useNavigation();

  // Delegates (created once per component instance)
  const dialogManager = useRef(new SettingsDialogManager()).current;
  const backupMetadataManager = useRef(new SettingsBackupMetadataManager()).current;
  const monetizationHandler = useRef(new SettingsMonetizationHandler()).current;
  const sharingExportHandler = useRef(new SettingsSharingExportHandler()).current;
  const permissionsHandler = useRef(new SettingsPermissionsHandler()).current;
  const backgroundImagePicker = useRef(new SettingsBackgroundImagePicker()).current;
  const restoreBackupHandler = useRef(new SettingsRestoreBackupHandler()).current;
  const showSnackbar = useSnackbarStore(state => state.showSnackbar);
  const theme = useTheme();
  console.debug("Theme:", theme.colors)


  const [showThemeDialog, setShowThemeDialog] = React.useState(false);
  const [showImageDialog, setShowImageDialog] = React.useState(false);



  useEffect(() => {
    backupMetadataManager.refreshBackupMetadata();
    monetizationHandler.registerPurchaseListener('remove_ads_product');
  }, []);

  useEffect(() => {
    if (settings.backupEnabled) {
      backupMetadataManager.refreshBackupMetadata();
      BackupJobHandler.registerBackupJob();
    } else {
      BackupJobHandler.unregisterBackupJob();
      backupMetadataManager.refreshBackupMetadata();
    }
  }, [settings.backupEnabled]);

  const handleThemeSelect = useCallback((color: string) => {
    setTheme(color);
  }, [setTheme]);

  const launchImagePicker = useCallback(async () => {
    await backgroundImagePicker.launchImagePicker(onImagePicked);
  }, [backgroundImagePicker]);

  const onImagePicked = useCallback(async (result: { canceled: boolean; uri?: string }) => {
    await backgroundImagePicker.handleImagePicked(
      result,
      setBackgroundImage,
      dialogManager.closeImageDialog.bind(dialogManager)
    );
  }, [backgroundImagePicker, setBackgroundImage, dialogManager]);

  const handleExportDiary = useCallback(async () => {
    await sharingExportHandler.exportDiary(
      diaryEntries,
      dialogManager.setErrorDialog.bind(dialogManager)
    );
  }, [sharingExportHandler, diaryEntries, dialogManager]);

  const handleBuiltInImageSelect = useCallback(async (imageRef: string) => {
    await backgroundImagePicker.handleBuiltInImageSelect(
      imageRef,
      setBackgroundImage,
      dialogManager.closeImageDialog.bind(dialogManager)
    );
  }, [backgroundImagePicker, setBackgroundImage, dialogManager]);

  const handleToggleDND = useCallback(async (value: boolean) => {
    await permissionsHandler.requestDndPermission(
      () => setDndEnabled(value),
      () => showSnackbar('DND permission denied.')
    );
  }, [permissionsHandler, setDndEnabled, dialogManager]);

  const handleToggleKeepScreenOn = useCallback((value: boolean) => {
    setKeepScreenOn(value);
  }, [setKeepScreenOn]);

  const handleToggleCountUp = useCallback((value: boolean) => {
    setCountUp(value);
  }, [setCountUp]);

  const handleToggleBackupEnabled = useCallback(async (value: boolean) => {
    setBackupEnabled(value);
    if (value) {
      await BackupJobHandler.registerBackupJob();
      await backupMetadataManager.refreshBackupMetadata();
    } else {
      await BackupJobHandler.unregisterBackupJob();
      await backupMetadataManager.refreshBackupMetadata();
    }
  }, [setBackupEnabled, backupMetadataManager]);

  const handleToggleAdsFree = useCallback(async (value: boolean) => {
    await setAdsFreePurchased(value);
  }, [setAdsFreePurchased]);

  const handleNavigateToDiarySharing = useCallback(() => {
    navigation.navigate('DiarySharing' as never);
  }, [navigation]);

  const handleRestoreBackup = useCallback(async () => {
    await restoreBackupHandler.initiateRestoreViaFilePicker(
      (fileUri: string) =>
        dialogManager.openRestoreDialog({ filePath: fileUri, timestamp: new Date().toISOString() }),
      dialogManager.setErrorDialog.bind(dialogManager)
    );
  }, [restoreBackupHandler, dialogManager]);

  const onFilePicked = useCallback(async (result: { cancelled: boolean; uri?: string }) => {
    if (!result.cancelled && result.uri) {
      await restoreBackupHandler.confirmRestore(
        { filePath: result.uri, timestamp: new Date().toISOString() },
        () => {
          showSnackbar('Database restored from backup.');
          dialogManager.closeRestoreDialog();
        },
        dialogManager.setErrorDialog.bind(dialogManager)
      );
    }
  }, [restoreBackupHandler, dialogManager]);

  const handleCloseDrawer = useCallback(() => {
    if ('closeDrawer' in navigation && typeof navigation.closeDrawer === 'function') {
      navigation.closeDrawer();
    } else if ('goBack' in navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  }, [navigation]);

  const onPermissionResult = useCallback((status: 'granted' | 'denied' | 'blocked' | 'unavailable' | 'authorized') => {
    permissionsHandler.handlePermissionResult(status, () =>
      showSnackbar('Permission denied or unavailable.')
    );
  }, [permissionsHandler, dialogManager]);

  const handleZustandSettingsUpdate = useCallback(() => { }, []);

  const handleRestoreBackupPress = useCallback((backupMeta: BackupMeta) => {
    dialogManager.openRestoreDialog(backupMeta);
  }, [dialogManager]);

  const handleConfirmRestore = useCallback(async () => {
    if (!dialogManager.pendingRestoreMeta) return;
    await restoreBackupHandler.confirmRestore(
      dialogManager.pendingRestoreMeta,
      () => {
        showSnackbar('Database restored from backup.');
        dialogManager.closeRestoreDialog();
      },
      dialogManager.setErrorDialog.bind(dialogManager)
    );
  }, [restoreBackupHandler, dialogManager]);

  const handleRemoveAds = useCallback(async () => {
    await monetizationHandler.startRemoveAdsPurchase(
      handlePurchaseSuccess,
      handlePurchaseFailure
    );
  }, [monetizationHandler]);

  const handlePurchaseSuccess = useCallback(async (_result: any) => {
    await setAdsFreePurchased(true);
    monetizationHandler.isPurchasing = false;
    showSnackbar('Ads removed successfully!');
  }, [setAdsFreePurchased, monetizationHandler, dialogManager]);

  const handlePurchaseFailure = useCallback((msg: string) => {
    dialogManager.setErrorDialog(msg || 'Purchase failed or cancelled.');
    monetizationHandler.isPurchasing = false;
  }, [dialogManager, monetizationHandler]);

  const restorePurchase = useCallback(async () => {
    await monetizationHandler.startRestorePurchase(
      handleRestoreSuccess,
      handleRestoreFailure
    );
  }, [monetizationHandler]);

  const handleRestoreSuccess = useCallback(async (_result: any) => {
    await setAdsFreePurchased(true);
    monetizationHandler.isRestoringPurchase = false;
    showSnackbar('Restored purchase successfully!');
  }, [setAdsFreePurchased, monetizationHandler, dialogManager]);

  const handleRestoreFailure = useCallback((msg: string) => {
    dialogManager.setErrorDialog(msg || 'Restore failed or cancelled.');
    monetizationHandler.isRestoringPurchase = false;
  }, [dialogManager, monetizationHandler]);

  const handleBuyMeACoffee = useCallback(() => {
    Linking.openURL(BUY_ME_A_COFFEE_URL);
  }, []);

  const handleShareApp = useCallback(async () => {
    await sharingExportHandler.shareApp(dialogManager.setErrorDialog.bind(dialogManager));
  }, [sharingExportHandler, dialogManager]);

  const handleRateUs = useCallback(async () => {
    await sharingExportHandler.rateUs(dialogManager.setErrorDialog.bind(dialogManager));
  }, [sharingExportHandler, dialogManager]);

  const handleViewStatistics = useCallback(() => {
    navigation.navigate('StatisticsPage' as never);
  }, [navigation]);

  return (
    //statusBarHeight so confusing
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.surfaceVariant, paddingTop: 16}}>
      {/* Appearance */}
      <Drawer.Section style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Drawer.Item
          label="Theme"
          onPress={() => setShowThemeDialog(true)}
          style={styles.drawerItem}
        />
        <Drawer.Item
          label="Session Background"
          onPress={() => setShowImageDialog(true)}
          style={styles.drawerItem}
        />
      </Drawer.Section>
      {/* Timers & Focus */}
      <Drawer.Section style={styles.section}>
        <Text style={styles.sectionTitle}>Timers & Focus</Text>
        <View style={styles.toggleButtonContainer}>
          <Button
            mode='contained'
            icon={settings.dndEnabled ? 'bell-off-outline' : 'bell-outline'}
            onPress={() => handleToggleDND(!settings.dndEnabled)}
            disabled={permissionsHandler.dndToggleDisabled}
            style={[
              styles.toggleButton,
              settings.dndEnabled ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surface },
              permissionsHandler.dndToggleDisabled && styles.toggleButtonDisabled,
            ]}
            labelStyle={{color: settings.dndEnabled ?theme.colors.inverseOnSurface:theme.colors.onSurface}}
            contentStyle={{ flexDirection: 'row-reverse' }} // icon on right if you want
          >
            Do Not Disturb
          </Button>
        </View>
        <View style={styles.toggleButtonContainer}>
          <Button
            icon={settings.keepScreenOn ? 'weather-night' : 'weather-sunny'}
            onPress={() => handleToggleKeepScreenOn(!settings.keepScreenOn)}
            disabled={permissionsHandler.dndToggleDisabled}
            style={[
              styles.toggleButton,
              settings.keepScreenOn ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surface },
            ]}
            labelStyle={{color: settings.keepScreenOn ?theme.colors.inverseOnSurface:theme.colors.onSurface}}
            contentStyle={{ flexDirection: 'row-reverse' }} // icon on right if you want
          >
            Keep Screen On
          </Button>
        </View>
        {/* <Drawer.Item
          label="Count Up Timer"
          right={() => (
            <Switch
              value={!!settings.countUp}
              onValueChange={handleToggleCountUp}
            />
          )}
          style={styles.drawerItem}
        /> */}
      </Drawer.Section>
      {/* Backup & Restore */}
      <Drawer.Section style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <View style={styles.toggleButtonContainer}>
          <Button
            icon={settings.backupEnabled ? 'database' : 'database-off'}
            onPress={() => handleToggleBackupEnabled(!settings.backupEnabled)}
            style={[
              styles.toggleButton,
              settings.backupEnabled ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.surface },
            ]}
            labelStyle={{color: settings.backupEnabled ?theme.colors.inverseOnSurface:theme.colors.onSurface}}
            contentStyle={{ flexDirection: 'row-reverse' }} // icon on right if you want
          >
            Enable Backup
          </Button>
        </View>
        <Drawer.Item
          label="Restore from Backup"
          onPress={handleRestoreBackup}
          style={styles.drawerItem}
        />
        {settings.backupEnabled && (
          <View style={styles.backupListContainer}>
            <Text style={styles.backupTitle}>Available Backups</Text>
            {backupMetadataManager.getBackupList().length === 0 ? (
              <Text style={styles.noBackupText}>No available backups</Text>
            ) : (
              backupMetadataManager.getBackupList().map((backup: BackupMeta) => (
                <List.Item
                  key={backup.filePath}
                  title={new Date(backup.timestamp).toLocaleString()}
                  description={backup.filePath}
                  onPress={() => handleRestoreBackupPress(backup)}
                  left={props => <List.Icon {...props} icon="database" />}
                />
              ))
            )}
            <Text style={styles.lastBackupText}>
              Last Backup:{' '}
              {backupMetadataManager.getLastBackupIso()
                ? new Date(backupMetadataManager.getLastBackupIso()!).toLocaleString()
                : 'N/A'}
            </Text>
          </View>
        )}
      </Drawer.Section>
      {/* Export & Share */}
      <Drawer.Section style={styles.sectionTitle}>
        <Text style={styles.sectionTitle}>Export & Share</Text>
        <Drawer.Item
          label="Export Diary"
          onPress={handleExportDiary}
          style={styles.drawerItem}
        />
        <Drawer.Item
          label="Share App"
          onPress={handleShareApp}
          style={styles.drawerItem}
        />
        <Drawer.Item
          label="Rate Us"
          onPress={handleRateUs}
          style={styles.drawerItem}
        />
        <Drawer.Item
          label="View Statistics"
          onPress={handleViewStatistics}
          style={styles.drawerItem}
        />
      </Drawer.Section>
      {/* Support & Monetization */}
      <Drawer.Section style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <Drawer.Item
          label={settings.adsFreePurchased ? 'Ads Removed' : 'Remove Ads'}
          onPress={
            settings.adsFreePurchased || monetizationHandler.isPurchasing
              ? undefined // disables press
              : handleRemoveAds
          }
          style={[
            styles.drawerItem,
            (settings.adsFreePurchased || monetizationHandler.isPurchasing) && styles.drawerItemDisabled
          ]}
        />

        <Drawer.Item
          label="Restore Purchase"
          icon={
            monetizationHandler.isRestoringPurchase
              ? () => <ActivityIndicator size={20} />
              : 'restore'
          }
          onPress={
            monetizationHandler.isRestoringPurchase
              ? undefined
              : restorePurchase
          }
          style={[
            styles.drawerItem,
            monetizationHandler.isRestoringPurchase && styles.drawerItemDisabled
          ]}
        />
        <Drawer.Item
          label="Buy Me a Coffee"
          onPress={handleBuyMeACoffee}
          style={styles.drawerItem}
        />
        <Drawer.Item
          label=""
          onPress={handleShareApp}
          style={styles.drawerItem}
        />
        <Drawer.Item
          label=""
          onPress={handleShareApp}
          style={styles.drawerItem}
        />
      </Drawer.Section>
      <AdBanner />

      {/* PORTAL AND DIALOGS */}
      <Portal>
        {/* Theme Dialog */}
        <Dialog
          visible={showThemeDialog}
          onDismiss={() => setShowThemeDialog(false)}
        >
          <Dialog.Title>Select Theme</Dialog.Title>
          <Dialog.Content>
            {THEME_OPTIONS.map(({ key, label }) => (
              <List.Item
                key={key}
                title={label}
                left={props => <List.Icon {...props} icon={settings.theme === key ? 'circle' : 'circle-outline'} />}
                onPress={() => {
                  handleThemeSelect(key);
                  setShowThemeDialog(false);
                }}
              />
            ))}
          </Dialog.Content>
        </Dialog>
        {/* Background Image Dialog */}
        <Dialog
          visible={showImageDialog}
          onDismiss={() => setShowImageDialog(false)}
        >
          <Dialog.Title>Select Background</Dialog.Title>
          <Dialog.Content>
            {BUILT_IN_BACKGROUNDS.map(({ key, label }) => (
              <List.Item
                key={key}
                title={label}
                left={props => <List.Icon {...props} icon={settings.sessionBackgroundImage === key ? 'image' : 'image-outline'} />}
                onPress={() => handleBuiltInImageSelect(key)}
              />
            ))}
            <Divider style={{ marginVertical: 8 }} />
            <Button mode="outlined" onPress={launchImagePicker}>
              Choose Custom Image...
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImageDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
        {/* Restore Confirmation Dialog */}
        <Dialog
          visible={dialogManager.showRestoreDialog}
          onDismiss={dialogManager.closeRestoreDialog.bind(dialogManager)}
        >
          <Dialog.Title>Restore Backup?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {dialogManager.pendingRestoreMeta
                ? `Restore backup from ${new Date(dialogManager.pendingRestoreMeta.timestamp).toLocaleString()}?`
                : 'Restore selected backup?'}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dialogManager.closeRestoreDialog.bind(dialogManager)}>Cancel</Button>
            <Button
              onPress={handleConfirmRestore}
              loading={restoreBackupHandler.restoreLoading}
              disabled={restoreBackupHandler.restoreLoading}
            >
              Restore
            </Button>
          </Dialog.Actions>
        </Dialog>
        {/* Error Dialog */}
        <Dialog
          visible={!!dialogManager.errorDialog}
          onDismiss={dialogManager.clearErrorDialog.bind(dialogManager)}
        >
          <Dialog.Title>Error</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{dialogManager.errorDialog}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={dialogManager.clearErrorDialog.bind(dialogManager)}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 8,
    paddingBottom: 0,
    paddingTop: 0,
  },
  sectionTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 17,
    marginTop: 14,
    letterSpacing: 0.3,
  },
  drawerItem: {
    paddingVertical: 1, // Less vertical space between items
    marginVertical: 0,
    height: 36,      // Optional: can tweak for extra compactness
  },
  drawerItemDisabled: {
    opacity: 0.4, // visually faded
  },
  twoLineLabel: {
    fontSize: 15,
    lineHeight: 19,
    color: '#222',
  },
  backupListContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  backupTitle: {
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 2,
    color: '#666',
  },
  noBackupText: {
    color: '#bbb',
    fontStyle: 'italic',
    marginVertical: 6,
    marginLeft: 8,
  },
  lastBackupText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 8,
  },
  toggleButtonContainer: {
    marginVertical: 6,
    marginHorizontal: 12,
  },
  toggleButton: {
    borderRadius: 20,
    // borderWidth: 1,
    height: 40
  },
  toggleButtonDisabled: {
    opacity: 0.5,
    borderColor: "#fff"
  },
});
