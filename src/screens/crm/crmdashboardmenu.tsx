import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import UserStorage from '../../utils/userStorage';
import { getFileUrl } from '../../config/apiConfig';

const menuItems = [
  'Lead',
  'Deal',
  'Notes',
  'Documents',
  'Tasks',
  'Meetings',
  'Calls',
  'Accounts',
  'Contacts',
];

const CrmDashboardMenu = () => {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await UserStorage.getUserData();
        if (storedUserData) {
          setUserData(storedUserData);
        }
      } catch (error) {
        console.error('CRM Dashboard: Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.profilepic}>
          <Image
            source={
              userData?.EmployeePhotoUrl
                ? { uri: getFileUrl(`/${userData.EmployeePhotoUrl}`) }
                : require('../../../assets/images/profile-picture.png')
            }
            style={styles.bannerImage}
            resizeMode="contain"
          />
        </View>
      </View>

      <Text style={styles.title}>CRM MODULE</Text>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <View key={item} style={styles.menuRow}>
            <View style={styles.iconWrapper}>
              <Text style={styles.iconText}>{item.charAt(0)}</Text>
            </View>
            <Text style={styles.menuText}>{item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  profilepic: {
    borderRadius: 100,
    width: 120,
    height: 120,
    backgroundColor: '#07478D',
  },
  bannerImage: {
    width: 120,
    height: 120,
    borderRadius: 100,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#811458',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuList: {
    width: '100%',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#811458',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  menuText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
});

export default CrmDashboardMenu;
