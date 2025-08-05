import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AdBanner } from '../components/AdBanner';

export type MainScreenAdBannerRendererProps = {
  adsFreePurchased: boolean;
  onAdLoad?: () => void;
  onAdError?: (error: Error) => void;
};

/**
 * Stateless delegate for rendering/hiding AdBanner based on adsFreePurchased.
 * Handles ad load/error events and layout for MainScreen.
 * Returns null if ads are removed, otherwise renders the AdBanner.
 */
export function MainScreenAdBannerRenderer({
  adsFreePurchased,
  onAdLoad,
  onAdError,
}: MainScreenAdBannerRendererProps): React.ReactElement | null {
  if (adsFreePurchased) return null;
  return (
    <View style={styles.bannerContainer} pointerEvents="box-none">
      <AdBanner onAdLoad={onAdLoad} onAdError={onAdError} />
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 100,
  },
});
