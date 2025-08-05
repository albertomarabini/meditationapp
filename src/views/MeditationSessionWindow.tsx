// src/views/MeditationSessionWindow.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus, BackHandler, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { Button, Dialog, Portal, Paragraph, IconButton, Appbar } from 'react-native-paper';
import { useSessionTimersStore as useTimerStore } from '../store/TimerStateStore';
import { SettingsStore } from '../store/SettingsStore';
import { useLogStore as LogStateStore } from '../store/LogStateStore';
import { SessionAudioOrchestrator } from '../delegates/SessionAudioOrchestrator';
import { MeditationSessionTimerManager } from '../delegates/MeditationSessionTimerManager';
import { SessionOSIntegrationManager } from '../delegates/SessionOSIntegrationManager';
import { SessionCentralAnimation } from '../layouts/SessionCentralAnimation';
import type { SessionTimer, Settings } from '../models/domain';
import { useSnackbarStore } from '../store/GlobalSnackbarStore';
import { statusBarHeight } from '../layouts/StatusBarHeight';
import type { RootStackParamList } from '../navigation/RootStackParamList';
import { Dimensions } from 'react-native';

type Navigation = NavigationProp<RootStackParamList, 'MeditationSessionWindow'>;
type Route = RouteProp<RootStackParamList, 'MeditationSessionWindow'>;

type SessionPhase = 'not_started' | 'preparation' | 'in_session' | 'paused' | 'terminated';

const osIntegrationManager = new SessionOSIntegrationManager();
const screenWidth = Dimensions.get('window').width;
const CIRCLE_MARGIN = 10;
const arcSize = screenWidth - CIRCLE_MARGIN * 2;

