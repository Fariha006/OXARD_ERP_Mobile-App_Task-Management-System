import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Switch, PermissionsAndroid, Platform } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import UserStorage from '../utils/userStorage';
import { MenuItem, submitAttendance } from '../api/api';
import { getFileUrl } from '../config/apiConfig';
import { useDrawer } from '../context/DrawerContext';
import Geolocation from '@react-native-community/geolocation';


const CustomDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: string, longitude: string} | null>(null);
  const { isDrawerRefreshing } = useDrawer();

  useEffect(() => {
    loadUserData();
    requestLocationPermission();
  }, [isDrawerRefreshing]); // Refresh when drawer refresh is triggered

  // Request location permission
  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
      // iOS permission is handled in Info.plist
      getCurrentLocation();
    } else {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location for attendance tracking.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    // For now, use default coordinates
    // To implement real GPS functionality, install and use:
    // npm install @react-native-community/geolocation
    // Then replace this with actual GPS code:
    
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({
          latitude: latitude.toString(),
          longitude: longitude.toString()
        });
        console.log('Current GPS location:', { latitude, longitude });
      },
      (error) => {
        console.error('GPS Error:', error);
        // Fallback to default coordinates
        setCurrentLocation({
          latitude: "12.9716",
          longitude: "77.5946"
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
   
    
   /* setCurrentLocation({
      latitude: "12.9716",
      longitude: "77.5946"
    });*/
    console.log('Using default location coordinates');
  };

  const loadUserData = async () => {
    try {
      console.log('CustomDrawer: Loading user data...');
      const storedMenuItems = await UserStorage.getMenuItems();
      const storedUserData = await UserStorage.getUserData();
      
      console.log('CustomDrawer: Stored menu items:', storedMenuItems?.length || 0);
      console.log('CustomDrawer: Stored user data:', storedUserData ? 'exists' : 'null');
      
      if (storedMenuItems) {
        setMenuItems(storedMenuItems);
        console.log('CustomDrawer: Menu items set successfully');
      }
      if (storedUserData) {
        setUserData(storedUserData);
        console.log('CustomDrawer: User data set successfully');
        
        // Debug AttendanceId issues
       // await UserStorage.debugAttendanceId();
        
        // Get updated user data after potential fix
        const updatedUserData = await UserStorage.getUserData();
        
        // Set check-in status based on AttendanceId
        console.log('CustomDrawer: AttendanceId check:', updatedUserData?.AttendanceId);
        console.log('CustomDrawer: AttendanceId type:', typeof updatedUserData?.AttendanceId);
        
        if (updatedUserData?.AttendanceId && Number(updatedUserData.AttendanceId) > 0) {
          setIsCheckedIn(true);
          console.log('CustomDrawer: User is checked in');
        } else {
          setIsCheckedIn(false);
          console.log('CustomDrawer: User is not checked in');
        }
      }
    } catch (error) {
      console.error('CustomDrawer: Error loading user data:', error);
    }
  };

  const isMenuItemVisible = (menuText: string): boolean => {
    return menuItems.some(item => 
      item.MenuDisplayCaption && 
      item.MenuDisplayCaption.toLowerCase().replace(/\s/g, '') === menuText.toLowerCase().replace(/\s/g, '')
    );
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
      const isCurrentlyCheckedIn = currentUserData.AttendanceId &&  Number(currentUserData.AttendanceId) > 0;
      
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

      console.log('Submitting attendance data:', attendanceData);

      const response = await submitAttendance(attendanceData, token);
      
      if (response.success) {
        // Update the AttendanceId in storage
        await UserStorage.updateAttendanceId(response.attendanceId);
        
        // Update local state
        setIsCheckedIn(!isCurrentlyCheckedIn);
        
        // Show success message
        const action = isCurrentlyCheckedIn ? 'Check-out' : 'Check-in';
        Alert.alert('Success', `${action} successful!`);
        
        // Reload user data to reflect changes
        loadUserData();
      } else {
        Alert.alert('Error', response.message || 'Attendance submission failed');
      }
    } catch (error: any) {
      console.error('Attendance submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit attendance');
    } finally {
      setIsAttendanceLoading(false);
    }
  };

  // Menu items configuration
  const menuItemsConfig = [
    {
      id: 'mydesk',
      text: 'My Desk',
      icon: require('../../assets/images/home.png'),
      screen: 'MyDesk',
      navigationParams: { screen: 'MyDesk' }
    },
    {
      id: 'myrequests',
      text: 'My Requests',
      icon: require('../../assets/images/requst.png'),
      screen: 'Home',
      navigationParams: { screen: 'RequestDashboard' }
    },
    {
      id: 'payslips',
      text: 'Payslips',
      icon: require('../../assets/images/payslip.png'),
      screen: 'Home',
      navigationParams: { screen: 'Payslip' }
    },
    {
      id: 'approval',
      text: 'Approval',
      icon: require('../../assets/images/aproval.png'),
      screen: 'Home',
      navigationParams: { screen: 'Approvals' }
    },
    {
      id: 'directory',
      text: 'Directory',
      icon: require('../../assets/images/directory.png'),
      screen: 'Details',
      navigationParams: { screen: 'Directory' }
    },
    {
      id: 'messages',
      text: 'Messages',
      icon: require('../../assets/images/messages.png'),
      screen: 'Details',
      navigationParams: { screen: 'Messege' }
    },
    {
      id: 'leaveoutstanding',
      text: 'Leave Balance',
      icon: require('../../assets/images/messages.png'),
      screen: 'Details',
      navigationParams: { screen: 'Details' }
    },
    {
      id: 'approval2',
      text: 'Approval',
      icon: require('../../assets/images/approval2.png'),
      screen: 'Details',
      navigationParams: { screen: 'Approvals' }
    },
    // {
    //   id: 'signout',
    //   text: 'Sign Out',
    //   icon: require('../../assets/images/btmsignout.png'),
    //   screen: 'Details',
    //   navigationParams: {screen:'Login'}
    // }
    // {
    //   id: 'addbuttons',
    //   text: 'Add Buttons',
    //   icon: require('../../assets/images/addbtn.png'),
    //   screen: 'Details',
    //   navigationParams: { screen: 'Details' }
    // }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headsep} />
      <View style={styles.userimagewraper}>
        <View style={styles.userimagewrapergray}>
          <Image 
            source={userData?.EmployeePhotoUrl ? { uri: getFileUrl(`/${userData.EmployeePhotoUrl}`) } : require('../../assets/images/userphoto.jpg')} 
            style={styles.userimage} 
          />
        
        </View>
      </View>
             <View style={styles.Usrnmanddownarow}>
         <View style={styles.userInfoContainer}>
           {/* <Text style={styles.Username}>George Fernandes</Text>
           <Text style={styles.Useremail}>georgefernandes88@gmail.com</Text> */}
                       <Text style={styles.Username}>{userData?.EmployeeName || 'User Name'}</Text>
            <Text style={styles.Useremail}>{userData?.DesgNam || ''}</Text>
            {/* {currentLocation && (
              <Text style={styles.locationText}>
                📍 Lat: {currentLocation.latitude}, Long: {currentLocation.longitude}
              </Text>
            )} */}
         </View>
                   <TouchableOpacity 
            style={[
              styles.attendanceSwitch,
              isCheckedIn ? styles.checkedInSwitch : styles.checkedOutSwitch,
              isAttendanceLoading && styles.loadingSwitch
            ]}
            onPress={handleAttendance}
            disabled={isAttendanceLoading}
          >
            <Text style={styles.attendanceSwitchText}>
              {isAttendanceLoading ? 'PROCESSING...' : (isCheckedIn ? 'CHECK OUT' : 'CHECK IN')}
            </Text>
          </TouchableOpacity>
       </View>
      <View style={styles.drawwraper}>
       
      

{menuItemsConfig.map((item, index) => {
          // Check if this menu item should be visible
          const isVisible = isMenuItemVisible(item.text);
          
          // If not visible, don't render the TouchableOpacity
          if (!isVisible) {
            return null;
          }

          return (
            <TouchableOpacity 
              key={item.id}
              onPress={() => navigation.navigate('Main', item.navigationParams)}
            >
              <View style={[styles.menuItem, index === 0 ? styles.menuItem : null]}>
                <View style={styles.divmenuIcon}>
                  <Image source={item.icon} style={styles.menuIcon} />
                </View>
                <Text style={styles.menuText}>{item.text}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Sign Out',
            'Do you want to Sign out?',
            [
              {
                text: 'No',
                style: 'cancel',
              },
              {
                text: 'Yes',
                style: 'destructive',
                onPress: () => navigation.navigate('Login'),
              },
            ]
          );
        }}>
        <View style={styles.menuItemsignout}>
        <View style={styles.divmenuIcon}>
          <Image source={require('../../assets/images/btmsignout.png')}
          style={styles.menuIcon} resizeMode="contain" />
        </View>
        <Text style={styles.menuText}>Sign Out</Text>
        </View>
      </TouchableOpacity>
        
      </View>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0, paddingLeft: 15, backgroundColor: "#E5EEFD" },
  headsep: { height: 20, backgroundColor: '#E5EEFD', marginBottom: 17, },
  drawwraper: { paddingLeft: 1, paddingRight: 5, },
  title: { fontSize: 18, marginBottom: 20 },
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
  Usrnmanddownarow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 20,
    alignItems: 'center',
    marginTop: 5,
    paddingBottom: 16,
    borderBottomColor: '#CECECE',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    marginBottom: 17,
  },
  downarows: {},
  Useremail: { color: 'black', fontSize: 13, fontWeight: '300' },
  Username: { color: '#133F7C', fontWeight: 'bold', fontSize: 15, },
  menuItem:{ 
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
    
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    marginBottom: 2,
 

  },
  menuItemsignout:{ 
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
   
    paddingTop: 25,
    paddingBottom: 8,
    paddingLeft: 10,
    marginBottom: 2,
    
    borderBottomColor: 'transparent',
    borderTopColor: '#CECECE',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
    borderWidth: 1,
    marginTop: 17,
    

  },
  menuItemactive:{ 
    backgroundColor: '#C8D2E1',
  },
  divmenuIcon:{ width:22,marginRight:12,},
  menuIcon:{ width:'100%',},
  menuText: { color: '#000000', fontSize: 12, fontWeight: '500'},
  attendanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingRight: 10,
  },
  attendanceText: {
    color: '#133F7C',
    fontSize: 14,
    fontWeight: '600',
  },
  attendanceSwitch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedInSwitch: {
    backgroundColor: '#ff6b6b',
  },
  checkedOutSwitch: {
    backgroundColor: '#4ecdc4',
  },
  loadingSwitch: {
    backgroundColor: '#cccccc',
  },
  attendanceSwitchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  designationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingRight: 10,
  },
  userInfoContainer: {
    flex: 1,
  },
  locationText: {
    color: '#666666',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 2,
  },
});
