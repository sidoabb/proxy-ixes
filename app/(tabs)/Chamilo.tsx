import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function NotesPage() {
  return (
    <View style={styles.container}>
      <WebView source={{ uri: 'https://chamilo.grenoble-inp.fr/' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
