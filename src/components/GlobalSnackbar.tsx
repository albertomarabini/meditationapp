import { Snackbar } from 'react-native-paper';
import { useSnackbarStore } from '../store/GlobalSnackbarStore';
import { BANNER_HEIGHT } from './AdBanner';
import { SettingsStore } from '../store/SettingsStore';

export function GlobalSnackbar() {
  const visible = useSnackbarStore(state => state.visible);
  const message = useSnackbarStore(state => state.message);
  const hideSnackbar = useSnackbarStore(state => state.hideSnackbar);
  const adsFreePurchased = SettingsStore((state) => state.settings.adsFreePurchased);

  console.log("BANNER_HEIGHT", BANNER_HEIGHT, "adsFreePurchased", adsFreePurchased);
  return (
    <Snackbar
      visible={visible}
      onDismiss={hideSnackbar}
      style={{ marginBottom: ((adsFreePurchased)?0:BANNER_HEIGHT) + 20, zIndex: 100}}
      duration={3000}
    >
      {message}
    </Snackbar>
  );
}
