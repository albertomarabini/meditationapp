// /src/delegates/SettingsSharingExportHandler.ts

import Share from 'react-native-share';
import * as FileSystem from 'expo-file-system';
import { Linking } from 'react-native';
import YAML from 'js-yaml';
import type { DiaryEntry } from '../models/domain';

const APP_SHARE_MESSAGE =
  "Check out this meditation app to support your mindful routine! Download it from the Play Store: https://play.google.com/store/apps/details?id=com.yourmeditation.app";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.yourmeditation.app";

export class SettingsSharingExportHandler {
  isSharing: boolean = false;
  sharingType: 'app' | 'diary' | 'statistics' | null = null;

  /**
   * Serializes diary entries to YAML and opens the sharing dialog.
   * @param diaryEntries Array of DiaryEntry objects to export.
   * @param onError Callback invoked with error message on failure.
   */
  async exportDiary(
    diaryEntries: DiaryEntry[],
    onError: (msg: string) => void
  ): Promise<void> {
    this.isSharing = true;
    this.sharingType = 'diary';
    try {
      const exportObj = {
        diary_entries: diaryEntries.map(entry => ({
          timestamp: entry.timestamp,
          content: entry.content,
        })),
      };
      const yaml = YAML.dump(exportObj);

      // Write YAML to a temporary file
      const fileName = `diary-export-${Date.now()}.yml`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, yaml, { encoding: FileSystem.EncodingType.UTF8 });

      // Share the file
      await Share.open({
        url: fileUri,
        type: 'text/yaml',
        title: 'Export Diary Entries',
        failOnCancel: false,
      });
    } catch (e: any) {
      onError('Failed to export diary entries: ' + (e?.message ?? e));
    }
    this.isSharing = false;
    this.sharingType = null;
  }

  /**
   * Opens the share dialog for the app with a pre-filled message.
   * @param onError Callback invoked with error message on failure.
   */
  async shareApp(onError: (msg: string) => void): Promise<void> {
    this.isSharing = true;
    this.sharingType = 'app';
    try {
      await Share.open({//[ts] Property 'open' does not exist on type 'typeof import("c:/Users/User/Documents/bk/Waldi/MeditationApp/node_modules/react-native-share/lib/typescript/index")'.
        title: 'Share App',
        message: APP_SHARE_MESSAGE,
      });
    } catch (e: any) {
      if (e?.message && e.message !== 'User did not share') {
        onError('Failed to share app: ' + e.message);
      }
    }
    this.isSharing = false;
    this.sharingType = null;
  }

  /**
   * Opens the platform-specific Play Store URL for rating.
   * @param onError Callback invoked with error message on failure.
   */
  async rateUs(onError: (msg: string) => void): Promise<void> {
    try {
      await Linking.openURL(PLAY_STORE_URL);
    } catch (e: any) {
      onError('Failed to open store: ' + (e?.message ?? e));
    }
  }
}


// // /src/delegates/SettingsSharingExportHandler.debug.ts

// import { Linking } from 'react-native';
// import YAML from 'js-yaml';
// import type { DiaryEntry } from '../models/domain';

// // Debug constants (same as real)
// const APP_SHARE_MESSAGE =
//   "Check out this meditation app to support your mindful routine! Download it from the Play Store: https://play.google.com/store/apps/details?id=com.yourmeditation.app";
// const PLAY_STORE_URL =
//   "https://play.google.com/store/apps/details?id=com.yourmeditation.app";

// // Debug/mock version of the handler
// export class SettingsSharingExportHandler {
//   isSharing: boolean = false;
//   sharingType: 'app' | 'diary' | 'statistics' | null = null;

//   async exportDiary(
//     diaryEntries: DiaryEntry[],
//     onError: (msg: string) => void
//   ): Promise<void> {
//     this.isSharing = true;
//     this.sharingType = 'diary';
//     try {
//       // Simulate YAML export, just for the log:
//       const exportObj = {
//         diary_entries: diaryEntries.map(entry => ({
//           timestamp: entry.timestamp,
//           content: entry.content,
//         })),
//       };
//       const yaml = YAML.dump(exportObj);
//       // Instead of sharing, just log:
//       console.log('[DEBUG] Would export diary entries:', yaml);
//       // You can simulate a delay if needed
//       // await new Promise(res => setTimeout(res, 300));
//     } catch (e: any) {
//       onError('Failed to export diary entries (debug): ' + (e?.message ?? e));
//     }
//     this.isSharing = false;
//     this.sharingType = null;
//   }

//   async shareApp(onError: (msg: string) => void): Promise<void> {
//     this.isSharing = true;
//     this.sharingType = 'app';
//     try {
//       // Instead of Share.open, just log the share attempt
//       console.log('[DEBUG] Would share app with message:', APP_SHARE_MESSAGE);
//     } catch (e: any) {
//       onError('Failed to share app (debug): ' + (e?.message ?? e));
//     }
//     this.isSharing = false;
//     this.sharingType = null;
//   }

//   async rateUs(onError: (msg: string) => void): Promise<void> {
//     try {
//       // Optional: Open the URL if Linking still exists, or just log
//       console.log('[DEBUG] Would open store URL:', PLAY_STORE_URL);
//       // await Linking.openURL(PLAY_STORE_URL); // or skip in pure debug
//     } catch (e: any) {
//       onError('Failed to open store (debug): ' + (e?.message ?? e));
//     }
//   }
// }
