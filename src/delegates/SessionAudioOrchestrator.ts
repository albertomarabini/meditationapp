// src/delegates/SessionAudioOrchestrator.ts

import { Audio, AVPlaybackStatus } from 'expo-av';
import type { SessionTimer } from '../models/domain';

type PlaybackType = 'meditation' | 'segmentation';

export class SessionAudioOrchestrator {
  private config: SessionTimer;
  private onError: (msg: string) => void;

  private meditationSoundRef: Audio.Sound | null;
  private segmentationSoundRef: Audio.Sound | null;
  private meditationSoundRepetitionCount: number;
  private segmentationSoundPlayCount: number;
  private isSoundEnabled: boolean;

  constructor(config: SessionTimer, onError: (msg: string) => void) {
    this.config = config;
    this.onError = onError;
    this.meditationSoundRef = null;
    this.segmentationSoundRef = null;
    this.meditationSoundRepetitionCount = 0;
    this.segmentationSoundPlayCount = 0;
    this.isSoundEnabled = true;
  }

  async playMeditationSound(): Promise<void> {
    if (!this.isSoundEnabled) return;
    const medSound = this.config.meditationSound;
    if (!medSound?.uri) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: medSound.uri },
        {
          volume: medSound.volume / 5,
          isLooping: medSound.repetitionType === 'forever',
          shouldPlay: true,
        }
      );
      this.meditationSoundRef = sound;
      this.meditationSoundRepetitionCount = 0;
      sound.setOnPlaybackStatusUpdate((status) => {
        this.handlePlaybackStatusUpdate(status, 'meditation');
      });
      await sound.playAsync();
    } catch (e: any) {
      this.onError(`Meditation sound playback error: ${e?.message || String(e)}`);
    }
  }

  async pauseMeditationSound(): Promise<void> {
    if (this.meditationSoundRef) {
      try {
        await this.meditationSoundRef.pauseAsync();
      } catch {}
    }
  }

  async resumeMeditationSound(): Promise<void> {
    if (this.meditationSoundRef) {
      try {
        await this.meditationSoundRef.playAsync();
      } catch {}
    }
  }

  async stopAndUnloadMeditationSound(): Promise<void> {
    if (this.meditationSoundRef) {
      try {
        await this.meditationSoundRef.stopAsync();
        await this.meditationSoundRef.unloadAsync();
      } catch {}
      this.meditationSoundRef = null;
    }
  }

  async playSegmentationSound(): Promise<void> {
    if (!this.isSoundEnabled) return;
    const segSound = this.config.segmentationSound;
    if (!segSound?.uri) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: segSound.uri },
        {
          volume: segSound.volume / 5,
          shouldPlay: true,
        }
      );
      this.segmentationSoundRef = sound;
      this.segmentationSoundPlayCount = 1;
      sound.setOnPlaybackStatusUpdate((status) => {
        this.handlePlaybackStatusUpdate(status, 'segmentation');
      });
      await sound.playAsync();
    } catch (e: any) {
      this.onError(`Segmentation sound playback error: ${e?.message || String(e)}`);
    }
  }

  async pauseSegmentationSound(): Promise<void> {
    if (this.segmentationSoundRef) {
      try {
        await this.segmentationSoundRef.pauseAsync();
      } catch {}
    }
  }

  async resumeSegmentationSound(): Promise<void> {
    if (this.segmentationSoundRef) {
      try {
        await this.segmentationSoundRef.playAsync();
      } catch {}
    }
  }

  async stopAndUnloadSegmentationSound(): Promise<void> {
    if (this.segmentationSoundRef) {
      try {
        await this.segmentationSoundRef.stopAsync();
        await this.segmentationSoundRef.unloadAsync();
      } catch {}
      this.segmentationSoundRef = null;
    }
  }

  setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
    if (!enabled) {
      this.stopAndUnloadMeditationSound();
      this.stopAndUnloadSegmentationSound();
    }
  }

  isSoundActive(): boolean {
    return this.isSoundEnabled;
  }

  async handlePlaybackStatusUpdate(
    status: AVPlaybackStatus,
    type: PlaybackType
  ): Promise<void> {
    // @ts-ignore
    if (!status.isLoaded || status.error) {
      // @ts-ignore
      this.onError(status.error || 'Unknown audio error');
      return;
    }
    // @ts-ignore
    if (status.didJustFinish) {
      if (type === 'segmentation') {
        const segSound = this.config.segmentationSound;
        if (
          segSound &&
          this.segmentationSoundPlayCount < segSound.repetition
        ) {
          this.segmentationSoundPlayCount += 1;
          try {
            await this.segmentationSoundRef?.replayAsync();
          } catch (e: any) {
            this.onError(`Segmentation sound replay error: ${e?.message || String(e)}`);
          }
        } else {
          try {
            await this.segmentationSoundRef?.unloadAsync();
          } catch {}
          this.segmentationSoundRef = null;
        }
      } else if (type === 'meditation') {
        const medSound = this.config.meditationSound;
        if (
          medSound &&
          medSound.repetitionType === 'count' &&
          this.meditationSoundRepetitionCount + 1 < (medSound.repetitionCount || 0)
        ) {
          this.meditationSoundRepetitionCount += 1;
          try {
            await this.meditationSoundRef?.replayAsync();
          } catch (e: any) {
            this.onError(`Meditation sound replay error: ${e?.message || String(e)}`);
          }
        } else {
          try {
            await this.meditationSoundRef?.unloadAsync();
          } catch {}
          this.meditationSoundRef = null;
        }
      }
    }
  }
}
