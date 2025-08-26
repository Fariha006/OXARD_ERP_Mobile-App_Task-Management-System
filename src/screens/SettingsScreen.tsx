import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  Switch,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserStorage from '../utils/userStorage';
import BiometricSettings from '../utils/biometricSettings';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load biometric setting using the utility
      const biometricEnabled = await BiometricSettings.isBiometricEnabled();
      setIsBiometricEnabled(biometricEnabled);
      
      // Load user name
      const name = await UserStorage.getEmployeeName();
      setUserName(name);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      setIsBiometricEnabled(value);
      
      // Save using the utility
      const success = value 
        ? await BiometricSettings.enableBiometric()
        : await BiometricSettings.disableBiometric();
      
      if (success) {
        // Show success message
        Alert.alert(
          'Success',
          `Biometric authentication has been ${value ? 'enabled' : 'disabled'}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to save setting');
      }
    } catch (error) {
      console.error('Error saving biometric setting:', error);
      Alert.alert('Error', 'Failed to save setting. Please try again.');
      
      // Revert the toggle if save failed
      setIsBiometricEnabled(!value);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#133F7C" barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={24} color="#133F7C" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>User Name</Text>
              <Text style={styles.settingValue}>{userName || 'Loading...'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#133F7C" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>
                Use fingerprint or face recognition to login
              </Text>
            </View>
            <Switch
              value={isBiometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: '#e0e0e0', true: '#133F7C' }}
              thumbColor={isBiometricEnabled ? '#ffffff' : '#f4f3f4'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={24} color="#133F7C" />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>



        {/* Footer Spacing */}
        <View style={styles.footerSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  back: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  toptitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
  },
  pagewrap: {
    width: '100%',
    paddingRight: 50,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pagetitle: {
    fontSize: 22,
    color: '#133F7C',
  },
  backicon: {
    marginLeft: 20,
  },
  backiconimg: {
    width: 25,
    height: 25,
  },
  rightclick: {
    width: 110,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    marginBottom: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#666666',
  },
  settingDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },

  footerSpacing: {
    height: 20,
  },
});
