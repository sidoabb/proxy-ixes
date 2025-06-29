import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import React, { useEffect, useState } from 'react';
import { Button, FlatList, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const CATEGORIES = {
  cours: { color: 'blue' },
  exam: { color: 'red' },
  autre: { color: 'gray' },
};

const ICS_URL =
  'https://edt.grenoble-inp.fr/directCal/2024-2025/etudiant/phelma?resources=20872';

const CalendarScreen = () => {
  const [events, setEvents] = useState({});
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const fetchICS = async () => {
      try {
        console.log('📡 Téléchargement du fichier ICS...');
        const icsPath = FileSystem.documentDirectory + 'edt.ics';
        const download = await FileSystem.downloadAsync(ICS_URL, icsPath);
        const icsText = await FileSystem.readAsStringAsync(download.uri);
        console.log('📝 Contenu brut du fichier ICS :\n', icsText.slice(0, 1000));
        const parsedEvents = parseICSRaw(icsText);

        console.log('✅ Événements parsés :', parsedEvents);
        setEvents(parsedEvents);
        await AsyncStorage.setItem('calendarEvents', JSON.stringify(parsedEvents));
      } catch (error) {
        console.error('❌ Erreur lors du téléchargement ou parsing du fichier ICS :', error);
      }
    };

    fetchICS();
  }, []);

  useEffect(() => {
    const loadEvents = async () => {
      const stored = await AsyncStorage.getItem('calendarEvents');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('🗃️ Événements récupérés de AsyncStorage :', parsed);
        setEvents(parsed);
      }

      if (!selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
      }
    };

    loadEvents();
  }, []);

  const parseICSRaw = (icsText) => {
    const events = {};
    const normalized = icsText.replace(/\r\n/g, '\n');
    const vevents = normalized.split('BEGIN:VEVENT').slice(1);

    for (const raw of vevents) {
      const lines = ('BEGIN:VEVENT' + raw).split('\n');

      const getField = (prefix) => {
        const match = lines.find((line) => line.startsWith(prefix));
        if (!match) return '';
        return match.substring(match.indexOf(':') + 1).replace(/\\n/g, '\n').trim();
      };

      const summary = getField('SUMMARY');
      const dtstart = getField('DTSTART');
      const dtend = getField('DTEND');
      const location = getField('LOCATION');
      const description = getField('DESCRIPTION');

      if (!dtstart || !dtend) continue;

      const start = new Date(
        dtstart.replace(/^(\d{8})T(\d{6})Z?$/, '$1T$2Z')
      );
      const end = new Date(
        dtend.replace(/^(\d{8})T(\d{6})Z?$/, '$1T$2Z')
      );
      const dateKey = start.toISOString().split('T')[0];
      const category =
        summary.toLowerCase().includes('rattrapage') ? 'exam' : 'cours';

      const event = {
        title: summary,
        start,
        end,
        location: location || '',
        description,
        category,
      };

      if (!events[dateKey]) events[dateKey] = [];
      events[dateKey].push(event);
    }

    return events;
  };

  const marked = Object.entries(events).reduce((acc, [date, evs]) => {
    acc[date] = {
      marked: true,
      dotColor: CATEGORIES[evs[0].category]?.color || 'blue',
    };
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Calendar
        markedDates={{
          ...marked,
          [selectedDate]: {
            ...(marked[selectedDate] || {}),
            selected: true,
            selectedColor: 'orange',
          },
        }}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
      />

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginVertical: 10 }}>
        Événements du {selectedDate} :
      </Text>

      {events[selectedDate]?.length ? (
        <FlatList
          data={events[selectedDate]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: '#eee',
                padding: 10,
                marginBottom: 5,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text>
                {new Date(item.start).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                -{' '}
                {new Date(item.end).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              {item.location ? <Text>📍 {item.location}</Text> : null}
            </View>
          )}
        />
      ) : (
        <Text style={{ fontStyle: 'italic' }}>Aucun événement.</Text>
      )}

      <Button title="Voir tous les événements en console" onPress={() => console.log(events)} />
    </View>
  );
};

export default CalendarScreen;
