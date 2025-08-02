import React, { useState, useEffect } from 'react';
import {
  View, Text, Button, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList,
  SafeAreaView, ActivityIndicator, Alert
} from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import UserStorage from '../utils/userStorage';
import { getApprovals } from '../api/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function ApprovalsScreen({ navigation }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await UserStorage.getToken();
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }
        const result = await getApprovals(token);
        setData(result);
      } catch (err) {
        setError('Failed to fetch approvals');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleAccordion = (idx: number) => {
    setOpenIndexes(openIndexes.includes(idx)
      ? openIndexes.filter(i => i !== idx)
      : [...openIndexes, idx]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading approvals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
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
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Approvals</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Array.isArray(data?.Item1) && data.Item1.length === 0 && <Text style={styles.lbl}>No approvals found.</Text>}
        {Array.isArray(data?.Item1) && data.Item1.map((item1: any, idx: number) => (
          <View key={idx} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(idx)}>
              <View style={styles.hdrltficn}>
                <Image source={require('../../assets/images/innerpage/star.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                <Text style={styles.accordionTitle}>{item1.MenuDisplayName} ({item1.RecordCount})</Text>
              </View>
              {/* <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text> */}
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                {Array.isArray(data?.Item2) && data.Item2.filter((item2: any) => item2.PageName === item1.PageName).length === 0 && (
                  <Text style={styles.lbl}>No records found.</Text>
                )}
                {Array.isArray(data?.Item2) && data.Item2.filter((item2: any) => item2.PageName === item1.PageName).map((item2: any, jdx: number) => (
                  <View key={jdx} style={jdx % 2 === 0 ? styles.odd : styles.even}>
                    <View>
                      <Text style={styles.lbl}>Reference No: <Text style={styles.vlue}>{item2.ReferenceNo || '-'}</Text></Text>
                      <Text style={styles.lbl}>Transaction Date: <Text style={styles.vlue}>{item2.TransactionDate ? item2.TransactionDate.split('T')[0] : '-'}</Text></Text>
                      <Text style={styles.lbl}>Decision Level: <Text style={styles.vlue}>{item2.DecisionLevel ?? '-'}</Text></Text>
                    </View>
                    <View>
                    {item2.ReportFlag === 1 && (
                      <TouchableOpacity style={styles.downloadBtn} onPress={() => {/* TODO: implement download logic */ }}>
                        <View style={styles.dwnloadicon}>
                          <Image source={require('../../assets/images/innerpage/download.png')} style={styles.downloadimage} resizeMode="contain" />
                          {/* <Text style={styles.downloadBtnText}> {downloadingId === item.PayslipId ? 'Downloading...' : 'Download'}</Text> */}
                        </View>
                      </TouchableOpacity>
                    )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

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
    width: '100%',
    paddingRight: 50,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pagetitle: {
    fontSize: 22,
    color: '#133F7C',
  },
  backicon: {
    marginLeft: 20,
  },
  backiconimg: {
    width: 25,
    height: 25,
  },
  rightclick: {
    width: 110,
  },
  clpsclick: {
    backgroundColor: '#E2EDFC',
    borderRadius: 20,
    width: 110,
    padding: 6,
    paddingLeft: 8,
    paddingRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clpsclicktxt: {
    color: '#000000',
    fontSize: 14,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  accordion: {
    borderRadius: 8,
    padding: 0,
    marginBottom: 10,
  },
  hdrltficn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ltficn: {
    width: 15,
    height: 22,
  },
  star: {
    width: 20,
    height: 22,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 20,
  },
  accordionHeaderOpen: {
    backgroundColor: '#E2EDFC',
  },
  dwnloadicon: {},
    downloadimage: {
    width: 16,
    height: 18,
    },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  accordionTitle: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: '600',
  },
  accordionContent: {
    marginTop: 10,
    paddingLeft: 6,
    paddingRight: 6,
  },
  odd: {
    backgroundColor: '#ffffff',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  even: {
    backgroundColor: '#F1F6FD',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#133F7C',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    fontSize: 18,
    color: '#FF0000',
    textAlign: 'center',
  },
  downloadBtn: {

  },
});