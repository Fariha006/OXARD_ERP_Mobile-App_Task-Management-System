import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

// ─── Types ────────────────────────────────────────────────────────────────────

type TimelineItem = {
  Activity: string | null;
  ActivityTime: string;
  ActivityDescription: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CIRCLE_SIZE      = 36;
const CENTER_COL_WIDTH = CIRCLE_SIZE + 24;

// ─── Component ────────────────────────────────────────────────────────────────

const CrmTimeline = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const relationId = route?.params?.RelationId ? String(route.params.RelationId) : '';

  const [data, setData]           = useState<TimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!relationId) { return; }
    const fetchTimeline = async () => {
      try {
        setIsLoading(true);
        const token    = await UserStorage.getToken();
        const userData = await UserStorage.getUserData();
        const compid   = String(userData?.CompId ?? '0');
        const userId   = String(userData?.UserId ?? '0');
        const apiUrl   = getApiUrl('/api/cr5014/TimeLine');
        const response = await axios.post<TimelineItem[]>(
          apiUrl,
          { FkRelationId: relationId, Compid: compid, UserId: userId, LanguageId: 1 },
          {
            headers: { ...API_CONFIG.DEFAULT_HEADERS, Authorization: `Bearer ${token}` },
            timeout: API_CONFIG.TIMEOUT,
          },
        );
        setData(Array.isArray(response.data) ? response.data : []);
      } catch (error: any) {
        const message = error?.response?.data?.message ?? error?.message ?? 'Failed to load timeline.';
        Alert.alert('Error', message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTimeline();
  }, [relationId]);

  // ── Shared top bar ────────────────────────────────────────────────────────

  const renderTopBar = () => (
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
        <Text style={styles.pageTitle}>LEADS TRACKING</Text>
      </View>
      <View style={styles.topBarPlaceholder} />
    </View>
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderTopBar()}
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#811458" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {renderTopBar()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {data.length === 0 ? (
          <Text style={styles.emptyText}>No timeline activity found.</Text>
        ) : (
          data.map((item, index) => {
            const isLeft = index % 2 === 0; // even → card on left, odd → card on right
            const isLast = index === data.length - 1;

            const card = (
              <View style={[styles.card, isLeft ? styles.cardRight : styles.cardLeft]}>
                {/* Triangle pointer toward center spine */}
                <View style={isLeft ? styles.arrowRight : styles.arrowLeft} />

                <Text style={styles.activityTitle}>
                  {item.Activity ?? 'Updated'}
                </Text>
                <Text style={styles.activityTime}>{item.ActivityTime}</Text>
                {item.ActivityDescription ? (
                  <Text style={styles.activityDesc}>{item.ActivityDescription}</Text>
                ) : null}
              </View>
            );

            return (
              <View key={index} style={styles.timelineRow}>

                {/* ── Left slot ── */}
                <View style={styles.sideSlot}>
                  {isLeft && card}
                </View>

                {/* ── Center spine: circle + connector line ── */}
                <View style={styles.centerCol}>
                  <View style={styles.circle}>
                    <Text style={styles.circleNumber}>{index + 1}</Text>
                  </View>
                  {!isLast && <View style={styles.connector} />}
                </View>

                {/* ── Right slot ── */}
                <View style={styles.sideSlot}>
                  {!isLeft && card}
                </View>

              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CrmTimeline;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingRight: 10,
  },
  backIconWrap: { marginLeft: 20 },
  backIconImg:  { width: 25, height: 25 },
  pageTitleWrap: { flex: 1, alignItems: 'center' },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#811458',
  },
  topBarPlaceholder: { width: 25 },

  /* Loading */
  loadingOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#811458',
    fontWeight: '600',
  },

  /* Scroll */
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 8,
  },

  /* Empty */
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#9e9e9e',
  },

  /* ── Alternating row ─────────────────────────────────────────────────────── */
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: CIRCLE_SIZE,
  },

  /* Each side takes equal space */
  sideSlot: {
    flex: 1,
    paddingTop: 4,
  },

  /* Center spine */
  centerCol: {
    width: CENTER_COL_WIDTH,
    alignItems: 'center',
  },

  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#811458',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#811458',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  circleNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  connector: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: '#811458',
    opacity: 0.3,
  },

  /* ── Card ────────────────────────────────────────────────────────────────── */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  /* Left-side card: accent border on right edge */
  cardRight: {
    marginRight: 6,
    borderRightWidth: 3,
    borderRightColor: '#811458',
  },

  /* Right-side card: accent border on left edge */
  cardLeft: {
    marginLeft: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#811458',
  },

  /* Triangle arrow — left card points RIGHT toward center */
  arrowRight: {
    position: 'absolute',
    right: -9,
    top: 13,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },

  /* Triangle arrow — right card points LEFT toward center */
  arrowLeft: {
    position: 'absolute',
    left: -9,
    top: 13,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#ffffff',
  },

  /* Card text */
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  activityTime: {
    fontSize: 11,
    color: '#9e9e9e',
    marginBottom: 5,
  },
  activityDesc: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 18,
  },
});
