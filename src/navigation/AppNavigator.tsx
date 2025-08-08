import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import DetailsScreen from '../screens/DetailsScreen';
import LoginScreen from '../screens/LoginScreen'
import LeaveRequestScreen from '../screens/LeaveRequestScreen';
import Header from '../components/Header';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Details: { userId: string }; // Example of passing params
  Login: undefined;
  LeaveRequest: { editData?: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const renderCustomHeader =(props: NativeStackHeaderProps) => <Header {...props} />;

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" >
     <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ header: renderCustomHeader }}
      />
        
       <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={{ header: renderCustomHeader }}
      />
         <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LeaveRequest"
        component={LeaveRequestScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
