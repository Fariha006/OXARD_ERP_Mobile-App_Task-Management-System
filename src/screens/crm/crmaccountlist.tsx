import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  Image,
} from 'react-native';
import axios from 'axios';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import UserStorage from '../../utils/userStorage';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';

const CrmAccountList = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [showFullData, setShowFullData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const token = await UserStorage.getToken();
          const userData = await UserStorage.getUserData();
          if (!token) {
            setError('No authentication token found. Please login again.');
            setData([]);
            return;
          }
          const compid = userData?.CompId ?? 0;
          const userId = userData?.UserId ?? 0;
          const apiurl = getApiUrl('/api/cr0060/LG_Mode');
          const requestBody = {
            Compid: compid,
            UserId: userId,
            LanguageId: 1,
            MobileViewFlag: 0,
            ShowFullData: showFullData ? 1 : 0,
            IsAccount: 1,
            FilterParams: '[]',
          };
          const response = await axios.post(apiurl, requestBody, {
            headers: {
              ...API_CONFIG.DEFAULT_HEADERS,
              Authorization: `Bearer ${token}`,
            },
            timeout: API_CONFIG.TIMEOUT,
          });
          setData(Array.isArray(response.data) ? response.data : []);
          setOpenIndexes([]);
        } catch (e: any) {
          setError(e?.message || 'Failed to fetch data');
          setData([]);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [showFullData])
  );

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? openIndexes.filter(i => i !== idx)
      : [...openIndexes, idx]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#811458" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Accounts</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={[styles.back, styles.toptitle]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.backicon}>
            <Image
              source={require('../../../assets/images/backarow.png')}
              style={styles.backiconimg}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Accounts</Text>
        </View>
        <TouchableOpacity
          style={styles.newEntryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('crmaccountcrud', { AccountId: 0 })}
        >
          <Text style={styles.newEntryButtonText}>New Entry</Text>
        </TouchableOpacity>
      </View>
      {/* Show Full Data Switch */}
      <View style={styles.topControlsContainer}>
        <View style={styles.showAllDataContainer}>
          <Text style={styles.showAllDataLabel}>Show full data</Text>
          <View style={styles.switchContainer}>
            <Switch
              value={showFullData}
              onValueChange={setShowFullData}
              trackColor={{ false: '#767577', true: '#133F7C' }}
              thumbColor={showFullData ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {data.length === 0 && <Text style={styles.emptyText}>No accounts found.</Text>}
        {data.map((item, idx) => (
          <View key={item.AccountId || idx} style={styles.accordion}>
            <TouchableOpacity
              style={[
                styles.accordionHeader,
                openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed,
              ]}
              onPress={() => toggleAccordion(idx)}
              activeOpacity={0.7}
            >
              <View style={styles.headerRow}>
                <Text style={styles.accordionTitle} numberOfLines={1}>
                  {item.AccountName || 'Company Name'}
                </Text>
                <Text style={styles.headerDate}>{item.City || '-'}</Text>
              </View>
              <Text style={styles.chevron}>{openIndexes.includes(idx) ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Account Name:</Text>
                  <Text style={styles.vlue}>{item.AccountName || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Sales Person:</Text>
                  <Text style={styles.vlue}>{item.SalesPersonName || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Industry:</Text>
                  <Text style={styles.vlue}>{item.IndustryName || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Street:</Text>
                  <Text style={styles.vlue}>{item.Street || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>City:</Text>
                  <Text style={styles.vlue}>{item.City || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>State:</Text>
                  <Text style={styles.vlue}>{item.State || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Country:</Text>
                  <Text style={styles.vlue}>{item.Country || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Zip Code:</Text>
                  <Text style={styles.vlue}>{item.ZipCode || '-'}</Text>
                </View>
                <View style={styles.editRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('crmaccountcrud', { AccountId: item.AccountId })}
                  >
                    <Text style={styles.editButtonText}>✎  Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  back: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  toptitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 10,
  },
  pagewrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pagetitle: {
    fontSize: 22,
    color: '#811458',
  },
  backicon: {
    marginLeft: 20,
  },
  backiconimg: {
    width: 24,
    height: 24,
  },
  scrollContainer: {
    padding: 16,
  },
  accordion: {
    borderRadius: 8,
    padding: 0,
    marginBottom: 10,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  accordionHeaderOpen: {
    backgroundColor: '#F0F0F0',
  },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingRight: 6,
    columnGap: 10,
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    flexShrink: 1,
  },
  headerDate: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 12,
    color: 'gray',
    paddingLeft: 10,
  },
  accordionContent: {
    marginTop: 1,
    paddingLeft: 6,
    paddingRight: 6,
  },
  odd: {
    backgroundColor: '#ffffff',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  even: {
    backgroundColor: '#F0F0F0',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  lbl: {
    fontSize: 11,
    color: 'gray',
    paddingLeft: 12,
    fontWeight: '600',
  },
  vlue: {
    fontSize: 11,
    color: '#000000',
    paddingLeft: 12,
  },
  editRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 6,
    paddingBottom: 4,
    paddingRight: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#811458',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#811458',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#FF0000',
    textAlign: 'center',
  },
  topControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  showAllDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  showAllDataLabel: {
    fontSize: 12,
    color: '#333',
    marginRight: 8,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newEntryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#811458',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 92,
  },
  newEntryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default CrmAccountList;
