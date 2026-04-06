import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import UserStorage from '../../utils/userStorage';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';

type LeadOrDealItem = {
  RelationId: number;
  RelationTrackNo: string;
  RegisterDate: string;
  LeadTypeId: number;
  LeadTypeName: string;
  CompanyName: string;
  ContactPerson: string;
  MobileNumber: string;
  Email: string;
  Status: number;
  StatusName: string;
};

const LeadOrDealScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const statusId = Number(route?.params?.StatusId);

  const screenTitle = useMemo(() => {
    return statusId === 1 ? 'Lead' : statusId === 2 ? 'Deal' : 'Lead Or Deal';
  }, [statusId]);

  const [data, setData] = useState<LeadOrDealItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [showFullData, setShowFullData] = useState(false);

  useEffect(() => {
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
        const status = statusId === 2 ? 2 : 1; // default to Lead when param missing/invalid

        const apiurl = getApiUrl('/api/cr5010/LG_Mode');
        const requestBody = {
          Mode: 'LG',
          MobileViewFlag: 1,
          ShowFullData: showFullData ? 1 : 0,
          Compid: compid,
          LanguageId: 1,
          UserId: userId,
          Status: status,
          FilterParams: '',
        };

        const response = await axios.post<LeadOrDealItem[]>(apiurl, requestBody, {
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
  }, [statusId, showFullData]);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx) ? openIndexes.filter(i => i !== idx) : [...openIndexes, idx]);
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
          <Text style={styles.errorTitle}>{screenTitle}</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.pagetitle}>{screenTitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.newEntryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('leadordealcrud', { StatusId: statusId })}
        >
          <Text style={styles.newEntryButtonText}>New Entry</Text>
        </TouchableOpacity>
      </View>

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
        {data.length === 0 && <Text style={styles.emptyText}>No data found.</Text>}

        {data.map((item, idx) => (
          <View key={`${item.RelationId}-${idx}`} style={styles.accordion}>
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
                  {item.RelationTrackNo}
                </Text>
                <Text style={styles.accordionDate} numberOfLines={1}>
                  {item.RegisterDate}
                </Text>
              </View>
              <Text style={styles.chevron}>{openIndexes.includes(idx) ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Relation trackno:</Text>
                  <Text style={styles.vlue}>{item.RelationTrackNo || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Registration date:</Text>
                  <Text style={styles.vlue}>{item.RegisterDate || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Company name:</Text>
                  <Text style={styles.vlue}>{item.CompanyName || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Contact person:</Text>
                  <Text style={styles.vlue}>{item.ContactPerson || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Mobile number:</Text>
                  <Text style={styles.vlue}>{item.MobileNumber || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Email:</Text>
                  <Text style={styles.vlue}>{item.Email || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Status:</Text>
                  <Text style={styles.vlue}>{item.StatusName || item.Status?.toString?.() || '-'}</Text>
                </View>
                <View style={styles.editRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('leadordealcrud', {
                        StatusId: statusId,
                        searchid: item.RelationId,
                      })
                    }
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
    width: 25,
    height: 25,
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
  topControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  accordionDate: {
    fontSize: 11,
    color: 'gray',
    marginLeft: 10,
    flexShrink: 0,
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
    backgroundColor: '#133F7C',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    color: '#ffffff',
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
});

export default LeadOrDealScreen;
