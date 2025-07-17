

import React, { useState,useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet,StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import UserStorage from '../utils/userStorage';
import { getFileUrl } from '../config/apiConfig';
import { useDrawer } from '../context/DrawerContext';

const Header = ({ navigation, route }: DrawerHeaderProps) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isShow = route.name === 'Details' || route.name === 'Home';
  const { isDrawerRefreshing } = useDrawer();
  
  useEffect(() => {
    loadUserData();
  }, [isDrawerRefreshing]); // Refresh when drawer refresh is triggered

  const loadUserData = async () => {
    try {
      console.log('Header: Starting to load user data...');
      setIsLoading(true);
      setError(null);
      
      const storedUserData = await UserStorage.getUserData();
      console.log('Header: Retrieved user data:', storedUserData);
      
      if (storedUserData) {
        setUserData(storedUserData);
        console.log('Header: User data set successfully');
      } else {
        console.log('Header: No user data found in storage');
        setError('No user data available');
      }
    } catch (error) {
      console.error('Header: Error loading user data:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  // Debug logging for render
  console.log('Header: Rendering with userData:', userData);
  console.log('Header: isLoading:', isLoading);
  console.log('Header: error:', error);

  return (
    <>
    <StatusBar 
    backgroundColor="#133F7C" 
    barStyle="light-content" 
    translucent={false}
  />
    <View style={styles.container}>
      <View style={styles.hdrcontainer}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
          <Ionicons name="menu" size={25} color="white" />
        </TouchableOpacity>
        {/* <Text style={styles.title}>
          {userData?.CompNam
            ? userData.CompNam.length > 28
              ? userData.CompNam.slice(0, 25) + '...'
              : userData.CompNam
            : isLoading 
              ? 'Loading...' 
              : error 
                ? 'Error Loading' 
                : 'COMPANY NAME'}
        </Text> */}
           <Text style={styles.title}>
          {userData?.CompNam
            }
        </Text>
        <View style={styles.Iconnotfction}>
          <Image source={require('../../assets/images/notification.png')} style={styles.menuIcon} />
        </View>
      </View>

      {/* Show profile section only on the Home screen */}
      {isShow && (
        <View style={styles.profileContainer}>
          <View style={styles.userimagewraper}>
            <View style={styles.userimagewrapergray}>
              <Image 
                source={
                  userData?.EmployeePhotoUrl 
                    ? { uri: getFileUrl(`/${userData.EmployeePhotoUrl}`) } 
                    : require('../../assets/images/userphoto.jpg')
                }
                style={styles.userimage}
                onError={(error) => {
                  console.log('Header: Image load error:', error);
                }}
              />
            </View>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {userData?.EmployeeName || (isLoading ? 'Loading...' : 'User Name')}
            </Text>
            <Text style={styles.userRole}>
              {userData?.UserNam || (isLoading ? 'Loading...' : 'email@email.com')}
            </Text>
          </View>
        </View>
      )}
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#133F7C',
    padding: 5,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hdrcontainer: {
    backgroundColor: '#133F7C',
    padding: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 5,
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
  menuIcon: {
    width: 16,
    height: 16,
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

