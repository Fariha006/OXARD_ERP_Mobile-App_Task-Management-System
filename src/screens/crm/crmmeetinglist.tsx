import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

type MeetingItem = {
  TaskId: number;
  RelationTrackNo: string;
  RegisterDate: string;
  CompanyName: string;
  Title: string;
  Date: string;
  EmployeeName: string;
  Status: string;
  FkRelationId: number;
  Details: string;
  MeetingVenue: string;
  MeetingLink: string;
  [key: string]: any;
};

type RelationItem = {
  RelationId: number;
  RelationTrackNo: string;
};

const CrmMeetingListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const status = route?.params?.Status ? Number(route.params.Status) : 1;
  const fkRelationId = route?.params?.RelationId ? Number(route.params.RelationId) : 0;

  const [data, setData] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [showFullData, setShowFullData] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchMeetings = async () => {
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

          const apiUrl = getApiUrl('/api/cr5014/LGM_Mode');
          const response = await axios.post(
            apiUrl,
            {
              Compid: compid,
              UserId: userId,
              LanguageId: 1,
              MobileViewFlag: 1,
              ShowFullData: showFullData ? 1 : 0,
              FilterParams: '[]',
              Status: status,
              FkRelationId: fkRelationId,
            },
            {
              headers: {
                ...API_CONFIG.DEFAULT_HEADERS,
                Authorization: `Bearer ${token}`,
              },
              timeout: API_CONFIG.TIMEOUT,
            },
          );

          const result = response.data;
          const meetings: MeetingItem[] = Array.isArray(result?.Item1) ? result.Item1 : [];
          const relations: RelationItem[] = Array.isArray(result?.Item2) ? result.Item2 : [];

          // Build a map: RelationId -> RelationTrackNo
          const rMap: Record<number, string> = {};
          relations.forEach((r) => {
            rMap[r.RelationId] = r.RelationTrackNo;
          });

          // Merge RelationTrackNo from Item2 into each meeting
          const merged = meetings.map((meeting) => ({
            ...meeting,
            RelationTrackNo: rMap[meeting.FkRelationId] || meeting.RelationTrackNo || '-',
          }));

          setData(merged);
          setOpenIndexes([]);
        } catch (e: any) {
          setError(e?.message || 'Failed to fetch meetings');
          setData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchMeetings();
    }, [status, fkRelationId, showFullData]),
  );

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
          <Text style={styles.errorTitle}>Meetings</Text>
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
          <Text style={styles.pagetitle}>Meetings</Text>
        </View>
        <TouchableOpacity
          style={styles.newEntryButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('crmmeetingcrud', { RelationId: fkRelationId, TaskId: 0, Status: status })}
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
        {data.length === 0 && <Text style={styles.emptyText}>No meetings found.</Text>}

        {data.map((item, idx) => {
          const trackNo = item.RelationTrackNo || '-';
          return (
            <View key={`${item.TaskId ?? idx}-${idx}`} style={styles.accordion}>
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
                    {trackNo}
                  </Text>
                </View>
                <Text style={styles.chevron}>{openIndexes.includes(idx) ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {openIndexes.includes(idx) && (
                <View style={styles.accordionContent}>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Employee Name:</Text>
                    <Text style={styles.vlue}>{item.EmployeeName || '-'}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Date:</Text>
                    <Text style={styles.vlue}>{item.Date || '-'}</Text>
                  </View>
                  <View style={styles.odd}>
                    <Text style={styles.lbl}>Company Name:</Text>
                    <Text style={styles.vlue}>{item.CompanyName || '-'}</Text>
                  </View>
                  <View style={styles.even}>
                    <Text style={styles.lbl}>Status:</Text>
                    <Text style={styles.vlue}>{item.Status || '-'}</Text>
                  </View>
                  <View style={styles.editRow}>
                    <TouchableOpacity
                      style={styles.editButton}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate('crmmeetingcrud', {
                          RelationId: item.FkRelationId,
                          TaskId: item.TaskId,
                          Status: status,
                        })
                      }
                    >
                      <Text style={styles.editButtonText}>✎  Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CrmMeetingListScreen;

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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#e53935',
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
