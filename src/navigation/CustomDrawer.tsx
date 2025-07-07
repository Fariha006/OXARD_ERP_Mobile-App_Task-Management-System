import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const CustomDrawer = ({ navigation }: DrawerContentComponentProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📂 Drawer Menu</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
        <Text>🏠 Home</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
        <Text>📄 Details</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MyDesk' })}>
        <Text>⚙️ MyDesk</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingLeft: 20 },
  title: { fontSize: 18, marginBottom: 20 },
});
