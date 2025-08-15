

// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';

// import AppNavigator from './src/navigation/DrawerNavigator';

// export default function App() {
//   return (

//        <AppNavigator /> 
//   );
// }

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar,PermissionsAndroid, Platform, Alert, View, Text } from 'react-native';
import DrawerLayout from './src/navigation/DrawerLayout';
import LoginScreen from './src/screens/LoginScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import Header from './src/components/Header';
import CustomDrawer from './src/navigation/CustomDrawer';
import SplashScreen from './src/components/SplashScreen';
import { DrawerProvider } from './src/context/DrawerContext';
import messaging from '@react-native-firebase/messaging';
import { API_CONFIG } from './src/config/apiConfig';
import { managetoken } from './src/api/api';
import notifee, { AndroidImportance } from '@notifee/react-native';
const Drawer = createDrawerNavigator();

async function createChannel() {
  // Creates a channel called "Default Channel"
  await notifee.createChannel({
    id: 'default',           // Channel ID
    name: 'Default Channel', // Channel name (visible to users)
    importance: AndroidImportance.HIGH, // High importance = makes sound & heads-up notification
  });
}


async function requestUserPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true; // iOS permission handled by Firebase
}
async function getFcmToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    console.log('📌 FCM Token:', token);
   // Alert.alert('FCM Token:', token);
    //const response = await managetoken(token); 
   // console.log('✅ Token saved successfully:', response); 
    // Send the token to your backend API
    // const response = await fetch(`http://localhost:50962/api/Login/savetocken`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ token: token })
    // });
    
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
    
    // const result = await response.json();
    // console.log('✅ Token saved successfully:', result);
  } catch (error) {
    console.error('❌ Error getting FCM token or saving to backend:', error);
    Alert.alert('Error', 'Failed to save FCM token to server');
  }
}

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    const initFCM = async () => {
      const hasPermission = await requestUserPermission();
      if (hasPermission) {
        await getFcmToken();
      }

      // Foreground messages
      const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
        console.log('📩 Foreground message:', remoteMessage);
        Alert.alert(remoteMessage.notification?.title ?? 'New Message', remoteMessage.notification?.body ?? '');
      // await notifee.displayNotification({
      //   title: remoteMessage.notification?.title ?? 'New Message',
      //   body: remoteMessage.notification?.body ?? '',
      //   android: {
      //     channelId: 'default',
      //     //largeIcon: 'https://onesoftapps.com/assets/images/logo.png',
      //     importance: AndroidImportance.HIGH,
      //     pressAction: {
      //       id: 'default',
      //     },
      //   },
      // });

      await notifee.displayNotification({
        title: 'Special Offer!',
        body: 'Check out our latest deals.',
        android: {
          channelId: 'default',
          largeIcon: 'https://example.com/your-image.png',
          style: {
            type: notifee.AndroidStyle.BIGPICTURE,
            picture: 'https://onesoftapps.com/assets/images/logo.png'
          }
        }
      });
    
    
    });

      

      // When app is opened from a notification (background state)
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('📂 App opened from background state:', remoteMessage);
      });

      // When app is opened from a notification (quit state)
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('📂 App opened from quit state:', remoteMessage);
          }
        });

      return () => {
        unsubscribeOnMessage();
      };
    };

    initFCM();
  }, []);

  useEffect(() => {
    createChannel();
  }, []);

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




