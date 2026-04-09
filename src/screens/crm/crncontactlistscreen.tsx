import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

type ContactItem = {
  AccountName: string;
  ContactId: number;
  FkRelationId: number | null;
  FkAccountId: number | null;
  FkCompId: number | null;
  ContactName: string;
  Email: string | null;
  SecondaryMail: string | null;
  Phone: string | null;
  Mobile: string | null;
  Fax: string | null;
  Department: string | null;
  Street: string | null;
  City: string | null;
  State: string | null;
  Zip: string | null;
  FkCntryId: number | null;
  CntryNam: string | null;
  Otherinfo: string | null;
  CrtdBy: number | null;
  CrtdOn: string | null;
  MdfdBy: number | null;
  MdfdOn: string | null;
  RecStatus: number | null;
};

const CrnContactListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const fkRelationId = route?.params?.RelationId ? String(route.params.RelationId) : '0';
  const fullMode = route?.params?.FullMode ? String(route.params.FullMode) : '1';
  const fkAccIdContact = route?.params?.FkAccIdContact ? String(route.params.FkAccIdContact) : '0';
  const companyName = route?.params?.CompanyName ? String(route.params.CompanyName) : '';

  const [data, setData] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [showFullData, setShowFullData] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
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

        const compid = String(userData?.CompId ?? '0');
        const userId = String(userData?.UserId ?? '0');

        const apiUrl = getApiUrl('/api/cr5011/LG_Mode');
        const response = await axios.post<ContactItem[]>(
          apiUrl,
          {
            Compid: compid,
            LanguageId: '1',
            UserId: userId,
            MobileViewFlag: '1',
            ShowFullData: showFullData ? '1' : '0',
            FkRelationId: fkRelationId,
          //  FullMode: fullMode,
          FullMode:'0',
            FkAccIdContact: fkAccIdContact,
            FilterParams: '',
          },
          {
            headers: {
              ...API_CONFIG.DEFAULT_HEADERS,
              Authorization: `Bearer ${token}`,
            },
            timeout: API_CONFIG.TIMEOUT,
          },
        );

        setData(Array.isArray(response.data) ? response.data : []);
        setOpenIndexes([]);
      } catch (e: any) {
        setError(e?.message || 'Failed to fetch contacts');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [fkRelationId, fullMode, fkAccIdContact, showFullData]);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(
      openIndexes.includes(idx)
        ? openIndexes.filter((i) => i !== idx)
        : [...openIndexes, idx],
    );
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
          <Text style={styles.errorTitle}>Contacts</Text>
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
          <Text style={styles.pagetitle}>Contact</Text>
        </View>
        <TouchableOpacity
          style={styles.newEntryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('crncontactcrud', { RelationId: Number(fkRelationId), AccountId: Number(fkAccIdContact), ContactId: 0, CompanyName: companyName })}
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
        {data.length === 0 && <Text style={styles.emptyText}>No contacts found.</Text>}

        {data.map((item, idx) => (
          <View key={`${item.ContactId}-${idx}`} style={styles.accordion}>
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
                  {item.AccountName || '-'}
                </Text>
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
                  <Text style={styles.lbl}>Contact Name:</Text>
                  <Text style={styles.vlue}>{item.ContactName || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Email:</Text>
                  <Text style={styles.vlue}>{item.Email || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Secondary Mail:</Text>
                  <Text style={styles.vlue}>{item.SecondaryMail || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Phone:</Text>
                  <Text style={styles.vlue}>{item.Phone || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Mobile:</Text>
                  <Text style={styles.vlue}>{item.Mobile || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Fax:</Text>
                  <Text style={styles.vlue}>{item.Fax || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Department:</Text>
                  <Text style={styles.vlue}>{item.Department || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Street:</Text>
                  <Text style={styles.vlue}>{item.Street || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>City:</Text>
                  <Text style={styles.vlue}>{item.City || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>State:</Text>
                  <Text style={styles.vlue}>{item.State || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Zip:</Text>
                  <Text style={styles.vlue}>{item.Zip || '-'}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Country:</Text>
                  <Text style={styles.vlue}>{item.CntryNam || '-'}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Other Info:</Text>
                  <Text style={styles.vlue}>{item.Otherinfo || '-'}</Text>
                </View>
                <View style={styles.editRow}>
                  <TouchableOpacity
                    style={styles.editButton}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('crncontactcrud', {
                        RelationId: Number(fkRelationId),
                        AccountId: Number(fkAccIdContact),
                        ContactId: item.ContactId,
                        CompanyName: companyName,
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

export default CrnContactListScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

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
});
