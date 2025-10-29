import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,TouchableOpacity,Text,Alert,StatusBar,
  ScrollView,
  Keyboard
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { loginUser, LoginRequest, UserData, MenuItem } from '../api/api';
import UserStorage from '../utils/userStorage';
import { useDrawer } from '../context/DrawerContext';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from "react-native-biometrics";
import BiometricSettings from '../utils/biometricSettings';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const rnBiometrics = new ReactNativeBiometrics();
export default function LoginScreen({ navigation }: Props) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [hasAttemptedAutoBiometric, setHasAttemptedAutoBiometric] = useState(false);
  const { refreshDrawer } = useDrawer();
  const isFocused = useIsFocused();
  const scrollViewRef = useRef<ScrollView>(null);

  // Handle keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Check if biometric is enabled and auto-trigger biometric login
  useEffect(() => {
    const checkBiometricAndAutoLogin = async () => {
      try {
        // Only attempt auto-biometric login once per screen focus
        if (hasAttemptedAutoBiometric) return;
        
        const isBiometricEnabled = await BiometricSettings.isBiometricEnabled();
        if (isBiometricEnabled) {
          setHasAttemptedAutoBiometric(true);
          // Small delay to ensure screen is fully loaded
          setTimeout(() => {
            handleBiometricLogin(false); // Don't show alerts for auto-trigger
          }, 500);
        }
      } catch (error) {
        console.error('Error checking biometric settings:', error);
      }
    };

    if (isFocused && !hasAttemptedAutoBiometric) {
      checkBiometricAndAutoLogin();
    } else if (!isFocused) {
      // Reset the flag when screen loses focus
      setHasAttemptedAutoBiometric(false);
    }
  }, [isFocused, hasAttemptedAutoBiometric]);

  const validateFields = () => {
    let isValid = true;
    
    // Reset previous errors
    setUsernameError('');
    setPasswordError('');
    
    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    }
    
    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    }
    
    return isValid;
  };

  const storeUserData = async (userData: UserData, menuItems: MenuItem[], token: string) => {
    try {
      console.log('LoginScreen: Storing user data...');
      console.log('LoginScreen: Token to store:', token ? `Token exists (length: ${token.length})` : 'No token');
      console.log('LoginScreen: Token preview:', token ? `${token.substring(0, 50)}...` : 'No token');
      
      // Add AttendanceId to user data
      const userDataWithAttendance = {
        ...userData,
        AttendanceId:userData.AttendanceId
      };
      
      console.log('LoginScreen: User data with AttendanceId:', userDataWithAttendance);
      
      await UserStorage.storeSessionData(userDataWithAttendance, menuItems, token);
      console.log('LoginScreen: User data stored successfully');
      
      // Verify the token was stored correctly
      const storedToken = await UserStorage.getToken();
      console.log('LoginScreen: Verification - stored token:', storedToken ? `Token exists (length: ${storedToken.length})` : 'No token found');
    } catch (error) {
      console.error('LoginScreen: Error storing user data:', error);
    }
  };

    const handleSignIn = async () => {
    if (!validateFields()) {
      return;
    }

    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        UserNam: username.trim(),
        UserLgnPwd: password.trim()
      };

      const response = await loginUser(loginData);

             if (response.success && response.userData && response.menuItems && response.token) {
         console.log('LoginScreen: Login successful:', response.userData);
         console.log('LoginScreen: Menu items:', response.menuItems);
         console.log('LoginScreen: Token from API:', response.token ? `Token exists (length: ${response.token.length})` : 'No token');
         console.log('LoginScreen: Token preview:', response.token ? `${response.token.substring(0, 50)}...` : 'No token');
         console.log('LoginScreen: ApprovalCount:', response.userData.ApprovalCount || 0);
         console.log('LoginScreen: MessageCount:', response.userData.MessageCount || 0);
         
         // Store user data, menu items, and token
         await storeUserData(response.userData, response.menuItems, response.token);
         
         // Store username and password for biometric authentication
         try {
           await AsyncStorage.setItem('savedUsername', username.trim());
           await AsyncStorage.setItem('savedPassword', password.trim());
           console.log('LoginScreen: Username and password stored for biometric authentication');
         } catch (error) {
           console.error('LoginScreen: Error storing credentials:', error);
         }
         
         // Trigger drawer refresh after storing data
         refreshDrawer();
         
         // Navigate to Home with user data
         //navigation.navigate('Home');
         navigation.navigate('Main', { screen: 'Home' });
        } else {
          console.log('LoginScreen: Login failed:', response.message);
          Alert.alert('Login Failed', response.message || 'Invalid credentials');
        }
      } catch (error) {
        console.error('Login error:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

  const handleBiometricLogin = async (showAlerts: boolean = true) => {
    try {
      // Check if biometric authentication is enabled
      const isBiometricEnabled = await BiometricSettings.isBiometricEnabled();
      if (!isBiometricEnabled) {
        if (showAlerts) {
          Alert.alert('Biometric Authentication', 'Biometric authentication is not enabled. Please enable it in settings.');
        }
        return;
      }

      // Check if biometric is available on device
      const { available, biometryType } = await rnBiometrics.isSensorAvailable();
      if (!available) {
        if (showAlerts) {
          Alert.alert('Biometric Authentication', 'Biometric authentication is not available on this device.');
        }
        return;
      }

      // Get stored credentials
      const savedUsername = await AsyncStorage.getItem('savedUsername');
      const savedPassword = await AsyncStorage.getItem('savedPassword');

      if (!savedUsername || !savedPassword) {
        if (showAlerts) {
          Alert.alert('Biometric Authentication', 'No saved credentials found. Please login with username and password first.');
        }
        return;
      }

      setIsLoading(true);

      // Prompt for biometric authentication
      const { success, error } = await rnBiometrics.simplePrompt({
        promptMessage: `Authenticate with ${biometryType}`,
        cancelButtonText: 'Cancel'
      });

      if (success) {
        // Biometric authentication successful, proceed with login
        const loginData: LoginRequest = {
          UserNam: savedUsername,
          UserLgnPwd: savedPassword
        };

        const response = await loginUser(loginData);

        if (response.success && response.userData && response.menuItems && response.token) {
          console.log('LoginScreen: Biometric login successful:', response.userData);
          console.log('LoginScreen: Menu items:', response.menuItems);
          console.log('LoginScreen: Token from API:', response.token ? `Token exists (length: ${response.token.length})` : 'No token');
          console.log('LoginScreen: Token preview:', response.token ? `${response.token.substring(0, 50)}...` : 'No token');
          console.log('LoginScreen: ApprovalCount:', response.userData.ApprovalCount || 0);
          console.log('LoginScreen: MessageCount:', response.userData.MessageCount || 0);
          
          // Store user data, menu items, and token
          await storeUserData(response.userData, response.menuItems, response.token);
          
          // Trigger drawer refresh after storing data
          refreshDrawer();
          
          // Navigate to Home with user data
          navigation.navigate('Main', { screen: 'Home' });
        } else {
          console.log('LoginScreen: Biometric login failed:', response.message);
          Alert.alert('Login Failed', response.message || 'Invalid credentials');
        }
      } else {
        console.log('Biometric authentication failed:', error);
        Alert.alert('Authentication Failed', 'Biometric authentication was cancelled or failed.');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert('Error', 'An unexpected error occurred during biometric authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    {isFocused && (
      <StatusBar 
        backgroundColor="#ffffff" 
        barStyle="dark-content" 
        translucent={false}
      />
      )}
      {/* <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        > */}
           <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior='padding'
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 5}
        >
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
        {/* Logo */}
        <Image
          source={require('../../assets/images/loginlogo.webp')} // Make sure logo.png is inside assets folder
          style={[styles.logo, isKeyboardVisible && styles.logoSmall]}
          resizeMode="contain"
        />

        {/* Username */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (usernameError) setUsernameError('');
          }}
          style={[styles.input, styles.inputusr, usernameError ? styles.inputError : null]}
          editable={!isLoading}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />
        {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          style={[styles.input, passwordError ? styles.inputError : null]}
          secureTextEntry
          editable={!isLoading}
          onFocus={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        {/* Sign In Button */}
        <View style={styles.loginbutton}>
          <TouchableOpacity 
            style={[styles.button, isLoading ? styles.buttonDisabled : null]} 
            onPress={() => handleSignIn()}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Or Sign In With Section */}
        <View style={styles.orSignInSection}>
          <Text style={styles.orSignInText}>or sign in with</Text>
                     <TouchableOpacity 
             style={styles.biometricButton}
             onPress={() => {
               setHasAttemptedAutoBiometric(true); // Prevent auto-trigger after manual attempt
               handleBiometricLogin(true); // Show alerts for manual trigger
             }}
             disabled={isLoading}
           >
            <Image 
              source={require('../../assets/images/biometric-icon.png')} 
              style={styles.biometricIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  inner: {
    flex: 1,
    padding: 24,
   
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    //paddingBottom: 50, // Extra padding at bottom for keyboard
  },
  logo: {
    width: '100%',
    marginBottom: 30,
  },
  logoSmall: {
    width: '60%',
    marginBottom: 15,
    alignSelf: 'center',
  },
  label: {
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 0,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 16,
  },
  inputusr: {
    marginBottom: 15,
  },
  inputError: {
    borderColor: '#ff0000',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 2,
  },
button: {
  marginTop: 30,
  borderColor: '#D60808',
  backgroundColor: '#D60808',
  width: 163,
  height: 44,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 6,
},
buttonDisabled: {
  backgroundColor: '#cccccc',
  borderColor: '#cccccc',
},
loginbutton: {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
},
  buttonText:{
    color: '#ffffff',
  },
  orSignInSection: {
    marginTop: 5,
    alignItems: 'center',
  },
  orSignInText: {
    fontSize: 14,
    color: '#666666',
    //marginBottom: 5,
    textAlign: 'center',
  },
  biometricButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIcon: {
    width: 80,
    height: 80,
  },
});



