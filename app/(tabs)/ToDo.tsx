import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity, useColorScheme, View
} from 'react-native';

type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

export default function TodoScreen() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [input, setInput] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = {
    background: isDark ? '#121212' : 'white',
    text: isDark ? '#fff' : '#000',
    secondaryText: isDark ? '#aaa' : '#555',
    progressBackground: isDark ? '#333' : '#eee',
    progressColorLow: '#e74c3c',
    progressColorMid: '#f39c12',
    progressColorFull: '#4caf50',
    border: isDark ? '#444' : '#ccc',
    inputBackground: isDark ? '#1e1e1e' : 'white',
    placeholder: isDark ? '#888' : '#555',
    todoItem: isDark ? '#333' : '#eee',
    todoDone: isDark ? '#2e7d32' : '#cce5cc',
    doneText: isDark ? '#bbb' : 'gray',
    emptyText: isDark ? '#aaa' : '#888',
  };

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

  let progressColor = colors.progressColorFull;
  if (progress < 1) {
    progressColor = progress <= 0.5 ? colors.progressColorLow : colors.progressColorMid;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Ma ToDo List</Text>

      <Text style={[styles.count, { color: colors.secondaryText }]}>📝 À faire : {activeTodos.length}</Text>
      <Text style={[styles.count, { color: colors.secondaryText }]}>✅ Terminées : {doneTodos.length}</Text>

      <View style={[styles.progressContainer, { backgroundColor: colors.progressBackground }]}>
        <View
          style={[
            styles.progressBar,
            { width: `${progress * 100}%`, backgroundColor: progressColor },
          ]}
        />
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text }]}
          placeholder="Nouvelle tâche"
          placeholderTextColor={colors.placeholder}
          value={input}
          onChangeText={setInput}
        />
        <Button title="Ajouter" onPress={addTodo} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Tâches à faire</Text>
      {activeTodos.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.emptyText }]}>Aucune tâche en cours.</Text>
      )}
      <FlatList
        data={activeTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.todoItem, { backgroundColor: colors.todoItem }]}
            onPress={() => toggleDone(item.id)}
            onLongPress={() => deleteTodo(item.id)}
          >
            <Text style={[styles.text, { color: colors.text }]}>{item.text}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>✅ Tâches terminées</Text>
      {doneTodos.length === 0 && (
        <Text style={[styles.emptyText, { color: colors.emptyText }]}>Aucune tâche terminée.</Text>
      )}
      <FlatList
        data={doneTodos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.todoItem, { backgroundColor: colors.todoDone }]}
            onPress={() => toggleDone(item.id)}
            onLongPress={() => deleteTodo(item.id)}
          >
            <Text style={[styles.textDone, { color: colors.doneText }]}>{item.text}</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  count: {
    fontSize: 16,
    marginBottom: 2,
  },
  progressContainer: {
    height: 10,
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
    marginBottom: 8,
  },
  todoItem: {
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
  },
  textDone: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
});
