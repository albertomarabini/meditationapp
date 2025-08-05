// /src/views/MainScreen.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, AppState, BackHandler, Dimensions, NativeSyntheticEvent, ImageErrorEventData } from 'react-native';
import { Image } from 'react-native';
import { FAB, IconButton, ActivityIndicator, Snackbar, useTheme, Provider as PaperProvider, Appbar } from 'react-native-paper';
import { NavigationService } from '../navigation/NavigationLayer';
import { useNavigation, useRoute } from '@react-navigation/native';

import { MainScreenAccessibilityHelper } from '../delegates/MainScreenAccessibilityHelper';
import { MainScreenAdBannerRenderer } from '../delegates/MainScreenAdBannerRenderer';
import { MainScreenTimerListRenderer } from '../delegates/MainScreenTimerListRenderer';
import { MainScreenBackgroundImageManager } from '../delegates/MainScreenBackgroundImageManager';
import { useSessionTimersStore as TimerStateStore } from '../store/TimerStateStore';
import { useSnackbarStore } from '../store/GlobalSnackbarStore';
import { SettingsStore } from '../store/SettingsStore';
import { statusBarHeight } from '../layouts/StatusBarHeight';


// Expo Image is imported dynamically for Expo Go compatibility.
let ExpoImage: any;
// try {
//   ExpoImage = require('expo-image').Image;
// } catch {
ExpoImage = undefined;
// }

// Navigation route constants
const SESSION_TIMER_CREATE_ROUTE = 'SessionTimerForm';
const SESSION_TIMER_EDIT_ROUTE = 'SessionTimerEdit';
const MEDITATION_SESSION_WINDOW_ROUTE = 'MeditationSessionWindow';
const CALENDAR_VIEW_ROUTE = 'CalendarView';
const SETTINGS_MENU_ROUTE = 'SettingsMenu';

const DEFAULT_BG = require('../../assets/default-bg.jpg');

console.log('MainScreen loaded');

