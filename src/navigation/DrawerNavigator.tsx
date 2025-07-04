import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import LoginScreen from '../screens/LoginScreen';
import Header from '../components/Header';



const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
     <NavigationContainer>
      <Drawer.Navigator initialRouteName="Login">
        <Drawer.Screen name="Home" component={HomeScreen} options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />,
        })} />
        <Drawer.Screen name="Details" component={DetailsScreen}  options={({ navigation, route }) => ({
          header: () => <Header navigation={navigation} route={route} />,
        })} />
        <Drawer.Screen name="Login" component={LoginScreen}  options={{ headerShown: false }}  />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
