

// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';

// import AppNavigator from './src/navigation/DrawerNavigator';

// export default function App() {
//   return (

//        <AppNavigator /> 
//   );
// }

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'react-native';
import DrawerLayout from './src/navigation/DrawerLayout';
import LoginScreen from './src/screens/LoginScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import Header from './src/components/Header';
import CustomDrawer from './src/navigation/CustomDrawer';
import SplashScreen from './src/components/SplashScreen';
import { DrawerProvider } from './src/context/DrawerContext';

const Drawer = createDrawerNavigator();

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  if (isSplashVisible) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
   
      <DrawerProvider>
        <NavigationContainer>
          <Drawer.Navigator initialRouteName="Login" drawerContent={(props) => <CustomDrawer {...props} />}>
            <Drawer.Screen name="Main" component={DrawerLayout} options={{ headerShown: false}}/>

            <Drawer.Screen name="Login" component={LoginScreen}  options={{ headerShown: false ,drawerItemStyle: { display: 'none' },}}  />

              
          </Drawer.Navigator>
        </NavigationContainer>
      </DrawerProvider>
    </>
  );
}