export default function MainScreen() {
  // Zustand selectors (direct state for reactivity)
  const sessionTimers = TimerStateStore((state) => state.sessionTimers);
  const setSessionTimers = TimerStateStore((state) => state.setSessionTimers);
  const timersLoading = TimerStateStore((state) => state.timersLoading);
  const adsFreePurchased = SettingsStore((state) => state.settings.adsFreePurchased);
  const themeStoreTheme = SettingsStore((state) => state.settings.theme);
  const backgroundImageUri = SettingsStore((state) => state.settings.sessionBackgroundImage);
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const showSnackbar = useSnackbarStore(state => state.showSnackbar);

  // Local state
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState<{ width: number; height: number }>({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  });
  const [scrollY, setScrollY] = useState(0);

  // FlatList reference for scroll control
  const flatListRef = useRef<any>(null);

  // Previous timers for list change detection/scroll reset
  const prevTimersRef = useRef<string[]>([]);

  // Background image manager
  const bgImageManagerRef = useRef<MainScreenBackgroundImageManager>(
    new MainScreenBackgroundImageManager(
      backgroundImageUri ? { uri: backgroundImageUri } : DEFAULT_BG,
      DEFAULT_BG
    )
  );

  // ------- Handlers -------

  // Load timers from the store on mount/refresh
  const loadSessionTimers = useCallback(async () => {
    // Optionally: setLoading(true);
    const timers = await TimerStateStore.getState().sessionTimers;
    setSessionTimers(timers);
    // Optionally: setLoading(false);
  }, [setSessionTimers]);

  // Deduplicate timers and manage FlatList scroll on updates
  const handleSessionTimersUpdate = useCallback((newTimers: any[]) => {
    // Enforce unique IDs at UI layer (defensive, as required)
    const uniqueTimers = (() => {
      const seen = new Set<string>();
      return newTimers.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    })();
    const prevIds = prevTimersRef.current;
    const newIds = uniqueTimers.map((t) => t.id);
    if (
      prevIds.length !== newIds.length ||
      prevIds.some((id: string, idx: number) => id !== newIds[idx])
    ) {
      flatListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
    }
    prevTimersRef.current = newIds;
  }, []);

  // Theme/background update handler
  const handleThemeOrBackgroundUpdate = useCallback(
    (newTheme: string, newBackgroundImage: string) => {
      if (bgImageManagerRef.current) {
        bgImageManagerRef.current.setBackgroundSource(
          newBackgroundImage ? { uri: newBackgroundImage } : DEFAULT_BG
        );
      }
    },
    []
  );

  // Settings update handler (e.g., adsFreePurchased, theme)
  const handleSettingsUpdate = useCallback((_newSettings: any) => {
    // Only triggers re-render via Zustand subscription
  }, []);

  // Focus handler for navigation
  const handleFocus = useCallback(() => {
    loadSessionTimers();
  }, [loadSessionTimers]);

  // Loading state update handler
  const handleLoadingStateUpdate = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, []);

  // App state (foreground/background) handler
  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      if (nextAppState === 'active') {
        loadSessionTimers();
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset?.({ offset: scrollY, animated: false });
        }
      }
    },
    [loadSessionTimers, scrollY]
  );

  // Layout/orientation handler
  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
      setLayout(event.nativeEvent.layout);
    },
    []
  );

  // Scroll handler for FlatList
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  }, []);

  // Image load handlers (delegated)
  const handleImageLoaded = useCallback(() => {
    bgImageManagerRef.current.handleImageLoaded();
  }, []);

  const handleImageError = useCallback((event: NativeSyntheticEvent<ImageErrorEventData>) => {
    bgImageManagerRef.current.handleImageError(event);
  }, []);

  // Snackbar/Dismiss/Retry handler
  const handleSnackbarAction = useCallback(
    (event: 'dismiss' | 'retry') => {
      if (event === 'retry') {
        loadSessionTimers();
      }
    },
    [loadSessionTimers]
  );

  // Hardware back handler for Android
  const handleHardwareBackPress = useCallback(() => {
    BackHandler.exitApp();
    return true;
  }, []);

  // Calendar button handler
  const handleCalendar = useCallback(() => {
    NavigationService.navigate(CALENDAR_VIEW_ROUTE);
  }, [NavigationService]);

  // Settings button handler
  const handleSettings = useCallback(() => {
    // if (typeof (navigation as any).openDrawer === 'function') {
    console.log("Settings clicked")
    NavigationService.openDrawer();
    // } else {
    //   NavigationService.navigate(SETTINGS_MENU_ROUTE);
    // }
  }, [NavigationService]);

  // Create Session Timer handler (FAB)
  const handleCreateSessionTimer = useCallback(() => {
    NavigationService.navigate(SESSION_TIMER_CREATE_ROUTE);
  }, [NavigationService]);

  // Edit Session Timer handler
  const handleEditSessionTimer = useCallback(
    (id: string) => {
      const timer = sessionTimers.find((t) => t.id === id);//[ts] Parameter 't' implicitly has an 'any' type.
      if (!timer) {
        showSnackbar('Session Timer not found.');
        return;
      }
      NavigationService.navigate(SESSION_TIMER_CREATE_ROUTE, { id });
    },
    [NavigationService, sessionTimers]
  );

  // Play Session Timer handler
  const handlePlay = useCallback(
    (sessionTimerId: string) => {
      const timer = sessionTimers.find((t) => t.id === sessionTimerId);
      if (!timer) {
        showSnackbar('Session Timer not found.');
        return;
      }
      NavigationService.navigate(MEDITATION_SESSION_WINDOW_ROUTE, { sessionId: sessionTimerId });
    },
    [NavigationService, sessionTimers]
  );

  // --- Effects ---

  // Initial mount: load timers & set up AppState/back handlers
  useEffect(() => {
    loadSessionTimers();
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleHardwareBackPress);

    return () => {
      subscription.remove();
      backHandler.remove();
    };
  }, [loadSessionTimers, handleAppStateChange, handleHardwareBackPress]);

  // Subscribe to Zustand SessionTimers changes for scroll reset
  useEffect(() => {
    handleSessionTimersUpdate(sessionTimers);
  }, [sessionTimers, handleSessionTimersUpdate]);

  // Subscribe to "theme" and "backgroundImage" changes
  useEffect(() => {
    handleThemeOrBackgroundUpdate(themeStoreTheme, backgroundImageUri);
  }, [themeStoreTheme, backgroundImageUri, handleThemeOrBackgroundUpdate]);

  // Subscribe to settings for adsFreePurchased, etc.
  useEffect(() => {
    handleSettingsUpdate(SettingsStore.getState().settings);
  }, [handleSettingsUpdate]);

  // Subscribe to navigation focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', handleFocus);
    return unsubscribe;
  }, [navigation, handleFocus]);

  // Layout recalculation on window size change
  useEffect(() => {
    const onChange = () => {
      setLayout({ width: Dimensions.get('window').width, height: Dimensions.get('window').height });
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      if (typeof subscription?.remove === 'function') subscription.remove();
    };
  }, []);

  // --- Render ---

  // Accessibility for buttons
  const calendarA11y = MainScreenAccessibilityHelper.getAccessibilityProps('Open Calendar');
  const settingsA11y = MainScreenAccessibilityHelper.getAccessibilityProps('Open Settings');
  const fabA11y = MainScreenAccessibilityHelper.getAccessibilityProps('Create Session Timer');

  // Background image source
  const bgImageSource = bgImageManagerRef.current.getBackgroundSource();
  console.log('MainScreen rendered, loading state:', loading);
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]} onLayout={handleLayout}>
      {/* Background Image (Expo Image, styled as absolute) */}
      {ExpoImage && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={bgImageSource}
            style={StyleSheet.absoluteFill}
            onLoad={handleImageLoaded}
            onError={handleImageError}
            resizeMode="cover"
          />
        </View>
      )}
      {/* Calendar Button (top left) and Settings Button (top right) */}
      <Appbar.Header>
        <Appbar.Action size={28} onPress={handleCalendar} icon="calendar" disabled={loading} accessibilityLabel="Calendar View" />
        <Appbar.Action size={28} icon="notebook" onPress={() => { NavigationService.navigate('DiaryView'); }} accessibilityLabel="Diary View" />
        <View style={{ flex: 1 }} />
        <Appbar.Action icon="cog" size={28} onPress={handleSettings} accessibilityLabel="Settings" />
      </Appbar.Header>
      {/* Session Timers List */}
      <View style={styles.listContainer}>
        <MainScreenTimerListRenderer
          sessionTimers={sessionTimers}
          onPlay={handlePlay}
          onEdit={handleEditSessionTimer}
          onCreate={handleCreateSessionTimer}
          theme={theme}
          loading={timersLoading}
        />
      </View>
      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          { backgroundColor: theme.colors.primary },
          { right: 24, bottom: adsFreePurchased ? 36 : 76 },
        ]}
        onPress={handleCreateSessionTimer}
        disabled={loading}
        {...fabA11y}
      />
      {/* Activity Indicator Overlay */}
      {loading && (
        <ActivityIndicator
          animating={true}
          size="large"
          style={styles.activityIndicator}
          color={theme.colors.primary}
        />
      )}
    </View>
  );


}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: statusBarHeight + 8,
    paddingHorizontal: 8,
    zIndex: 2,
  },
  listContainer: {
    flex: 1,
    zIndex: 1,
    paddingBottom: 16,
    paddingTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    elevation: 5,
    zIndex: 10,
  },
  activityIndicator: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    zIndex: 200,
  },
});







