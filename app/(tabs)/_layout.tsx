import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';

          if (route.name === 'home') iconName = 'home-outline';
          else if (route.name === 'Calendrier') iconName = 'calendar-outline';
          else if (route.name === 'ToDo') iconName = 'checkbox-outline';
          else if (route.name === 'mail') iconName = 'mail-outline';
          else if (route.name === 'Ressources') iconName = 'document-text-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    />
  );
}
