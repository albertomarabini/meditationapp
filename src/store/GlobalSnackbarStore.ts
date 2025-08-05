// store/snackbarStore.ts
import { create } from 'zustand';

type SnackbarStore = {
  visible: boolean;
  message: string;
  showSnackbar: (msg: string) => void;
  hideSnackbar: () => void;
};

export const useSnackbarStore = create<SnackbarStore>((set) => ({
  visible: false,
  message: '',
  showSnackbar: (message) => set({ visible: true, message }),
  hideSnackbar: () => set({ visible: false }),
}));
