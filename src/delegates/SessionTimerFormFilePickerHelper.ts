import * as DocumentPicker from 'expo-document-picker';
import type { SoundOrigin } from '../models/domain';

/**
 * Encapsulates all logic for audio file picking for the SessionTimerForm.
 * Used exclusively for Segmentation Sound and Meditation Sound selection.
 */
export class SessionTimerFormFilePickerHelper {
  /**
   * Launches the Expo DocumentPicker for audio files to pick a segmentation sound.
   * Calls onPicked with { uri } if successful, onCancel otherwise.
   */
  async pickSegmentationSound(
    onPicked: (selection: { uri: string }) => void,
    onCancel: () => void
  ): Promise<void> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onPicked({ uri: result.assets[0].uri });
    } else {
      onCancel();
    }
  }

  /**
   * Launches the Expo DocumentPicker for audio files to pick a meditation sound.
   * The origin argument is accepted for API completeness, but always uses DocumentPicker in Expo Go.
   * Calls onPicked with { uri } if successful, onCancel otherwise.
   */
  async pickMeditationSound(
    origin: SoundOrigin,
    onPicked: (selection: { uri: string }) => void,
    onCancel: () => void
  ): Promise<void> {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: false,
      multiple: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onPicked({ uri: result.assets[0].uri });
    } else {
      onCancel();
    }
  }
}
