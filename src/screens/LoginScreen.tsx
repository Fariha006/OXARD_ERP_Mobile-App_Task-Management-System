import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,TouchableOpacity,Text,Alert,StatusBar,
  ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { loginUser, LoginRequest, UserData, MenuItem } from '../api/api';
import UserStorage from '../utils/userStorage';
import { useDrawer } from '../context/DrawerContext';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from "react-native-biometrics";

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
const rnBiometrics = new ReactNativeBiometrics();
export default function LoginScreen({ navigation }: Props) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { refreshDrawer } = useDrawer();
  const isFocused = useIsFocused();
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
         navigation.navigate('Home');
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

  return (
    <>
    {isFocused && (
      <StatusBar 
        backgroundColor="#ffffff" 
        barStyle="dark-content" 
        translucent={false}
      />
      )}
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.inner}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
    keyboardShouldPersistTaps="handled"
  >
        {/* Logo */}
        <Image
          source={require('../../assets/images/loginlogo.webp')} // Make sure logo.png is inside assets folder
          style={styles.logo}
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
          <Text style={styles.orSignInText}>Or sign in with</Text>
          <TouchableOpacity 
            style={styles.biometricButton}
            onPress={() => {
              // Handle biometric authentication here
              console.log('Biometric authentication pressed');
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
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: '100%',
    marginBottom: 30,
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
    marginTop: 30,
    alignItems: 'center',
  },
  orSignInText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
    textAlign: 'center',
  },
  biometricButton: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  biometricIcon: {
    width: 80,
    height: 80,
  },
});



