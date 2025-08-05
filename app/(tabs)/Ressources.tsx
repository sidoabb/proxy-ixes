import { StyleSheet, useColorScheme, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function NotesPage() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const backgroundColor = isDark ? '#121212' : '#fff';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <WebView
        source={{ uri: 'https://phelm-docs.onrender.com/' }}
        style={styles.webview}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
