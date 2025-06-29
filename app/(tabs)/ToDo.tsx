import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
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
};

export default function TodoScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const loadTodos = async () => {
      const json = await AsyncStorage.getItem('todos');
      if (json) setTodos(JSON.parse(json));
    };
    loadTodos();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  function addTodo() {
    if (!input.trim()) return;

    setTodos((prev) => [
      ...prev,
      { id: Date.now().toString(), text: input.trim(), done: false },
    ]);
    setInput('');
  }

  function toggleDone(id: string) {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  }

  function deleteTodo(id: string) {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }

  const activeTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);
  const progress = todos.length > 0 ? doneTodos.length / todos.length : 0;

  let progressColor = '#4caf50'; // vert
  if (progress < 1) {
    progressColor = progress <= 0.5 ? '#e74c3c' : '#f39c12'; // rouge ou orange
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ma ToDo List</Text>

      <Text style={styles.count}>📝 À faire : {activeTodos.length}</Text>
      <Text style={styles.count}>✅ Terminées : {doneTodos.length}</Text>

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress * 100}%`, backgroundColor: progressColor },
          ]}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Nouvelle tâche"
          placeholderTextColor="#555"
          value={input}
          onChangeText={setInput}
        />
        <Button title="Ajouter" onPress={addTodo} />
      </View>

      <Text style={styles.sectionTitle}>📋 Tâches à faire</Text>
      {activeTodos.length === 0 && (
        <Text style={styles.emptyText}>Aucune tâche en cours.</Text>
      )}
      <FlatList
        data={activeTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.todoItem}
            onPress={() => toggleDone(item.id)}
            onLongPress={() => deleteTodo(item.id)}
          >
            <Text style={styles.text}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>✅ Tâches terminées</Text>
      {doneTodos.length === 0 && (
        <Text style={styles.emptyText}>Aucune tâche terminée.</Text>
      )}
      <FlatList
        data={doneTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.todoItem, styles.todoDone]}
            onPress={() => toggleDone(item.id)}
            onLongPress={() => deleteTodo(item.id)}
          >
            <Text style={styles.textDone}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',

  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  count: {
    fontSize: 16,
    marginBottom: 2,
    color: '#555',
  
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 12,
    marginBottom: 20,
  },
  progressBar: {
    height: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 8,
  },
  todoItem: {
    padding: 12,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 8,
  },
  todoDone: {
    backgroundColor: '#cce5cc',
  },
  text: {
    fontSize: 16,
  },
  textDone: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    color: 'gray',
  },
});
