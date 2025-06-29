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

const calendarEvents = [
  { id: '1', title: 'Cours de maths', time: '2025-06-24T10:30:00' },
  { id: '2', title: 'TP Chimie', time: '2025-06-24T14:00:00' },
  { id: '3', title: 'Réunion projet', time: '2025-06-25T09:00:00' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [nextEvent, setNextEvent] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [showDates, setShowDates] = useState(false);

  // Dates de l’année scolaire
  const schoolStart = moment("2025-09-01");
  const schoolEnd = moment("2026-05-15");

  const now = moment();
  const progress = Math.min(1, Math.max(0, (now.diff(schoolStart)) / (schoolEnd.diff(schoolStart))));
  const progressPercent = Math.round(progress * 100);

  let color = '#4caf50'; // vert
  if (progress <0.3 ) {
    color = '#d32f2f'; // rouge
  } else if (progress <0.6) {
    color = '#ffa000'; // orange
  }
  

  useEffect(() => {
    const now = moment();
    const upcoming = calendarEvents.find(event => moment(event.time).isAfter(now));
    setNextEvent(upcoming);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nextEvent) {
        const duration = moment.duration(moment(nextEvent.time).diff(moment()));
        const formatted = `${duration.hours()}h ${duration.minutes()}min ${duration.seconds()}s`;
        setCountdown(formatted);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nextEvent]);

  const renderEvent = ({ item }) => (
    <View style={styles.event}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventTime}>{moment(item.time).format('HH:mm')}</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 20, backgroundColor: '#fff' }}>
      <Stack.Screen
        options={{
          title: "PhelmApp",
          headerTitleAlign: "right",
          headerTitleStyle: { color: "red" },
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <Image
                source={require('./photoid.jpg')}
                style={{ width: 40, height: 35, borderRadius: 20, marginRight: 10 }}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <Text style={styles.title}>Bonjour Sidonie 👋</Text>

      {nextEvent && (
        <Text style={styles.countdown}>
          ⏳ Prochain événement dans : {countdown}
        </Text>
      )}

      <Text style={styles.section}>📅 Prochains événements :</Text>
      <FlatList
        data={calendarEvents.slice(0, 2)}
        keyExtractor={item => item.id}
        renderItem={renderEvent}
      />

<View style={{ marginTop: 40, marginBottom: 20 }}>
  <TouchableOpacity onPress={() => setShowDates(!showDates)}>
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
    <Text style={styles.progressText}>📊 Avancement : {progressPercent}% de l’année scolaire</Text>
  </TouchableOpacity>
</View>


      {showDates && (
        <View style={styles.dateList}>
          <Text>📅 Rentrée : 1 septembre 2025 </Text>
          <Text> Vacances de Toussaint : </Text>
          <Text>🎄 Vacances de Noël : </Text>
          <Text>🌸 Vacances de printemps : </Text>
          <Text>📝 Examens finaux : </Text>
          <Text>🏁 Fin d’année : 15 mai 2026</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  countdown: {
    fontSize: 18,
    marginBottom: 20,
    color: '#d32f2f',
  },
  section: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  event: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  progressText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
    
  },
  dateList: {
    marginTop: 10,
    paddingHorizontal: 10,
    
  },
});
