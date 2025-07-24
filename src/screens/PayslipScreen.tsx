import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import { getPayslips, downloadPayslipPdf } from '../api/api';
import UserStorage from '../utils/userStorage';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

// Add these declarations at the top for web compatibility
// @ts-ignore
// eslint-disable-next-line
declare var window: any;
// @ts-ignore
// eslint-disable-next-line
declare var document: any;

export default function PayslipScreen({ navigation }: { navigation?: any }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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
        const result = await getPayslips(token);
        setData(Array.isArray(result) ? result : []);
      } catch (err) {
        setError('Failed to fetch payslips');
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

  const handleDownload = async (payslipId: number, referenceNo: string) => {
    setDownloadingId(payslipId);
    try {
      const token = await UserStorage.getToken();
      if (!token) {
        Alert.alert('No authentication token found. Please login again.');
        setDownloadingId(null);
        return;
      }
      if (Platform.OS === 'web') {
        // On web, fetch blob directly (not base64)
        const response = await fetch('http://216.48.184.187:8081/api/Report/Download', {
          method: 'POST',
          headers: {
            // 'Content-Type': 'application/json', // removed for binary safety
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ ReportCode: 'da6110', Id: payslipId.toString() }),
        });
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        // Type guard for window and document
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Payslip_${referenceNo}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
        Alert.alert('Success', `Payslip ${referenceNo} downloaded.`);
      } else {
        // Mobile: use downloadPayslipPdf from api.tsx
        const base64data = await downloadPayslipPdf('da6110', payslipId.toString(), token);
        console.log('PDF base64 preview (mobile):', base64data.substring(0, 40));
        if (!base64data.startsWith('JVBERi0')) {
          Alert.alert('Warning', 'PDF base64 does not start with JVBERi0. The file may be invalid.');
        }
        const fileName = `Payslip_${referenceNo}.pdf`;
        const path =
          Platform.OS === 'android'
            ? `${RNFS.DownloadDirectoryPath}/${fileName}`
            : `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(path, base64data, 'base64');
        Alert.alert('Success', `Payslip saved to ${path}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download payslip.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#133F7C" />
          <Text style={styles.loadingText}>Loading payslips...</Text>
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
        <TouchableOpacity onPress={() => navigation?.goBack && navigation.goBack()}>
          <View style={styles.backicon}>
            <Image source={require('../../assets/images/backarow.png')}
              style={styles.backiconimg} resizeMode="contain" />
          </View>
        </TouchableOpacity>
        <View style={styles.pagewrap}>
          <Text style={styles.pagetitle}>Payslips</Text>
        </View>
        <TouchableOpacity style={styles.rightclick}></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {data.length === 0 && <Text style={styles.lbl}>No payslips found.</Text>}
        {data.map((item, idx) => (
          <View key={idx} style={styles.accordion}>
            <TouchableOpacity style={[styles.accordionHeader, openIndexes.includes(idx) ? styles.accordionHeaderOpen : styles.accordionHeaderClosed]}
              onPress={() => toggleAccordion(idx)}>
              <View style={styles.hdrltficn}>
                <Image source={require('../../assets/images/innerpage/star.png')} style={[styles.ltficn, styles.star]} resizeMode="contain" />
                <Text style={styles.accordionTitle}>{item.ReferenceNo} {item.TransactionDate}</Text>
                <TouchableOpacity
                  style={styles.downloadBtn}
                  onPress={() => handleDownload(item.PayslipId, item.ReferenceNo)}
                  disabled={downloadingId === item.PayslipId}
                >
                  <Text style={styles.downloadBtnText}>
                    {downloadingId === item.PayslipId ? 'Downloading...' : 'Download'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text>{openIndexes.includes(idx) ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {openIndexes.includes(idx) && (
              <View style={styles.accordionContent}>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Reference No:</Text>
                  <Text style={styles.vlue}>{item.ReferenceNo}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Transaction Date:</Text>
                  <Text style={styles.vlue}>{item.TransactionDate}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Employee Name:</Text>
                  <Text style={styles.vlue}>{item.EmployeeName}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Payslip Type:</Text>
                  <Text style={styles.vlue}>{item.PayslipType}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Total Earnings:</Text>
                  <Text style={styles.vlue}>{item.TotalEarnings}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Total Deductions:</Text>
                  <Text style={styles.vlue}>{item.ToalDeductions}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Net Amount:</Text>
                  <Text style={styles.vlue}>{item.NetAmount}</Text>
                </View>
                <View style={styles.even}>
                  <Text style={styles.lbl}>Year:</Text>
                  <Text style={styles.vlue}>{item.Year}</Text>
                </View>
                <View style={styles.odd}>
                  <Text style={styles.lbl}>Month:</Text>
                  <Text style={styles.vlue}>{item.Month}</Text>
                </View>
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
    fontWeight: 'bold',
    color: '#133F7C',
  },
  backicon: {
    marginLeft: 15,
  },
  backiconimg: {
    width: 13,
    height: 20,
  },
  rightclick: {
    width: 110,
  },
  scrollContainer: {
    padding: 16,
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
    backgroundColor: '#E1E6EC',
  },
  accordionHeaderClosed: {
    borderColor: '#DEECFF',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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
  },
  even: {
    backgroundColor: '#F1F6FD',
    marginBottom: 5,
    paddingBottom: 2,
    paddingTop: 2,
  },
  lbl: {
    fontSize: 16,
    color: '#000000',
    paddingLeft: 12,
  },
  vlue: {
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#133F7C',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
  },
  downloadBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});