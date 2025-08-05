import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { useAppTheme } from '../theme';

export default function TabsLayout() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName = "home";

          if (route.name === "home") iconName = "home-outline";
          else if (route.name === "Calendrier") iconName = "calendar-outline";
          else if (route.name === "ToDo") iconName = "checkbox-outline";
          else if (route.name === "mail") iconName = "mail-outline";
          else if (route.name === "Ressources") iconName = "document-text-outline";

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: isDark ? "#fff" : "tomato",
        tabBarInactiveTintColor: isDark ? "#aaa" : "gray",
        tabBarStyle: {
          backgroundColor: isDark ? "#121212" : "#fff",
        },
        headerStyle: {
          backgroundColor: isDark ? "#121212" : "#fff",
        },
        headerTitleStyle: {
          color: isDark ? "#fff" : "#000",
        },
      })}
    />
  );
}