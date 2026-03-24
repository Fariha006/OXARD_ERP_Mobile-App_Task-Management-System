import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  StatusBar,
  PermissionsAndroid,
  Platform,
  Alert,
  View,
  Text,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
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
  const [iosVectorFontsReady, setIosVectorFontsReady] = useState(Platform.OS !== 'ios');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let cancelled = false;
    const failOpenTimer = setTimeout(() => {
      if (!cancelled) setIosVectorFontsReady(true);
    }, 5000);
    Promise.all([Ionicons.loadFont(), MaterialIcons.loadFont()])
      .catch((e) => console.warn('Vector icon fonts failed to load:', e))
      .finally(() => {
        clearTimeout(failOpenTimer);
        if (!cancelled) setIosVectorFontsReady(true);
      });
    return () => {
      cancelled = true;
      clearTimeout(failOpenTimer);
    };
  }, []);

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

  if (!iosVectorFontsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#133F7C' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
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