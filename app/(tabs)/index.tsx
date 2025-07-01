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

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [countdown, setCountdown] = useState('');
  const [showDates, setShowDates] = useState(false);

  const schoolStart = moment("2025-09-01");
  const schoolEnd = moment("2026-05-15");
  const now = moment();
  const progress = Math.min(1, Math.max(0, now.diff(schoolStart) / schoolEnd.diff(schoolStart)));
  const progressPercent = Math.round(progress * 100);
  const [nextCountdown, setNextCountdown] = useState(null);
  const [countdownDays, setCountdownDays] = useState(null);

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
        setEvents(upcoming.slice(0, 3)); // on garde 3 au cas où tu veux en afficher plus ensuite
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


      {events.length > 0 && (
        <View style={styles.nextCard}>
          <Text style={styles.cardTitle}>⏳ Prochain événement</Text>
          <Text style={styles.cardText}>{events[0].title}</Text>
          <Text style={styles.cardTime}>
            🕒 {moment(events[0].startDate).format("DD/MM - HH:mm")}
          </Text >
          {events[0].location ? (
  <Text style={styles.cardTime}>📍 {events[0].location}</Text>
) : null}
          <Text style={styles.cardCountdown}>⏱ Dans {countdown}</Text>
        </View>
      )}

      <Text style={styles.section}>📅 À venir</Text>
      <FlatList
        data={events.slice(1)} // ⬅️ saute le premier événement
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderEvent}
        style={{ marginBottom: 30 }}
      />

      <TouchableOpacity onPress={() => setShowDates(!showDates)}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: color }]} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
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
  },
  nextCard: {
    backgroundColor: '#fef3e2',
    padding: 18,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
    marginTop : 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d35400',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardTime: {
    fontSize: 15,
    color: '#555',
    marginTop: 6,
  },
  cardCountdown: {
    fontSize: 16,
    color: '#c0392b',
    marginTop: 8,
  },
  section: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
    
  },
  event: {
    backgroundColor: '#f1f1f1',
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#4e91fc',

  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 20,
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
    
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#444',
    marginBottom : 8,
   
  },
  dateList: {
    marginTop: 12,
    paddingHorizontal: 12,
  },
  eventLocation: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  
});