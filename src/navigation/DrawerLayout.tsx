import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import Header from '../components/Header';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import MydeskScreen from '../screens/MyDeskScreen';
import Personalinformationscreen from '../screens/Personalinformationscreen';

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

<Stack.Screen
      name="Personalinfo"
      component={Personalinformationscreen}
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
      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
        <View><Image source={require('../../assets/images/btmhome.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
        <View><Image source={require('../../assets/images/btmmsgs.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Messeges</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Profile')}>
        <View><Image source={require('../../assets/images/btmleave.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Leaves</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Settings')}>
        <View><Image source={require('../../assets/images/btmaprov.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
        <Text style={styles.label}>Approval</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btmmenu} onPress={() => navigation.navigate('Login')}>
        <View><Image source={require('../../assets/images/btmsignout.png')}
          style={styles.btmicon} resizeMode="contain" />
        </View>
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
    borderTopColor: '#002F65',
    backgroundColor: '#002F65',
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#EAEFFF',
  },
  btmmenu: {
    flexDirection: 'column',
    alignItems: 'center',
  }
});