export default function MeditationSessionWindow() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const timerId: string = route.params?.sessionId;

  // Zustand stores
  const sessionTimers = useTimerStore((state) => state.sessionTimers);
  const settings = SettingsStore((state) => state.settings);

  // Local state
  const [lockedConfig, setLockedConfig] = useState<SessionTimer | null>(null);
  const [lockedSettings, setLockedSettings] = useState<Settings | null>(null);
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('not_started');
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(-1);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [playbackErrorDialog, setPlaybackErrorDialog] = useState<string | null>(null);

  const timerManagerRef = useRef<MeditationSessionTimerManager | null>(null);
  const audioOrchestratorRef = useRef<SessionAudioOrchestrator | null>(null);
  const showSnackbar = useSnackbarStore(state => state.showSnackbar);
  const overlayOpacity = useRef(new Animated.Value(0)).current;


  const [digitalElapsed, setDigitalElapsed] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastArcProgress, setLastArcProgress] = useState(0);
  const elapsedIntervalRef = useRef<number | null>(null);

  const [resetKey, setResetKey] = useState(0);
  const prevSessionPhase = useRef<SessionPhase>(sessionPhase);
  const [showDarkOverlay, setShowDarkOverlay] = useState(false);


  const appState = useRef<AppStateStatus>(AppState.currentState);

  // --- Load and lock session blueprint on focus/mount ---
  useEffect(() => {
    if (!timerId) {
      showSnackbar('Missing session timer ID.');
      return;
    }
    const sessionTimer = sessionTimers.find((t) => t.id === timerId);
    if (!sessionTimer) {
      showSnackbar('Session Timer not found.');
      return;
    }
    const sessionCopy: SessionTimer = JSON.parse(JSON.stringify(sessionTimer));
    const settingsCopy: Settings = JSON.parse(JSON.stringify(settings));
    setLockedConfig(sessionCopy);
    setLockedSettings(settingsCopy);
    setSessionPhase('not_started');
    setCurrentSegmentIndex(sessionCopy.preparationTime > 0 ? -1 : 0);

    setDigitalElapsed(0);

    timerManagerRef.current = new MeditationSessionTimerManager(
      sessionCopy,
      settingsCopy,
      handleSegmentEnd
    );
    audioOrchestratorRef.current = new SessionAudioOrchestrator(
      sessionCopy,
      (msg: string) => setPlaybackErrorDialog(msg)
    );
    // eslint-disable-next-line
  }, [timerId, sessionTimers, settings]);

  // --- Digital elapsed timer mirror (for UI) ---
  useEffect(() => {
    let interval: number | null = null;
    if (sessionPhase === 'in_session' || sessionPhase === 'preparation') {
      interval = setInterval(() => {
        if (timerManagerRef.current) {
          setDigitalElapsed(timerManagerRef.current.getDigitalElapsed());
        }
      }, 1000);
    }
    if (sessionPhase === 'terminated') setDigitalElapsed(prev => prev);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionPhase]);

  // Effect: Watch for first segment start
  useEffect(() => {
    if (sessionPhase === 'in_session' && currentSegmentIndex === 0) {
      startElapsedTimer();
    }
    if (sessionPhase === 'not_started') {
      setElapsedSeconds(0);
      stopElapsedTimer();
    }
    if (sessionPhase === 'terminated') {
      stopElapsedTimer();
    }
    return () => stopElapsedTimer();
  }, [sessionPhase, currentSegmentIndex]);

  // --- AppState change effect (pause on background) ---
  useEffect(() => {
    const handleAppState = async (nextAppState: AppStateStatus) => {
      if (
        (nextAppState === 'inactive' || nextAppState === 'background') &&
        (sessionPhase === 'in_session' || sessionPhase === 'preparation')
      ) {
        setSessionPhase('paused');
        timerManagerRef.current?.pauseTimers();
        await audioOrchestratorRef.current?.pauseMeditationSound();
        await audioOrchestratorRef.current?.pauseSegmentationSound();
        await osIntegrationManager.deactivateKeepAwakeIfNeeded(
          lockedSettings?.keepScreenOn ?? false
        );
        await osIntegrationManager.deactivateDndIfNeeded(
          lockedSettings?.dndEnabled ?? false
        );
      }
      appState.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
    };
    // eslint-disable-next-line
  }, [sessionPhase, lockedSettings]);

  // --- Navigation back event handling (system back) ---
  useEffect(() => {
    const beforeRemove = (e: any) => {
      e.preventDefault();
      setShowTerminateDialog(true);
    };
    navigation.addListener('beforeRemove', beforeRemove);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowTerminateDialog(true);
      return true;
    });

    return () => {
      navigation.removeListener('beforeRemove', beforeRemove);
      backHandler.remove();
    };
    // eslint-disable-next-line
  }, []);

  // --- Cleanup all resources on unmount ---
  useEffect(() => {
    return () => {
      handleSessionWindowCleanup();
    };
    // eslint-disable-next-line
  }, []);

  //Elapsed Timer
  function startElapsedTimer() {
    if (elapsedIntervalRef.current) return; // Already running!
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedSeconds((secs) => secs + 1);
    }, 1000);
  }

  function stopElapsedTimer() {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
  }


  // --- Session Control Handlers ---
  const handleStartSession = useCallback(async () => {
    if (!lockedConfig || !lockedSettings) return;
    timerManagerRef.current = new MeditationSessionTimerManager(
      lockedConfig,
      lockedSettings,
      handleSegmentEnd
    );
    audioOrchestratorRef.current = new SessionAudioOrchestrator(
      lockedConfig,
      (msg: string) => setPlaybackErrorDialog(msg)
    );
    timerManagerRef.current.startTimers();
    await audioOrchestratorRef.current.playMeditationSound();
    osIntegrationManager.activateKeepAwakeIfNeeded(lockedSettings.keepScreenOn);
    await osIntegrationManager.activateDndIfNeeded(lockedSettings.dndEnabled);

    // Here is the fix:
    if (lockedConfig.preparationTime > 0) {
      setSessionPhase('preparation');
      setCurrentSegmentIndex(-1);
    } else {
      setSessionPhase('in_session');
      setCurrentSegmentIndex(0);
    }
    setResetKey(k => k + 1);
  }, [lockedConfig, lockedSettings]);


  const handlePauseSession = useCallback(async () => {
    timerManagerRef.current?.pauseTimers();
    await audioOrchestratorRef.current?.pauseMeditationSound();
    await audioOrchestratorRef.current?.pauseSegmentationSound();
    await osIntegrationManager.deactivateKeepAwakeIfNeeded(
      lockedSettings?.keepScreenOn ?? false
    );
    await osIntegrationManager.deactivateDndIfNeeded(
      lockedSettings?.dndEnabled ?? false
    );
    setSessionPhase('paused');
  }, [lockedSettings]);

  const handleContinueSession = useCallback(async () => {
    timerManagerRef.current?.resumeTimers();
    await audioOrchestratorRef.current?.resumeMeditationSound();
    await audioOrchestratorRef.current?.resumeSegmentationSound();
    osIntegrationManager.activateKeepAwakeIfNeeded(
      lockedSettings?.keepScreenOn ?? false
    );
    await osIntegrationManager.activateDndIfNeeded(
      lockedSettings?.dndEnabled ?? false
    );
    setSessionPhase(
      lockedConfig?.preparationTime && currentSegmentIndex === -1
        ? 'preparation'
        : 'in_session'
    );
    setResetKey(k => k + 1);
  }, [lockedSettings, lockedConfig, currentSegmentIndex]);

  async function handleSegmentEnd() {
    if (!lockedConfig) return;
    let nextIndex = currentSegmentIndex + 1;

    // Preparation phase ends, start first segment
    if (currentSegmentIndex === -1 && lockedConfig.segments.length > 0) {
      nextIndex = 0;
      setSessionPhase('in_session');
      setCurrentSegmentIndex(nextIndex);
      setResetKey(k => k + 1);
      await audioOrchestratorRef.current?.playSegmentationSound();
      return;
    }

    // Last segment finished: terminate session
    if (nextIndex >= lockedConfig.segments.length) {
      // Cleanup timers/audio & mark session as terminated
      timerManagerRef.current?.cleanup();
      await audioOrchestratorRef.current?.stopAndUnloadMeditationSound();
      await audioOrchestratorRef.current?.stopAndUnloadSegmentationSound();
      await osIntegrationManager.deactivateKeepAwakeIfNeeded(
        lockedSettings?.keepScreenOn ?? false
      );
      await osIntegrationManager.deactivateDndIfNeeded(
        lockedSettings?.dndEnabled ?? false
      );
      setSessionPhase('terminated');
      setCurrentSegmentIndex(lockedConfig.segments.length - 1);
      setResetKey(k => k + 1);
      // Optionally: play "session end" sound here
      return;
    }

    // Go to next segment
    setCurrentSegmentIndex(nextIndex);
    setResetKey(k => k + 1);
    await audioOrchestratorRef.current?.playSegmentationSound();
  }



  async function finishSession() {
    timerManagerRef.current?.cleanup();
    await audioOrchestratorRef.current?.stopAndUnloadMeditationSound();
    await audioOrchestratorRef.current?.stopAndUnloadSegmentationSound();
    await osIntegrationManager.deactivateKeepAwakeIfNeeded(
      lockedSettings?.keepScreenOn ?? false
    );
    await osIntegrationManager.deactivateDndIfNeeded(
      lockedSettings?.dndEnabled ?? false
    );
    setSessionPhase('terminated');
    setResetKey(k => k + 1);          // put arc in “ended” gold state
  }

  function handlePlaybackErrorDialogDismiss() {
    setPlaybackErrorDialog(null);
  }

  function handleBackPress() {
    setShowTerminateDialog(true);
  }

  function handleBeforeRemove(event: any) {
    event.preventDefault();
    setShowTerminateDialog(true);
  }

  async function handleSessionTerminateConfirm() {
    setSessionPhase('terminated');
    timerManagerRef.current?.cleanup();
    await audioOrchestratorRef.current?.stopAndUnloadMeditationSound();
    await audioOrchestratorRef.current?.stopAndUnloadSegmentationSound();
    await osIntegrationManager.deactivateKeepAwakeIfNeeded(
      lockedSettings?.keepScreenOn ?? false
    );
    await osIntegrationManager.deactivateDndIfNeeded(
      lockedSettings?.dndEnabled ?? false
    );
    if (
      lockedConfig &&
      digitalElapsed > 0 &&
      sessionPhase !== 'not_started'
    ) {
      const timestamp = new Date().toISOString();
      LogStateStore.getState().addMeditationLog({
        timestamp,
        duration: digitalElapsed,
      });
    }
    setShowTerminateDialog(false);
    navigation.goBack();
  }

  function handleSessionTerminateCancel() {
    setShowTerminateDialog(false);
  }

  async function handleSessionWindowCleanup() {
    timerManagerRef.current?.cleanup();
    await audioOrchestratorRef.current?.stopAndUnloadMeditationSound();
    await audioOrchestratorRef.current?.stopAndUnloadSegmentationSound();
    await osIntegrationManager.deactivateKeepAwakeIfNeeded(
      lockedSettings?.keepScreenOn ?? false
    );
    await osIntegrationManager.deactivateDndIfNeeded(
      lockedSettings?.dndEnabled ?? false
    );
  }

  function renderTimerDisplay() {
    const roundValue = timerManagerRef.current?.getRoundTimerValue() ?? (lockedConfig?.preparationTime ?? 0);
    const totalSegments = lockedConfig?.segments.length ?? 0;
    let roundLabel;
    if (sessionPhase === 'preparation') {
      roundLabel = 'Preparation';
    } else if (
      sessionPhase === 'in_session' &&
      currentSegmentIndex >= 0 &&
      currentSegmentIndex < totalSegments
    ) {
      roundLabel = `Segment ${currentSegmentIndex + 1}`;
    } else if (sessionPhase === 'paused') {
      roundLabel = 'Paused';
    } else {
      roundLabel = '';
    }
    return (
      <View style={styles.timerBlock}>
        <Text style={styles.timerRoundLabel}>{roundLabel}</Text>
        <Text style={styles.timerRoundValue}>{roundValue}s</Text>
        <Text style={styles.timerDigitalLabel}>Elapsed</Text>
        <Text style={styles.timerDigitalValue}>{elapsedSeconds}s</Text>

      </View>
    );
  }

  function renderSessionControls() {
    // Default: hide button if nothing loaded
    if (!lockedConfig) return null;

    // Not started: Start button, green
    if (sessionPhase === 'not_started') {
      const hasPreparation = lockedConfig?.preparationTime && lockedConfig.preparationTime > 0;
      return (
        <Button
          mode="contained"
          onPress={handleStartSession}
          style={[styles.controlButton, { backgroundColor: hasPreparation ? '#39e622' : '#42a5f5' }]} // green. blue
        >
          {hasPreparation ? 'Preparation' : 'Start'}
        </Button>
      );
    }


    // Preparation or paused during preparation
    if (
      (sessionPhase === 'preparation') ||
      (sessionPhase === 'paused' && currentSegmentIndex === -1)
    ) {
      return (
        <Button
          mode="contained"
          onPress={
            sessionPhase === 'preparation'
              ? handlePauseSession
              : handleContinueSession
          }
          style={[
            styles.controlButton,
            { backgroundColor: '#e53935' }, // red
          ]}
        >
          {sessionPhase === 'preparation' ? 'Pause' : 'Resume'}
        </Button>
      );
    }

    // In session or paused during session
    if (
      sessionPhase === 'in_session' ||
      (sessionPhase === 'paused' && currentSegmentIndex >= 0)
    ) {
      return (
        <Button
          mode="contained"
          onPress={
            sessionPhase === 'in_session'
              ? handlePauseSession
              : handleContinueSession
          }
          style={[
            styles.controlButton,
            { backgroundColor: sessionPhase === 'paused' ? '#e53935' : '#42a5f5' },// red , blue
          ]}
        >
          {sessionPhase === 'in_session' ? 'Pause' : 'Resume'}
        </Button>
      );
    }

    // Ended: green terminate button
    if (sessionPhase === 'terminated') {
      return (
        <Button
          mode="contained"
          onPress={handleSessionTerminateConfirm}
          style={[styles.controlButton, { backgroundColor: '#39e622' }]} // green
        >
          Terminate
        </Button>
      );
    }

    return null;
  }

  function getArcProgress() {
    if (!lockedConfig) return 0;
    if (sessionPhase === 'paused') return lastArcProgress;
    if (sessionPhase === 'preparation' && lockedConfig.preparationTime > 0) {
      const total = lockedConfig.preparationTime;
      const remaining = timerManagerRef.current?.getRoundTimerValue?.() ?? total;
      const elapsed = total - remaining;
      return Math.max(0, Math.min(1, elapsed / total));
    }
    if (
      sessionPhase === 'in_session' &&
      currentSegmentIndex >= 0 &&
      lockedConfig.segments &&
      currentSegmentIndex < lockedConfig.segments.length
    ) {
      const total = lockedConfig.segments[currentSegmentIndex].duration;
      const remaining = timerManagerRef.current?.getRoundTimerValue?.() ?? total;
      const elapsed = total - remaining;
      return Math.max(0, Math.min(1, elapsed / total));
    }
    if (sessionPhase === 'terminated') return 1;
    return 0;
  }


  useEffect(() => {
    // Only run this if we just entered 'paused'
    if (sessionPhase === 'paused' && prevSessionPhase.current !== 'paused') {
      // Get progress based on the phase we just left!
      let progress = 0;
      if (prevSessionPhase.current === 'preparation' && lockedConfig?.preparationTime) {
        const total = lockedConfig.preparationTime;
        const remaining = timerManagerRef.current?.getRoundTimerValue?.() ?? total;
        const elapsed = total - remaining;
        progress = Math.max(0, Math.min(1, elapsed / total));
      } else if (prevSessionPhase.current === 'in_session' && lockedConfig?.segments && currentSegmentIndex >= 0) {
        const total = lockedConfig.segments[currentSegmentIndex].duration;
        const remaining = timerManagerRef.current?.getRoundTimerValue?.() ?? total;
        const elapsed = total - remaining;
        progress = Math.max(0, Math.min(1, elapsed / total));
      }
      setLastArcProgress(progress);
    }
    prevSessionPhase.current = sessionPhase;
    // eslint-disable-next-line
  }, [sessionPhase, lockedConfig, currentSegmentIndex]);


  // Timer rendering
  let svgDuration = 0;
  if (sessionPhase === 'preparation') {
    svgDuration = (lockedConfig?.preparationTime ?? 0) * 1000;
  } else if (
    sessionPhase === 'in_session' &&
    lockedConfig &&
    currentSegmentIndex >= 0 &&
    currentSegmentIndex < lockedConfig.segments.length
  ) {
    svgDuration = lockedConfig.segments[currentSegmentIndex].duration * 1000;
  }


  //Show/hide overlay
  const handleShowOverlay = () => {
    setShowDarkOverlay(true);
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  };

  const handleHideOverlay = () => {
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 700,
      useNativeDriver: true,
    }).start(() => setShowDarkOverlay(false));
  };


  return (
    <View style={styles.container}>
      {showDarkOverlay && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            opacity: overlayOpacity,
            zIndex: 9999,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleHideOverlay}
        />
      )}
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBackPress} accessibilityLabel="Back" />
        <Appbar.Content title={lockedConfig?.name ?? 'Meditation Session'} />
      </Appbar.Header>
      <View style={{paddingTop:120}}>
      <SessionCentralAnimation
        key={resetKey}                   // Force animation reset when key changes
        progress={getArcProgress()}
        isPaused={sessionPhase === 'paused'}
        isEnded={sessionPhase === 'terminated'}
        size={arcSize}
      >
        {renderTimerDisplay()}

        <View style={styles.controlsRow}>{renderSessionControls()}</View>
      </SessionCentralAnimation>
      <View style={{ position: 'absolute', bottom: 1, left: 0, right: 0, alignItems: 'center' }}>
        <Button mode="contained" onPress={handleShowOverlay}>
          Go Dark
        </Button>
      </View>
      </View>
      <Portal>
        {/* Terminate Session Dialog */}
        <Dialog visible={showTerminateDialog} onDismiss={handleSessionTerminateCancel}>
          <Dialog.Title>End Session?</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to terminate this meditation session?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSessionTerminateCancel}>Cancel</Button>
            <Button color="red" onPress={handleSessionTerminateConfirm}>
              End Session
            </Button>
          </Dialog.Actions>
        </Dialog>
        {/* Playback Error Dialog */}
        <Dialog visible={!!playbackErrorDialog} onDismiss={handlePlaybackErrorDialogDismiss}>
          <Dialog.Title>Playback Error</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{playbackErrorDialog}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handlePlaybackErrorDialogDismiss}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#FAFAFA',
  },
  timerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  timerRoundLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 2,
  },
  timerRoundValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  timerDigitalLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  timerDigitalValue: {
    fontSize: 20,
    color: '#111',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 16,
  },
  controlButton: {
    marginHorizontal: 12,
    minWidth: 120,
  },
});
