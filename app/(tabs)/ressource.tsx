import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function NotesPage() {
  return (
    <View style={styles.container}>
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
