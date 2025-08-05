import { DefaultTheme as PaperDefault, MD3DarkTheme as PaperDark } from 'react-native-paper';

export const Themes = {
    default: {
      ...PaperDefault,
      colors: {
        ...PaperDefault.colors,
        primary: '#673ab7',
        accent: '#03dac4',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#222222', // Navigation only!
        onSurface: '#222222', // <<<<<< KEY FIX
        onBackground: '#222222', // << optional for backgrounds
        placeholder: '#888',
      },
    },
    calm_blue: {
      ...PaperDefault,
      colors: {
        ...PaperDefault.colors,
        primary: '#1976d2',
        accent: '#81d4fa',
        background: '#e3f2fd',
        surface: '#bbdefb',
        text: '#1a237e',
        onSurface: '#1a237e', // <<<<<<
        onBackground: '#1a237e',
        placeholder: '#607d8b',
      },
    },
    midnight: {
      ...PaperDark,
      colors: {
        ...PaperDark.colors,
        primary: '#b8c6db',
        accent: '#fcb900',
        background: '#18192a',
        surface: '#24243e',
        text: '#ffffff',
        onSurface: '#ffffff',
        inverseOnSurface: '#000000',
        onBackground: '#ffffff',
        placeholder: '#bdbdbd',
        onSurfaceVariant: '#aaaaaa', // <<<<<< Menu item
        surfaceVariant:"#0d133d"
      },
    },
    sunrise: {
      ...PaperDefault,
      colors: {
        ...PaperDefault.colors,
        primary: '#ff9800',
        accent: '#ffd54f',
        background: '#fff8e1',
        surface: '#ffe0b2',
        text: '#8d5524',
        onSurface: '#8d5524', // <<<<<<
        onBackground: '#8d5524',
        placeholder: '#bcaaa4',
      },
    },
  };

