// src/delegates/MeditationSessionTimerManager.ts

import type { SessionTimer, Settings } from '../models/domain';

type SessionPhase = 'not_started' | 'preparation' | 'in_session' | 'paused' | 'terminated';

export class MeditationSessionTimerManager {
  private sessionConfig: SessionTimer;
  private lockedSettings: Settings;
  private onSegmentEnd: () => void;

  private roundTimerRef: ReturnType<typeof setInterval> | null;
  private digitalTimerRef: ReturnType<typeof setInterval> | null;
  private currentSegmentIndex: number;
  private phase: SessionPhase;
  private roundTimerValue: number;
  private digitalElapsed: number;

  constructor(
    sessionConfig: SessionTimer,
    lockedSettings: Settings,
    onSegmentEnd: () => void
  ) {
    this.sessionConfig = sessionConfig;
    this.lockedSettings = lockedSettings;
    this.onSegmentEnd = onSegmentEnd;
    this.roundTimerRef = null;
    this.digitalTimerRef = null;
    this.currentSegmentIndex =
      sessionConfig.preparationTime > 0 ? -1 : 0;
    this.phase =
      sessionConfig.preparationTime > 0 ? 'preparation' : 'in_session';
    this.roundTimerValue =
      sessionConfig.preparationTime > 0
        ? sessionConfig.preparationTime
        : sessionConfig.segments[0].duration;
    this.digitalElapsed = 0;
  }

  startTimers(): void {
    this.digitalTimerRef = setInterval(() => {
      this.digitalElapsed += 1;
    }, 1000);

    const roundDuration =
      this.currentSegmentIndex === -1
        ? this.sessionConfig.preparationTime
        : this.sessionConfig.segments[this.currentSegmentIndex].duration;

    this.roundTimerRef = setInterval(() => {
      if (this.lockedSettings.countUp) {
        if (this.roundTimerValue >= roundDuration) {
          this.clearRoundTimer();
          this.onSegmentEnd();
        } else {
          this.roundTimerValue += 1;
        }
      } else {
        if (this.roundTimerValue <= 0) {
          this.clearRoundTimer();
          this.onSegmentEnd();
        } else {
          this.roundTimerValue -= 1;
        }
      }
    }, 1000);
  }

  pauseTimers(): void {
    if (this.roundTimerRef) {
      clearInterval(this.roundTimerRef);
      this.roundTimerRef = null;
    }
    if (this.digitalTimerRef) {
      clearInterval(this.digitalTimerRef);
      this.digitalTimerRef = null;
    }
  }

  resumeTimers(): void {
    this.startTimers();
  }

  resetTimers(): void {
    this.pauseTimers();
    this.currentSegmentIndex =
      this.sessionConfig.preparationTime > 0 ? -1 : 0;
    this.phase =
      this.sessionConfig.preparationTime > 0 ? 'preparation' : 'in_session';
    this.roundTimerValue =
      this.sessionConfig.preparationTime > 0
        ? this.sessionConfig.preparationTime
        : this.sessionConfig.segments[0].duration;
    this.digitalElapsed = 0;
  }

  cleanup(): void {
    this.pauseTimers();
  }

  getCurrentPhase(): SessionPhase {
    return this.phase;
  }

  getCurrentSegmentIndex(): number {
    return this.currentSegmentIndex;
  }

  getRoundTimerValue(): number {
    return this.roundTimerValue;
  }

  getDigitalElapsed(): number {
    return this.digitalElapsed;
  }

  setPhase(phase: SessionPhase): void {
    this.phase = phase;
  }

  setCurrentSegmentIndex(idx: number): void {
    this.currentSegmentIndex = idx;
  }

  private clearRoundTimer(): void {
    if (this.roundTimerRef) {
      clearInterval(this.roundTimerRef);
      this.roundTimerRef = null;
    }
  }
}
