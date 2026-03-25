

import React, { useState,useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet,StatusBar, Alert, Platform, PermissionsAndroid } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { DrawerActions } from '@react-navigation/native';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserStorage from '../utils/userStorage';
import { getFileUrl } from '../config/apiConfig';
import { useDrawer } from '../context/DrawerContext';
import { submitAttendance } from '../api/api';
import Geolocation from '@react-native-community/geolocation';


const Header = ({ navigation, route }: DrawerHeaderProps) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: string, longitude: string} | null>(null);
  const isShow = route.name === 'Details' || route.name === 'Home';
  const { isDrawerRefreshing } = useDrawer();
  
  useEffect(() => {
    loadUserData();
    getCurrentLocation();
  }, [isDrawerRefreshing]); // Refresh when drawer refresh is triggered

  // Get current location
  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          latitude: latitude.toString(),
          longitude: longitude.toString()
        });
        console.log('Header: Current GPS location:', { latitude, longitude });
      },
      (error) => {
        // Fallback to default coordinates
        setCurrentLocation({
          latitude: "12.9716",
          longitude: "77.5946"
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

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
        
        // Set check-in status based on AttendanceId
        if (storedUserData?.AttendanceId && Number(storedUserData.AttendanceId) > 0) {
          setIsCheckedIn(true);
          console.log('Header: User is checked in');
        } else {
          setIsCheckedIn(false);
          console.log('Header: User is not checked in');
        }
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

  // Handle attendance (check-in/check-out)
  const handleAttendance = async () => {
    if (isAttendanceLoading) return; // Prevent multiple clicks
    
    setIsAttendanceLoading(true);
    try {
      // Refresh location before submitting attendance
      getCurrentLocation();
      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please login again.');
        return;
      }

      const currentUserData = await UserStorage.getUserData();
      if (!currentUserData) {
        Alert.alert('Error', 'User data not found. Please login again.');
        return;
      }

      // Get current date and time
      const now = new Date();
      const punchDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const punchTime = now.toTimeString().split(' ')[0]; // HH:MM:SS format

      // Determine if this is check-in or check-out
      const isCurrentlyCheckedIn = currentUserData.AttendanceId && Number(currentUserData.AttendanceId) > 0;
      
      // Get current location or use default
      const location = currentLocation || { latitude: "12.9716", longitude: "77.5946" };
      
      const attendanceData = {
        Mode: isCurrentlyCheckedIn ? "U" : "I",
        AttendanceId: isCurrentlyCheckedIn ? currentUserData.AttendanceId.toString() : "0",
        Latitude: location.latitude,
        Longitude: location.longitude,
        Place: " ", // You can replace with actual place name
        PunchDate: punchDate,
        PunchTime: punchTime
      };

      console.log('Header: Submitting attendance data:', attendanceData);

      const response = await submitAttendance(attendanceData, token);
      
      if (response.success) {
        // Update the AttendanceId in storage
        await UserStorage.updateAttendanceId(response.attendanceId);
        
        // Update local state
        setIsCheckedIn(!isCurrentlyCheckedIn);
        
        // Show success message
        const action = isCurrentlyCheckedIn ? 'Check-out' : 'Check-in';
        //Alert.alert('Success', `${action} successful!`);
        
        // Reload user data to reflect changes
        loadUserData();
      } else {
        Alert.alert('Error', response.message || 'Attendance submission failed');
      }
    } catch (error: any) {
      console.error('Header: Attendance submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Debug logging for render
  console.log('Header: Rendering with userData:', userData);
  console.log('Header: isLoading:', isLoading);
  console.log('Header: error:', error);

  const openDrawerForIOS = () => {
    let currentNav: any = navigation;
    while (currentNav) {
      currentNav.dispatch(DrawerActions.openDrawer());
      currentNav = currentNav.getParent?.();
    }
  };

  return (
    <>
    <StatusBar 
    backgroundColor="#133F7C" 
    barStyle="light-content" 
    translucent={false}
  />
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.hdrcontainer}>
        <TouchableOpacity
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => {
            if (Platform.OS === 'android') {
              navigation.toggleDrawer();
            } else {
              openDrawerForIOS();
            }
          }}
        >
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
                 {/* Notification Icon */}
         <TouchableOpacity
           style={styles.Iconnotfction}
           onPress={() => navigation.navigate('Main', { screen: 'Notification' })}
         >
           <Image source={require('../../assets/images/notification.png')} style={styles.menuIcon} />
         </TouchableOpacity>
         
         {/* Settings Icon */}
         {/* <TouchableOpacity
           style={[styles.Iconnotfction, { marginLeft: 8 }]}
           onPress={() => navigation.navigate('Settings')}
         >
           <Ionicons name="settings-outline" size={16} color="#133F7C" />
         </TouchableOpacity> */}
      </View>

      {/* Show profile section and check-in/check-out button only on the Home and Details screens */}
      {isShow && (
        <View style={styles.profileContainer}>
          <View style={styles.profileLeftSection}>
            <View style={styles.userimagewraper}>
              <View style={styles.userimagewrapergray}>
                <Image 
                  source={
                    userData?.EmployeePhotoUrl 
                      ? { uri: getFileUrl(`/${userData.EmployeePhotoUrl}`) } 
                      : require('../../assets/images/profile-picture.png')
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
                {userData?.DesgNam || (isLoading ? 'Loading...' : '')}
              </Text>
            </View>
          </View>
          
          {/* Check-in/Check-out Button - Right Side */}
          <TouchableOpacity
            style={[
              styles.attendanceButton,
              isCheckedIn ? styles.checkedInButton : styles.checkedOutButton,
              isAttendanceLoading && styles.loadingButton
            ]}
            onPress={handleAttendance}
            disabled={isAttendanceLoading}
          >
            <Text style={styles.attendanceButtonText}>
              {isAttendanceLoading ? '...' : (isCheckedIn ? 'Check Out' : 'Check In')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#811458',
    padding: 5,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  hdrcontainer: {
   // backgroundColor: '#133F7C',
   backgroundColor: '#811458',
    // backgroundColor: 'pink',
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' ? 0 : 20,
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
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
    marginLeft: 15,
    marginTop: 3,
  },
  profileContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 10,
    marginRight: 1,
    alignContent: 'center',
  },
  profileLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  attendanceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 1,
  },
  checkedInButton: {
    backgroundColor: '#f3bf12',
   
  },
  checkedOutButton: {
    backgroundColor: '#4ecdc4',
  },
  loadingButton: {
    backgroundColor: '#cccccc',
  },
  attendanceButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Header;

