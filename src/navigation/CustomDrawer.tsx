import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image,Alert  } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import UserStorage from '../utils/userStorage';
import { MenuItem } from '../api/api';
import { getFileUrl } from '../config/apiConfig';
import { useDrawer } from '../context/DrawerContext';


const CustomDrawer = ({ navigation }: DrawerContentComponentProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const { isDrawerRefreshing } = useDrawer();

  useEffect(() => {
    loadUserData();
  }, [isDrawerRefreshing]); // Refresh when drawer refresh is triggered

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
      text: 'Leave Outstanding',
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
        <View>
          {/* <Text style={styles.Username}>George Fernandes</Text>
          <Text style={styles.Useremail}>georgefernandes88@gmail.com</Text> */}
          <Text style={styles.Username}>{userData?.EmployeeName || 'User Name'}</Text>
          <Text style={styles.Useremail}>{userData?.DesgNam || ''}</Text>
        </View>
        {/* <View style={styles.downarows}>
          <Image source={require('../../assets/images/arrowdown.png')} />
        </View> */}
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
    borderRadius: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    marginBottom: 2,
 

  },
  menuItemsignout:{ 
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
    borderRadius: 10,
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
});
