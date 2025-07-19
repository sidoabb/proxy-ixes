import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();


  const profile = {
    photo: require('./photoidbis.jpg'),


    nom: 'Abuzakuk',
    prenom: 'Sidonie',
    numEtudiant: '42402036',
    filiere: ' 2A Sicom',
    mail: 'sidonie.abuzakuk@grenoble-inp.org',
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header blanc avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.content}>
      <Image source={profile.photo} style={styles.photo} />


        <Text style={styles.name}>
          {profile.prenom} {profile.nom}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Num étudiant :</Text>
          <Text style={styles.info}>{profile.numEtudiant}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Filière :</Text>
          <Text style={styles.info}>{profile.filiere}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Mail :</Text>
          <Text style={styles.info}>{profile.mail}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    height: 56,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 70,
  },
  backText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 30,
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#222',
  },
  infoRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#555',
  },
  info: {
    fontSize: 16,
    color: '#222',
  },
});
