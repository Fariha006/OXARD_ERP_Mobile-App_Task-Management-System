import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

type ReportItem = {
  ReportSettingsId: number;
  ReportName: string;
  CategoryName: string;
  CrtdBy: number;
  CrtdOn: string;
  MdfdBy: number;
  MdfdOn: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Contacts: '#2196F3',
  Account: '#4CAF50',
  Documents: '#FF9800',
  Notes: '#9C27B0',
  Activities: '#E91E63',
};

const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] ?? '#607D8B';

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Contacts':
      return '👤';
    case 'Account':
      return '🏢';
    case 'Documents':
      return '📄';
    case 'Notes':
      return '📝';
    case 'Activities':
      return '📊';
    default:
      return '📋';
  }
};

const CrmReportMenuListScreen = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
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

        const apiUrl = getApiUrl('/api/cr0080/LG_Mode');
        const response = await axios.post<ReportItem[]>(
          apiUrl,
          {
            Compid: compid,
            UserId: userId,
            LanguageId: 1,
          },
          {
            headers: {
              ...API_CONFIG.DEFAULT_HEADERS,
              Authorization: `Bearer ${token}`,
            },
            timeout: API_CONFIG.TIMEOUT,
          },
        );

        setData(response.data ?? []);
      } catch (err: any) {
        console.error('CRM Report Menu: fetch failed:', err);
        setError(err?.message || 'Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

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
          <Text style={styles.pageTitle}>Reports</Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#811458" />
            <Text style={styles.loadingText}>Loading Reports…</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.7}
            onPress={() => {
              setLoading(true);
              setError(null);
              setTimeout(() => setLoading(false), 100);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No Reports</Text>
          <Text style={styles.emptyText}>No reports are available at the moment.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>
            {data.length} Report{data.length !== 1 ? 's' : ''} Available
          </Text>

          {data.map((item) => {
            const color = getCategoryColor(item.CategoryName);
            const icon = getCategoryIcon(item.CategoryName);
            return (
              <TouchableOpacity
                key={item.ReportSettingsId}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.navigate('crmreportscreen', {
                    ReportSettingsId: item.ReportSettingsId,
                    ReportName: item.ReportName,
                  });
                }}
              >
                <View style={[styles.cardAccent, { backgroundColor: color }]} />
                <View style={[styles.iconCircle, { backgroundColor: color + '18' }]}>
                  <Text style={styles.iconEmoji}>{icon}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.reportName} numberOfLines={2}>
                    {item.ReportName}
                  </Text>
                  <View style={styles.categoryRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: color + '18' }]}>
                      <Text style={[styles.categoryBadgeText, { color }]}>
                        {item.CategoryName}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.viewButton}>
                  <Text style={styles.viewArrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },

  /* ── Header ── */
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 22,
    color: '#811458',
  },
  topBarRight: {
    width: 45,
  },

  /* ── Loading ── */
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 40,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },

  /* ── Error ── */
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#d32f2f',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#811458',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  /* ── Empty ── */
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#444',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  /* ── List ── */
  listContainer: {
    padding: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
    marginLeft: 4,
  },

  /* ── Card ── */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingRight: 14,
    paddingLeft: 0,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#811458',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardAccent: {
    width: 4,
    height: '100%',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  iconEmoji: {
    fontSize: 20,
  },
  cardBody: {
    flex: 1,
    marginLeft: 14,
  },
  reportName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  viewArrow: {
    fontSize: 22,
    fontWeight: '700',
    color: '#811458',
    marginTop: -2,
  },
});

export default CrmReportMenuListScreen;
