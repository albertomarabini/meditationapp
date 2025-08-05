// import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
// import * as DoNotDisturb from 'react-native-do-not-disturb';

// export class SessionOSIntegrationManager {
//   activateKeepAwakeIfNeeded(keepScreenOn: boolean): void {
//     if (keepScreenOn) activateKeepAwake();
//   }

//   deactivateKeepAwakeIfNeeded(keepScreenOn: boolean): void {
//     if (keepScreenOn) deactivateKeepAwake();
//   }

//   async activateDndIfNeeded(dndEnabled: boolean): Promise<void> {
//     if (dndEnabled) {
//       await (DoNotDisturb as any).turnOn();
//     }
//   }

//   async deactivateDndIfNeeded(dndEnabled: boolean): Promise<void> {
//     if (dndEnabled) {
//       await (DoNotDisturb as any).turnOff();
//     }
//   }
// }
// DEBUG/MOCK version for SessionOSIntegrationManager
export class SessionOSIntegrationManager {
  activateKeepAwakeIfNeeded(keepScreenOn: boolean): void {
    // Debug: Do nothing (or log)
    console.log('DEBUG: activateKeepAwakeIfNeeded', keepScreenOn);
  }

  deactivateKeepAwakeIfNeeded(keepScreenOn: boolean): void {
    // Debug: Do nothing (or log)
    console.log('DEBUG: deactivateKeepAwakeIfNeeded', keepScreenOn);
  }

  async activateDndIfNeeded(dndEnabled: boolean): Promise<void> {
    // Debug: Do nothing (or log)
    console.log('DEBUG: activateDndIfNeeded', dndEnabled);
  }

  async deactivateDndIfNeeded(dndEnabled: boolean): Promise<void> {
    // Debug: Do nothing (or log)
    console.log('DEBUG: deactivateDndIfNeeded', dndEnabled);
  }
}
