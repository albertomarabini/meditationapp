// import React, { useState, useCallback } from 'react';//[ts] '"react"' has no exported member named 'useCallback'. Did you mean 'RefCallback'?
// import { View, StyleSheet, Platform } from 'react-native';
// import { useSettingsStore } from '../store/SettingsStore';
// import {
//   BannerAd,
//   BannerAdSize,
//   GAMBannerAd,
//   AdEventType,
//   TestIds,
// } from 'react-native-google-mobile-ads';

// const BANNER_HEIGHT = 50;
// const TEST_AD_UNIT_ID = TestIds.BANNER; // replace with real one for prod

// export type AdBannerProps = {
//   onAdLoad?: () => void;
//   onAdError?: (error: Error) => void;
// };

// /**
//  * Renders persistent ad banner using react-native-google-mobile-ads.
//  * Conditionally displays banner based on adsFreePurchased from SettingsStore.
//  * Handles ad banner load/error events and preserves layout with a placeholder if ad load fails.
//  */
// export function AdBanner({ onAdLoad, onAdError }: AdBannerProps) {
//   const adsFreePurchased = useSettingsStore((state) => state.settings.adsFreePurchased);
//   const [adError, setAdError] = useState(false);

//   const handleAdEvent = useCallback(
//     (type: AdEventType, error?: Error) => {
//       if (type === AdEventType.LOADED) {
//         onAdLoad?.();
//       } else if (type === AdEventType.ERROR && error) {
//         setAdError(true);
//         onAdError?.(error instanceof Error ? error : new Error(String(error)));
//       }
//     },
//     [onAdLoad, onAdError]
//   );

//   if (adsFreePurchased) return null;
//   if (adError) return <View style={styles.bannerPlaceholder} />;

//   return (
//     <View style={styles.bannerContainer} pointerEvents="box-none">
//       <BannerAd
//         unitId={TEST_AD_UNIT_ID}
//         size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}//[ts] Property 'SMART_BANNER' does not exist on type 'typeof BannerAdSize'.
//         requestOptions={{
//           requestNonPersonalizedAdsOnly: false,
//         }}
//         onAdLoaded={() => handleAdEvent(AdEventType.LOADED)}
//         onAdFailedToLoad={(error) => handleAdEvent(AdEventType.ERROR, error)}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   bannerContainer: {
//     width: '100%',
//     alignItems: 'center',
//     justifyContent: 'flex-end',
//     backgroundColor: '#fff',
//     height: BANNER_HEIGHT,
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     zIndex: 100,
//   },
//   bannerPlaceholder: {
//     width: '100%',
//     height: BANNER_HEIGHT,
//     backgroundColor: '#fff',
//   },
// });



/*****************************************************
 *
 * Simulated class
 *
******************************************************/

import React, { useEffect } from 'react';//npx expo install
import { View, StyleSheet } from 'react-native';
import { useSettingsStore } from '../store/SettingsStore';

export const BANNER_HEIGHT = 50;

export type AdBannerProps = {
  onAdLoad?: () => void;
  onAdError?: (error: Error) => void;
};

/**
 * Simulated AdBanner for development or testing environments.
 * Maintains layout and simulates ad events without using native ad libraries.
 */
export function AdBanner({ onAdLoad, onAdError }: AdBannerProps) {
  const adsFreePurchased = useSettingsStore((state) => state.settings.adsFreePurchased);

  useEffect(() => {
    // Simulate ad loading success after 500ms
    const timer = setTimeout(() => {
      if (Math.random() < 0.9) {
        onAdLoad?.();
      } else {
        onAdError?.(new Error('Simulated ad load error'));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [onAdLoad, onAdError]);

  if (adsFreePurchased) return null;

  return (
    <View style={styles.bannerContainer} pointerEvents="box-none">
      <View style={styles.mockBanner} />
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    height: BANNER_HEIGHT,
    position: 'absolute',
    bottom: 0,
    left: 0,
    // zIndex: 100,
  },
  mockBanner: {
    width: '100%',
    height: BANNER_HEIGHT,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

