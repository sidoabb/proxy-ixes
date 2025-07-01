import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ICAL from 'ical.js';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert, Button, FlatList, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

const STORAGE_KEY = 'events';
const ICS_URL = 'https://proxy-ixes.onrender.com/edt';

const CATEGORIES = {
  cours: { label: '🎓 Cours', color: '#4e91fc' },
  sport: { label: '🏋️ Sport', color: '#4caf50' },
  perso: { label: '🎉 Perso', color: '#9c27b0' },
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [events, setEvents] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [category, setCategory] = useState('cours');

  const router = useRouter();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/countdown')}>
          <Text style={{ fontSize: 22, marginRight: 16 }}>⏳</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setEvents(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    fetchICS();
  }, []);

  const fetchICS = () => {
    fetch(ICS_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        const imported = parseICS(text);

        setEvents(prev => {
          const cleaned = {};
          for (const [date, evs] of Object.entries(prev)) {
            const customs = evs.filter(ev => ev.id?.startsWith('custom-'));
            if (customs.length > 0) cleaned[date] = customs;
          }
          for (const [date, evs] of Object.entries(imported)) {
            if (!cleaned[date]) cleaned[date] = [];
            cleaned[date] = [...cleaned[date], ...evs];
          }
          return cleaned;
        });

        if (!selectedDate) {
          setSelectedDate(new Date().toISOString().split('T')[0]);
        }
      })
      .catch(err => {
        console.error('❌ Erreur lors du fetch ou du parse ICS :', err.message);
      });
  };

  const parseICS = (icsText) => {
    const jcal = ICAL.parse(icsText);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents('vevent');
    const out = {};
    vevents.forEach((ev, index) => {
      const e = new ICAL.Event(ev);
      const dateKey = e.startDate.toJSDate().toISOString().split('T')[0];
      if (!out[dateKey]) out[dateKey] = [];
      out[dateKey].push({
        title: e.summary,
        description: e.description || '',
        location: e.location || '',
        startDate: e.startDate.toJSDate(),
        endDate: e.endDate.toJSDate(),
        category: 'cours',
        id: `ics-${e.uid || 'event'}-${index}`,
      });
    });
    return out;
  };

  const addEvent = () => {
    if (endDate <= startDate) return Alert.alert('Heure de fin doit être après l’heure de début');
    const dateKey = startDate.toISOString().split('T')[0];
    setEvents(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), {
        title,
        description,
        startDate,
        endDate,
        category,
        id: `custom-${Date.now()}`
      }],
    }));
    resetModal();
  };

  const deleteEvent = (dateKey, id) => {
    setEvents(prev => {
      const day = prev[dateKey].filter(ev => ev.id !== id);
      const next = { ...prev };
      if (day.length) next[dateKey] = day;
      else delete next[dateKey];
      return next;
    });
  };

  const resetModal = () => {
    setModalVisible(false);
    setTitle('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date());
    setCategory('cours');
  };

  const marked = Object.entries(events).reduce((acc, [date, evs]) => {
    acc[date] = {
      marked: true,
      dotColor: CATEGORIES[evs[0].category]?.color || 'blue',
    };
    return acc;
  }, {});

  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: 'tomato',
    };
  }

  return (
    <View style={{ flex: 1 }}>
      <Calendar onDayPress={d => setSelectedDate(d.dateString)} markedDates={marked} />

      <View style={{ padding: 16 }}>
        <Button title="+ Ajouter un événement" onPress={() => setModalVisible(true)} />
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles.sectionTitle}>📅 Événements le {selectedDate || '...'}</Text>
        <FlatList
          data={events[selectedDate] || []}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={[styles.eventItem, { borderLeftColor: CATEGORIES[item.category]?.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>
                  {item.title} {item.id?.startsWith('custom-') ? `(${CATEGORIES[item.category]?.label})` : ''}
                </Text>
          
                <Text style={styles.eventTime}>
                  🕒 {new Date(item.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(item.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
          
                {item.location ? (
                  <Text style={styles.eventLocation}>📍 {item.location}</Text>
                ) : null}
          
                {item.id?.startsWith('custom-') && item.description ? (
                  <Text style={styles.eventDescription}>{item.description}</Text>
                ) : null}
              </View>
          
              <TouchableOpacity onPress={() => deleteEvent(selectedDate, item.id)}>
                <Ionicons name="trash" size={20} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          )}
          
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun événement prévu.</Text>}
        />
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <ScrollView contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ajouter un événement</Text>

            <TextInput placeholder="Titre" placeholderTextColor="#666" value={title} onChangeText={setTitle} style={[styles.input, styles.inputBold]} />
            <TextInput placeholder="Description" placeholderTextColor="#666" value={description} onChangeText={setDescription} style={[styles.input, styles.inputBold]} />

            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.input}>
              <Text>Début : {startDate.toLocaleString()}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="datetime"
                display="default"
                onChange={(e, sel) => {
                  setShowStartPicker(false);
                  sel && setStartDate(sel);
                }}
              />
            )}

            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.input}>
              <Text>Fin : {endDate.toLocaleString()}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                display="default"
                onChange={(e, sel) => {
                  setShowEndPicker(false);
                  sel && setEndDate(sel);
                }}
              />
            )}

            <Text style={{ marginTop: 10 }}>Catégorie :</Text>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <TouchableOpacity
                key={k}
                onPress={() => setCategory(k)}
                style={[styles.categoryButton, category === k && styles.categorySelected]}
              >
                <Text>{v.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button title="Annuler" onPress={resetModal} />
              <Button title="Ajouter" onPress={addEvent} disabled={!title.trim()} />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  emptyText: { fontStyle: 'italic', color: '#999' },
  eventItem: {
    flexDirection: 'row', backgroundColor: '#fafafa', padding: 10, marginTop: 8,
    borderLeftWidth: 4, borderRadius: 6, elevation: 2, alignItems: 'center',
  },
  eventTitle: { fontSize: 16, fontWeight: '600', marginTop: 4,color: '#333'},
  eventTime: { color: '#333', fontWeight: 'bold' },
  eventDescription: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#444',
    marginTop: 2,
  },
  modalBackground: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: 'white', borderRadius: 8, padding: 16, minWidth: '80%', marginTop: 150
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    backgroundColor: '#eee', padding: 10, borderRadius: 6, marginTop: 10
  },
  inputBold: {
    fontWeight: '600',
    color: '#111',
  },
  categoryButton: {
    padding: 10, marginTop: 6, backgroundColor: '#ddd', borderRadius: 6
  },
  categorySelected: {
    backgroundColor: '#bbb'
  },
});
