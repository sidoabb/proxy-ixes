import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAppTheme } from '../theme';

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#121212' : '#fff',
    text: isDark ? '#f5f5f5' : '#000',
    secondaryText: isDark ? '#cccccc' : '#444',
    card: isDark ? '#1e1e1e' : '#fef3e2',
    event: isDark ? '#2a2a2a' : '#f1f1f1',
    border: isDark ? '#333' : '#e0e0e0',
    progressBackground: isDark ? '#333' : '#e0e0e0',
    progressText: isDark ? '#bbb' : '#444',
    sectionTitle: isDark ? '#f5f5f5' : '#222',
    shadowColor: isDark ? '#000' : '#000',
    countdown: isDark ? '#ff8a65' : '#c0392b',
    highlight: isDark ? '#ffd180' : '#d35400',
    barBackground: isDark ? '#424242' : '#e0e0e0',
    barFill: isDark ? '#81c784' : '#4caf50',
    borderLeft: isDark ? '#90caf9' : '#4e91fc',
    emptyText: isDark ? '#aaa' : '#666',
  };

  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(null);
  const [countdownDays, setCountdownDays] = useState(null);

  const schoolStart = moment("2025-09-01");
  const schoolEnd = moment("2026-05-15");
  const now = moment();
  const progress = Math.min(1, Math.max(0, now.diff(schoolStart) / schoolEnd.diff(schoolStart)));
  const progressPercent = Math.round(progress * 100);

  let color = '#4caf50';
  if (progress < 0.3) color = '#d32f2f';
  else if (progress < 0.6) color = '#ffa000';

  useEffect(() => {
    const loadEvents = async () => {
      const stored = await AsyncStorage.getItem('events');
      if (stored) {
        const all = JSON.parse(stored);
        const flat = Object.values(all).flat();
        const upcoming = flat
          .filter(ev => moment(ev.startDate).isAfter(moment()))
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        setEvents(upcoming.slice(0, 3));
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    if (events.length === 0) return;

    const interval = setInterval(() => {
      const diff = moment(events[0].startDate).diff(moment());
      const dur = moment.duration(diff);
      const text = `${dur.hours()}h ${dur.minutes()}min ${dur.seconds()}s`;
      setCountdown(text);
    }, 1000);

    return () => clearInterval(interval);
  }, [events]);

  useEffect(() => {
    const loadCountdown = async () => {
      try {
        const stored = await AsyncStorage.getItem("@countdowns");
        if (stored) {
          const list = JSON.parse(stored)
            .map(item => ({ title: item.title, date: new Date(item.date) }))
            .filter(item => item.date > new Date())
            .sort((a, b) => a.date - b.date);

          if (list.length > 0) {
            setNextCountdown(list[0]);
            const diff = Math.ceil((list[0].date - new Date()) / (1000 * 60 * 60 * 24));
            setCountdownDays(diff);
          }
        }
      } catch (err) {
        console.error("Erreur chargement compte à rebours :", err);
      }
    };

    loadCountdown();
  }, []);

  const renderEvent = ({ item }) => (
    <View style={styles.event}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventTime}>
        {moment(item.startDate).format("DD/MM HH:mm")}
      </Text>
      {item.location ? (
        <Text style={styles.eventLocation}>📍 {item.location}</Text>
      ) : null}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
    },
    profilePic: {
      width: 40,
      height: 35,
      borderRadius: 20,
      marginRight: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 20,
      color: colors.text,
    },
    nextCard: {
      backgroundColor: colors.card,
      padding: 18,
      borderRadius: 10,
      marginBottom: 30,
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 3,
      marginTop: 10,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.highlight,
      marginBottom: 4,
    },
    cardText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    cardTime: {
      fontSize: 15,
      color: colors.secondaryText,
      marginTop: 6,
    },
    cardCountdown: {
      fontSize: 16,
      color: colors.countdown,
      marginTop: 8,
    },
    section: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.sectionTitle,
    },
    event: {
      backgroundColor: colors.event,
      padding: 14,
      marginBottom: 12,
      borderRadius: 10,
      borderLeftWidth: 5,
      borderLeftColor: colors.borderLeft,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    eventTime: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 4,
    },
    eventLocation: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 2,
    },
    progressContainer: {
      height: 14,
      backgroundColor: colors.barBackground,
      borderRadius: 8,
      overflow: 'hidden',
      marginTop: 20,
    },
    progressBar: {
      height: '100%',
      borderRadius: 8,
      backgroundColor: color,
    },
    progressText: {
      marginTop: 8,
      textAlign: 'center',
      fontSize: 14,
      color: colors.progressText,
      marginBottom: 8,
    },
    sleepText: {
      fontSize: 15,
      textAlign: 'center',
      color: colors.emptyText,
      fontWeight: '600',
      marginBottom: 20,
    },
    sleepImage: {
      width: '100%',
      height: 200,
      marginTop: 40,
      marginBottom: 20,
    },
    dateList: {
      marginTop: 12,
      paddingHorizontal: 12,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "PhelmApp",
          headerTitleAlign: "right",
          headerTitleStyle: { color: "red" },
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Image
                source={require('./photoid.jpg')}
                style={styles.profilePic}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={styles.title}>Bonjour Sidonie 👋</Text>

      {nextCountdown && countdownDays !== null && (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, color: '#333' }}>
            🎯 Plus que <Text style={{ fontWeight: 'bold', color: '#d32f2f' }}>{countdownDays} jours</Text> avec {nextCountdown.title}
          </Text>
        </View>
      )}

      {events.length > 0 ? (
        <View style={styles.nextCard}>
          <Text style={styles.cardTitle}>⏳ Prochain événement</Text>
          <Text style={styles.cardText}>{events[0].title}</Text>
          <Text style={styles.cardTime}>🕒 {moment(events[0].startDate).format("DD/MM - HH:mm")}</Text>
          {events[0].location ? (
            <Text style={styles.cardTime}>📍 {events[0].location}</Text>
          ) : null}
          <Text style={styles.cardCountdown}>⏱ Dans {countdown}</Text>
        </View>
      ) : (
        <View style={styles.sleepCard}>
          <Image
            source={require('/Users/a33611/mon-app-phelma/phelmApp/app/(tabs)/phoenixdodo.png')}
            style={styles.sleepImage}
            resizeMode="contain"
          />
        
        </View>
      )}

      {events.length > 1 && (
        <>
          <Text style={styles.section}>📅 À venir</Text>
          <FlatList
            data={events.slice(1)}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderEvent}
            style={{ marginBottom: 30 }}
          />
        </>
      )}

      <TouchableOpacity onPress={() => setShowDates(!showDates)}>
        <View style={[
          styles.progressContainer,
          { marginTop: events.length > 1 ? 20 : 160 }
        ]}>
          <View
            style={[
              styles.progressBar,
              { width: `${progress * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          📊 {progressPercent}% de l’année scolaire
        </Text>
      </TouchableOpacity>

      {showDates && (
        <View style={styles.dateList}>
          <Text>📅 Rentrée : 1 septembre 2025</Text>
          <Text>🎃 Toussaint : …</Text>
          <Text>🎄 Noël : …</Text>
          <Text>🌸 Printemps : …</Text>
          <Text>📝 Examens : …</Text>
          <Text>🏁 Fin : 15 mai 2026</Text>
        </View>
      )}
    </View>
  );
}
