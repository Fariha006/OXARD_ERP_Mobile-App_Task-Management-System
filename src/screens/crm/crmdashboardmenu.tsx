import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import UserStorage from '../../utils/userStorage';
import { API_CONFIG, getApiUrl, getFileUrl } from '../../config/apiConfig';
import type { CrmLoModeResponse } from '../../types/crmLoMode';

const menuItems = [
  { text: 'Lead', url: 'leadordeal', image: '', params: { StatusId: 1, menutype: 1 } },
  { text: 'Deal', url: 'leadordeal', image: '', params: { StatusId: 2, menutype: 1 } },
  { text: 'Notes', url: '', image: '', params: undefined },
  { text: 'Documents', url: '', image: '', params: undefined },
  { text: 'Tasks', url: '', image: '', params: undefined },
  { text: 'Meetings', url: '', image: '', params: undefined },
  { text: 'Calls', url: '', image: '', params: undefined },
  { text: 'Accounts', url: '', image: '', params: undefined },
  { text: 'Contacts', url: 'crncontactlist', image: '', params: { RelationId: 0, FullMode: 0, FkAccIdContact: 0, CompanyName: '' } },
];

const CrmDashboardMenu = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loModeLoading, setLoModeLoading] = useState(true);
  const [loModeError, setLoModeError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

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

    const fetchAndStoreLoMode = async () => {
      setLoModeLoading(true);
      setLoModeError(null);
      try {
        const token = await UserStorage.getToken();
        const storedUser = await UserStorage.getUserData();
        if (!token) {
          setLoModeError('Not signed in.');
          return;
        }

        const compid = storedUser?.CompId ?? 0;
        const userId = storedUser?.UserId ?? 0;
        const apiurl = getApiUrl('/api/cr5010/LO_Mode');
        const requestBody = {
          Compid: String(compid),
          LanguageId: '1',
          UserId: String(userId),
          Status: '1',
        };

        const response = await axios.post<CrmLoModeResponse>(apiurl, requestBody, {
          headers: {
            ...API_CONFIG.DEFAULT_HEADERS,
            Authorization: `Bearer ${token}`,
          },
          timeout: API_CONFIG.TIMEOUT,
        });

        await UserStorage.storeCrmLoModeData(response.data);
      } catch (error: any) {
        console.error('CRM Dashboard: LO_Mode fetch failed:', error);
        setLoModeError(error?.message || 'Failed to load CRM options.');
      } finally {
        setLoModeLoading(false);
      }
    };

    loadUserData();
    fetchAndStoreLoMode();
  }, []);

  const handleMenuPress = async (url: string, params?: Record<string, unknown>) => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }

    const isExternalUrl = /^(https?:\/\/|mailto:|tel:)/i.test(trimmedUrl);

    try {
      if (isExternalUrl) {
        const canOpen = await Linking.canOpenURL(trimmedUrl);
        if (canOpen) {
          await Linking.openURL(trimmedUrl);
        }
        return;
      }

      navigation.navigate(trimmedUrl, params);
    } catch (error) {
      console.error('CRM Dashboard: Failed to navigate:', error);
    }
  };

  if (loModeLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#811458" />
          <Text style={styles.loadingText}>Loading CRM…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <View style={styles.backIconWrap}>
            <Image
              source={require('../../../assets/images/backarow.png')}
              style={styles.backIconImg}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>CRM MODULE</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {loModeError ? (
          <Text style={styles.bannerError}>{loModeError}</Text>
        ) : null}
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

        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.text}
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.url, item.params)}
            >
              <View style={styles.iconWrapper}>
                <Text style={styles.iconText}>{item.text.charAt(0)}</Text>
              </View>
              <Text style={styles.menuText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingRight: 10,
  },
  backIconWrap: {
    marginLeft: 20,
  },
  backIconImg: {
    width: 25,
    height: 25,
  },
  pageTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#811458',
  },
  topBarRight: {
    width: 25,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#374151',
  },
  bannerError: {
    color: '#b91c1c',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
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
