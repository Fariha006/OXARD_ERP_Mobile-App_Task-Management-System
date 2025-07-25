import React from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList, SafeAreaView, StatusBar
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {

  const tiles = [
    { id: 1, title: 'My Desk', image: require('../../assets/images/home/mydesk.png'),route:'Main',screen:'MyDesk' },
    { id: 2, title: 'My Requests', image: require('../../assets/images/home/request.png'),route:'Main',screen:'CertificateRequest' },
    { id: 3, title: 'Payslips', image: require('../../assets/images/home/payslip.png'),route:'Main',screen:'Payslip' },
    { id: 4, title: 'Approval', image: require('../../assets/images/home/aproval.png'),route:'Main',screen:'Approvals' },
    { id: 5, title: 'Directory', image: require('../../assets/images/home/directory.png'),route:'Main',screen:'EmployeeDirectory' },
    { id: 6, title: 'Messages', image: require('../../assets/images/home/msgs.png'),route:'Main',screen:'Messages' },
    { id: 7, title: 'Leave Outstandings ', image: require('../../assets/images/home/leave.png'),route:'Main',screen:'LeaveOutstanding' },
    { id: 8, title: 'Approval', image: require('../../assets/images/home/aprovb.png'),route:'Main',screen:'Approval' },
    { id: 9, title: 'Add ', image: require('../../assets/images/home/addbtn.png'),route:'Main',screen:'Add' },
  ];

  const DATA = [
    {
      id: '1',
      name: 'Alina Mathew',
      role: 'Software Engineer',
      image: require('../../assets/images/birthday.png'),
      tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
    },
    {
      id: '2',
      name: 'Ravi',
      role: 'UI/UX Designer',
      image: require('../../assets/images/birthday.png'),
      tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
    },
    {
      id: '3',
      name: 'Sara',
      role: 'Project Manager',
      image: require('../../assets/images/birthday.png'),
      tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
    },
    {
      id: '4',
      name: 'Sara',
      role: 'Project Manager',
      image: require('../../assets/images/birthday.png'),
      tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
    },
    {
      id: '5',
      name: 'Sara',
      role: 'Project Manager',
      image: require('../../assets/images/birthday.png'),
      tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
    },
    {
      id: '6',
      name: 'Sara',
      role: 'Project Manager',
      image: require('../../assets/images/birthday.png'),
      tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
    },
  ];

  const ANNOUNCEMENTS = [
    {
      id: '1',
      tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
    },
    {
      id: '2',
      tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
    },
    {
      id: '3',
      tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
    },
    {
      id: '4',
      tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
    },
    {
      id: '5',
      tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
    },
    {
      id: '6',
      tags: 'As part of our World Environment Day celebrations,\nwe invite everyone to join us on Thursday, 5th June,\nby wearing green or a shade of green outfit.',
    },
  ];


  const renderItem = ({ item }: { item: typeof DATA[0] }) => (
    <View style={styles.lstcontainer}>
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Image source={item.image} style={styles.lstimage} />
          <View style={styles.textContainer}>
            <Text style={styles.lsttitle}>{item.name}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.itemname}>Happy Birthday {item.name}</Text>
        <Text >{item.tags}</Text>
      </View>
    </View>
  );

  const announcementRenderItem = ({ item }: { item: typeof ANNOUNCEMENTS[0] }) => (
    <View style={styles.anouncementitem}>
      <Text style={styles.anouncementtagText}>{item.tags}</Text>
    </View>
  );

  return (
    <>
      <StatusBar 
        backgroundColor="#133F7C" 
        barStyle="light-content" 
        translucent={false}
      />
      <View style={styles.container}>
      <View style={styles.btncontainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false} horizontal={true} showsHorizontalScrollIndicator={false}>
          <View style={styles.grid}>
            {tiles.map((tile) => (
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: tile.screen })} key={tile.id} style={styles.tile}>
                <Image source={tile.image} style={styles.image} />
                <Text style={styles.title}>{tile.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={true} // 👈 shows the vertical scrollbar
      >
        <View>
          <FlatList
            data={DATA}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            scrollEnabled={false}
          />
        </View>
        <View style={styles.anouncementcontainer}>
          <View style={styles.annstextimg}>
            <View style={styles.annIcon}><Image style={styles.annIconimg} source={require('../../assets/images/icon!.png')} /></View>
            <Text style={styles.anouncementheader}>Announcements</Text>
          </View>
          <FlatList
            data={ANNOUNCEMENTS}
            renderItem={announcementRenderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ marginBottom: 20 }}
            scrollEnabled={false} />
        </View>
      </ScrollView>

    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: 0,
    backgroundColor: '#ffffff',
    paddingLeft: 0,
    paddingBottom: 80,
  },
  btncontainer: {
    paddingTop: 0,
    paddingBottom: 10,
    paddingRight: 0,
    paddingLeft: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  annstextimg: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#E5EEFD',
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 10,
    borderRadius: 6,
    alignContent: 'center',
    alignItems: 'center',
  },
  annIcon: {
    width: 40,
    height: 36,
    marginRight: 4,
  },
  annIconimg: {
    width: 31,
    height: 31,
  },
  scrollContainer: {
    padding: 0,
    paddingRight: 12,
    paddingLeft: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 5, paddingLeft: 6,
  },
  image: {
    marginBottom: 1,
  },
  tile: {
    width: '10%',
    aspectRatio: 1,
    backgroundColor: '#E5EEFD',
    borderRadius: 10,
    marginBottom: 5,
    marginLeft: 0,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    color: '#101010',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  lstcontainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    backgroundColor: '#CAD6FF',
    marginBottom: 7,
    borderRadius: 8,
    padding: 6,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lstimage: {
    width: 73,
    height: 78,
    borderRadius: 6,
    marginRight: 4,
  },
  textContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginLeft: 10,
    paddingLeft: 6,
    paddingTop: 6,
    height:56,
    borderRadius: 6,
    marginTop: 5,
  },
  itemname: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C50205',
  },
  lsttitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: '#133F7C',
  },
  tagsContainer: {


    marginTop: 12,
    gap: 8,
  },
  tagBox: {
    backgroundColor: '#d0ebff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#333',
  },

  // Announcement styles
  anouncementcontainer: {
    margin: 5,
    flexDirection: 'column',
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
  },
  anouncementheader: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#333',
  },
  anouncementitem: {
    backgroundColor: '#CAD6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  anouncementtagText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});
