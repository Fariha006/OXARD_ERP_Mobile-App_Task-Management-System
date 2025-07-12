import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,TouchableOpacity,Text
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
export default function LoginScreen({ navigation }: Props) {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    console.log('Username:', username);
    console.log('Password:', password);
  
  
   navigation.navigate('Main');
  
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          onChangeText={setUsername}
          style={[styles.input, styles.inputusr]}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        {/* Sign In Button */}
        {/* <View style={styles.button}><Button title="Sign In" onPress={() => handleSignIn()} /></View> */}
        <View style={styles.loginbutton}>
          <TouchableOpacity style={styles.button} onPress={() => handleSignIn()}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  },
  inputusr: {
    marginBottom: 15,
  },
button: {
  marginTop: 22,
  borderColor: '#D60808',
  backgroundColor: '#D60808',
  width: 163,
  height: 44,
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 6,
},
loginbutton: {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
},
  buttonText:{
    color: '#ffffff',
}
});



