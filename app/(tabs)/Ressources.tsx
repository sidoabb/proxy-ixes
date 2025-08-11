import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function NotesPage() {
  


  return (
    
      <WebView
        source={{ uri: 'https://phelm-docs.onrender.com/' }}
        style={styles.webview}
        scalesPageToFit={true}
      />
    
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
