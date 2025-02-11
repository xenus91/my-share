// theme.ts
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      // Primary/Синий
      main: '#003C96',
      // Primary/Солнечный можно использовать как light вариант
      light: '#FFB900',
    },
    secondary: {
      // Secondary/Темно синий
      main: '#001E64',
      // Дополнительные цвета можно добавить через расширение темы (custom keys)
      buttonPressed: '#FC9700',  // Secondary/ButtonPressed
      grass: '#00BE64',          // Secondary/Травяной
      extraBlue: '#2FCBFF',       // Secondary/Доп голубой
    },
    error: {
      main: '#E05225',           // Error/Ошибка
    },
    background: {
      default: '#FAFAFA',        // Grayscale/Дополнительный(2)
      paper: '#FFFFFF',          // Grayscale/Белый
    },
    text: {
      primary: '#000000',        // Grayscale/Черный
      secondary: '#4D4D4D',      // Grayscale/Антрацит
    },
    divider: '#B5B5B5',          // Grayscale/Tab bar
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      // Primary/Синий Dark
      main: '#003C96',
      // Primary/Солнечный Dark
      light: '#FFB900',
    },
    secondary: {
      // Secondary/Темно синий Dark
      main: '#001E64',
      buttonPressed: '#FC9700',  // Secondary/Button Pressed Dark
      grass: '#00BE64',          // Secondary/Травяной Dark
      extraBlue: '#2FCBFF',       // Secondary/Доп голубой Dark
    },
    error: {
      main: '#E05225',           // Error/Ошибка Dark
    },
    background: {
      // Grayscale/Фоновый Dark
      default: '#2B2B2B',
      // Для бумаги можно использовать другой оттенок – например, оставить светлее
      paper: '#FAFAFA',
    },
    text: {
      primary: '#FFFFFF',        // Основной текст белый
      secondary: '#4D4D4D',      // Grayscale/Антрацит Dark (можно скорректировать по необходимости)
    },
    divider: '#232222',          // Grayscale/Tab bar Dark или Темный дополнительный
  },
});
