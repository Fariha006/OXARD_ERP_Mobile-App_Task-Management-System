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
      </View>

      {/* Show profile section only on the Home screen */}
      {isShow && (
        <View style={styles.profileContainer}>
          <Image
            source={require('../../assets/images/Circle-icons-profile.svg.png')} // Update with your image path
            style={styles.profileImage}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>John Doe</Text>
            <Text style={styles.userRole}>Admin</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#007AFF',
    padding: 15,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
    hdrcontainer: {
    backgroundColor: '#007AFF',
    padding: 5,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left', // Align text to the left
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20, // for rounded image
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'column',
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

