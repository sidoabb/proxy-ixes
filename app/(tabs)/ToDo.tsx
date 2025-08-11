// app/(tabs)/todo.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  reminderDate?: string; // ISO string
  lastNotifiedAt?: string; // ISO string
};

// Helper pour vérifier “aujourd'hui”
const isToday = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

// Wrapper pour header injection
export default function TodoScreenWrapper() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'ToDo',
          headerShown: true, // on gère le header interne
        }}
      />
      <TodoScreen />
    </>
  );
}

function TodoScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  // Charger
  useEffect(() => {
    const load = async () => {
      const json = await AsyncStorage.getItem('todos');
      if (json) setTodos(JSON.parse(json));
    };
    load();
    requestNotificationPermission();
  }, []);

  // Sauvegarder
  useEffect(() => {
    AsyncStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Listener notification reçue
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(notification => {
      const data = notification.request.content.data as any;
      if (data?.todoId) {
        setTodos(prev =>
          prev.map(t =>
            t.id === data.todoId
              ? { ...t, lastNotifiedAt: new Date().toISOString() }
              : t
          )
        );
      }
    });
    return () => sub.remove();
  }, []);

  // Relances toutes les 2h si reminder passé et non fait
  useEffect(() => {
    const now = new Date();
    todos.forEach(todo => {
      if (todo.done || !todo.reminderDate) return;
      const reminderAt = new Date(todo.reminderDate);
      const lastNotified = todo.lastNotifiedAt ? new Date(todo.lastNotifiedAt) : null;

      if (now >= reminderAt) {
        const shouldNotifyAgain =
          !lastNotified ||
          now.getTime() - lastNotified.getTime() >= 1000 * 60 * 60 * 2; // 2h
        if (shouldNotifyAgain) {
          notifyTodoReminder(todo);
        }
      }
    });
    const interval = setInterval(() => {
      setTodos(t => [...t]); // déclenche réévaluation
    }, 1000 * 60 * 5);
    return () => clearInterval(interval);
  }, [todos]);

  // Permissions notifications
  const requestNotificationPermission = async () => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Notifications', 'Permission non accordée pour les notifications.');
    }
  };

  // CRUD
  const addTodo = () => {
    if (!input.trim()) return;
    setTodos(prev => [
      ...prev,
      { id: Date.now().toString(), text: input.trim(), done: false },
    ]);
    setInput('');
  };

  const toggleDone = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? {
              ...todo,
              done: !todo.done,
            }
          : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  const openReminderModal = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setPickerDate(todo.reminderDate ? new Date(todo.reminderDate) : new Date());
    setShowPicker(false);
    setModalVisible(true);
  };

  const confirmReminder = () => {
    if (!selectedTodo) return;
    const updated: TodoItem = {
      ...selectedTodo,
      reminderDate: pickerDate.toISOString(),
      lastNotifiedAt: undefined,
    };
    setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    notifyTodoReminder(updated);
    setModalVisible(false);
  };

  const notifyTodoReminder = async (todo: TodoItem) => {
    const when = new Date(todo.reminderDate || new Date().toISOString());
    const trigger = when > new Date() ? { date: when } : null;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rappel : ' + todo.text,
        body: "T'as une tâche à faire.",
        data: { todoId: todo.id },
        sound: true,
      },
      trigger: trigger,
    });

    setTodos(prev =>
      prev.map(t =>
        t.id === todo.id ? { ...t, lastNotifiedAt: new Date().toISOString() } : t
      )
    );
  };

  // Filtrage selon les règles :
  // - Affiche dans “à faire” les tâches sans reminder + reminders pour aujourd’hui
  const activeTodos = todos.filter(
    t =>
      !t.done &&
      (!t.reminderDate || (t.reminderDate && isToday(t.reminderDate)))
  );
  const doneTodos = todos.filter(t => t.done);

  // Reminders pour aujourd'hui et futurs (hors aujourd'hui)
  const todayReminders = todos.filter(
    t => !t.done && t.reminderDate && isToday(t.reminderDate)
  );
  const upcomingNonTodayReminders = todos.filter(
    t => !t.done && t.reminderDate && !isToday(t.reminderDate)
  );

  const formatReminder = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <HeaderWithReminders
        upcomingNonTodayReminders={upcomingNonTodayReminders}
        todayReminders={todayReminders}
        toggleDone={toggleDone}
        deleteTodo={deleteTodo}
      />


      <View style={styles.countersRow}>
        <Text style={styles.count}>📝 À faire : {activeTodos.length}</Text>
        <Text style={styles.count}>✅ Terminées : {doneTodos.length}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${todos.length ? (doneTodos.length / todos.length) * 100 : 0}%`,
              backgroundColor:
                doneTodos.length / Math.max(1, todos.length) >= 1
                  ? '#4CAF50'
                  : doneTodos.length / Math.max(1, todos.length) <= 0.5
                  ? '#FF4C4C'
                  : '#FFD700',
            },
          ]}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nouvelle tâche"
          placeholderTextColor="#444"
          value={input}
          onChangeText={setInput}
        />
        <Button title="Ajouter" onPress={addTodo} />
      </View>

      <Text style={styles.sectionTitle}>📋 Tâches à faire</Text>
      {activeTodos.length === 0 && <Text style={styles.emptyText}>Aucune tâche en cours.</Text>}
      <FlatList
        data={activeTodos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.todoRow}>
            {/* étoile à gauche */}
            <TouchableOpacity onPress={() => openReminderModal(item)} style={{ padding: 8 }}>
              <Ionicons
                name={item.reminderDate ? 'star' : 'star-outline'}
                size={24}
                color={item.reminderDate ? '#f1c40f' : '#999'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.todoItem,
                item.reminderDate && isToday(item.reminderDate)
                  ? { backgroundColor: '#ffe5e5', borderColor: 'red', borderWidth: 1 }
                  : {},
              ]}
              onPress={() => toggleDone(item.id)}
              onLongPress={() =>
                Alert.alert('Supprimer', 'Supprimer cette tâche ?', [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => deleteTodo(item.id),
                  },
                ])
              }
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.text,
                    item.reminderDate && isToday(item.reminderDate)
                      ? { color: 'red', fontWeight: '600' }
                      : {},
                  ]}
                >
                  {item.text}
                </Text>
                {item.reminderDate && (
                  <Text style={styles.reminderText}>⏰ {formatReminder(item.reminderDate)}</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.sectionTitle}>✅ Tâches terminées</Text>
      {doneTodos.length === 0 && <Text style={styles.emptyText}>Aucune tâche terminée.</Text>}
      <FlatList
        data={doneTodos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.todoItemDone}
            onPress={() => toggleDone(item.id)}
            onLongPress={() => deleteTodo(item.id)}

          >
            <View style={{ flex: 1 }}>
              <Text style={styles.textDone}>{item.text}</Text>
              {item.reminderDate && (
                <Text style={styles.reminderTextDone}>
                  ⏰ {formatReminder(item.reminderDate)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal rappel */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rappel pour : {selectedTodo?.text}</Text>
            {Platform.OS === 'ios' && (
              <DateTimePicker
                value={pickerDate}
                mode="datetime"
                display="inline"
                themeVariant="light"
                onChange={(_, date) => {
                  if (date) setPickerDate(date);
                }}
              />
            )}
            {Platform.OS !== 'ios' && (
  <>
    <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.pickButton}>
      <Text style={styles.pickButtonText}>
        Choisir : {pickerDate.toLocaleString()}
      </Text>
    </TouchableOpacity>
    {showPicker && (
    <View style={{ backgroundColor: '#000', borderRadius: 6 }}> 
        <DateTimePicker
        themeVariant="light"
          value={pickerDate}
          mode="datetime"
          display="default"
         
          onChange={(_, date) => {
            if (date) setPickerDate(date);
            setShowPicker(false);
          }}
        />
      </View>
    )}
  </>
)}

            <View style={styles.modalActions}>
              <Button title="Annuler" onPress={() => setModalVisible(false)} />
              <Button title="Valider" onPress={confirmReminder} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Header avec smiley / badge et liste des reminders futurs
function HeaderWithReminders({
  upcomingNonTodayReminders,
  todayReminders,
  toggleDone,
  deleteTodo,
}: {
  upcomingNonTodayReminders: TodoItem[];
  todayReminders: TodoItem[];
  toggleDone: (id: string) => void;
  deleteTodo: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const totalFuture = upcomingNonTodayReminders.length;

 return (
   <>
  <View style={headerStyles.wrapper}>
    <View style={headerStyles.spacer} />

    <TouchableOpacity onPress={() => setOpen(true)} style={headerStyles.clockButton}>
      <Text style={{ fontSize: 22, textAlign: 'center' }}>⏰</Text>
      {totalFuture > 0 && (
        <View style={headerStyles.badge}>
          <Text style={headerStyles.badgeText}>{totalFuture}</Text>
        </View>
      )}
    </TouchableOpacity>

    <View style={headerStyles.spacer} />
  </View>



      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={headerStyles.modalContainer}>
          <Text style={headerStyles.modalTitle}>Reminders à venir</Text>
          {upcomingNonTodayReminders.length === 0 && (
            <Text style={{ fontStyle: 'italic', marginBottom: 12 }}>
              Aucun reminder futur.
            </Text>
          )}
          <ScrollView style={{ flex: 1 }}>
            {upcomingNonTodayReminders.map(t => (
              <View key={t.id} style={headerStyles.reminderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={headerStyles.reminderTextTitle}>{t.text}</Text>
                  <Text style={headerStyles.reminderTextSub}>
                    {t.reminderDate ? new Date(t.reminderDate).toLocaleString() : ''}
                  </Text>
                </View>
                <View style={headerStyles.reminderActions}>
                  <TouchableOpacity onPress={() => toggleDone(t.id)}>
                    <Text style={{ color: 'green', marginRight: 12 }}>✔️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTodo(t.id)}>
                    <Text style={{ color: 'red' }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <Button title="Fermer" onPress={() => setOpen(false)} />
        </View>
      </Modal>
      </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  countersRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  count: { fontSize: 16 },
  progressContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  progressBar: { height: '100%' },
  inputRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 , },
  emptyText: { fontStyle: 'italic', marginBottom: 8, color: '#666' },
  todoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  todoItem: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  todoItemDone: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  text: { fontSize: 16 },
  textDone: { fontSize: 16, textDecorationLine: 'line-through', color: '#555' },
  reminderText: { marginTop: 4, fontSize: 12, color: '#555' },
  reminderTextDone: { marginTop: 4, fontSize: 12, color: '#777' },
  starButton: { padding: 8, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  pickButton: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  pickButtonText: {
    fontSize: 16,
  },
});

const headerStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  badgeButton: { flexDirection: 'row', alignItems: 'center', padding: 6 },
  badge: {
    backgroundColor: 'tomato',
    borderRadius: 8,
    paddingHorizontal: 6,
    marginLeft: 4,
  },
  badgeText: { color: '#fff', fontSize: 12 },
  modalContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 4,
  },
  clockButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // pour que le badge reste bien positionné
  },
  
  reminderTextTitle: { fontSize: 16, fontWeight: '600' },
  reminderTextSub: { fontSize: 12, color: '#555', marginTop: 2 },
  reminderActions: { flexDirection: 'row', alignItems: 'center' },
});
