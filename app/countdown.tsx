import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function CountdownScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [countdowns, setCountdowns] = useState([]);
  const STORAGE_KEY = '@countdowns';

  useEffect(() => {
    const loadCountdowns = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const restored = parsed.map((item) => ({
            title: item.title,
            date: new Date(item.date),
          }));
          // Tri par date ascendante (du plus proche au plus lointain)
          restored.sort((a, b) => a.date.getTime() - b.date.getTime());
          setCountdowns(restored);
        }
      } catch (err) {
        console.error('Erreur chargement countdowns:', err);
      }
    };
    loadCountdowns();
  }, []);

  const saveCountdowns = async (data) => {
    try {
      // Tri avant sauvegarde aussi
      const sortedData = data.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortedData));
    } catch (err) {
      console.error('Erreur sauvegarde countdowns:', err);
    }
  };

  const handleAddCountdown = () => {
    if (!title || !date) return;
    const newList = [...countdowns, { title, date }];
    // Trie par date
    newList.sort((a, b) => a.date.getTime() - b.date.getTime());
    setCountdowns(newList);
    saveCountdowns(newList);
    setTitle('');
    setDate(new Date());
  };

  const handleDeleteCountdown = (indexToDelete) => {
    const newList = countdowns.filter((_, index) => index !== indexToDelete);
    setCountdowns(newList);
    saveCountdowns(newList);
  };

  const getCountdownColor = (days) => {
    if (days < 7) return '#d00';        // rouge
    if (days <= 30) return '#e67e22';  // orange
    return '#2ecc71';                   // vert
  };

  const renderCountdown = ({ item, index }) => {
    const diff = item.date.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const color = getCountdownColor(days);

    return (
      <View style={styles.countdownCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.countdownTitle}>{item.title}</Text>
          <Text style={[styles.countdownTimeBig, { color }]}>
            {days}j {hours}h {minutes}min
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteCountdown(index)} style={styles.deleteButton}>
          <Text style={styles.deleteText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/Calendrier')} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compte à rebours</Text>
        <View style={{ width: 70 }} />
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>🆕 Nouveau compte à rebours</Text>

            <TextInput
              placeholder="Nom du compte à rebours"
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.input}>
              <Text style={{ color: '#222' }}>
                📅 {date.toLocaleString('fr-FR')}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                is24Hour={true}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            <View style={{ marginTop: 12 }} />

            <TouchableOpacity onPress={handleAddCountdown} style={styles.addButton}>
              <Text style={styles.addButtonText}>+ Ajouter</Text>
            </TouchableOpacity>

            <Text style={styles.subheading}>⏳ Comptes à rebours</Text>
          </>
        }
        data={countdowns}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderCountdown}
        ListEmptyComponent={
          <Text style={{ marginTop: 16 }}>Aucun compte à rebours encore...</Text>
        }
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    height: 56,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 70,
  },
  backText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 24,
  },
  subheading: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    color: '#222',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#2d6cdf',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  countdownCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  countdownTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
  },
  countdownTimeBig: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 18,
    color: '#b00',
  },
});
