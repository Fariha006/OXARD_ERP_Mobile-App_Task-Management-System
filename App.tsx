

// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';

// import AppNavigator from './src/navigation/DrawerNavigator';

// export default function App() {
//   return (

//        <AppNavigator /> 
//   );
// }

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import DrawerLayout from './src/navigation/DrawerLayout';
import LoginScreen from './src/screens/LoginScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import Header from './src/components/Header';
import CustomDrawer from './src/navigation/CustomDrawer';
const Drawer = createDrawerNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Login" drawerContent={(props) => <CustomDrawer {...props} />}>
        <Drawer.Screen name="Main" component={DrawerLayout} options={{ headerShown: false}}/>

        <Drawer.Screen name="Login" component={LoginScreen}  options={{ headerShown: false ,drawerItemStyle: { display: 'none' },}}  />

          
      </Drawer.Navigator>
    </NavigationContainer>
  );
}




