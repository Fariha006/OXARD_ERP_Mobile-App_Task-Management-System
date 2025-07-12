// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// import { DrawerHeaderProps } from '@react-navigation/drawer'; 

// import Ionicons from 'react-native-vector-icons/Ionicons';


// const Header = ({ navigation, route }: DrawerHeaderProps) => {
//   return (
//     <View style={styles.container}>
//       <TouchableOpacity onPress={() =>  navigation.toggleDrawer()}>
//          <Ionicons name="menu" size={50} color="white" />
//       </TouchableOpacity>
//       <Text style={styles.title}>AHALLYA INFOTECH PVT LTD </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     height: 60,
//     backgroundColor: '#6200ee',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//   },
//   back: {
//     color: 'white',
//     fontSize: 20,
//     marginRight: 15,
//   },
//   title: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
// });

// export default Header;
// components/Header.tsx
//
// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { DrawerHeaderProps } from '@react-navigation/drawer';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// const Header = ({ navigation, route }: DrawerHeaderProps) => {
//   return (
//     <View style={styles.container}>

//       <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
//         <Ionicons name="menu" size={25} color="white" />
//       </TouchableOpacity>
//       <Text style={styles.title}>AHALLYA INFOTECH PVT LTD</Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     height: 60,
//     backgroundColor: '#6200ee',
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 15,
//   },
//   title: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginLeft: 15,
//   },
// });

// export default Header;
//

import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerHeaderProps } from '@react-navigation/drawer';

const Header = ({ navigation, route }: DrawerHeaderProps) => {
  const isShow = route.name === 'Details' || route.name === 'Home';

  return (
    <View style={styles.container}>
      <View style={styles.hdrcontainer}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
          <Ionicons name="menu" size={25} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>AHALLYA INFOTECH PVT LTD</Text>
        <View style={styles.Iconnotfction}><Image source={require('../../assets/images/notification.png')} style={styles.menuIcon} /></View>
      </View>

      {/* Show profile section only on the Home screen */}
      {isShow && (
        <View style={styles.profileContainer}>
          <View style={styles.userimagewraper}>
            <View style={styles.userimagewrapergray}>
              <Image source={require('../../assets/images/userphoto.jpg')} style={styles.userimage} />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>George Fernandes</Text>
            <Text style={styles.userRole}>Sr. Software Developer</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#133F7C',
    padding: 15,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hdrcontainer: {
    backgroundColor: '#133F7C',
    padding: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 23,
  },
  Iconnotfction: {
    backgroundColor: '#ffffff',
    width: 26,
    height: 26,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  userimagewraper:
  {
    backgroundColor: '#CC0000',
    width: 53, height: 53,
    borderRadius: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  userimagewrapergray: {
    backgroundColor: '#CC0000',
    width: 53, height: 53,
    borderRadius: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userimage: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
    marginLeft: 20,
  },
  profileContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    alignContent: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20, // for rounded image
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'column',
    marginLeft: 20,
  },
  userName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  userRole: {
    color: 'white',
    fontSize: 12,
  },
});

export default Header;

