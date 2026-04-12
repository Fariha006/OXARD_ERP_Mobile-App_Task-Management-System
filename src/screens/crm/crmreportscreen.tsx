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
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../../config/apiConfig';
import UserStorage from '../../utils/userStorage';

type ReportDataItem = Record<string, unknown>;

type FieldMeta = {
  caption: string;
  key: string;
};

const CrmReportScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const reportSettingsId = route?.params?.ReportSettingsId ?? 0;
  const reportName = route?.params?.ReportName ?? 'Report';

  const [data, setData] = useState<ReportDataItem[]>([]);
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
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

        const apiUrl = getApiUrl('/api/cr0080/LD_RPT_Mode');
        const response = await axios.post(
          apiUrl,
          {
            Compid: compid,
            UserId: userId,
            LanguageId: 1,
            ReportSettingsId: String(reportSettingsId),
            ShowFullData: 0,
            MobileViewFlag: 1,
            FilterParams: '[]',
          },
          {
            headers: {
              ...API_CONFIG.DEFAULT_HEADERS,
              Authorization: `Bearer ${token}`,
            },
            timeout: API_CONFIG.TIMEOUT,
          },
        );

        const rows: ReportDataItem[] = response.data ?? [];
        setData(rows);

        // Extract field metadata from first row
        if (rows.length > 0) {
          const firstRow = rows[0];
          const extractedFields: FieldMeta[] = Object.keys(firstRow).map((key) => ({
            caption: key,
            key,
          }));
          setFields(extractedFields);
        }
      } catch (err: any) {
        console.error('CRM Report Screen: fetch failed:', err);
        setError(err?.message || 'Failed to load report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [reportSettingsId]);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string' && value.trim() === '') return '-';
    return String(value);
  };

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
          <Text style={styles.pageTitle} numberOfLines={1}>
            {reportName}
          </Text>
        </View>
        <View style={styles.topBarRight} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#811458" />
          <Text style={styles.loadingText}>Loading Report…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No data available for this report.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>
            {data.length} Record{data.length !== 1 ? 's' : ''}
          </Text>

          {data.map((item, index) => (
            <View key={index} style={styles.card}>
              {fields.map((field) => {
                const value = formatValue(item[field.key]);
                return (
                  <View key={field.key} style={styles.fieldRow}>
                    <Text style={styles.fieldCaption}>{field.caption}</Text>
                    <Text style={styles.fieldValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          ))}
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
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555',
  },

  /* ── Error ── */
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#d32f2f',
    textAlign: 'center',
  },

  /* ── Empty ── */
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
  },

  /* ── List ── */
  listContainer: {
    padding: 16,
    paddingTop: 14,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  /* ── Field row ── */
  fieldRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  fieldCaption: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#811458',
  },
  fieldValue: {
    flex: 1.5,
    fontSize: 13,
    color: '#333',
    textAlign: 'right',
  },
});

export default CrmReportScreen;
