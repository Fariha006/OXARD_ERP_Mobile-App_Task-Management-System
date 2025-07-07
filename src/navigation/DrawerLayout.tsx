import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MydeskScreen from '../screens/MyDeskScreen';


const Stack = createStackNavigator();

const InnerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} options={({ navigation, route }) => ({
    header: () => <Header navigation={navigation} route={route} />
  })}
/>
    <Stack.Screen 
  name="Details" 
  component={DetailsScreen} 
  options={({ navigation, route }) => ({
    header: () => <Header navigation={navigation} route={route} />
  })}
/>
    <Stack.Screen 
  name="MyDesk" 
  component={MydeskScreen} 
  options={({ navigation, route }) => ({
    header: () => <Header navigation={navigation} route={route} />
  })}
/>

  </Stack.Navigator>
);

const Footer = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.footer}>
      <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
        <Text>🏠</Text>
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' } )}>
        <Text>📄</Text>
        <Text style={styles.label}>Messeges</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Text>👤</Text>
        <Text style={styles.label}>Leaves</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
        <Text>⚙️</Text>
        <Text style={styles.label}>Approval</Text>
      </TouchableOpacity>
       <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
        <Text>⚙️</Text>
        <Text style={styles.label}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const DrawerLayout = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <InnerStack />
      </View>
      <Footer />
    </View>
  );
};

export default DrawerLayout;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
