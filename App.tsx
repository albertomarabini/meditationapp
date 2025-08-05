import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { PaperProvider, Snackbar, useTheme } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { RootStackParamList } from './src/navigation/RootStackParamList'
import { navigationRef } from './src/navigation/NavigationLayer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

// === YOUR SCREENS ===
import MainScreen from './src/views/MainScreen';
import CalendarView from './src/views/CalendarView';
import DiaryEntryEditor from './src/views/DiaryEntryEditor';
import DiaryView from './src/views/DiaryView';
import MeditationSessionWindow from './src/views/MeditationSessionWindow';
import SessionTimerForm from './src/views/SessionTimerForm';
import SettingsMenu from './src/views/SettingsMenu';
import StatisticsPage from './src/views/StatisticsPage';
// (Add all others as needed)

// === YOUR STORE/BOOT MANAGERS ===
import { ExpoSQLiteSchema } from './src/persistence/ExpoSQLiteSchema';
import { useSettingsStore } from './src/store/SettingsStore';
import { initTimerStore, useSessionTimersStore } from './src/store/TimerStateStore';
import { useLogStore } from './src/store/LogStateStore';
import { useDiaryStore } from './src/store/DiaryStore';
import { NotificationManager } from './src/services/NotificationManager';
import { BackupJobHandler } from './src/services/BackupJobHandler';
import { AppBootManager,  setAppBootManagerSnackbar} from './src/bootstrap/AppBootManager';
import { Themes } from './src/layouts/Themes';


//TEST
// import {TestButtonScreen} from "./src/views/TestButtonScreen"
// src/services/SessionTimerRepoAdapter.ts
import { SessionTimerRepoAdapter } from './src/persistence/SessionTimerRepoAdapter';
import { GlobalSnackbar } from './src/components/GlobalSnackbar';
import { useSnackbarStore } from './src/store/GlobalSnackbarStore';
import { MainScreenAdBannerRenderer } from './src/delegates/MainScreenAdBannerRenderer';

// === NAVIGATION SETUP ===
const Stack = createStackNavigator<RootStackParamList>();
type DrawerParamList = { MainStack: undefined; SettingsMenu: undefined };
const Drawer = createDrawerNavigator<DrawerParamList>();


function MainStack() {
  return (
    <Stack.Navigator initialRouteName="MainScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainScreen" component={MainScreen} />
      <Stack.Screen name="CalendarView" component={CalendarView} />
      <Stack.Screen name="DiaryEntryEditor" component={DiaryEntryEditor} />
      <Stack.Screen name="DiaryView" component={DiaryView} />
      <Stack.Screen name="MeditationSessionWindow" component={MeditationSessionWindow} />
      <Stack.Screen name="SessionTimerForm" component={SessionTimerForm} />
      <Stack.Screen name="StatisticsPage" component={StatisticsPage} />
      {/* ...add any others */}
    </Stack.Navigator>);
}

export default function App() {
  const themeKey = useSettingsStore(state => state.settings.theme) || 'default';
  const schema = new ExpoSQLiteSchema();
  const timerStoreSetInitialized = useSessionTimersStore(state => state.setInitialized);
  const loadAllSessionTimers = useSessionTimersStore((state) => state.loadAllSessionTimers);
  const showSnackbar = useSnackbarStore(state => state.showSnackbar);
  const adsFreePurchased = useSettingsStore((state) => state.settings.adsFreePurchased);
  const loadAppSettings = useSettingsStore(state => state.loadSettings);

  useEffect(() => {
    // DEBUG Database: we need a better management of this error
    //All the database initializators should work together to tell if the application should start
    schema.initialize()
      .then(() => console.log('DB ready!'))
      .catch(err => console.error('DB error:', err));
    //Starting Timer Store
    (async () => {
      await initTimerStore();
      await loadAllSessionTimers();
      timerStoreSetInitialized(true);
    })();
    //Loading Settings
    loadAppSettings();
    // Zustand store slices
    void useSettingsStore.getState;
    void useSessionTimersStore.getState;
    void useLogStore.getState;
    void useDiaryStore.getState;

    // Singleton services
    void NotificationManager;
    void BackupJobHandler;

    // === BOOT LOGIC ===
    setAppBootManagerSnackbar((msg) => showSnackbar(msg));
    const bootManager = new AppBootManager();
    bootManager.hydrateSettingsStore();
    bootManager.checkAndRestoreSessionState();
    bootManager.registerLifecycleListeners();

    return () => {
      bootManager.unregisterLifecycleListeners();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={(Themes as any)[themeKey]}>
        <NavigationContainer ref={navigationRef}  theme={(Themes as any)[themeKey]}>
          <Drawer.Navigator
            initialRouteName="MainStack"
            screenOptions={{ headerShown: false }}
            drawerContent={(props: DrawerContentComponentProps) => <SettingsMenu {...props} />}
          >
            <Drawer.Screen name="MainStack" component={MainStack} />
          </Drawer.Navigator>
          <GlobalSnackbar />
        </NavigationContainer>
        {/* Persistent Ad Banner (if enabled) */}
        {MainScreenAdBannerRenderer({
          adsFreePurchased,
        })}
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
