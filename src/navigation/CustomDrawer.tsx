import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const CustomDrawer = ({ navigation }: DrawerContentComponentProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.headsep} />
      <View style={styles.userimagewraper}>
        <View style={styles.userimagewrapergray}>
          <Image source={require('../../assets/images/userphoto.jpg')} style={styles.userimage} />
        </View>
      </View>
      <View style={styles.Usrnmanddownarow}>
        <View>
          <Text style={styles.Username}>George Fernandes</Text>
          <Text style={styles.Useremail}>georgefernandes88@gmail.com</Text>
        </View>
        <View style={styles.downarows}>
          <Image source={require('../../assets/images/arrowdown.png')} />
        </View>
      </View>
      <View style={styles.drawwraper}>
        {/* <Text style={styles.title}>📂 Drawer Menu</Text> */}
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'MyDesk' })}>
          <View style={[styles.menuItem, styles.menuItemactive]}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/home.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>My Desk</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/requst.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>My Requests</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/payslip.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Payslips</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/aproval.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Approval</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/directory.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Directory</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/messages.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Messages</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/messages.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Leave Outstanding</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/approval2.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Approval</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Details' })}>
          <View style={styles.menuItem}>
            <View style={styles.divmenuIcon}><Image source={require('../../assets/images/addbtn.png')} style={styles.menuIcon} /></View>
            <Text style={styles.menuText}>Add Buttons</Text>
          </View>
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0, paddingLeft: 0, backgroundColor: '#ffffff' },
  headsep: { height: 20, backgroundColor: '#F1F6FD', marginBottom: 17, },
  drawwraper: { paddingLeft: 5, paddingRight: 5, },
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
  Useremail: { color: '#6D6F71', fontSize: 13, fontWeight: '300' },
  Username: { color: '#133F7C', fontWeight: 'bold', fontSize: 15, },
  menuItem:{ 
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', 
    borderRadius: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    marginBottom: 10,
  },
  menuItemactive:{ 
    backgroundColor: '#C8D2E1',
  },
  divmenuIcon:{ width:22,marginRight:12,},
  menuIcon:{ width:'100%',},
  menuText: { color: '#000000', fontSize: 16, fontWeight: '500'},
});
