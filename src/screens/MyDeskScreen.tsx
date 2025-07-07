import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.back}>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <Text style={styles.backText}>&lt;</Text>
        </TouchableOpacity>
      </View>
        <View style={styles.Caption}>     
          <Text style={styles.CaptionText}>MyDesk</Text>        
      </View>
      <View>
        <View style={styles.logoContainer}>
          <Image
                  source={require('../../assets/images/Circle-icons-profile.svg.png')} // Make sure logo.png is inside assets folder
                  style={styles.logo}
                  resizeMode="contain"
                />
        </View>
          <View style={styles.logoContainercode}>     
          <Text style={styles.logoContainercodetext}>EMP 457</Text>        
          </View>
           <View style={styles.logoContainercode}>     
          <Text style={styles.logoContainercodetext}>Teorge Fernandes</Text>        
          </View>
      </View>
      <View style={styles.mydeskbtnfirstraw}>
          <View style={styles.tile}>
         <TouchableOpacity key='1' style={styles.tile}>
            <Image source={require('../../assets/images/Circle-icons-profile.svg.png')} style={styles.image} />
            <Text style={styles.title}>Personal information</Text>
          </TouchableOpacity>
           </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures full screen usage
    padding: 5,
    flexDirection: 'column',
    // alignItems: 'flex-start',
    // justifyContent: 'flex-start',
  },
  back: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems:'flex-start',
  
  },
  backText: {
    fontSize: 16,
    color: 'blue',
  },
  Caption: {
  height: 60, // or any height you need
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f0f0f0', // optional
},

CaptionText: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#333', // optional
},
logoContainer:{
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
},
  logo: {
    width: '100%',
    height: 120,
    marginBottom: 5,
  },
    logoContainercode: {
  height: 30, // or any height you need
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#f0f0f0', // optional
},
  logoContainercodetext: {
  fontSize: 20,
  fontWeight: 'bold',
  color: 'red', // optional
},
mydeskbtnfirstraw: {
    flexDirection: 'row',
   
    justifyContent: 'space-between',
},
  tile: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 15,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
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
});
