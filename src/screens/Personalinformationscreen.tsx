import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, Alert, ActivityIndicator
} from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { getPersonalInfo, PersonalInfo } from '../api/api';
import UserStorage from '../utils/userStorage';

type RootStackParamList = {
  Home: undefined;
  Details: { userId: string };
  Login: undefined;
  MyDesk: undefined;
  Personalinfo: undefined;
};

type Props = StackScreenProps<RootStackParamList, 'Personalinfo'>;

export default function Personalinformationscreen({ navigation }: Props) {
  const [accordionOpen, setAccordionOpen] = useState(true);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPersonalInfo();
  }, []);

  const loadPersonalInfo = async () => {
    try {
      console.log('PersonalInfoScreen: Starting to load personal info...');
      setIsLoading(true);
      setError(null);

      // Get the stored token
      const token = await UserStorage.getToken();
      console.log('PersonalInfoScreen: Token retrieved:', token ? `Token exists (length: ${token.length})` : 'No token');
      console.log('PersonalInfoScreen: Token preview:', token ? `${token.substring(0, 50)}...` : 'No token');

      if (!token) {
        setError('No authentication token found. Please login again.');
        setIsLoading(false);
        return;
      }

      // Validate token format
      if (token.trim() === '') {
        setError('Empty authentication token. Please login again.');
        setIsLoading(false);
        return;
      }

      // Call the API
      const response = await getPersonalInfo(token);
      console.log('PersonalInfoScreen: API response:', response);

      if (response.success && response.personalInfo) {
        setPersonalInfo(response.personalInfo);
        console.log('PersonalInfoScreen: Personal info set successfully');
      } else {
        setError(response.message || 'Failed to load personal information');
        console.log('PersonalInfoScreen: API failed:', response.message);
      }
    } catch (error) {
      console.error('PersonalInfoScreen: Error loading personal info:', error);
      setError('An unexpected error occurred while loading personal information');
    } finally {
      setIsLoading(false);
    }
  };

  const testTokenAndAPI = async () => {
    try {
      console.log('=== TOKEN DEBUG TEST ===');

      // Test 1: Get stored token
      const token = await UserStorage.getToken();
      console.log('Test 1 - Stored Token:', token ? `Exists (${token.length} chars)` : 'NULL');
      console.log('Test 1 - Token Preview:', token ? token.substring(0, 100) : 'NULL');

      if (!token) {
        Alert.alert('Debug Info', 'No token found in storage');
        return;
      }

      // Test 2: Test API call with detailed logging
      console.log('Test 2 - Making API call...');
      const apiurl = 'http://216.48.184.187:8081/api/Mob1010/MyDesk';
      console.log('Test 2 - API URL:', apiurl);
      console.log('Test 2 - Authorization Header:', `Bearer ${token.substring(0, 50)}...`);

      // Test 3: Try different header formats
      console.log('Test 3 - Testing different header formats...');

      // Format 1: Standard Bearer
      console.log('Format 1: Bearer token');

      // Format 2: Just the token (some APIs don't need "Bearer")
      console.log('Format 2: Token only');

      Alert.alert('Debug Info', `Token length: ${token.length}\nToken preview: ${token.substring(0, 50)}...`);

    } catch (error: any) {
      console.error('Debug test error:', error);
      Alert.alert('Debug Error', error?.message || error?.toString() || 'Unknown error');
    }
  };

  const formatDateOfBirth = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Remove extra spaces and format the date
    const cleanDate = dateString.trim();
    return cleanDate || 'N/A';
  };

  const formatPlaceOfBirth = (placeString: string) => {
    if (!placeString) return 'N/A';
    // Remove extra spaces
    return placeString.trim() || 'N/A';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.back, styles.toptitle]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={styles.backicon}>
              <Image source={require('../../assets/images/backarow.png')}
                style={styles.backiconimg} resizeMode="contain" />
            </View>
          </TouchableOpacity>
          <View style={styles.pagewrap}>
            <Text style={styles.pagetitle}>My Desk</Text>
          </View>
          <TouchableOpacity style={styles.rightclick}>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading personal information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.back, styles.toptitle]}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <View style={styles.backicon}>
              <Image source={require('../../assets/images/backarow.png')}
                style={styles.backiconimg} resizeMode="contain" />
            </View>
          </TouchableOpacity>
          <View style={styles.pagewrap}>
            <Text style={styles.pagetitle}>My Desk</Text>
          </View>
          <TouchableOpacity style={styles.rightclick}>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPersonalInfo}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.debugButton} onPress={testTokenAndAPI}>
            <Text style={styles.debugButtonText}>Debug Token</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>My Desk</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Accordion Section */}
        <View style={styles.accordion}>
          <TouchableOpacity style={styles.accordionHeader}
            onPress={() => setAccordionOpen(!accordionOpen)}>
            <View style={styles.hdrltficn}>
              <Image source={require('../../assets/images/innerpage/star.png')}
                style={[styles.ltficn, styles.star]} resizeMode="contain" />
              <Text style={styles.accordionTitle}>Personal Information</Text>
            </View>
            <Text>{accordionOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {accordionOpen && (
            <View style={styles.accordionContent}>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Employee Id :</Text>
                <Text style={styles.vlue}>{personalInfo?.EmpNo || 'N/A'}</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Employee Name :</Text>
                <Text style={styles.vlue}>{personalInfo?.EmployeeName || 'N/A'}</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Nationality :</Text>
                <Text style={styles.vlue}>{personalInfo?.Nationality || 'N/A'}</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Gender :</Text>
                <Text style={styles.vlue}>{personalInfo?.Gender || 'N/A'}</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Religion :</Text>
                <Text style={styles.vlue}>{personalInfo?.Religion || 'N/A'}</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Caste :</Text>
                <Text style={styles.vlue}>{personalInfo?.Caste || 'N/A'}</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Place of Birth :</Text>
                <Text style={styles.vlue}>{formatPlaceOfBirth(personalInfo?.PlaceOfBirth || '')}</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Date of Birth :</Text>
                <Text style={styles.vlue}>{formatDateOfBirth(personalInfo?.DateOfBirth || '')}</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Marital Status :</Text>
                <Text style={styles.vlue}>{personalInfo?.MartitalStatus || 'N/A'}</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Blood Group :</Text>
                <Text style={styles.vlue}>{personalInfo?.BloodGroup || 'N/A'}</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Mother Tongue :</Text>
                <Text style={styles.vlue}>{personalInfo?.MotherTounge || 'N/A'}</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Family Status :</Text>
                <Text style={styles.vlue}>{personalInfo?.FamilyStatus || 'N/A'}</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Social Insurance No :</Text>
                <Text style={styles.vlue}>{personalInfo?.SocialInsuranceNo || 'N/A'}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    fontWeight: 'bold',
    color: '#133F7C',
  },
  backicon: {
    marginLeft: 15,
  },
  backiconimg: {
    width: 13,
    height: 20,
  },
  rightclick: {
    width: 110,
    backgroundColor: 'red',
  },
  clpsclick: {
    backgroundColor: '#E2EDFC',
    borderRadius: 20,
    width: 110,
    padding: 6,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clpsclicktxt: {
    color: '#000000',
    fontSize: 14,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  accordion: {
    borderRadius: 8,
    padding: 0,
    marginBottom: 10,
  },
  hdrltficn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ltficn: {
    width: 15,
    height: 22,
  },
  star: {
    width: 20,
    height: 22,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#E1E6EC',
  },
  accordionHeaderOpen: {
    backgroundColor: '#E1E6EC',
  },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  accordionContent: {
    marginTop: 10,
    paddingLeft: 6,
    paddingRight: 6,
  },
  odd: {
    backgroundColor: '#ffffff',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  even: {
    backgroundColor: '#F1F6FD',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  lbl: {
    fontSize: 16,
    color: '#000000',
    paddingLeft: 12,
  },
  vlue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    paddingLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#133F7C',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
