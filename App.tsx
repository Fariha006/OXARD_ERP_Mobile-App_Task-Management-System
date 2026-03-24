import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar, PermissionsAndroid, Platform, Alert, View, Text } from 'react-native';
import DrawerLayout from './src/navigation/DrawerLayout';
import LoginScreen from './src/screens/LoginScreen';
import CustomDrawer from './src/navigation/CustomDrawer';
import SplashScreen from './src/components/SplashScreen';
import { DrawerProvider } from './src/context/DrawerContext'; 
import messaging from '@react-native-firebase/messaging';
import firebase from '@react-native-firebase/app';
import notifee, { AndroidImportance } from '@notifee/react-native';
import UserStorage from './src/utils/userStorage';

const Drawer = createDrawerNavigator();

async function createChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

async function requestUserPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }
  return true;
}

async function getFcmToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    console.log('🔑 FCM Token:', token);

    await UserStorage.storeFcmToken(token);
    console.log('✅ FCM token saved');
  } catch (error) {
    console.error('❌ FCM error:', error);
  }
}

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    console.log('🔥 Firebase apps:', firebase.apps);

    // 🚨 If Firebase not initialized → stop here
    if (!firebase.apps.length) {
      console.error('❌ Firebase NOT initialized (iOS issue)');
      return;
    }

    const initFCM = async () => {
      const hasPermission = await requestUserPermission();

      if (hasPermission) {
        await getFcmToken();
      }

      const unsubscribe = messaging().onMessage(async remoteMessage => {
        console.log('📩 Foreground message:', remoteMessage);

        Alert.alert(
          remoteMessage.notification?.title ?? 'New Message',
          remoteMessage.notification?.body ?? ''
        );
      });

      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('📂 Opened from background:', remoteMessage);
      });

      const initialMessage = await messaging().getInitialNotification();
      if (initialMessage) {
        console.log('📂 Opened from quit:', initialMessage);
      }

      return unsubscribe;
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
    <DrawerProvider>
      <NavigationContainer>
        <Drawer.Navigator
          initialRouteName="Login"
          drawerContent={(props) => <CustomDrawer {...props} />}
        >
          <Drawer.Screen
            name="Main"
            component={DrawerLayout}
            options={{ headerShown: false }}
          />

          <Drawer.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: false,
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer.Navigator>
      </NavigationContainer>
    </DrawerProvider>
  );
}