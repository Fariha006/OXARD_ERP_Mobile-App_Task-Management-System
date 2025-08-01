import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, Alert, Platform, UIManager, LayoutAnimation
} from 'react-native';

import { StackScreenProps } from '@react-navigation/stack';
import { getAddressInfo, AddressInfo } from '../api/api';
import UserStorage from '../utils/userStorage';
type Props = StackScreenProps<any, 'Address'>;

export default function AddressScreen({ navigation }: Props) {
  const [currentaccordionOpen, setCurrentaccordionOpen] = useState(false);
  const [permanentaccordionOpen, setPermanentAccordionOpen] = useState(false);
  const [emergencyaccordionOpen, setEmergencyAccordionOpen] = useState(false);
  const [addressInfo, setAddressInfo] = useState<AddressInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddressInfo();
  }, []);

  const fetchAddressInfo = async () => {
    try {
      setLoading(true);
      const token = await UserStorage.getToken();

      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        navigation.navigate('Login');
        return;
      }

      const response = await getAddressInfo(token);

      if (response.success && response.addressInfo) {
        setAddressInfo(response.addressInfo);
      } else {
        Alert.alert('Error', response.message || 'Failed to fetch address information');
      }
    } catch (error) {
      console.error('Error fetching address info:', error);
      Alert.alert('Error', 'Failed to fetch address information');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.pagetitle}>Address</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading address information...</Text>
          </View>
        ) : addressInfo ? (
          <>
            {/* Current Address Accordion */}
            <View style={styles.accordion}>

              <TouchableOpacity
                style={[styles.accordionHeader, currentaccordionOpen ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
                onPress={() => setCurrentaccordionOpen(!currentaccordionOpen)}>
                <View style={styles.hdrltficn}>
                  <Image source={require('../../assets/images/innerpage/location1.png')}
                    style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <Text style={styles.accordionTitle}>Current Address</Text>
                </View>
                {/* <Text>{permanentaccordionOpen ? '▲' : '▼'}</Text> */}
              </TouchableOpacity>
              {currentaccordionOpen && (
                <View style={styles.accordionContent}>

                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Address :</Text>
                    <Text style={styles.vlue}>{addressInfo.AddressC}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Country :</Text>
                    <Text style={styles.vlue}>{addressInfo.CntryNamC}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>State :</Text>
                    <Text style={styles.vlue}>{addressInfo.StateNamC}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>City :</Text>
                    <Text style={styles.vlue}>{addressInfo.CityNamC}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>District :</Text>
                    <Text style={styles.vlue}>{addressInfo.DistrictC}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Street Name :</Text>
                    <Text style={styles.vlue}>{addressInfo.StreetC}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Building Number :</Text>
                    <Text style={styles.vlue}>{addressInfo.BuildingNoC}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Postal Code :</Text>
                    <Text style={styles.vlue}>{addressInfo.PostalCodeC}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Zip Code :</Text>
                    <Text style={styles.vlue}>{addressInfo.ZipCodeC}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Phone :</Text>
                    <Text style={styles.vlue}>{addressInfo.PhoneC}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Mobile :</Text>
                    <Text style={styles.vlue}>{addressInfo.MobileC}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}> Email(Official) :</Text>
                    <Text style={styles.vlue}>{addressInfo.OfficialEmailId}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Email(P) :</Text>
                    <Text style={styles.vlue}>{addressInfo.PersonalEmailId}</Text>
                  </View>

                </View>
              )}
            </View>

            {/* Permanent Address Accordion */}
            <View style={styles.accordion}>
              <TouchableOpacity
                style={[styles.accordionHeader, permanentaccordionOpen ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
                onPress={() => setPermanentAccordionOpen(!permanentaccordionOpen)}>
                <View style={styles.hdrltficn}>
                  <Image source={require('../../assets/images/innerpage/location1.png')}
                    style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <Text style={styles.accordionTitle}>Permanent Address</Text>
                </View>
                {/* <Text>{permanentaccordionOpen ? '▲' : '▼'}</Text> */}
              </TouchableOpacity>
              {permanentaccordionOpen && (
                <View style={styles.accordionContent}>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Address :</Text>
                    <Text style={styles.vlue}>{addressInfo.AddressP}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Country :</Text>
                    <Text style={styles.vlue}>{addressInfo.CntryNamP}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>State :</Text>
                    <Text style={styles.vlue}>{addressInfo.StateNamP}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>City :</Text>
                    <Text style={styles.vlue}>{addressInfo.CityNamP}</Text>
                  </View>

                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Zip Code :</Text>
                    <Text style={styles.vlue}>{addressInfo.ZipCodeP}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Phone :</Text>
                    <Text style={styles.vlue}>{addressInfo.PhoneP}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Mobile :</Text>
                    <Text style={styles.vlue}>{addressInfo.MobileP}</Text>
                  </View>
                </View>
              )}
            </View>
            {/* Emergency Address Accordion */}
            <View style={styles.accordion}>
              <TouchableOpacity
                style={[styles.accordionHeader, emergencyaccordionOpen ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
                onPress={() => setEmergencyAccordionOpen(!emergencyaccordionOpen)}>
                <View style={styles.hdrltficn}>
                  <Image source={require('../../assets/images/innerpage/location1.png')}
                    style={[styles.ltficn, styles.star]} resizeMode="contain" />
                  <Text style={styles.accordionTitle}>Emergency Contact</Text>
                </View>
                {/* <Text>{emergencyaccordionOpen ? '▲' : '▼'}</Text> */}
              </TouchableOpacity>
              {emergencyaccordionOpen && (
                <View style={styles.accordionContent}>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Contact Person :</Text>
                    <Text style={styles.vlue}>{addressInfo.ContactPersonP}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Address :</Text>
                    <Text style={styles.vlue}>{addressInfo.AddressE}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Country :</Text>
                    <Text style={styles.vlue}>{addressInfo.CntryNamE}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>State :</Text>
                    <Text style={styles.vlue}>{addressInfo.StateNamE}</Text>
                  </View>

                  <View style={styles.odd}>
                    <Text style={styles.lbl}>City :</Text>
                    <Text style={styles.vlue}>{addressInfo.CityNamE}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Zip Code :</Text>
                    <Text style={styles.vlue}>{addressInfo.ZipCodeE}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Phone :</Text>
                    <Text style={styles.vlue}>{addressInfo.PhoneE}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Mobile :</Text>
                    <Text style={styles.vlue}>{addressInfo.MobileE}</Text>
                  </View>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No address information available</Text>
          </View>
        )}
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
  },

  accordionHeaderOpen: {
      backgroundColor: '#E2EDFC',
  },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },

  accordionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  accordionContent: {
    marginTop: 1,
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
    fontSize: 11,
    color: 'gray',
    paddingLeft: 12,
    fontWeight: '600',
  },
  vlue: {
    fontSize: 11,
    // fontWeight: '600',
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
    fontSize: 18,
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
    color: '#ff0000',
    textAlign: 'center',
  },
});
