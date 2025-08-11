// CalendarScreen.js
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import ICAL from 'ical.js';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert, FlatList, Modal, ScrollView, StyleSheet,
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
  const [pickerMode, setPickerMode] = useState('date');


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

  const colors = {
    text: '#333',
    background: 'white',
    inputBorder: '#ccc',
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <Calendar
          onDayPress={d => setSelectedDate(d.dateString)}
          markedDates={marked}
          theme={{
            calendarBackground: 'white',
            dayTextColor: 'black',
            monthTextColor: 'black',
            selectedDayBackgroundColor: 'tomato',
            selectedDayTextColor: 'white',
            todayTextColor: '#3B82F6',
          }}
        />
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={styles(colors).sectionTitle}>📅 Événements le {selectedDate || '...'}</Text>
        <FlatList
          data={events[selectedDate] || []}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item }) => (
            <View style={[styles(colors).eventItem, { borderLeftColor: CATEGORIES[item.category]?.color }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles(colors).eventTitle}>
                  {item.title} {item.id?.startsWith('custom-') ? `(${CATEGORIES[item.category]?.label})` : ''}
                </Text>
                <Text style={styles(colors).eventTime}>
                  🕒 {new Date(item.startDate).toLocaleString()} – {new Date(item.endDate).toLocaleString()}
                </Text>
                {item.location ? <Text style={styles(colors).eventLocation}>📍 {item.location}</Text> : null}
                {item.id?.startsWith('custom-') && item.description ? (
                  <Text style={styles(colors).eventDescription}>{item.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => deleteEvent(selectedDate, item.id)}>
                <Ionicons name="trash" size={20} color="#d32f2f" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles(colors).emptyText}>Aucun événement prévu.</Text>}
        />
      </View>

      {/* Bouton flottant */}
      <TouchableOpacity
        style={styles(colors).fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles(colors).modalBackground}>
          <ScrollView contentContainerStyle={styles(colors).modalContainer}>
            <Text style={styles(colors).modalTitle}>Nouvel événement</Text>
            <TextInput
              placeholder="Titre"
              placeholderTextColor="#444"
              value={title}
              onChangeText={setTitle}
              style={styles(colors).input}
            />
            <TextInput
              placeholder="Description"
              placeholderTextColor="#444"
              value={description}
              onChangeText={setDescription}
              style={styles(colors).input}
              multiline
            />

            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <Text style={styles(colors).pickerLabel}>📅 Début : {startDate.toLocaleString()}</Text>
            </TouchableOpacity>
            {showStartPicker && (
            <DateTimePicker
            value={startDate}
            mode={pickerMode} // "date" ou "time"
            is24Hour
            onChange={(e, d) => {
              if (pickerMode === 'date') {
                if (d) {
                  setStartDate(d);
                  setPickerMode('time'); // 🔹 Après la date, on demande l’heure
                }
              } else {
                setShowStartPicker(false);
                if (d) setStartDate(d);
              }
            }}
          />
          
            )}

            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <Text style={styles(colors).pickerLabel}>📅 Fin : {endDate.toLocaleString()}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="datetime"
                is24Hour
                display="default"
                onChange={(e, d) => {
                  setShowEndPicker(false);
                  if (d) setEndDate(d);
                }}
              />
            )}

            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <TouchableOpacity key={key} onPress={() => setCategory(key)} style={{ marginBottom: 4 }}>
                <Text style={{
                  color: category === key ? cat.color : colors.text,
                  fontWeight: category === key ? 'bold' : 'normal'
                }}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity style={styles(colors).btnCancel} onPress={resetModal}>
                <Text style={{ color: 'white' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles(colors).btnAdd} onPress={addEvent}>
                <Text style={{ color: 'white' }}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors) =>
  StyleSheet.create({
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 12,
      color: colors.text,
      marginTop: 25,
    },
    eventItem: {
      flexDirection: 'row',
      borderLeftWidth: 4,
      paddingLeft: 8,
      marginBottom: 12,
      backgroundColor: '#f9f9f9',
      borderRadius: 6,
      paddingVertical: 8,
      paddingRight: 8,
    },
    eventTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    eventTime: {
      color: '#555',
      fontSize: 14,
    },
    eventLocation: {
      fontSize: 14,
      color: '#555',
    },
    eventDescription: {
      fontSize: 14,
      color: '#333',
    },
    emptyText: {
      textAlign: 'center',
      color: '#aaa',
      marginTop: 20,
    },
    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: 'tomato',
      padding: 16,
      borderRadius: 50,
      elevation: 5,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
    },
    modalContainer: {
      backgroundColor: colors.background,
      padding: 20,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
 
      marginTop: 150, // 🔹 Évite que ça prenne tout l'écran
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
      backgroundColor: 'white',
    },
    pickerLabel: {
      marginBottom: 8,
      fontSize: 16,
      color: colors.text,
    },
    btnCancel: {
      backgroundColor: '#888',
      padding: 12,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
      marginRight: 5,
    },
    btnAdd: {
      backgroundColor: 'tomato',
      padding: 12,
      borderRadius: 6,
      flex: 1,
      alignItems: 'center',
      marginLeft: 5,
    },
  });
