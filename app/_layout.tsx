import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { ThemeProvider, useAppTheme } from './theme';

function InnerLayout() {
  const { theme } = useAppTheme();
  const navTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <NavigationThemeProvider value={navTheme}>
      <Stack />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}
