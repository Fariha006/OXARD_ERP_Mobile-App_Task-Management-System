import React from 'react';
import { View, Text, Button, StyleSheet,ScrollView,TouchableOpacity,Image,FlatList,SafeAreaView
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {

  const tiles = [
  { id: 1, title: 'My Desk', image: require('../../assets/images/del_button.png') },
  { id: 2, title: 'My Requests', image: require('../../assets/images/del_button.png') },
  { id: 3, title: 'Payslips', image: require('../../assets/images/del_button.png') },
  { id: 4, title: 'Approval', image: require('../../assets/images/del_button.png') },
  { id: 5, title: 'Directory', image: require('../../assets/images/del_button.png') },
  { id: 6, title: 'Messages', image: require('../../assets/images/del_button.png') },
  { id: 7, title: 'Leave Outstandings ', image: require('../../assets/images/del_button.png') },
  { id: 8, title: 'Approval', image: require('../../assets/images/del_button.png') },
  { id: 9, title: 'Add ', image: require('../../assets/images/del_button.png') },
];

const DATA = [
  {
    id: '1',
    name: 'Alina',
    role: 'Software Engineer',
    image: require('../../assets/images/Circle-icons-profile.svg.png'),
   tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
  },
  {
    id: '2',
    name: 'Ravi',
    role: 'UI/UX Designer',
    image: require('../../assets/images/Circle-icons-profile.svg.png'),
    tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!', 
   },
  {
    id: '3',
    name: 'Sara',
    role: 'Project Manager',
    image: require('../../assets/images/Circle-icons-profile.svg.png'),
    tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
  },
    {
    id: '4',
    name: 'Sara',
    role: 'Project Manager',
    image: require('../../assets/images/Circle-icons-profile.svg.png'),
    tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
  },
    {
    id: '5',
    name: 'Sara',
    role: 'Project Manager',
    image: require('../../assets/images/Circle-icons-profile.svg.png'),
    tags: 'Wishing you a day filled with love, laughter, andunforgettable moments-Happy Birthday!',
  },
    {
    id: '6',
    name: 'Sara',
    role: 'Project Manager',
    image: require('../../assets/images/Circle-icons-profile.svg.png'),
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
        <Image  source={item.image} style={styles.lstimage} />
        <View style={styles.textContainer}>
          <Text style={styles.lsttitle}>Happy Birthday {item.name}</Text>
          <Text style={styles.role}>{item.role}</Text>
        </View>
      </View>
      

     </View>
     <View>
        <Text >Happy Birthday {item.name}</Text>
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
    <View style={styles.container}>
      <View style={styles.btncontainer}>
       <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false} horizontal={true} showsHorizontalScrollIndicator={false}
    >
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <TouchableOpacity key={tile.id} style={styles.tile}>
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
        <Text style={styles.anouncementheader}>Announcements</Text>
        <FlatList
          data={ANNOUNCEMENTS}
          renderItem={announcementRenderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          scrollEnabled={false}
        />
      </View>
      </ScrollView>
   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
   btncontainer: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
   scrollContainer: {
    padding: 5,
  },
  grid: {
    flexDirection: 'row',
   
    justifyContent: 'space-between',
  },
  tile: {
    width: '10%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 15,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  image: {
    width: 30,
    height: 30,
    marginBottom: 8,
    resizeMode: 'contain',
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
    backgroundColor:  '#f8f8f8',
     marginBottom: 5,
 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // backgroundColor: '#f8f8f8',
    
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    height: 50,
    // width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  lstimage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  lsttitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
    margin:5,
    flexDirection: 'column',
    alignItems: 'flex-start',
    

  },
   anouncementheader: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  anouncementitem: {
    backgroundColor: '#e6f0ff',
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
