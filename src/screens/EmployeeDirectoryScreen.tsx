import React, { useState, useEffect }  from 'react';
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, 
  SafeAreaView} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function EmployeeDirectoryScreen({ navigation }: Props) {
  const [accordionOpen, setAccordionOpen] = useState(true);
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <Text style={styles.pagetitle}>My Desk</Text>
        <TouchableOpacity  style={styles.rightclick}>
          {/* <View style={styles.clpsclick}>
            <Text style={styles.clpsclicktxt}>Collapse All</Text>
            <Image source={require('../../assets/images/dot.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View> */}
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
                <Text style={styles.vlue}>UNS78325</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Employee Name :</Text>
                <Text style={styles.vlue}>James Jacob</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Nationality :</Text>
                <Text style={styles.vlue}>Indian</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Gender :</Text>
                <Text style={styles.vlue}>Male</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Religion :</Text>
                <Text style={styles.vlue}>Christian</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Caste :</Text>
                <Text style={styles.vlue}>Roman Catholic</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Place of Birth :</Text>
                <Text style={styles.vlue}>Kochi</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Date of Birth :</Text>
                <Text style={styles.vlue}>10 - November - 1996</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Marital Status :</Text>
                <Text style={styles.vlue}>Single</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Blood Group :</Text>
                <Text style={styles.vlue}>O+ve</Text>
              </View>
              <View style={styles.odd}>
                <Text style={styles.lbl}>Mother Tongue :</Text>
                <Text style={styles.vlue}>Malayalam</Text>
              </View>
              <View style={styles.even}>
                <Text style={styles.lbl}>Family Status :</Text>
                <Text style={styles.vlue}>With Dependent</Text>
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
  },
  clpsclick: {
    backgroundColor: '#E2EDFC',
    borderRadius: 20,
    width: 110,
    padding:6,
    paddingLeft:8,
    paddingRight:8,
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
    backgroundColor: '#F1F6FD',
    padding: 10,
    borderRadius: 20,
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
    paddingLeft:12,
  },
  vlue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    paddingLeft:12,
  }
});