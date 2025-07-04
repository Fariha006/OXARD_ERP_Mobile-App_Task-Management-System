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
  }
});
