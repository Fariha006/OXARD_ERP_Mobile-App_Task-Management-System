import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MainScreen = () => {
  const [activeTab, setActiveTab] = useState<'Home' | 'Details' | 'Profile' | 'Settings'>('Home');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <Text style={styles.page}>🏠 Home Page</Text>;
      case 'Details':
        return <Text style={styles.page}>📄 Details Page</Text>;
      case 'Profile':
        return <Text style={styles.page}>👤 Profile Page</Text>;
      case 'Settings':
        return <Text style={styles.page}>⚙️ Settings Page</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderScreen()}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => setActiveTab('Home')} style={styles.tab}>
          <Text>🏠</Text>
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Details')} style={styles.tab}>
          <Text>📄</Text>
          <Text style={styles.tabText}>Messeges</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Profile')} style={styles.tab}>
          <Text>👤</Text>
          <Text style={styles.tabText}>Leaves</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Settings')} style={styles.tab}>
          <Text>⚙️</Text>
          <Text style={styles.tabText}>Approvals</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('Settings')} style={styles.tab}>
          <Text>⚙️</Text>
          <Text style={styles.tabText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { fontSize: 24 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  tab: { alignItems: 'center' },
  tabText: { fontSize: 12, marginTop: 2 },
});
